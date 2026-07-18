/**
 * ----------------------------------------------------------------------------------
 * ADMIN PORTAL LAYOUT
 *
 * WHAT THIS FILE DOES:
 * Renders the chrome around every admin/vendor page: the grouped sidebar navigation,
 * the sticky top bar with notifications and the profile menu, and the content well
 * that hosts the routed page.
 *
 * HOW IT FITS INTO THE APP:
 * Mounted by App.jsx for the '/admin/*' route tree, behind the ADMIN/VENDOR guard.
 *
 * WHERE TO CHANGE THINGS:
 *   - Navigation items and their grouping live in NAV_GROUPS below.
 *   - Visual rules live in AdminLayout.css.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Drawer, Empty, Tooltip, Grid } from 'antd';
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
  ShopOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './AdminLayout.css';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

// CHANGE THIS TO RENAME THE PORTAL IN THE SIDEBAR
const PORTAL_NAME = 'Odoo Rent';

// Sidebar width in each state, kept here so the content offset stays in sync
const SIDEBAR_WIDTH = 232;
const SIDEBAR_WIDTH_COLLAPSED = 76;

/**
 * Navigation grouped into labelled sections. `adminOnly` items are filtered out for
 * vendors, who must not reach platform settings.
 */
const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/admin/orders', icon: <ShoppingOutlined />, label: 'Orders' },
      { key: '/admin/schedule', icon: <CalendarOutlined />, label: 'Schedule' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { key: '/admin/products', icon: <TagsOutlined />, label: 'Products' },
      { key: '/admin/pricelists', icon: <FileTextOutlined />, label: 'Pricelists' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { key: '/admin/reports', icon: <BarChartOutlined />, label: 'Reports' },
      { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings', adminOnly: true },
    ],
  },
];

