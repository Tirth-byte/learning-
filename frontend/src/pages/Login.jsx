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
import { Form, Input, Button, Alert, message } from 'antd';
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
import api from '../api/axios';

// CHANGE THESE TO UPDATE THE ONE-CLICK DEMO LOGIN BUTTONS
const DEMO_ACCOUNTS = [
  { role: 'Admin', description: 'Full platform access', email: 'admin@rental.com', password: 'Admin@123', icon: <CrownOutlined /> },
  { role: 'Vendor', description: 'Own products and orders', email: 'vendor1@rental.com', password: 'Vendor@123', icon: <ShopOutlined /> },
  { role: 'Customer', description: 'Storefront and rentals', email: 'customer1@rental.com', password: 'Customer@123', icon: <ShoppingOutlined /> },
];

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // OTP Login States
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [otpStep, setOtpStep] = useState('request'); // 'request' or 'verify'
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = React.useRef([]);
  if (otpRefs.current.length !== 6) {
    otpRefs.current = Array(6).fill().map((_, i) => otpRefs.current[i] || React.createRef());
  }

  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  /** Submit credentials and route by role. */
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

  /** Send verification code */
  const handleSendOtp = async () => {
    if (!identifier) {
      setError('Enter your email or phone number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/send-otp', { identifier });
      if (response.data.code) {
        console.log(`[Demo Dev Mode] Received OTP code: ${response.data.code}`);
        message.info(`[Demo OTP] Code: ${response.data.code}`);
      }
      setOtpStep('verify');
      setCountdown(30);
      setOtpCode(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  /** Verify code and login */
  const handleVerifyOtp = async (codeStr) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-otp', { identifier, code: codeStr });
      const { action, token, user } = response.data.data;
      if (action === 'login') {
        loginWithToken(user, token);
        message.success('Login successful');
        navigate(user.role === 'CUSTOMER' ? '/products' : '/admin/dashboard');
      } else {
        setError('Verification successful, but no account exists. Please sign up first.');
        setLoginMode('password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (val && isNaN(Number(val))) return;
    const newCode = [...otpCode];
    newCode[idx] = val;
    setOtpCode(newCode);

    if (val && idx < 5) {
      otpRefs.current[idx + 1].current.focus();
    }

    if (newCode.join('').length === 6 && idx === 5) {
      handleVerifyOtp(newCode.join(''));
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) {
      otpRefs.current[idx - 1].current.focus();
    }
  };

  /** Fill the form with a demo account and submit it immediately. */
  const loginAsDemo = (account) => {
    form.setFieldsValue({ email: account.email, password: account.password });
    onFinish({ email: account.email, password: account.password });
  };

  return (
    <AuthShell
      title={loginMode === 'password' ? 'Sign in' : 'OTP Sign in'}
      subtitle={loginMode === 'password' ? 'Access your account to manage rentals, orders, and returns.' : 'Sign in instantly using a one-time code.'}
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

      {loginMode === 'password' ? (
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)', marginTop: 'var(--s-2)' }}>
            <Button
              type="default"
              size="large"
              onClick={() => {
                setLoginMode('otp');
                setOtpStep('request');
              }}
            >
              Sign in with OTP
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              Sign in
            </Button>
          </div>
        </Form>
      ) : (
        <div>
          {otpStep === 'request' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--t-sm)', fontWeight: 650, color: 'var(--ink)' }}>Email or Phone number</label>
                <Input
                  size="large"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@company.com or 9876543210"
                  prefix={<MailOutlined style={{ color: 'var(--faint)' }} />}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
                <Button
                  type="default"
                  size="large"
                  onClick={() => setLoginMode('password')}
                >
                  Back to Password
                </Button>
                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  onClick={handleSendOtp}
                >
                  Send OTP
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'center', fontSize: 'var(--t-sm)', color: 'var(--body)' }}>
                Enter the 6-digit code sent to <strong style={{ color: 'var(--ink)' }}>{identifier}</strong>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs.current[idx]}
                    type="text"
                    pattern="\d*"
                    maxLength={1}
                    value={otpCode[idx]}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    style={{
                      width: 44,
                      height: 48,
                      fontSize: 20,
                      textAlign: 'center',
                      borderRadius: 6,
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                      fontWeight: '600',
                      color: 'var(--ink)',
                      outline: 'none'
                    }}
                  />
                ))}
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                {countdown > 0 ? (
                  <span style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>
                    Resend code in {countdown}s
                  </span>
                ) : (
                  <Button type="link" style={{ padding: 0 }} onClick={() => handleSendOtp()}>
                    Resend OTP code
                  </Button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', width: '100%' }}>
                  <Button
                    type="default"
                    size="large"
                    onClick={() => setOtpStep('request')}
                  >
                    Change email/phone
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {loginMode === 'password' && (
        <>
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
        </>
      )}
    </AuthShell>
  );
};

export default Login;
