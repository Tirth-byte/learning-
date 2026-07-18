import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const registeredUser = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: 'CUSTOMER', // Default role for storefront registration
      });
      message.success(`Account created successfully! Welcome, ${registeredUser.name}`);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
            Join the Enterprise Rental Platform.
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, maxWidth: 500, lineHeight: 1.6 }}>
            Browse a high-quality selection of electronics, office furniture, and equipment. Rent for hours, days, or months, with secure deposits and quick checkouts.
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
            <Title level={3} style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#1F2937' }}>Create Account</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Get started by setting up your customer account</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 6 }} />}

          <Form name="register" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item 
              name="name" 
              label={<span style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Full Name</span>}
              rules={[{ required: true, message: 'Please input your name!' }]}
              style={{ marginBottom: 16 }}
            >
              <Input prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} placeholder="Aarav Sharma" style={{ borderRadius: 6 }} />
            </Form.Item>

            <Form.Item 
              name="email" 
              label={<span style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Email Address</span>}
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Valid email required' }
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input prefix={<MailOutlined style={{ color: '#9CA3AF' }} />} placeholder="name@company.com" style={{ borderRadius: 6 }} />
            </Form.Item>

            <Form.Item 
              name="password" 
              label={<span style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Password</span>}
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, max: 12, message: 'Password must be between 6 and 12 characters!' }
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="••••••••" style={{ borderRadius: 6 }} />
            </Form.Item>

            <Form.Item 
              name="confirmPassword" 
              label={<span style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Confirm Password</span>}
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="••••••••" style={{ borderRadius: 6 }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 24 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ backgroundColor: '#3651A5', borderColor: '#3651A5', borderRadius: 6, height: 40, fontWeight: 600 }}>
                Register Account
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Already have an account? </Text>
              <Link to="/login" style={{ color: '#3651A5', fontWeight: 600, fontSize: 13 }}>Sign In</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
