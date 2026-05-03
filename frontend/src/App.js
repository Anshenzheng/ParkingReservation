import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import MainLayout from './components/Layout';

import Dashboard from './pages/admin/Dashboard';
import ParkingManage from './pages/admin/ParkingManage';
import ReservationManage from './pages/admin/ReservationManage';
import Statistics from './pages/admin/Statistics';

import OwnerHome from './pages/owner/OwnerHome';
import ParkingList from './pages/owner/ParkingList';
import MyReservations from './pages/owner/MyReservations';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
};

const OwnerRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['owner']}>
      {children}
    </ProtectedRoute>
  );
};

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  const renderAdminRoutes = () => (
    <>
      <Route path="/" element={
        <AdminRoute>
          <MainLayout user={user}>
            <Dashboard />
          </MainLayout>
        </AdminRoute>
      } />
      <Route path="/parking-manage" element={
        <AdminRoute>
          <MainLayout user={user}>
            <ParkingManage />
          </MainLayout>
        </AdminRoute>
      } />
      <Route path="/reservation-manage" element={
        <AdminRoute>
          <MainLayout user={user}>
            <ReservationManage />
          </MainLayout>
        </AdminRoute>
      } />
      <Route path="/statistics" element={
        <AdminRoute>
          <MainLayout user={user}>
            <Statistics />
          </MainLayout>
        </AdminRoute>
      } />
    </>
  );

  const renderOwnerRoutes = () => (
    <>
      <Route path="/" element={
        <OwnerRoute>
          <MainLayout user={user}>
            <OwnerHome user={user} />
          </MainLayout>
        </OwnerRoute>
      } />
      <Route path="/parking-list" element={
        <OwnerRoute>
          <MainLayout user={user}>
            <ParkingList />
          </MainLayout>
        </OwnerRoute>
      } />
      <Route path="/my-reservations" element={
        <OwnerRoute>
          <MainLayout user={user}>
            <MyReservations />
          </MainLayout>
        </OwnerRoute>
      } />
    </>
  );

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          {isAdmin ? renderAdminRoutes() : renderOwnerRoutes()}
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
