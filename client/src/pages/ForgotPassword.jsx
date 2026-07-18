import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert, message, Space } from 'antd';
import { MailOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { forgotPassword } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await forgotPassword(values.email);
      setSuccess(true);
      message.success('Password reset email mock triggered');
    } catch (err) {
      setError(err.message || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F5F6F8' }}>
      {/* Left Column: Slogan & Branding Area */}
      <div 
        style={{ 
          flex: '1.2', 
          backgroundColor: '#3651A5', 
          color: '#ffffff', 
          padding: '60px', 
          display: 'none', 
          lg: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="login-left-banner"
      >
        <div style={{ zIndex: 2 }}>
          <Space style={{ marginBottom: 40 }}>
            <ShoppingOutlined style={{ fontSize: 28 }} />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>Odoo Rent India</span>
          </Space>
          
          <Title level={1} style={{ color: '#ffffff', fontSize: 38, fontWeight: 700, lineHeight: 1.2, margin: '0 0 20px 0' }}>
            Recover Access to Your Account.
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, maxWidth: 500, lineHeight: 1.6 }}>
            Confirm your registered email address and we will dispatch a reset link to refresh your security credentials.
          </Paragraph>
        </div>

        {/* Decorative background grids */}
        <div style={{ 
          position: 'absolute', 
          bottom: '-10%', 
          right: '-10%', 
          width: '500px', 
          height: '500px', 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
          zIndex: 1
        }} />

        <div style={{ zIndex: 2 }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>
            Trusted by modern product and equipment rental shops.
          </Text>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, display: 'none', md: 'flex' }}>
              <ShoppingOutlined style={{ fontSize: 24, color: '#3651A5' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#3651A5' }}>Odoo Rent</span>
            </div>
            <Title level={3} style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#1F2937' }}>Reset Password</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Enter your email to receive a password reset link</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 6 }} />}
          {success && <Alert message="Check your email inbox! A reset link has been dispatched." type="success" showIcon style={{ marginBottom: 20, borderRadius: 6 }} />}

          <Form name="forgot_password" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item 
              name="email" 
              label={<span style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Email Address</span>}
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Valid email required' }
              ]}
              style={{ marginBottom: 24 }}
            >
              <Input prefix={<MailOutlined style={{ color: '#9CA3AF' }} />} placeholder="name@company.com" style={{ borderRadius: 6 }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 24 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ backgroundColor: '#3651A5', borderColor: '#3651A5', borderRadius: 6, height: 40, fontWeight: 600 }}>
                Send Reset Link
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#3651A5', fontWeight: 600, fontSize: 13 }}>Back to Sign In</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
