import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Select } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

const { Option } = Select;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await authAPI.login(values);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      message.success('登录成功！');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      await authAPI.register(values);
      message.success('注册成功！请登录');
      setActiveTab('login');
    } catch (error) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const loginFormItems = [
    {
      name: 'username',
      rules: [{ required: true, message: '请输入用户名' }],
    },
    {
      name: 'password',
      rules: [{ required: true, message: '请输入密码' }],
    },
  ];

  const registerFormItems = [
    {
      name: 'username',
      rules: [{ required: true, message: '请输入用户名' }],
    },
    {
      name: 'password',
      rules: [{ required: true, message: '请输入密码' }],
    },
    {
      name: 'name',
      rules: [{ required: true, message: '请输入姓名' }],
    },
    {
      name: 'phone',
      rules: [{ required: true, message: '请输入手机号码' }],
    },
    {
      name: 'building',
    },
    {
      name: 'unit',
    },
    {
      name: 'room',
    },
  ];

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          layout="vertical"
          initialValues={{ remember: true }}
        >
          <Form.Item {...loginFormItems[0]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item {...loginFormItems[1]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            管理员默认账号: admin / admin123
          </div>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item {...registerFormItems[0]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item {...registerFormItems[1]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item {...registerFormItems[2]}>
            <Input placeholder="真实姓名" size="large" />
          </Form.Item>
          <Form.Item {...registerFormItems[3]}>
            <Input prefix={<PhoneOutlined />} placeholder="手机号码" size="large" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Form.Item name="building" style={{ flex: 1 }}>
              <Input prefix={<HomeOutlined />} placeholder="楼栋号" size="large" />
            </Form.Item>
            <Form.Item name="unit" style={{ flex: 1 }}>
              <Input placeholder="单元号" size="large" />
            </Form.Item>
            <Form.Item name="room" style={{ flex: 1 }}>
              <Input placeholder="房间号" size="large" />
            </Form.Item>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="login-container">
      <Card className="login-box" bordered={false}>
        <h1 className="login-title">小区车位预约管理系统</h1>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} centered />
      </Card>
    </div>
  );
};

export default Login;
