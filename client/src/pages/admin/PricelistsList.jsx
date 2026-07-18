/**
 * ----------------------------------------------------------------------------------
 * ADMIN PRICELISTS MANAGEMENT PAGE
 * 
 * WHAT THIS FILE DOES:
 * This file displays a ledger of custom pricelists (currencies, promotional lists).
 * It features a nested modal dialog where admins can link products to promo pricing rules
 * (e.g. customized hourly or daily rates) and delete rules in real-time.
 * 
 * HOW IT FITS INTO THE APP:
 * Accessible under '/admin/pricelists' route for ADMIN roles to manage business discounts.
 * ----------------------------------------------------------------------------------
 */

import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Button, Input, Space, Modal, Form, Select, message, Popconfirm, Divider, Row, Col } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Change these values to adjust branding titles, labels, or currency displays.
// ----------------------------------------------------------------------------------

// CHANGE THIS TO MODIFY THE MAIN PAGE TITLE
const PAGE_HEADING_TITLE = "Pricelists (Multi-Currency Pricing Rules)";

// CHANGE THIS TO MODIFY THE DEFAULT RENTAL CURRENCY SYMBOL RENDERED
const CURRENCY_DISPLAY_SYMBOL = "₹";

// CHANGE THIS TO CHANGE THE DEFAULT ITEMS PER PAGE IN THE LEDGER
const DEFAULT_LEDGER_PAGE_SIZE = 10;


