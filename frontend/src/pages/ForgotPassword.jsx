/**
 * ----------------------------------------------------------------------------------
 * FORGOT PASSWORD PAGE
 *
 * WHAT THIS FILE DOES:
 * Takes an email address and triggers the password-reset flow, then swaps the form
 * for a confirmation state so the user knows the request went through.
 *
 * HOW IT FITS INTO THE APP:
 * Public route at '/forgot-password', linked from the Login page.
 *
 * WHERE TO CHANGE THINGS:
 *   - Layout and styling live in components/auth/AuthShell.{jsx,css}.
 * ----------------------------------------------------------------------------------
 */

import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, CheckCircleFilled, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sentToEmail, setSentToEmail] = useState(null);
  const { forgotPassword } = useAuth();

  /**
   * Request a reset link.
   *
   * Input:  { email }
   * Output: switches to the confirmation state, or shows the error inline.
   */
  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(values.email);
      setSentToEmail(values.email);
    } catch (err) {
      setError(err.message || 'Could not process the reset request.');
    } finally {
      setLoading(false);
    }
  };

  // Confirmation state, shown after a successful request
  if (sentToEmail) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`If an account exists for ${sentToEmail}, we've sent a link to reset the password.`}
        panelTitle="Back in a moment."
        panelText="Reset links are single use. Request another if this one expires before you get to it."
        footer={<Link to="/login">Return to sign in</Link>}
      >
        <div
          className="surface"
          style={{ padding: 'var(--s-5)', display: 'flex', gap: 'var(--s-3)', alignItems: 'flex-start' }}
        >
          <CheckCircleFilled style={{ color: 'var(--success)', fontSize: 20, marginTop: 2 }} />
          <div>
            <div className="u-h3" style={{ marginBottom: 4 }}>Reset link sent</div>
            <p className="u-muted" style={{ margin: 0 }}>
              Didn’t get it? Check the spam folder, or try again with a different address.
            </p>
          </div>
        </div>

        <Button
          block
          size="large"
          icon={<ArrowLeftOutlined />}
          style={{ marginTop: 'var(--s-4)' }}
          onClick={() => setSentToEmail(null)}
        >
          Use a different email
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send a link to set a new password."
      panelTitle="Locked out? It happens."
      panelText="We'll email you a secure link so you can get back to managing rentals."
      footer={<>Remembered it? <Link to="/login">Sign in</Link></>}
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 'var(--s-5)' }} />}

      <Form name="forgot" onFinish={onFinish} layout="vertical" requiredMark={false}>
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

        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Send reset link
        </Button>
      </Form>
    </AuthShell>
  );
};

export default ForgotPassword;
