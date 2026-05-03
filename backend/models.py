from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='owner')  # admin 或 owner
    name = db.Column(db.String(80), nullable=False)
    phone = db.Column(db.String(20))
    building = db.Column(db.String(20))
    unit = db.Column(db.String(20))
    room = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'name': self.name,
            'phone': self.phone,
            'building': self.building,
            'unit': self.unit,
            'room': self.room,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ParkingSpot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spot_number = db.Column(db.String(20), unique=True, nullable=False)
    spot_type = db.Column(db.String(20), nullable=False)  # fixed 或 temporary
    status = db.Column(db.String(20), nullable=False, default='available')  # available, occupied, maintenance
    location = db.Column(db.String(100))
    building = db.Column(db.String(20))
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    bookable_start = db.Column(db.String(20), default='08:00')
    bookable_end = db.Column(db.String(20), default='22:00')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = db.relationship('User', backref='parking_spots', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'spot_number': self.spot_number,
            'spot_type': self.spot_type,
            'status': self.status,
            'location': self.location,
            'building': self.building,
            'owner_id': self.owner_id,
            'bookable_start': self.bookable_start,
            'bookable_end': self.bookable_end,
            'owner_name': self.owner.name if self.owner else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    spot_id = db.Column(db.Integer, db.ForeignKey('parking_spot.id'), nullable=False)
    reservation_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(20), nullable=False)
    end_time = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, approved, rejected, cancelled, completed
    license_plate = db.Column(db.String(20))
    vehicle_type = db.Column(db.String(20), default='car')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', backref='reservations', lazy=True)
    spot = db.relationship('ParkingSpot', backref='reservations', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'spot_id': self.spot_id,
            'spot_number': self.spot.spot_number if self.spot else None,
            'reservation_date': self.reservation_date.isoformat() if self.reservation_date else None,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'status': self.status,
            'license_plate': self.license_plate,
            'vehicle_type': self.vehicle_type,
            'notes': self.notes,
            'user_name': self.user.name if self.user else None,
            'user_phone': self.user.phone if self.user else None,
            'user_building': self.user.building if self.user else None,
            'spot_building': self.spot.building if self.spot else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