/** Human-readable titles for breadcrumb segments that shouldn't be auto-capitalised. */
const SEGMENT_LABELS = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  orders: 'Orders',
  products: 'Products',
  pricelists: 'Pricelists',
  reports: 'Reports',
  settings: 'Settings',
  schedule: 'Schedule',
  profile: 'Profile',
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  // Below lg the sidebar becomes an overlay drawer instead of a fixed rail
  const isMobile = !screens.lg;

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close the mobile nav whenever the route changes, or it covers the new page
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  /**
   * Build the alert list from live dashboard counters.
   *
   * Input:  none
   * Output: sets notifications; falls back to an all-clear entry.
   */
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const stats = response.data.data;
      const loaded = [];

      if (stats?.overdueCount > 0) {
        loaded.push({
          id: 'overdue',
          title: 'Overdue returns',
          message: `${stats.overdueCount} active rental${stats.overdueCount > 1 ? 's have' : ' has'} passed the return deadline.`,
          tone: 'danger',
          icon: <WarningOutlined />,
          to: '/admin/orders',
        });
      }
      if (stats?.dueTodayCount > 0) {
        loaded.push({
          id: 'dueToday',
          title: 'Due back today',
          message: `${stats.dueTodayCount} rental${stats.dueTodayCount > 1 ? 's are' : ' is'} scheduled to return today.`,
          tone: 'warning',
          icon: <ClockCircleOutlined />,
          to: '/admin/schedule',
        });
      }
      if (loaded.length === 0) {
        loaded.push({
          id: 'allClear',
          title: 'All clear',
          message: 'No overdue returns and nothing due back today.',
          tone: 'success',
          icon: <CheckCircleOutlined />,
          read: true,
        });
      }
      setNotifications(loaded);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleProfileMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'profile') {
      navigate('/admin/profile');
    } else if (key === 'storefront') {
      navigate('/products');
    }
  };

  const profileMenu = {
    items: [
      {
        key: 'identity',
        label: (
          <div className="adm-menu-identity">
            <strong>{user?.name || 'Administrator'}</strong>
            <span>{user?.email}</span>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      { key: 'profile', icon: <UserOutlined />, label: 'My profile' },
      { key: 'storefront', icon: <ShopOutlined />, label: 'View storefront' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', danger: true },
    ],
    onClick: handleProfileMenuClick,
  };

  // Menu items, filtered by role and wrapped in router links
  const menuItems = NAV_GROUPS.flatMap((group) => {
    const visibleItems = group.items.filter((item) => !item.adminOnly || user?.role === 'ADMIN');
    if (visibleItems.length === 0) return [];

    return [
      // Group headings are noise when the rail is collapsed to icons
      ...(collapsed && !isMobile ? [] : [{ key: `group-${group.label}`, type: 'group', label: group.label }]),
      ...visibleItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: <Link to={item.key}>{item.label}</Link>,
      })),
    ];
  });

  /**
   * Breadcrumb trail from the URL. The leading 'admin' segment is rendered once as a
   * static root, so '/admin/dashboard' reads 'Admin / Dashboard' rather than
   * 'Admin / Admin / Dashboard'.
   */
  const segments = location.pathname.split('/').filter(Boolean);
  const trailSegments = segments[0] === 'admin' ? segments.slice(1) : segments;
  const breadcrumbTrail = trailSegments.map((segment, index) => {
    const url = `/admin/${trailSegments.slice(0, index + 1).join('/')}`;
    const label = SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    return { url, label };
  });

  const unreadCount = notifications.filter((item) => !item.read).length;

  const sidebarContent = (
    <>
      <div className="adm-brand">
        <span className="adm-brand-mark"><ShopOutlined /></span>
        {(!collapsed || isMobile) && <span className="adm-brand-name">{PORTAL_NAME}</span>}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        className="adm-menu"
      />

      {(!collapsed || isMobile) && (
        <div className="adm-side-foot">
          <div className="adm-side-card">
            <span className="adm-side-card-title">Signed in as</span>
            <strong>{user?.name}</strong>
            <span className="pill pill-info" style={{ marginTop: 8 }}>{user?.role}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <Layout className="adm-shell">
      {isMobile ? (
        <Drawer
          placement="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          width={SIDEBAR_WIDTH}
          closable={false}
          styles={{ body: { padding: 0 } }}
          className="adm-mobile-nav"
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={SIDEBAR_WIDTH}
          collapsedWidth={SIDEBAR_WIDTH_COLLAPSED}
          theme="light"
          className="adm-sider"
        >
          {sidebarContent}
        </Sider>
      )}

      <Layout
        className="adm-main"
        style={{ marginLeft: isMobile ? 0 : collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
      >
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <Button
              type="text"
              aria-label="Toggle navigation"
              icon={collapsed && !isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => (isMobile ? setMobileNavOpen(true) : setCollapsed(!collapsed))}
            />
            <nav className="crumbs adm-crumbs" aria-label="Breadcrumb">
              <Link to="/admin/dashboard">Admin</Link>
              {breadcrumbTrail.map((crumb, index) => (
                <React.Fragment key={crumb.url}>
                  <span className="crumbs-sep">/</span>
                  {index === breadcrumbTrail.length - 1 ? (
                    <span className="crumbs-current">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.url}>{crumb.label}</Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="adm-topbar-right">
            <Tooltip title="View storefront">
              <Button type="text" icon={<ShopOutlined />} onClick={() => navigate('/products')} />
            </Tooltip>

            <Badge count={unreadCount} size="small" offset={[-2, 4]}>
              <Button
                type="text"
                aria-label="Notifications"
                icon={<BellOutlined />}
                onClick={() => setNotifOpen(true)}
              />
            </Badge>

            <Dropdown menu={profileMenu} trigger={['click']} placement="bottomRight">
              <button className="adm-profile" type="button">
                <Avatar size={32} style={{ background: 'var(--brand-500)' }} icon={<UserOutlined />} />
                <span className="adm-profile-text">
                  <strong>{user?.name}</strong>
                  <span>{user?.role}</span>
                </span>
              </button>
            </Dropdown>
          </div>
        </header>

        <Content className="adm-content">
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title="Notifications"
        placement="right"
        onClose={() => setNotifOpen(false)}
        open={notifOpen}
        width={360}
      >
        {notifications.length === 0 ? (
          <Empty description="Nothing to report" />
        ) : (
          <ul className="adm-notif-list">
            {notifications.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="adm-notif"
                  onClick={() => {
                    if (item.to) navigate(item.to);
                    setNotifOpen(false);
                  }}
                >
                  <span className={`adm-notif-icon adm-notif-${item.tone}`}>{item.icon}</span>
                  <span className="adm-notif-body">
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </Layout>
  );
}
