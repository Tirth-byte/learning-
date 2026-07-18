/**
 * ----------------------------------------------------------------------------------
 * LOGIN PAGE
 *
 * WHAT THIS FILE DOES:
 * Authenticates a user and routes them to the right home screen: customers to the
 * storefront catalog, admins and vendors to the operations portal. Also offers
 * one-click demo logins for each role.
 *
 * HOW IT FITS INTO THE APP:
 * Public route at '/login'. Uses AuthContext.login, which stores the JWT that
 * api/axios.js attaches to subsequent requests.
 *
 * WHERE TO CHANGE THINGS:
 *   - Demo accounts are listed in DEMO_ACCOUNTS below.
 *   - Layout and styling live in components/auth/AuthShell.{jsx,css}.
 * ----------------------------------------------------------------------------------
 */

import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  RightOutlined,
  CrownOutlined,
  ShopOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';

// CHANGE THESE TO UPDATE THE ONE-CLICK DEMO LOGIN BUTTONS
const DEMO_ACCOUNTS = [
  { role: 'Admin', description: 'Full platform access', email: 'admin@rental.com', password: 'Admin@123', icon: <CrownOutlined /> },
  { role: 'Vendor', description: 'Own products and orders', email: 'vendor1@rental.com', password: 'Vendor@123', icon: <ShopOutlined /> },
  { role: 'Customer', description: 'Storefront and rentals', email: 'customer1@rental.com', password: 'Customer@123', icon: <ShoppingOutlined /> },
];

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  /**
   * Submit credentials and route by role.
   *
   * Input:  { email, password }
   * Output: navigates on success, or surfaces the failure message inline.
   */
  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await login(values.email, values.password);
      navigate(loggedInUser.role === 'CUSTOMER' ? '/products' : '/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  /** Fill the form with a demo account and submit it immediately. */
  const loginAsDemo = (account) => {
    form.setFieldsValue({ email: account.email, password: account.password });
    onFinish({ email: account.email, password: account.password });
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your account to manage rentals, orders, and returns."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 'var(--s-5)' }}
        />
      )}

      <Form form={form} name="login" onFinish={onFinish} layout="vertical" requiredMark={false}>
        <Form.Item
          name="email"
          label="Email address"
          rules={[
            { required: true, message: 'Enter your email address.' },
            { type: 'email', message: 'That does not look like a valid email.' },
          ]}
        >
          <Input
            size="large"
            autoComplete="email"
            prefix={<MailOutlined style={{ color: 'var(--faint)' }} />}
            placeholder="name@company.com"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <div className="u-between" style={{ width: '100%' }}>
              <span>Password</span>
              <Link to="/forgot-password" style={{ fontSize: 'var(--t-2xs)', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
          }
          rules={[{ required: true, message: 'Enter your password.' }]}
        >
          <Input.Password
            size="large"
            autoComplete="current-password"
            prefix={<LockOutlined style={{ color: 'var(--faint)' }} />}
            placeholder="••••••••"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          style={{ marginTop: 'var(--s-2)' }}
        >
          Sign in
        </Button>
      </Form>

      <div className="auth-divider">Demo logins</div>

      <div className="auth-demos">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.role}
            type="button"
            className="auth-demo"
            disabled={loading}
            onClick={() => loginAsDemo(account)}
          >
            <span className="auth-demo-avatar">{account.icon}</span>
            <span className="auth-demo-text">
              <strong>Continue as {account.role}</strong>
              <span>{account.description}</span>
            </span>
            <RightOutlined className="auth-demo-arrow" />
          </button>
        ))}
      </div>
    </AuthShell>
  );
};

export default Login;
