/**
 * ----------------------------------------------------------------------------------
 * REGISTRATION PAGE
 *
 * WHAT THIS FILE DOES:
 * Creates a customer account and signs the user straight into the storefront. The
 * password rules mirror the server's validation in services/authService.js exactly,
 * and are shown as a live checklist so failures surface before submitting.
 *
 * HOW IT FITS INTO THE APP:
 * Public route at '/register'. On success AuthContext stores the JWT and the user
 * lands on the catalog.
 *
 * WHERE TO CHANGE THINGS:
 *   - PASSWORD_RULES must stay in sync with server/src/services/authService.js.
 *   - Layout and styling live in components/auth/AuthShell.{jsx,css}.
 * ----------------------------------------------------------------------------------
 */

import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, CheckCircleFilled, MinusCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';

// The server accepts only these special characters — see authService.js step 5
const ALLOWED_SPECIALS = '@ $ & _';

/**
 * Live password requirements. Each `test` mirrors a server-side check, so a password
 * that satisfies every rule here will not be rejected by the API.
 */
const PASSWORD_RULES = [
  { key: 'length', label: '6 to 12 characters', test: (value) => value.length >= 6 && value.length <= 12 },
  { key: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { key: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { key: 'special', label: `One special character (${ALLOWED_SPECIALS})`, test: (value) => /[@$&_]/.test(value) },
];

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  /**
   * Create the account then route into the storefront.
   *
   * Input:  { name, email, password, confirmPassword }
   * Output: navigates to '/products', or shows the server's message inline.
   */
  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // AuthContext.register posts this object straight to /auth/register
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      navigate('/products');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up a customer account to rent equipment and track your orders."
      panelTitle="Start renting in minutes."
      panelText="Browse the catalog, choose your rental window, and check out with the deposit shown up front — no surprises at return time."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 'var(--s-5)' }} />}

      <Form name="register" onFinish={onFinish} layout="vertical" requiredMark={false}>
        <Form.Item
          name="name"
          label="Full name"
          rules={[{ required: true, message: 'Enter your full name.' }]}
        >
          <Input
            size="large"
            autoComplete="name"
            prefix={<UserOutlined style={{ color: 'var(--faint)' }} />}
            placeholder="Aarav Sharma"
          />
        </Form.Item>

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
          label="Password"
          rules={[
            { required: true, message: 'Choose a password.' },
            {
              // Validate against the same rules the server enforces
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
                return failed.length === 0
                  ? Promise.resolve()
                  : Promise.reject(new Error('Password does not meet all the requirements below.'));
              },
            },
          ]}
        >
          <Input.Password
            size="large"
            autoComplete="new-password"
            prefix={<LockOutlined style={{ color: 'var(--faint)' }} />}
            placeholder="••••••••"
            onChange={(event) => setPasswordValue(event.target.value)}
          />
        </Form.Item>

        {/* Live checklist so the user sees which rule is still unmet */}
        <div className="auth-rules">
          {PASSWORD_RULES.map((rule) => {
            const isMet = passwordValue.length > 0 && rule.test(passwordValue);
            return (
              <div key={rule.key} className={`auth-rule${isMet ? ' is-met' : ''}`}>
                {isMet ? <CheckCircleFilled /> : <MinusCircleOutlined />}
                {rule.label}
              </div>
            );
          })}
        </div>

        <Form.Item
          name="confirmPassword"
          label="Confirm password"
          dependencies={['password']}
          style={{ marginTop: 'var(--s-5)' }}
          rules={[
            { required: true, message: 'Re-enter your password.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('The two passwords do not match.'));
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            autoComplete="new-password"
            prefix={<LockOutlined style={{ color: 'var(--faint)' }} />}
            placeholder="••••••••"
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Create account
        </Button>
      </Form>
    </AuthShell>
  );
};

export default Register;
