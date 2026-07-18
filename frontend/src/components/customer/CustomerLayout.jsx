/**
 * ----------------------------------------------------------------------------------
 * STOREFRONT LAYOUT
 *
 * WHAT THIS FILE DOES:
 * Renders the customer-facing chrome: promo bar, sticky header with catalog search
 * and cart count, the routed page, and the site footer.
 *
 * HOW IT FITS INTO THE APP:
 * Mounted by App.jsx for the storefront routes ('/products', '/cart', '/checkout',
 * '/my-orders', '/profile'). The marketing page at '/' has its own chrome and does
 * not use this layout.
 *
 * WHERE TO CHANGE THINGS:
 *   - Promo bar text and brand name are constants below.
 *   - Visual rules live in CustomerLayout.css.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Layout, Button, Avatar, Dropdown, Badge, Input, Drawer } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  MenuOutlined,
  DashboardOutlined,
  ProfileOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './CustomerLayout.css';

const { Content } = Layout;

// CHANGE THIS TO RENAME THE STORE
const BRAND_NAME = 'Odoo Rent Shop';

// CHANGE THIS TO EDIT THE PROMOTIONAL STRIP ABOVE THE HEADER
const PROMO_TEXT = 'Security deposits are held separately and refunded in full on an on-time return.';

// Primary storefront navigation
const STORE_LINKS = [
  { to: '/products', label: 'Catalog' },
  { to: '/my-orders', label: 'My orders', authOnly: true },
];

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    updateCartCount();
    // The cart lives in localStorage; pages dispatch this event after mutating it
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  /**
   * Recompute the header cart badge from localStorage.
   *
   * Input:  none
   * Output: sets cartCount; falls back to 0 if the stored cart is unparseable.
   */
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('rental_cart') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + (item.qty || 1), 0));
    } catch (error) {
      setCartCount(0);
    }
  };

  /**
   * Push the search term into the catalog URL so the catalog page can filter on it.
   */
  const handleSearch = (value) => {
    const trimmed = value.trim();
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products');
  };

  const handleProfileMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'orders') {
      navigate('/my-orders');
    } else if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'portal') {
      navigate('/admin/dashboard');
    }
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'VENDOR';

  const profileMenu = {
    items: [
      {
        key: 'identity',
        label: (
          <div className="cust-menu-identity">
            <strong>{user?.name || 'Customer'}</strong>
            <span>{user?.email}</span>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      { key: 'profile', icon: <UserOutlined />, label: 'My profile' },
      { key: 'orders', icon: <ProfileOutlined />, label: 'My orders' },
      ...(isStaff ? [{ key: 'portal', icon: <DashboardOutlined />, label: 'Admin portal' }] : []),
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', danger: true },
    ],
    onClick: handleProfileMenuClick,
  };

  const visibleLinks = STORE_LINKS.filter((link) => !link.authOnly || user);

  return (
    <Layout className="cust-shell">
      <div className="cust-promo">{PROMO_TEXT}</div>

      <header className="cust-header">
        <div className="cust-header-inner">
          <div className="cust-header-left">
            <Button
              type="text"
              className="cust-burger"
              aria-label="Open menu"
              icon={<MenuOutlined />}
              onClick={() => setMobileNavOpen(true)}
            />

            <Link to="/" className="cust-logo">
              <span className="cust-logo-mark"><ShopOutlined /></span>
              <span className="cust-logo-name">{BRAND_NAME}</span>
            </Link>

            <nav className="cust-nav">
              {visibleLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`cust-nav-link${location.pathname === link.to ? ' is-active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="cust-search">
            <Input
              allowClear
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onPressEnter={(event) => handleSearch(event.target.value)}
              placeholder="Search the catalog"
              prefix={<SearchOutlined style={{ color: 'var(--faint)' }} />}
            />
          </div>

          <div className="cust-header-right">
            <Link to="/cart" aria-label="Cart" className="cust-cart">
              <Badge count={cartCount} size="small" offset={[-2, 4]} color="var(--brand-500)">
                <Button type="text" icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />} />
              </Badge>
            </Link>

            {user ? (
              <Dropdown menu={profileMenu} trigger={['click']} placement="bottomRight">
                <button className="cust-profile" type="button">
                  <Avatar size={30} style={{ background: 'var(--brand-500)' }} icon={<UserOutlined />} />
                  <span className="cust-profile-name">{user.name?.split(' ')[0]}</span>
                </button>
              </Dropdown>
            ) : (
              <div className="cust-auth-actions">
                <Button type="text" onClick={() => navigate('/login')}>Log in</Button>
                <Button type="primary" className="btn-pill" onClick={() => navigate('/register')}>
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Content className="cust-content">
        <Outlet />
      </Content>

      <footer className="cust-footer">
        <div className="cust-footer-inner">
          <div className="cust-footer-brand">
            <Link to="/" className="cust-logo">
              <span className="cust-logo-mark"><ShopOutlined /></span>
              <span className="cust-logo-name">{BRAND_NAME}</span>
            </Link>
            <p>Rental management from quotation to settled deposit.</p>
          </div>

          <div className="cust-footer-links">
            <Link to="/products">Catalog</Link>
            <Link to="/my-orders">My orders</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/">About</Link>
          </div>
        </div>

        <div className="cust-footer-base">
          <span>{BRAND_NAME} © 2026. India Operations.</span>
          <span>Late fees are calculated per hour and settled against the deposit.</span>
        </div>
      </footer>

      {/* Mobile navigation */}
      <Drawer
        placement="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        width={272}
        title={BRAND_NAME}
      >
        <nav className="cust-mobile-nav">
          {visibleLinks.map((link) => (
            <Link key={link.to} to={link.to}>{link.label}</Link>
          ))}
          <Link to="/cart">Cart ({cartCount})</Link>
          {isStaff && <Link to="/admin/dashboard">Admin portal</Link>}
          {!user && (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Create account</Link>
            </>
          )}
        </nav>
      </Drawer>
    </Layout>
  );
}
