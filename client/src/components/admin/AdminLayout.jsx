import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Drawer, List, Typography } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TagsOutlined,
  SettingOutlined,
  BarChartOutlined,
  UserOutlined,
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const stats = response.data.data;
      const loadedNotifications = [];
      if (stats && stats.overdueCount > 0) {
        loadedNotifications.push({
          id: 'overdue',
          message: `Alert: ${stats.overdueCount} active rentals are overdue return deadlines!`,
          read: false,
          type: 'error',
        });
      }
      if (stats && stats.dueTodayCount > 0) {
        loadedNotifications.push({
          id: 'dueToday',
          message: `Reminder: ${stats.dueTodayCount} rentals are due for return today.`,
          read: false,
          type: 'warning',
        });
      }
      if (loadedNotifications.length === 0) {
        loadedNotifications.push({
          id: 'allClear',
          message: 'All clear: operations running smoothly. No pending alerts.',
          read: true,
          type: 'success',
        });
      }
      setNotifications(loadedNotifications);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMenuClick = (e) => {
    if (e.key === 'logout') {
      logout();
      navigate('/login');
    } else if (e.key === 'profile') {
      navigate('/admin/profile'); // profile is accessible
    }
  };

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Dashboard</Link>,
    },
    {
      key: '/admin/orders',
      icon: <ShoppingOutlined />,
      label: <Link to="/admin/orders">Orders</Link>,
    },
    {
      key: '/admin/schedule',
      icon: <CalendarOutlined />,
      label: <Link to="/admin/schedule">Schedule</Link>,
    },
    {
      key: '/admin/products',
      icon: <TagsOutlined />,
      label: <Link to="/admin/products">Products</Link>,
    },
    {
      key: '/admin/pricelists',
      icon: <FileTextOutlined />,
      label: <Link to="/admin/pricelists">Pricelists</Link>,
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: <Link to="/admin/reports">Reports</Link>,
    },
  ];

  // Only Admin sees Settings
  if (user?.role === 'ADMIN') {
    menuItems.push({
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">Settings</Link>,
    });
  }

  const profileMenu = {
    items: [
      { key: 'name', label: <Text strong>{user?.name || 'Administrator'}</Text>, disabled: true },
      { key: 'role', label: <Text type="secondary">{user?.role}</Text>, disabled: true },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Log out' },
    ],
    onClick: handleMenuClick,
  };

  // Generate simple breadcrumbs from location
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = pathSnippets.map((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const name = snippet.charAt(0).toUpperCase() + snippet.slice(1);
    return { key: url, title: name };
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          borderRight: '1px solid #E5E7EB',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #E5E7EB' }}>
          <ShoppingOutlined style={{ fontSize: 24, color: '#3651A5', marginRight: collapsed ? 0 : 8 }} />
          {!collapsed && (
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', letterSpacing: '-0.3px' }}>
              Odoo Rent
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0, paddingTop: 16 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E5E7EB',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Notification Bell */}
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                onClick={() => setNotifOpen(true)}
              />
            </Badge>

            {/* Profile Dropdown */}
            <Dropdown menu={profileMenu} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#3651A5' }} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1F2937' }}>{user?.name}</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{user?.role}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: '24px',
            minHeight: 280,
          }}
        >
          <div style={{ marginBottom: 16, fontSize: 12, color: '#6B7280' }}>
            Admin / {breadcrumbItems.map((b) => b.title).join(' / ')}
          </div>
          <Outlet />
        </Content>
      </Layout>

      {/* Notification Drawer */}
      <Drawer
        title="Notifications"
        placement="right"
        onClose={() => setNotifOpen(false)}
        open={notifOpen}
        width={320}
      >
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: item.read ? 400 : 500, color: item.type === 'error' ? '#DC2626' : item.type === 'warning' ? '#D97706' : '#1F2937' }}>
                  {item.message}
                </Text>
                <Text type="secondary" style={{ fontSize: 10 }}>Active Alert</Text>
              </div>
            </List.Item>
          )}
        />
      </Drawer>
    </Layout>
  );
}
