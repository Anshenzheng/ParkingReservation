import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Popconfirm,
  message,
  Space,
  Select,
  DatePicker,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { reservationAPI } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [selectedDate, setSelectedDate] = useState(undefined);

  useEffect(() => {
    loadReservations();
  }, [selectedStatus, selectedDate]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedStatus) params.status = selectedStatus;
      if (selectedDate) params.date = selectedDate;
      const response = await reservationAPI.getReservations(params);
      setReservations(response.data);
    } catch (error) {
      message.error('加载预约数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await reservationAPI.cancelReservation(id);
      message.success('已取消预约');
      loadReservations();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { text: '待审核', className: 'status-tag-pending', icon: <ClockCircleOutlined /> },
      approved: { text: '已通过', className: 'status-tag-approved', icon: <CheckCircleOutlined /> },
      rejected: { text: '已拒绝', className: 'status-tag-rejected', icon: <ExclamationCircleOutlined /> },
      cancelled: { text: '已取消', className: 'status-tag-cancelled', icon: <CloseCircleOutlined /> },
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
      title: '车牌号',
      dataIndex: 'license_plate',
      key: 'license_plate',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '预约时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {(record.status === 'pending' || record.status === 'approved') && (
            <Popconfirm title="确定取消此预约吗？" onConfirm={() => handleCancel(record.id)}>
              <Button type="link" size="small" danger>
                取消预约
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">我的预约记录</h2>
      </div>

      <div className="filter-section">
        <Space>
          <DatePicker
            placeholder="选择日期"
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : undefined)}
          />
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="pending">待审核</Option>
            <Option value="approved">已通过</Option>
            <Option value="rejected">已拒绝</Option>
            <Option value="cancelled">已取消</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Button type="primary" onClick={loadReservations}>
            查询
          </Button>
        </Space>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={reservations}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default MyReservations;
