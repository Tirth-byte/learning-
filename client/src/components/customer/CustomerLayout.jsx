import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Input, Typography } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    updateCartCount();
    // Listen for custom event to update cart count instantly on add
    window.addEventListener('cartUpdated', updateCartCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('rental_cart') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + (item.qty || 1), 0));
    } catch (e) {
      setCartCount(0);
    }
  };

  const handleMenuClick = (e) => {
    if (e.key === 'logout') {
      logout();
      navigate('/login');
    } else if (e.key === 'orders') {
      navigate('/my-orders');
    } else if (e.key === 'profile') {
      navigate('/profile');
    }
  };

  const profileMenu = {
    items: [
      { key: 'name', label: <Text strong>{user?.name || 'Customer'}</Text>, disabled: true },
      { key: 'role', label: <Text type="secondary">{user?.role}</Text>, disabled: true },
      { type: 'divider' },
      { key: 'profile', label: 'My Profile' },
      { key: 'orders', label: 'My Orders' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Log out' },
    ],
    onClick: handleMenuClick,
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#F5F6F8' }}>
      {/* Top Promotional Announcement Banner */}
      <div 
        style={{ 
          background: 'linear-gradient(90deg, #3651A5 0%, #1E293B 100%)', 
          color: '#ffffff', 
          textAlign: 'center', 
          padding: '6px 12px', 
          fontSize: '11px', 
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}
      >
        ✨ Special Promotion: Held deposits are fully insured. Rent with zero liability terms!
      </div>

      <Header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #E5E7EB',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left Side: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingOutlined style={{ fontSize: 24, color: '#3651A5' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', letterSpacing: '-0.4px' }}>
              Odoo Rent Shop
            </span>
          </Link>
        </div>

        {/* Middle Mock Search Bar */}
        <div style={{ display: 'none', sm: 'block', width: 280 }}>
          <Input 
            placeholder="Search catalog..." 
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />} 
            size="small"
            style={{ borderRadius: 6, fontSize: 12 }}
          />
        </div>

        {/* Right Side: Cart, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {user ? (
            <>
              {/* Back to Admin if Admin/Vendor */}
              {(user.role === 'ADMIN' || user.role === 'VENDOR') && (
                <Button type="link" onClick={() => navigate('/admin/dashboard')} style={{ fontSize: 12, padding: 0 }}>
                  Go to Portal
                </Button>
              )}

              {/* Cart Icon */}
              <Link to="/cart">
                <Badge count={cartCount} size="small" offset={[5, -5]} color="#3651A5">
                  <Button type="text" icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />} />
                </Badge>
              </Link>

              {/* Profile Dropdown */}
              <Dropdown menu={profileMenu} trigger={['click']}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Avatar style={{ backgroundColor: '#3651A5' }} icon={<UserOutlined />} size="small" />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#1F2937', display: 'none', md: 'inline' }}>
                    {user.name.split(' ')[0]}
                  </span>
                </div>
              </Dropdown>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="text" size="small" onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button type="primary" size="small" style={{ backgroundColor: '#3651A5', borderRadius: 4 }} onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </Header>

      <Content style={{ padding: '0 16px', marginTop: 24, minHeight: 'calc(100vh - 128px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Outlet />
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#ffffff', borderTop: '1px solid #E5E7EB', padding: '16px 0', marginTop: 40, fontSize: 11, color: '#6B7280' }}>
        Odoo Rental Management System ©2026. India Operations.
      </Footer>
    </Layout>
  );
}
