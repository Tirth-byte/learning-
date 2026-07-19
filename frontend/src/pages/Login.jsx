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
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Login Flow States
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [email, setEmail] = useState('');
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

  // Handle password submission: authenticate and send OTP
  const onFinishForm = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password,
      });

      if (response.data.data.requireOtp) {
        setEmail(values.email);
        setStep('otp');
        setCountdown(30);
        setOtpCode(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.current?.focus(), 100);
        
        // In dev mode, the code is returned in the API payload
        if (response.data.data.code) {
          console.log(`[Demo Dev Mode] Received OTP code: ${response.data.data.code}`);
          message.info(`[Demo OTP] Code: ${response.data.data.code}`);
        }
      } else {
        // Fallback: log in directly if 2FA was bypassed
        const { token, user } = response.data.data;
        loginWithToken(user, token);
        message.success('Login successful');
        navigate(user.role === 'CUSTOMER' ? '/products' : '/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Re-send OTP code
  const handleResendOtp = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/send-otp', { identifier: email });
      if (response.data.code) {
        console.log(`[Demo Dev Mode] Received OTP code: ${response.data.code}`);
        message.info(`[Demo OTP] Code: ${response.data.code}`);
      }
      setCountdown(30);
      setOtpCode(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 100);
      message.success('New verification code sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Complete login with OTP code
  const handleVerifyOtp = async (codeStr) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login/verify', { email, code: codeStr });
      const { token, user } = response.data.data;
      loginWithToken(user, token);
      message.success('Login successful');
      navigate(user.role === 'CUSTOMER' ? '/products' : '/admin/dashboard');
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

  // Fill and submit demo login
  const loginAsDemo = (account) => {
    form.setFieldsValue({ email: account.email, password: account.password });
    onFinishForm({ email: account.email, password: account.password });
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle={step === 'form' ? 'Access your account to manage rentals, orders, and returns.' : 'Verify the OTP code sent to your email.'}
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 'var(--s-5)' }} />}

      {step === 'form' ? (
        <Form form={form} name="login" onFinish={onFinishForm} layout="vertical" requiredMark={false}>
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

          <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ marginTop: 'var(--s-4)' }}>
            Sign In
          </Button>
        </Form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center', fontSize: 'var(--t-sm)', color: 'var(--body)' }}>
            Enter the 6-digit code sent to <strong style={{ color: 'var(--ink)' }}>{email}</strong>
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
              <Button type="link" style={{ padding: 0 }} onClick={handleResendOtp}>
                Resend OTP code
              </Button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', width: '100%', marginTop: '8px' }}>
              <Button
                type="default"
                size="large"
                onClick={() => setStep('form')}
              >
                Back to Login Form
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'form' && (
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
