import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  message,
  Tag,
} from 'antd';
import {
  CarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { parkingAPI, reservationAPI, commonAPI } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const ParkingList = () => {
  const [spots, setSpots] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBuildings();
    loadSpots();
  }, []);

  const loadBuildings = async () => {
    try {
      const response = await commonAPI.getBuildings();
      setBuildings(response.data);
    } catch (error) {
      console.error('加载楼栋失败', error);
    }
  };

  const loadSpots = async (params = {}) => {
    setLoading(true);
    try {
      const response = await parkingAPI.getAvailableSpots(params);
      setSpots(response.data);
    } catch (error) {
      message.error('加载车位数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReservationClick = (spot) => {
    setSelectedSpot(spot);
    form.resetFields();
    form.setFieldsValue({
      reservation_date: dayjs(),
    });
    setModalVisible(true);
  };

  const handleSubmitReservation = async () => {
    try {
      const values = await form.validateFields();
      
      const reservationData = {
        spot_id: selectedSpot.id,
        reservation_date: values.reservation_date.format('YYYY-MM-DD'),
        start_time: values.start_time.format('HH:mm'),
        end_time: values.end_time.format('HH:mm'),
        license_plate: values.license_plate,
        vehicle_type: values.vehicle_type,
      };

      await reservationAPI.createReservation(reservationData);
      message.success('预约申请已提交，请等待审核');
      setModalVisible(false);
      loadSpots();
    } catch (error) {
      message.error(error.response?.data?.error || '预约失败');
    }
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params = {};
    if (values.reservation_date) {
      params.date = values.reservation_date.format('YYYY-MM-DD');
    }
    if (values.start_time) {
      params.start_time = values.start_time.format('HH:mm');
    }
    if (values.end_time) {
      params.end_time = values.end_time.format('HH:mm');
    }
    if (selectedBuilding) {
      params.building = selectedBuilding;
    }
    loadSpots(params);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">空余车位</h2>
      </div>

      <div className="filter-section">
        <Form form={form} layout="inline">
          <Form.Item name="reservation_date" label="预约日期">
            <DatePicker />
          </Form.Item>
          <Form.Item name="start_time" label="开始时间">
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item name="end_time" label="结束时间">
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item label="楼栋">
            <Select
              placeholder="选择楼栋"
              style={{ width: 120 }}
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
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </div>

      {spots.length === 0 ? (
        <div className="table-container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <CarOutlined style={{ fontSize: 48, color: '#ccc' }} />
          <p style={{ marginTop: 16, color: '#999' }}>暂无可用车位</p>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {spots.map((spot) => (
            <Col xs={24} sm={12} md={8} key={spot.id}>
              <Card
                className={`spot-card spot-card-${spot.status}`}
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <span>{spot.spot_number}</span>
                    <Tag color="cyan" style={{ marginLeft: 8 }}>
                      临时车位
                    </Tag>
                  </div>
                }
                extra={
                  <Button type="primary" onClick={() => handleReservationClick(spot)}>
                    预约
                  </Button>
                }
              >
                <div style={{ marginBottom: 8 }}>
                  <EnvironmentOutlined style={{ marginRight: 4, color: '#666' }} />
                  <span style={{ color: '#666' }}>
                    {spot.building || '未指定楼栋'} - {spot.location || '地下停车场'}
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <ClockCircleOutlined style={{ marginRight: 4, color: '#666' }} />
                  <span style={{ color: '#666' }}>
                    可预约时段: {spot.bookable_start} - {spot.bookable_end}
                  </span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="预约车位"
        open={modalVisible}
        onOk={handleSubmitReservation}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        {selectedSpot && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>车位编号：</strong>
              {selectedSpot.spot_number}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>位置：</strong>
              {selectedSpot.building || '未指定楼栋'} - {selectedSpot.location || '地下停车场'}
            </div>
            <div>
              <strong>可预约时段：</strong>
              {selectedSpot.bookable_start} - {selectedSpot.bookable_end}
            </div>
          </div>
        )}
        <Form layout="vertical">
          <Form.Item
            name="reservation_date"
            label="预约日期"
            rules={[{ required: true, message: '请选择预约日期' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="license_plate" label="车牌号">
            <Input placeholder="请输入车牌号（可选）" />
          </Form.Item>
          <Form.Item name="vehicle_type" label="车辆类型">
            <Select placeholder="请选择车辆类型">
              <Option value="car">轿车</Option>
              <Option value="suv">SUV</Option>
              <Option value="truck">货车</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParkingList;
