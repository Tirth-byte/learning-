import React, { useState, useEffect } from 'react';
import { Typography, Card, Form, Input, Button, Row, Col, Avatar, Divider, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined, SolutionOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const Profile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const { user, setUser } = useAuth(); // Context updates

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await api.get('/auth/me');
      const data = res.data.data;
      setUserProfile(data);
      form.setFieldsValue(data);
    } catch (err) {
      console.error(err);
      message.error('Failed to load profile details from server');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      const res = await api.put('/auth/profile', values);
      message.success('Profile updated successfully');
      
      // Update local and context state
      const updatedUser = res.data.data;
      setUserProfile(updatedUser);
      setUser(updatedUser);
      localStorage.setItem('rental_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (values) => {
    try {
      setLoading(true);
      await api.put('/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password updated successfully');
      passwordForm.resetFields();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={4} style={{ color: '#1F2937', marginBottom: '24px' }}>My Account Profile</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="enterprise-card" style={{ textAlign: 'center', padding: '12px' }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#3651A5', marginBottom: '16px' }} />
            <Title level={5} style={{ margin: 0 }}>{userProfile?.name}</Title>
            <Tag color="#3651A5" className="status-tag" style={{ marginTop: 8 }}>{userProfile?.role}</Tag>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <div style={{ textAlign: 'left', fontSize: 13 }}>
              <div style={{ marginBottom: 6 }}>
                <Text type="secondary">Registered Email</Text>
                <br/>
                <Text strong>{userProfile?.email}</Text>
              </div>
              <div>
                <Text type="secondary">Member Since</Text>
                <br/>
                <Text strong>{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          {/* Profile form */}
          <Card bordered={false} className="enterprise-card" title={<span><SolutionOutlined style={{ marginRight: 8 }} /> Personal & Company details</span>} style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="email" label="Email Address">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="phone" label="Phone Number">
                    <Input />
                  </Form.Item>
                </Col>
                
                {/* Enterprise Details */}
                <Col span={24}>
                  <Divider style={{ margin: '8px 0 16px 0' }} />
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="companyName" label="Company Name">
                    <Input placeholder="e.g. Acme Rentals Ltd" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="gstNo" label="GST Number">
                    <Input placeholder="e.g. 27AAAAA1111A1Z1" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="address" label="Billing & Shipping Address">
                    <Input.TextArea rows={2} placeholder="Enter physical street address" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} style={{ backgroundColor: '#3651A5' }}>
                Save Profile
              </Button>
            </Form>
          </Card>

          {/* Password update form */}
          <Card bordered={false} className="enterprise-card" title={<span><LockOutlined style={{ marginRight: 8 }} /> Password Security</span>}>
            <Form form={passwordForm} layout="vertical" onFinish={handleUpdatePassword}>
              <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true, message: 'Please input current password' }]}>
                <Input.Password />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="newPassword" label="New Password" rules={[{ required: true, message: 'Password is required' }, { min: 6, max: 12, message: 'Must be 6-12 chars' }]}>
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    name="confirmPassword" 
                    label="Confirm New Password" 
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Please confirm password' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('The two passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} style={{ backgroundColor: '#3651A5' }}>
                Update Password
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
