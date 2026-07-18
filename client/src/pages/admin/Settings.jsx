/**
 * ----------------------------------------------------------------------------------
 * ADMIN SETTINGS PAGE
 * 
 * WHAT THIS FILE DOES:
 * This file displays a tabbed settings dashboard for corporate administrators.
 * It loads and saves system-wide parameters (grace periods, default tax percentages,
 * currency symbols, and late return fees) using the backend API.
 * 
 * HOW IT FITS INTO THE APP:
 * Accessible under the '/admin/settings' route for users with the 'ADMIN' role.
 * Settings saved here dictate return penalties and default security holds across all bookings.
 * ----------------------------------------------------------------------------------
 */

import React, { useEffect, useState } from 'react';
import { Typography, Card, Form, Input, Button, Tabs, message, Spin, Row, Col } from 'antd';
import { SaveOutlined, AppstoreOutlined, AccountBookOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Title, Text } = Typography;

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Change these values to adjust titles or system feedback alerts.
// ----------------------------------------------------------------------------------

// CHANGE THIS TO MODIFY THE HEADING TITLE AT THE TOP OF THE PAGE
const PAGE_HEADING_TITLE = "System Settings & Rules";

// CHANGE THIS TO MODIFY THE TOAST NOTIFICATION POPUP SHOWN ON A SUCCESSFUL UPDATE
const TOAST_SUCCESS_ALERT = "System configurations updated successfully";

// CHANGE THIS TO MODIFY THE TOAST NOTIFICATION POPUP SHOWN ON AN UPDATE ERROR
const TOAST_ERROR_ALERT = "Failed to update system settings";


const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Load configurations from the database on page mount.
   */
  useEffect(() => {
    fetchSettings();
  }, []);

  /**
   * Fetch system settings details from the server and fill the form input fields.
   * 
   * Input: None
   * Output: Updates the form state with database settings properties.
   */
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      if (response.data) {
        form.setFieldsValue(response.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      message.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format input values as numbers and save settings to the backend database.
   * 
   * Input:
   *   - values: Form parameters (companyName, taxRate, gracePeriod, defaultLateFee, defaultDepositPct).
   * Output:
   *   - Resolves or alerts errors.
   */
  const onFinish = async (values) => {
    try {
      setSaving(true);
      
      // Enforce clean formatting numbers before dispatching to the API server
      const payload = {
        ...values,
        taxRate: parseFloat(values.taxRate || 0),
        gracePeriod: parseInt(values.gracePeriod || 0),
        defaultLateFee: parseFloat(values.defaultLateFee || 0),
        defaultDepositPct: parseFloat(values.defaultDepositPct || 0),
      };
      
      await api.put('/settings', payload);
      message.success(TOAST_SUCCESS_ALERT);
      fetchSettings();
    } catch (error) {
      console.error(error);
      message.error(TOAST_ERROR_ALERT);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  // Define tab items: General Info, Billing & Finance, and Return Rules
  const items = [
    {
      key: 'general',
      label: <span><AppstoreOutlined /> General Info</span>,
      children: (
        <div style={{ padding: '8px 0' }}>
          <Form.Item name="companyName" label="Company Registered Name" rules={[{ required: true, message: 'Company name is required' }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="companyEmail" label="Corporate Contact Email" rules={[{ type: 'email' }]}>
                <Input placeholder="billing@company.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="companyPhone" label="Contact Helpline Number">
                <Input placeholder="+91 99999 99999" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="companyAddress" label="Registered Headquarters Address">
            <Input.TextArea rows={3} placeholder="Street Address, City, State, ZIP" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'financial',
      label: <span><AccountBookOutlined /> Billing & Finance</span>,
      children: (
        <div style={{ padding: '8px 0' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="currency" label="Standard Base Currency" rules={[{ required: true }]}>
                <Input placeholder="INR, USD, EUR" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taxRate" label="Default Output Tax Rate (%)" rules={[{ required: true }]}>
                <Input type="number" step="0.1" suffix="%" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'rental',
      label: <span><ClockCircleOutlined /> Return & Overdue Rules</span>,
      children: (
        <div style={{ padding: '8px 0' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gracePeriod" label="Late Return Grace Period" rules={[{ required: true }]}>
                <Input type="number" suffix="Hours" placeholder="e.g. 2 hours" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultDepositPct" label="Default Security Deposit Rate" rules={[{ required: true }]}>
                <Input type="number" suffix="%" placeholder="e.g. 50%" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="defaultLateFee" label="Hourly Overdue Penalty Rate (Default)" rules={[{ required: true }]}>
            <Input type="number" prefix="₹" placeholder="e.g. 100" />
          </Form.Item>
          <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, color: '#6B7280' }}>
            <strong>Calculation Rule:</strong> Overdue returns are calculated as <code>Math.ceil(lateHours) * defaultLateFee</code> once the grace period is breached. The computed amount is automatically deducted from the customer's held security deposit on return log.
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8' }}>
      <div style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
        <Title level={4} style={{ marginBottom: 24, color: '#1F2937' }}>{PAGE_HEADING_TITLE}</Title>

        <Card bordered={false} className="enterprise-card" style={{ padding: '8px 12px' }}>
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={onFinish}
          >
            <Tabs defaultActiveKey="general" items={items} style={{ marginBottom: 20 }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} style={{ backgroundColor: '#3651A5', borderColor: '#3651A5' }}>
                Save Settings
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
