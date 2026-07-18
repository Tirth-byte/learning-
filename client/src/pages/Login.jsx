import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert, message, Divider, Space } from 'antd';
import { MailOutlined, LockOutlined, ShoppingOutlined, RightOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await login(values.email, values.password);
      message.success(`Welcome back, ${loggedInUser.name}!`);
      
      if (loggedInUser.role === 'CUSTOMER') {
        navigate('/');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = (email, password) => {
    form.setFieldsValue({ email, password });
    onFinish({ email, password });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F5F6F8' }}>
      {/* Left Column: Slogan & Branding Area (SaaS/ERP styled) */}
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
            The Modern Way to Manage Rental Operations.
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, maxWidth: 500, lineHeight: 1.6 }}>
            Track inventories, draft quotations, generate posted invoices, and calculate late return schedules automatically from a unified operational dashboard.
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
            <Title level={3} style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#1F2937' }}>Sign In</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Access your account to start managing rentals</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 6 }} />}

          <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item 
              name="email" 
              label={<span style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Email Address</span>}
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Enter a valid email address!' }
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input prefix={<MailOutlined style={{ color: '#9CA3AF' }} />} placeholder="name@company.com" style={{ borderRadius: 6 }} />
            </Form.Item>

            <Form.Item 
              name="password" 
              label={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>Password</span>
                  <Link to="/forgot-password" style={{ fontSize: 12, color: '#3651A5', fontWeight: 500 }}>Forgot?</Link>
                </div>
              }
              rules={[{ required: true, message: 'Please input your password!' }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="••••••••" style={{ borderRadius: 6 }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 24 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ backgroundColor: '#3651A5', borderColor: '#3651A5', borderRadius: 6, height: 40, fontWeight: 600 }}>
                Sign In
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>New to Odoo Rent? </Text>
              <Link to="/register" style={{ color: '#3651A5', fontWeight: 600, fontSize: 13 }}>Create an account</Link>
            </div>

            <Divider style={{ margin: '20px 0' }}><span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>FAST TESTING DEMO LOGINS</span></Divider>

            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Button 
                block 
                size="middle" 
                onClick={() => loginAsDemo('admin@rental.com', 'Admin@123')}
                style={{ borderRadius: 6, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E5E7EB' }}
              >
                <span>👤 Login as <strong>Admin (Manager)</strong></span>
                <RightOutlined style={{ fontSize: 10, color: '#9CA3AF' }} />
              </Button>
              <Button 
                block 
                size="middle" 
                onClick={() => loginAsDemo('vendor1@rental.com', 'Vendor@123')}
                style={{ borderRadius: 6, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E5E7EB' }}
              >
                <span>🏬 Login as <strong>Vendor (Provider)</strong></span>
                <RightOutlined style={{ fontSize: 10, color: '#9CA3AF' }} />
              </Button>
              <Button 
                block 
                size="middle" 
                onClick={() => loginAsDemo('customer1@rental.com', 'Customer@123')}
                style={{ borderRadius: 6, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E5E7EB' }}
              >
                <span>🛒 Login as <strong>Customer (Shopper)</strong></span>
                <RightOutlined style={{ fontSize: 10, color: '#9CA3AF' }} />
              </Button>
            </Space>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
