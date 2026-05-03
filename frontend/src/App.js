import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
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

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isOwner: user?.role === 'owner',
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (requiredRole && user.role !== requiredRole) {
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, requiredRole, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
};

const OwnerRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="owner">{children}</ProtectedRoute>;
};

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/owner-home', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return null;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<HomePage />} />
      
      <Route path="/admin-dashboard" element={
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
      
      <Route path="/owner-home" element={
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
    </Routes>
  );
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
};

export default App;
