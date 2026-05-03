from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from functools import wraps
import os

from config import Config
from models import db, User, ParkingSpot, Reservation

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
jwt = JWTManager(app)
db.init_app(app)

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated_function

def owner_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != 'owner':
            return jsonify({'error': '需要业主权限'}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    
    user = User(
        username=data['username'],
        name=data['name'],
        phone=data.get('phone'),
        building=data.get('building'),
        unit=data.get('unit'),
        room=data.get('room'),
        role=data.get('role', 'owner')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    access_token = create_access_token(identity=user.id, expires_delta=timedelta(days=1))
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user:
        return jsonify(user.to_dict()), 200
    return jsonify({'error': '用户不存在'}), 404

@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200

@app.route('/api/parking-spots', methods=['GET'])
@jwt_required()
def get_parking_spots():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    spot_type = request.args.get('type')
    status = request.args.get('status')
    building = request.args.get('building')
    
    query = ParkingSpot.query
    
    if spot_type:
        query = query.filter_by(spot_type=spot_type)
    if status:
        query = query.filter_by(status=status)
    if building:
        query = query.filter_by(building=building)
    
    spots = query.all()
    return jsonify([s.to_dict() for s in spots]), 200

@app.route('/api/parking-spots/available', methods=['GET'])
@jwt_required()
def get_available_spots():
    date_str = request.args.get('date')
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    
    query = ParkingSpot.query.filter_by(spot_type='temporary', status='available')
    
    if date_str and start_time and end_time:
        reservation_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        occupied_spots = db.session.query(Reservation.spot_id).filter(
            Reservation.reservation_date == reservation_date,
            Reservation.status.in_(['pending', 'approved']),
            Reservation.start_time < end_time,
            Reservation.end_time > start_time
        ).all()
        
        occupied_ids = [s[0] for s in occupied_spots]
        if occupied_ids:
            query = query.filter(ParkingSpot.id.notin_(occupied_ids))
    
    spots = query.all()
    return jsonify([s.to_dict() for s in spots]), 200

@app.route('/api/parking-spots', methods=['POST'])
@admin_required
def create_parking_spot():
    data = request.get_json()
    
    if ParkingSpot.query.filter_by(spot_number=data['spot_number']).first():
        return jsonify({'error': '车位编号已存在'}), 400
    
    spot = ParkingSpot(
        spot_number=data['spot_number'],
        spot_type=data['spot_type'],
        status=data.get('status', 'available'),
        location=data.get('location'),
        building=data.get('building'),
        bookable_start=data.get('bookable_start', '08:00'),
        bookable_end=data.get('bookable_end', '22:00')
    )
    
    if data.get('owner_id'):
        spot.owner_id = data['owner_id']
    
    db.session.add(spot)
    db.session.commit()
    
    return jsonify(spot.to_dict()), 201

@app.route('/api/parking-spots/<int:spot_id>', methods=['PUT'])
@admin_required
def update_parking_spot(spot_id):
    spot = ParkingSpot.query.get_or_404(spot_id)
    data = request.get_json()
    
    if 'spot_number' in data:
        existing = ParkingSpot.query.filter_by(spot_number=data['spot_number']).first()
        if existing and existing.id != spot_id:
            return jsonify({'error': '车位编号已存在'}), 400
        spot.spot_number = data['spot_number']
    
    if 'spot_type' in data:
        spot.spot_type = data['spot_type']
    if 'status' in data:
        spot.status = data['status']
    if 'location' in data:
        spot.location = data['location']
    if 'building' in data:
        spot.building = data['building']
    if 'bookable_start' in data:
        spot.bookable_start = data['bookable_start']
    if 'bookable_end' in data:
        spot.bookable_end = data['bookable_end']
    if 'owner_id' in data:
        spot.owner_id = data['owner_id']
    
    db.session.commit()
    return jsonify(spot.to_dict()), 200

@app.route('/api/parking-spots/<int:spot_id>', methods=['DELETE'])
@admin_required
def delete_parking_spot(spot_id):
    spot = ParkingSpot.query.get_or_404(spot_id)
    
    if spot.reservations:
        return jsonify({'error': '该车位已有预约记录，无法删除'}), 400
    
    db.session.delete(spot)
    db.session.commit()
    return jsonify({'message': '删除成功'}), 200

@app.route('/api/reservations', methods=['GET'])
@jwt_required()
def get_reservations():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    query = Reservation.query
    
    if user.role == 'owner':
        query = query.filter_by(user_id=current_user_id)
    
    date_str = request.args.get('date')
    building = request.args.get('building')
    status = request.args.get('status')
    
    if date_str:
        reservation_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        query = query.filter_by(reservation_date=reservation_date)
    
    if status:
        query = query.filter_by(status=status)
    
    if building:
        query = query.join(ParkingSpot).filter(ParkingSpot.building == building)
    
    query = query.order_by(Reservation.created_at.desc())
    reservations = query.all()
    
    return jsonify([r.to_dict() for r in reservations]), 200

@app.route('/api/reservations', methods=['POST'])
@owner_required
def create_reservation():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    spot = ParkingSpot.query.get(data['spot_id'])
    if not spot:
        return jsonify({'error': '车位不存在'}), 404
    
    if spot.spot_type != 'temporary' or spot.status != 'available':
        return jsonify({'error': '该车位不可预约'}), 400
    
    reservation_date = datetime.strptime(data['reservation_date'], '%Y-%m-%d').date()
    start_time = data['start_time']
    end_time = data['end_time']
    
    if start_time < spot.bookable_start or end_time > spot.bookable_end:
        return jsonify({'error': f'预约时间超出可预约时段 {spot.bookable_start} - {spot.bookable_end}'}), 400
    
    existing = Reservation.query.filter(
        Reservation.spot_id == spot.id,
        Reservation.reservation_date == reservation_date,
        Reservation.status.in_(['pending', 'approved']),
        Reservation.start_time < end_time,
        Reservation.end_time > start_time
    ).first()
    
    if existing:
        return jsonify({'error': '该时段车位已被预约'}), 400
    
    reservation = Reservation(
        user_id=current_user_id,
        spot_id=spot.id,
        reservation_date=reservation_date,
        start_time=start_time,
        end_time=end_time,
        license_plate=data.get('license_plate'),
        vehicle_type=data.get('vehicle_type', 'car'),
        notes=data.get('notes'),
        status='pending'
    )
    
    db.session.add(reservation)
    db.session.commit()
    
    return jsonify(reservation.to_dict()), 201

@app.route('/api/reservations/<int:reservation_id>/approve', methods=['POST'])
@admin_required
def approve_reservation(reservation_id):
    reservation = Reservation.query.get_or_404(reservation_id)
    
    if reservation.status != 'pending':
        return jsonify({'error': '只能审核待处理的预约'}), 400
    
    reservation.status = 'approved'
    db.session.commit()
    
    return jsonify(reservation.to_dict()), 200

@app.route('/api/reservations/<int:reservation_id>/reject', methods=['POST'])
@admin_required
def reject_reservation(reservation_id):
    reservation = Reservation.query.get_or_404(reservation_id)
    
    if reservation.status != 'pending':
        return jsonify({'error': '只能审核待处理的预约'}), 400
    
    data = request.get_json()
    reservation.status = 'rejected'
    if data and 'notes' in data:
        reservation.notes = (reservation.notes or '') + '\n审核备注: ' + data['notes']
    
    db.session.commit()
    
    return jsonify(reservation.to_dict()), 200

@app.route('/api/reservations/<int:reservation_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_reservation(reservation_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    reservation = Reservation.query.get_or_404(reservation_id)
    
    if user.role != 'admin' and reservation.user_id != current_user_id:
        return jsonify({'error': '无权限取消此预约'}), 403
    
    if reservation.status not in ['pending', 'approved']:
        return jsonify({'error': '该预约无法取消'}), 400
    
    reservation.status = 'cancelled'
    db.session.commit()
    
    return jsonify(reservation.to_dict()), 200

@app.route('/api/statistics/usage', methods=['GET'])
@admin_required
def get_statistics():
    date_str = request.args.get('date')
    building = request.args.get('building')
    
    query = Reservation.query
    
    if date_str:
        reservation_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        query = query.filter_by(reservation_date=reservation_date)
    
    if building:
        query = query.join(ParkingSpot).filter(ParkingSpot.building == building)
    
    reservations = query.all()
    
    total_spots = ParkingSpot.query.count()
    temporary_spots = ParkingSpot.query.filter_by(spot_type='temporary').count()
    fixed_spots = ParkingSpot.query.filter_by(spot_type='fixed').count()
    
    stats = {
        'total_spots': total_spots,
        'temporary_spots': temporary_spots,
        'fixed_spots': fixed_spots,
        'total_reservations': len(reservations),
        'pending_count': len([r for r in reservations if r.status == 'pending']),
        'approved_count': len([r for r in reservations if r.status == 'approved']),
        'rejected_count': len([r for r in reservations if r.status == 'rejected']),
        'cancelled_count': len([r for r in reservations if r.status == 'cancelled']),
        'completed_count': len([r for r in reservations if r.status == 'completed']),
    }
    
    return jsonify(stats), 200

@app.route('/api/buildings', methods=['GET'])
@jwt_required()
def get_buildings():
    buildings = db.session.query(ParkingSpot.building).filter(
        ParkingSpot.building.isnot(None)
    ).distinct().all()
    
    user_buildings = db.session.query(User.building).filter(
        User.building.isnot(None)
    ).distinct().all()
    
    all_buildings = set([b[0] for b in buildings] + [b[0] for b in user_buildings])
    
    return jsonify(sorted(list(all_buildings))), 200

def init_db():
    with app.app_context():
        db.create_all()
        
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                name='管理员',
                phone='13800138000',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            
            db.session.commit()
            print('默认管理员账号已创建: admin / admin123')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
