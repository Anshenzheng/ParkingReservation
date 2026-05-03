import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, message } from 'antd';
import {
  CarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { reservationAPI } from '../../utils/api';

const OwnerHome = ({ user }) => {
  const navigate = useNavigate();
  const [myReservations, setMyReservations] = useState([]);

  useEffect(() => {
    loadMyReservations();
  }, []);

  const loadMyReservations = async () => {
    try {
      const response = await reservationAPI.getReservations({});
      setMyReservations(response.data);
    } catch (error) {
      console.error('加载预约数据失败', error);
    }
  };

  const stats = {
    total: myReservations.length,
    pending: myReservations.filter((r) => r.status === 'pending').length,
    approved: myReservations.filter((r) => r.status === 'approved').length,
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">欢迎回来，{user?.name}</h2>
        <p className="welcome-text" style={{ marginTop: 8 }}>
          {user?.building && user?.unit && user?.room && (
            <>您的住址：<strong>{user.building}栋 {user.unit}单元 {user.room}室</strong></>
          )}
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="我的预约"
              value={stats.total}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="可用车位"
              value="—"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={12}>
          <Card
            hoverable
            onClick={() => navigate('/parking-list')}
            style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ textAlign: 'center' }}>
              <CarOutlined style={{ fontSize: 40, color: '#1890ff' }} />
              <div style={{ marginTop: 12, fontSize: 16, fontWeight: 500 }}>查看空余车位</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>预约临时车位</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12}>
          <Card
            hoverable
            onClick={() => navigate('/my-reservations')}
            style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: 40, color: '#52c41a' }} />
              <div style={{ marginTop: 12, fontSize: 16, fontWeight: 500 }}>我的预约记录</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>查看历史预约</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="使用说明">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>预约车位</strong>：点击"查看空余车位"，选择合适的车位和时间段进行预约
              </li>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>等待审核</strong>：预约申请提交后，需要物业管理员审核
              </li>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>查看预约</strong>：在"我的预约记录"中查看所有预约状态
              </li>
              <li style={{ color: '#666' }}>
                <strong>取消预约</strong>：在预约开始前可以取消未使用的预约
              </li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OwnerHome;
