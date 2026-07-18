/**
 * ----------------------------------------------------------------------------------
 * ACCOUNT PROFILE PAGE
 *
 * WHAT THIS FILE DOES:
 * Lets any signed-in user (customer, vendor, or admin) view their account summary,
 * edit their contact details, and change their password.
 *
 * HOW IT FITS INTO THE APP:
 * Routed at both '/profile' (storefront chrome) and '/admin/profile' (portal chrome),
 * so it must not assume either layout.
 *
 * NOTE ON TWO FIXED BUGS:
 *   - The previous version rendered <Tag> without importing it, which threw
 *     'Tag is not defined' and left both routes blank.
 *   - It also called setUser() from useAuth, which the context did not expose.
 *     AuthContext now provides setUser.
 *
 * WHERE TO CHANGE THINGS:
 *   - Password rules mirror server/src/services/authService.js.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Avatar, message, Spin } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SaveOutlined,
  MailOutlined,
  HomeOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Surface } from '../../components/ui';

// Mirrors the server-side rules in authService.js — the special set is limited
const PASSWORD_HINT = '6–12 characters, with an uppercase letter, a lowercase letter, and one of @ $ & _';

const Profile = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const { user, setUser } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  /** Load the authoritative profile from the API and seed the form. */
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await api.get('/auth/me');
      const data = response.data.data;
      setUserProfile(data);
      profileForm.setFieldsValue(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      message.error('Could not load your profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  /**
   * Save contact details, then refresh both the context and the cached copy in
   * localStorage so the header shows the new name immediately.
   */
  const handleUpdateProfile = async (values) => {
    try {
      setSavingProfile(true);
      const response = await api.put('/auth/profile', values);
      const updatedUser = response.data.data;

      setUserProfile(updatedUser);
      setUser(updatedUser);
      localStorage.setItem('rental_user', JSON.stringify(updatedUser));
      message.success('Profile updated.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error(error.response?.data?.message || 'Could not update your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  /** Change the password, then clear the form so the fields are not left populated. */
  const handleUpdatePassword = async (values) => {
    try {
      setSavingPassword(true);
      await api.put('/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password updated.');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Failed to update password:', error);
      message.error(error.response?.data?.message || 'Could not update your password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: '120px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const displayName = userProfile?.name || user?.name || 'Account';

  return (
    <div className="page page-narrow">
      <PageHeader
        title="My account"
        subtitle="Update your contact details and manage your password."
      />

      {/* Identity summary */}
      <Surface className="surface-pad" style={{ marginBottom: 'var(--s-5)' }}>
        <div className="u-row" style={{ gap: 'var(--s-4)' }}>
          <Avatar size={56} style={{ background: 'var(--brand-500)', flex: 'none' }} icon={<UserOutlined />} />
          <div className="u-grow">
            <div className="u-h3">{displayName}</div>
            <div className="u-muted">{userProfile?.email}</div>
          </div>
          <span className="pill pill-info">{userProfile?.role || user?.role}</span>
        </div>
      </Surface>

      {/* Contact details */}
      <Surface title="Contact details" style={{ marginBottom: 'var(--s-5)' }}>
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Full name"
            rules={[{ required: true, message: 'Enter your name.' }]}
          >
            <Input size="large" prefix={<UserOutlined style={{ color: 'var(--faint)' }} />} />
          </Form.Item>

          <Form.Item name="email" label="Email address">
            {/* Email identifies the account, so it is read-only here */}
            <Input
              size="large"
              disabled
              prefix={<MailOutlined style={{ color: 'var(--faint)' }} />}
            />
          </Form.Item>

          <Form.Item name="phone" label="Phone number">
            <Input
              size="large"
              placeholder="Optional"
              prefix={<PhoneOutlined style={{ color: 'var(--faint)' }} />}
            />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea
              rows={3}
              placeholder="Optional — used on invoices and for delivery"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={savingProfile}
          >
            Save changes
          </Button>
        </Form>
      </Surface>

      {/* Password */}
      <Surface title="Password">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleUpdatePassword}
          requiredMark={false}
        >
          <Form.Item
            name="currentPassword"
            label="Current password"
            rules={[{ required: true, message: 'Enter your current password.' }]}
          >
            <Input.Password
              size="large"
              autoComplete="current-password"
              prefix={<LockOutlined style={{ color: 'var(--faint)' }} />}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New password"
            extra={PASSWORD_HINT}
            rules={[
              { required: true, message: 'Choose a new password.' },
              // Same rules the server enforces, checked before the request goes out
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const isValid =
                    value.length >= 6 && value.length <= 12 &&
                    /[A-Z]/.test(value) && /[a-z]/.test(value) && /[@$&_]/.test(value);
                  return isValid
                    ? Promise.resolve()
                    : Promise.reject(new Error(PASSWORD_HINT));
                },
              },
            ]}
          >
            <Input.Password
              size="large"
              autoComplete="new-password"
              prefix={<LockOutlined style={{ color: 'var(--faint)' }} />}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm new password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Re-enter the new password.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('The two passwords do not match.'));
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              autoComplete="new-password"
              prefix={<LockOutlined style={{ color: 'var(--faint)' }} />}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={savingPassword}
          >
            Update password
          </Button>
        </Form>
      </Surface>
    </div>
  );
};

export default Profile;
