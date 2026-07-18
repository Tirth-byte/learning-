import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';
import antdTheme from './theme/antdTheme';

// Public Marketing Page
import Landing from './pages/Landing';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Layouts
import AdminLayout from './components/admin/AdminLayout';
import CustomerLayout from './components/customer/CustomerLayout';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import OrdersList from './pages/admin/OrdersList';
import OrderDetail from './pages/admin/OrderDetail';
import ProductsList from './pages/admin/ProductsList';
import PricelistsList from './pages/admin/PricelistsList';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Schedule from './pages/admin/Schedule';

// Customer Pages
import Home from './pages/customer/Home';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import MyOrders from './pages/customer/MyOrders';
import Profile from './pages/customer/Profile';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={user?.role === 'CUSTOMER' ? '/' : '/admin/dashboard'} replace />;
  }

  return children;
};

export default function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public marketing homepage. Sits outside CustomerLayout because it
                renders its own full-bleed nav, hero, and footer. */}
            <Route path="/" element={<Landing />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Admin Portal Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['ADMIN', 'VENDOR']}>
                    <AdminLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="products" element={<ProductsList />} />
              <Route path="pricelists" element={<PricelistsList />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Customer Facing Store Routes.
                Note there is no index route here: '/' is the marketing Landing page
                above, and the catalog now lives at '/products'. */}
            <Route path="/" element={<CustomerLayout />}>
              <Route path="products" element={<Home />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-orders"
                element={
                  <ProtectedRoute>
                    <MyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
