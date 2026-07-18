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
import { Form, Input, Button, Alert, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, CheckCircleFilled, MinusCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';
import api from '../api/axios';

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
  const { register, loginWithToken } = useAuth();
  const navigate = useNavigate();

  // OTP Registration States
  const [registerMode, setRegisterMode] = useState('password'); // 'password' or 'otp'
  const [otpStep, setOtpStep] = useState('request'); // 'request', 'verify', 'complete'
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

  /** Create the account via password flow then route into the storefront. */
  const onFinishPassword = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
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

  /** Complete registration after OTP verification */
  const onFinishOtpComplete = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const isEmail = identifier.includes('@');
      const payload = {
        name: values.name,
        email: isEmail ? identifier : values.email,
        phone: isEmail ? values.phone : identifier,
        password: values.password,
        confirmPassword: values.confirmPassword,
        isOtpSignup: true,
        otpIdentifier: identifier,
      };

      await register(payload);
      message.success('Account created successfully');
      navigate('/products');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Send verification code for registration */
  const handleSendOtp = async () => {
    if (!identifier) {
      setError('Please enter your email or phone number.');
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

  /** Verify code for signup */
  const handleVerifyOtp = async (codeStr) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-otp', { identifier, code: codeStr });
      const { action } = response.data.data;
      if (action === 'signup_verified') {
        setOtpStep('complete');
      } else if (action === 'login') {
        const { token, user } = response.data.data;
        loginWithToken(user, token);
        message.success('Account already exists. Logged in successfully.');
        navigate(user.role === 'CUSTOMER' ? '/products' : '/admin/dashboard');
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

  return (
    <AuthShell
      title="Create your account"
      subtitle={registerMode === 'password' ? 'Set up a customer account to rent equipment.' : 'Set up a customer account instantly using OTP.'}
      panelTitle="Start renting in minutes."
      panelText="Browse the catalog, choose your rental window, and check out with the deposit shown up front."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 'var(--s-5)' }} />}

      {registerMode === 'password' ? (
        <Form name="register" onFinish={onFinishPassword} layout="vertical" requiredMark={false}>
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
            name="phone"
            label="Phone number (optional)"
            rules={[{ pattern: /^\d{10,15}$/, message: 'Must be a valid 10-15 digit number.' }]}
          >
            <Input
              size="large"
              autoComplete="tel"
              prefix={<PhoneOutlined style={{ color: 'var(--faint)' }} />}
              placeholder="9876543210"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Choose a password.' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
                  return failed.length === 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('Password does not meet requirements.'));
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
                  return Promise.reject(new Error('Passwords do not match.'));
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)', marginTop: 'var(--s-2)' }}>
            <Button
              type="default"
              size="large"
              onClick={() => {
                setRegisterMode('otp');
                setOtpStep('request');
              }}
            >
              Sign up with OTP
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              Create account
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
                  onClick={() => setRegisterMode('password')}
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
          ) : otpStep === 'verify' ? (
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
          ) : (
            <Form name="register_complete" onFinish={onFinishOtpComplete} layout="vertical" requiredMark={false}>
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

              {identifier.includes('@') ? (
                <>
                  <Form.Item
                    label="Email address"
                    help="Email address verified via OTP"
                  >
                    <Input size="large" value={identifier} disabled prefix={<MailOutlined style={{ color: 'var(--faint)' }} />} />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Phone number (optional)"
                    rules={[{ pattern: /^\d{10,15}$/, message: 'Must be a valid 10-15 digit number.' }]}
                  >
                    <Input
                      size="large"
                      autoComplete="tel"
                      prefix={<PhoneOutlined style={{ color: 'var(--faint)' }} />}
                      placeholder="9876543210"
                    />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item
                    label="Phone number"
                    help="Phone number verified via OTP"
                  >
                    <Input size="large" value={identifier} disabled prefix={<PhoneOutlined style={{ color: 'var(--faint)' }} />} />
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
                </>
              )}

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Choose a password.' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
                      return failed.length === 0
                        ? Promise.resolve()
                        : Promise.reject(new Error('Password does not meet requirements.'));
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
                      return Promise.reject(new Error('Passwords do not match.'));
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

              <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ marginTop: 'var(--s-2)' }}>
                Complete signup
              </Button>
            </Form>
          )}
        </div>
      )}
    </AuthShell>
  );
};

export default Register;