const PricelistsList = () => {
  const [pricelists, setPricelists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPricelist, setEditingPricelist] = useState(null);
  const [form] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);

  // Nested pricelist items state
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedPricelist, setSelectedPricelist] = useState(null);
  const [pricelistItems, setPricelistItems] = useState([]);
  const [itemForm] = Form.useForm();

  /**
   * Load pricelists and product list on component load.
   */
  useEffect(() => {
    fetchPricelists();
    fetchProducts();
  }, []);

  /**
   * Fetch all pricelists from the backend API.
   * 
   * Input: None
   * Output: Updates the pricelists state.
   */
  const fetchPricelists = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pricelists');
      setPricelists(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pricelists:', error);
      message.error('Failed to load pricelists');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch product catalogue to let admins select products when creating rules.
   * 
   * Input: None
   * Output: Updates products state.
   */
  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  /**
   * Open the add/edit pricelist configuration popup modal.
   * 
   * Input:
   *   - pricelist: Selected pricelist configuration (defaults to null for additions).
   */
  const handleOpenModal = (pricelist = null) => {
    setEditingPricelist(pricelist);
    if (pricelist) {
      form.setFieldsValue(pricelist);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  /**
   * Reset form and close the configuration popup modal.
   */
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingPricelist(null);
    form.resetFields();
  };

  /**
   * Submit pricelist configs to the database (handles posts and puts).
   * 
   * Input:
   *   - values: Form parameters (name, currency, active state).
   * Output:
   *   - Resolves or alerts errors.
   */
  const handleSubmit = async (values) => {
    try {
      setActionLoading(true);
      const payload = {
        ...values,
        active: values.active !== false,
      };
      if (editingPricelist) {
        await api.put(`/pricelists/${editingPricelist.id}`, payload);
        message.success('Pricelist updated successfully');
      } else {
        await api.post('/pricelists', payload);
        message.success('Pricelist created successfully');
      }
      handleCloseModal();
      fetchPricelists();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save pricelist');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Delete a selected pricelist from the database.
   * 
   * Input:
   *   - id: Database ID of the pricelist.
   */
  const handleDelete = async (id) => {
    try {
      await api.delete(`/pricelists/${id}`);
      message.success('Pricelist deleted successfully');
      fetchPricelists();
    } catch (error) {
      message.error('Failed to delete pricelist');
    }
  };

  /**
   * Open the rules ledger modal to manage item prices for the selected pricelist.
   * 
   * Input:
   *   - pricelist: Pricelist model object.
   */
  const handleOpenItems = async (pricelist) => {
    setSelectedPricelist(pricelist);
    try {
      setLoading(true);
      const response = await api.get(`/pricelists/${pricelist.id}`);
      setPricelistItems(response.data.data?.items || []);
      setItemModalVisible(true);
    } catch (error) {
      message.error('Failed to load pricelist rules');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a custom item pricing rule to the selected pricelist.
   * 
   * Input:
   *   - values: Form fields containing productId, salesPrice, and periodicity frequency.
   */
  const handleAddItemRule = async (values) => {
    try {
      setActionLoading(true);
      await api.post(`/pricelists/${selectedPricelist.id}/items`, {
        productId: parseInt(values.productId, 10),
        salesPrice: parseFloat(values.salesPrice),
        periodicity: values.periodicity,
      });
      message.success('Pricing rule added successfully');
      itemForm.resetFields();
      
      // Reload items to update list
      const response = await api.get(`/pricelists/${selectedPricelist.id}`);
      setPricelistItems(response.data.data?.items || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add pricing rule');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Delete a custom item pricing rule from the list.
   * 
   * Input:
   *   - itemId: Database ID of the pricelist rule item.
   */
  const handleDeleteItemRule = async (itemId) => {
    try {
      setActionLoading(true);
      await api.delete(`/pricelists/${selectedPricelist.id}/items/${itemId}`);
      message.success('Pricing rule removed');
      
      // Reload items to update list
      const response = await api.get(`/pricelists/${selectedPricelist.id}`);
      setPricelistItems(response.data.data?.items || []);
    } catch (err) {
      message.error('Failed to remove pricing rule');
    } finally {
      setActionLoading(false);
    }
  };

  // Outer pricelist table ledger columns
  const columns = [
    {
      title: 'Pricelist Name',
      dataIndex: 'name',
      key: 'name',
      render: text => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      render: text => text || 'INR',
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'} className="status-tag">
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<UnorderedListOutlined />} onClick={() => handleOpenItems(record)} title="Manage Rates" />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Delete pricelist?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Inner item promo rules columns
  const ruleColumns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'productName',
    },
    {
      title: 'Promo Price',
      dataIndex: 'salesPrice',
      key: 'salesPrice',
      render: (val, record) => <span className="tabular-numbers">{CURRENCY_DISPLAY_SYMBOL}{(val || 0).toFixed(2)} / {(record.periodicity || 'DAY').toLowerCase()}</span>,
    },
    {
      title: 'Remove',
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="Delete rule?" onConfirm={() => handleDeleteItemRule(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1F2937' }}>{PAGE_HEADING_TITLE}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} style={{ backgroundColor: '#3651A5', borderColor: '#3651A5' }}>
          Add Pricelist
        </Button>
      </div>

      <Card bordered={false} className="enterprise-card" style={{ padding: 0 }}>
        <Table 
          dataSource={pricelists} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          size="small"
          className="dense-table"
          pagination={{ pageSize: DEFAULT_LEDGER_PAGE_SIZE }}
        />
      </Card>

      {/* Add/Edit Pricelist Modal */}
      <Modal
        title={editingPricelist ? "Edit Pricelist Config" : "Create New Pricelist"}
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}
        okButtonProps={{ style: { backgroundColor: '#3651A5' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Pricelist Suffix Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. Festive Monsoon Sale" />
          </Form.Item>
          <Form.Item name="currency" label="Pricelist Currency Code" initialValue="INR">
            <Input placeholder="INR, USD, EUR" />
          </Form.Item>
          <Form.Item name="active" label="Status" valuePropName="checked" initialValue={true}>
            <Select>
              <Option value={true}>Active (In-use)</Option>
              <Option value={false}>Draft / Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Nested Items Modal */}
      <Modal
        title={`Custom Prices: ${selectedPricelist?.name}`}
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Row gutter={24} style={{ marginTop: 16 }}>
          <Col span={10} style={{ borderRight: '1px solid #E5E7EB' }}>
            <Title level={5} style={{ marginTop: 0 }}>Add Price Rule</Title>
            <Form form={itemForm} layout="vertical" onFinish={handleAddItemRule}>
              <Form.Item name="productId" label="Product" rules={[{ required: true, message: 'Select product' }]}>
                <Select placeholder="Select item">
                  {products.map(productItem => <Option key={productItem.id} value={productItem.id}>{productItem.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="salesPrice" label="Rate Amount" rules={[{ required: true, message: 'Amount is required' }]}>
                <Input type="number" prefix="₹" step="0.01" />
              </Form.Item>
              <Form.Item name="periodicity" label="Billing Frequency" initialValue="DAY">
                <Select>
                  <Option value="HOUR">Hour</Option>
                  <Option value="DAY">Day</Option>
                  <Option value="WEEK">Week</Option>
                  <Option value="MONTH">Month</Option>
                </Select>
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={actionLoading} block style={{ backgroundColor: '#3651A5' }}>
                Add Custom Price Rule
              </Button>
            </Form>
          </Col>
          <Col span={14}>
            <Title level={5} style={{ marginTop: 0 }}>Rules Ledger</Title>
            <Table
              dataSource={pricelistItems}
              columns={ruleColumns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default PricelistsList;
