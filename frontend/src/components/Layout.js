import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd';
import {
  CarOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const adminMenuItems = [
    {
      key: '/admin-dashboard',
      icon: <HomeOutlined />,
      label: '首页概览',
      onClick: () => navigate('/admin-dashboard'),
    },
    {
      key: '/parking-manage',
      icon: <CarOutlined />,
      label: '车位管理',
      onClick: () => navigate('/parking-manage'),
    },
    {
      key: '/reservation-manage',
      icon: <CalendarOutlined />,
      label: '预约管理',
      onClick: () => navigate('/reservation-manage'),
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '统计分析',
      onClick: () => navigate('/statistics'),
    },
  ];

  const ownerMenuItems = [
    {
      key: '/owner-home',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/owner-home'),
    },
    {
      key: '/parking-list',
      icon: <CarOutlined />,
      label: '空余车位',
      onClick: () => navigate('/parking-list'),
    },
    {
      key: '/my-reservations',
      icon: <HistoryOutlined />,
      label: '我的预约',
      onClick: () => navigate('/my-reservations'),
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : ownerMenuItems;

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 'bold' }}>{user?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {isAdmin ? '管理员' : '业主'}
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <CarOutlined style={{ fontSize: 28, color: '#1890ff', marginRight: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>
            车位预约系统
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            height: 64,
          }}
        >
          <div style={{ fontSize: 16, color: '#595959' }}>
            {isAdmin ? '物业管理员控制台' : '业主服务中心'}
          </div>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar size={32} icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, background: '#f0f2f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
