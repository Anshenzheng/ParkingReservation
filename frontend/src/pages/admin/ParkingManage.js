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
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { parkingAPI, userAPI, commonAPI } from '../../utils/api';

const { Option } = Select;
const { TextArea } = Input;

const ParkingManage = () => {
  const [spots, setSpots] = useState([]);
  const [users, setUsers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSpot, setEditingSpot] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSpots();
    loadUsers();
    loadBuildings();
  }, []);

  const loadSpots = async () => {
    setLoading(true);
    try {
      const response = await parkingAPI.getSpots({});
      setSpots(response.data);
    } catch (error) {
      message.error('加载车位数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('加载用户失败', error);
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

  const handleAdd = () => {
    setEditingSpot(null);
    form.resetFields();
    form.setFieldsValue({
      spot_type: 'temporary',
      status: 'available',
      bookable_start: '08:00',
      bookable_end: '22:00',
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingSpot(record);
    form.setFieldsValue({
      ...record,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await parkingAPI.deleteSpot(id);
      message.success('删除成功');
      loadSpots();
    } catch (error) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingSpot) {
        await parkingAPI.updateSpot(editingSpot.id, values);
        message.success('更新成功');
      } else {
        await parkingAPI.createSpot(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadSpots();
    } catch (error) {
      if (error.response) {
        message.error(error.response.data?.error || '操作失败');
      }
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      available: { text: '可用', color: 'success', icon: <CheckCircleOutlined /> },
      occupied: { text: '占用', color: 'warning', icon: <CarOutlined /> },
      maintenance: { text: '维护中', color: 'error', icon: <ToolOutlined /> },
    };
    const info = statusMap[status] || statusMap.available;
    return (
      <Tag color={info.color}>
        {info.icon} {info.text}
      </Tag>
    );
  };

  const getTypeTag = (type) => {
    return type === 'fixed' ? (
      <Tag color="purple">固定车位</Tag>
    ) : (
      <Tag color="cyan">临时车位</Tag>
    );
  };

  const columns = [
    {
      title: '车位编号',
      dataIndex: 'spot_number',
      key: 'spot_number',
    },
    {
      title: '车位类型',
      dataIndex: 'spot_type',
      key: 'spot_type',
      render: getTypeTag,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '楼栋',
      dataIndex: 'building',
      key: 'building',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '可预约时段',
      key: 'bookable',
      render: (_, record) => `${record.bookable_start} - ${record.bookable_end}`,
    },
    {
      title: '绑定业主',
      dataIndex: 'owner_name',
      key: 'owner_name',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此车位吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statistics = {
    total: spots.length,
    fixed: spots.filter((s) => s.spot_type === 'fixed').length,
    temporary: spots.filter((s) => s.spot_type === 'temporary').length,
    available: spots.filter((s) => s.status === 'available').length,
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">车位管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加车位
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic title="总车位" value={statistics.total} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic title="固定车位" value={statistics.fixed} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic title="临时车位" value={statistics.temporary} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic title="可用车位" value={statistics.available} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={spots}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editingSpot ? '编辑车位' : '添加车位'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="spot_number"
                label="车位编号"
                rules={[{ required: true, message: '请输入车位编号' }]}
              >
                <Input placeholder="例如: A001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="spot_type"
                label="车位类型"
                rules={[{ required: true, message: '请选择车位类型' }]}
              >
                <Select>
                  <Option value="fixed">固定车位</Option>
                  <Option value="temporary">临时车位</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="available">可用</Option>
                  <Option value="occupied">占用</Option>
                  <Option value="maintenance">维护中</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="building" label="楼栋">
                <Select allowClear placeholder="请选择楼栋">
                  {buildings.map((b) => (
                    <Option key={b} value={b}>{b}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label="位置">
            <TextArea rows={2} placeholder="例如: 地下车库B1层，靠近电梯口" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bookable_start"
                label="可预约开始时间"
                rules={[{ required: true, message: '请输入开始时间' }]}
              >
                <Input placeholder="例如: 08:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bookable_end"
                label="可预约结束时间"
                rules={[{ required: true, message: '请输入结束时间' }]}
              >
                <Input placeholder="例如: 22:00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="owner_id" label="绑定业主（固定车位）">
            <Select allowClear placeholder="选择业主">
              {users.filter(u => u.role === 'owner').map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name} ({u.username})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParkingManage;
