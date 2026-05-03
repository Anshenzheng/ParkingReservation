import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
  DatePicker,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { reservationAPI, commonAPI } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ReservationManage = () => {
  const [reservations, setReservations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedBuilding, setSelectedBuilding] = useState(undefined);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingReservation, setRejectingReservation] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadReservations();
    loadBuildings();
  }, [selectedDate, selectedBuilding, selectedStatus]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedBuilding) params.building = selectedBuilding;
      if (selectedStatus) params.status = selectedStatus;
      const response = await reservationAPI.getReservations(params);
      setReservations(response.data);
    } catch (error) {
      message.error('加载预约数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadBuildings = async () => {
    try {
      const response = await commonAPI.getBuildings();
      setBuildings(response.data);
    } catch (error) {
      console.error('加载楼栋失败', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await reservationAPI.approveReservation(id);
      message.success('审核通过');
      loadReservations();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleRejectClick = (record) => {
    setRejectingReservation(record);
    form.resetFields();
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await form.validateFields();
      await reservationAPI.rejectReservation(rejectingReservation.id, values);
      message.success('已拒绝');
      setRejectModalVisible(false);
      loadReservations();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleCancel = async (id) => {
    try {
      await reservationAPI.cancelReservation(id);
      message.success('已取消');
      loadReservations();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { text: '待审核', className: 'status-tag-pending' },
      approved: { text: '已通过', className: 'status-tag-approved' },
      rejected: { text: '已拒绝', className: 'status-tag-rejected' },
      cancelled: { text: '已取消', className: 'status-tag-cancelled' },
      completed: { text: '已完成', className: 'status-tag-completed' },
    };
    const info = statusMap[status] || statusMap.pending;
    return <Tag className={info.className}>{info.text}</Tag>;
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
      title: '联系电话',
      dataIndex: 'user_phone',
      key: 'user_phone',
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
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleRejectClick(record)}
                danger
              >
                拒绝
              </Button>
            </>
          )}
          {(record.status === 'pending' || record.status === 'approved') && (
            <Popconfirm title="确定取消此预约吗？" onConfirm={() => handleCancel(record.id)}>
              <Button type="link" size="small" danger>
                取消
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
        <h2 className="page-title">预约管理</h2>
      </div>

      <div className="filter-section">
        <Space wrap>
          <DatePicker
            placeholder="选择日期"
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : undefined)}
            style={{ width: 150 }}
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

      <Modal
        title="拒绝预约"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="notes" label="拒绝原因">
            <TextArea rows={4} placeholder="请输入拒绝原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReservationManage;
