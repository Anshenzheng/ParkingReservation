import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, Space, DatePicker, Select, message } from 'antd';
import {
  CarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { statisticsAPI, reservationAPI, commonAPI } from '../../utils/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedBuilding, setSelectedBuilding] = useState(undefined);

  useEffect(() => {
    loadBuildings();
    loadStatistics();
    loadReservations();
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

  const loadReservations = async () => {
    try {
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedBuilding) params.building = selectedBuilding;
      const response = await reservationAPI.getReservations(params);
      setReservations(response.data.slice(0, 10));
    } catch (error) {
      message.error('加载预约数据失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { text: '待审核', className: 'status-tag-pending', icon: <ClockCircleOutlined /> },
      approved: { text: '已通过', className: 'status-tag-approved', icon: <CheckCircleOutlined /> },
      rejected: { text: '已拒绝', className: 'status-tag-rejected', icon: <ExclamationCircleOutlined /> },
      cancelled: { text: '已取消', className: 'status-tag-cancelled', icon: <ExclamationCircleOutlined /> },
      completed: { text: '已完成', className: 'status-tag-completed', icon: <CheckCircleOutlined /> },
    };
    const info = statusMap[status] || statusMap.pending;
    return (
      <Tag className={info.className}>
        {info.icon} {info.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: '车位编号',
      dataIndex: 'spot_number',
      key: 'spot_number',
    },
    {
      title: '预约业主',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: '楼栋',
      dataIndex: 'spot_building',
      key: 'spot_building',
    },
    {
      title: '预约日期',
      dataIndex: 'reservation_date',
      key: 'reservation_date',
    },
    {
      title: '时间段',
      key: 'time',
      render: (_, record) => `${record.start_time} - ${record.end_time}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">首页概览</h2>
      </div>

      <div className="filter-section">
        <Space>
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
          <Button type="primary" onClick={() => { loadStatistics(); loadReservations(); }}>
            查询
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
              title="今日预约"
              value={statistics?.total_reservations || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="待审核"
              value={statistics?.pending_count || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="已通过"
              value={statistics?.approved_count || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="已拒绝"
              value={statistics?.rejected_count || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="已取消"
              value={statistics?.cancelled_count || 0}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="table-container">
        <h3 style={{ marginBottom: 16 }}>最近预约记录</h3>
        <Table
          columns={columns}
          dataSource={reservations}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default Dashboard;
