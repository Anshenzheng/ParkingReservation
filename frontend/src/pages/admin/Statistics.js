import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, DatePicker, Select, Button, message } from 'antd';
import {
  CarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { statisticsAPI, commonAPI } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const Statistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedBuilding, setSelectedBuilding] = useState(undefined);

  useEffect(() => {
    loadBuildings();
    loadStatistics();
  }, [selectedDate, selectedBuilding]);

  const loadBuildings = async () => {
    try {
      const response = await commonAPI.getBuildings();
      setBuildings(response.data);
    } catch (error) {
      console.error('加载楼栋失败', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedBuilding) params.building = selectedBuilding;
      const response = await statisticsAPI.getUsage(params);
      setStatistics(response.data);
    } catch (error) {
      message.error('加载统计数据失败');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">统计分析</h2>
      </div>

      <div className="filter-section">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <DatePicker
            placeholder="选择日期"
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : null)}
          />
          <Select
            placeholder="选择楼栋"
            style={{ width: 150 }}
            allowClear
            value={selectedBuilding}
            onChange={setSelectedBuilding}
          >
            {buildings.map((b) => (
              <Option key={b} value={b}>
                {b}
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={loadStatistics}>
            查询
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="总车位"
              value={statistics?.total_spots || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="固定车位"
              value={statistics?.fixed_spots || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="临时车位"
              value={statistics?.temporary_spots || 0}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="总预约数"
              value={statistics?.total_reservations || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card" style={{ borderTop: '4px solid #faad14' }}>
            <Statistic
              title="待审核"
              value={statistics?.pending_count || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card" style={{ borderTop: '4px solid #52c41a' }}>
            <Statistic
              title="已通过"
              value={statistics?.approved_count || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card" style={{ borderTop: '4px solid #ff4d4f' }}>
            <Statistic
              title="已拒绝"
              value={statistics?.rejected_count || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card" style={{ borderTop: '4px solid #999' }}>
            <Statistic
              title="已取消"
              value={statistics?.cancelled_count || 0}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="数据说明">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>总车位</strong>：小区内所有车位总数（包括固定车位和临时车位）
              </li>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>固定车位</strong>：已分配给业主的固定车位
              </li>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>临时车位</strong>：可供业主预约的临时车位
              </li>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>总预约数</strong>：筛选条件下的预约记录总数
              </li>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>待审核</strong>：等待物业管理员审核的预约申请
              </li>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>已通过</strong>：审核通过的预约
              </li>
              <li style={{ marginBottom: 8, color: '#666' }}>
                <strong>已拒绝</strong>：审核拒绝的预约
              </li>
              <li style={{ color: '#666' }}>
                <strong>已取消</strong>：被业主或管理员取消的预约
              </li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
