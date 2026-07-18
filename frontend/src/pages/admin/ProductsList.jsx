/**
 * ----------------------------------------------------------------------------------
 * ADMIN PRODUCTS CATALOG PAGE
 * 
 * WHAT THIS FILE DOES:
 * This file displays a grid listing of all products (including draft and published items).
 * Admins can add new products, edit pricing parameters, publish items to the shop,
 * delete items, and perform simulated product maintenance resets.
 * 
 * HOW IT FITS INTO THE APP:
 * Accessible under '/admin/products' route for ADMIN roles to manage inventory stock,
 * base rates, security deposits, and maintenance thresholds.
 * ----------------------------------------------------------------------------------
 */

import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Button, Input, Space, Modal, Form, Select, message, Popconfirm, Tooltip, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, GlobalOutlined, ToolOutlined, PieChartOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Title } = Typography;
const { Option } = Select;

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Change these values to adjust pricing symbols, page sizes, or maintenance limits.
// ----------------------------------------------------------------------------------

// CHANGE THIS TO ADJUST THE NUMBER OF COMPLETED RENTS BEFORE A PRODUCT ALERTS FOR SERVICE
const RENTAL_COUNT_MAINTENANCE_TRIGGER = 5;

// CHANGE THIS TO ADJUST THE NUMBER OF RENTAL HOURS BEFORE A PRODUCT ALERTS FOR SERVICE
const RENTAL_HOURS_MAINTENANCE_TRIGGER = 100;

// CHANGE THIS TO CHANGE THE DEFAULT DISPLAY CURRENCY SYMBOL
const DISPLAY_CURRENCY_SYMBOL = "₹";

// CHANGE THIS TO MODIFY THE MAIN CATALOGUE PAGE HEADING
const CATALOGUE_HEADING_TITLE = "Products Catalogue";


const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Fetch catalog inventory and categories on load.
   */
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  /**
   * Fetch all products from the backend (published and draft drafts).
   * 
   * Input: None
   * Output: Updates the products state.
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?published=false');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch the list of categories for the dropdown selections.
   * 
   * Input: None
   * Output: Updates categories state.
   */
  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  /**
   * Open the product create/edit form popup.
   * 
   * Input:
   *   - product: The product to edit (defaults to null for additions).
   */
  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      form.setFieldsValue({
        ...product,
        categoryId: product.categoryId,
        image: product.images?.[0] || '',
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  /**
   * Reset fields and close form modal.
   */
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
    form.resetFields();
  };

  /**
   * Save product parameters to the backend (handles posts and puts).
   * 
   * Input:
   *   - values: Form fields containing pricing, rates, and category selection.
   * Output:
   *   - Resolves or alerts errors.
   */
  const handleSubmit = async (values) => {
    try {
      setActionLoading(true);
      const payload = {
        ...values,
        images: values.image ? [values.image] : [],
      };
      delete payload.image;

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        message.success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        message.success('Product created successfully');
      }
      handleCloseModal();
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Delete a product permanently from the database.
   * 
   * Input:
   *   - id: Database ID of the product.
   */
  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  /**
   * Toggle the publish status between Draft and Published.
   * 
   * Input:
   *   - id: Product database ID.
   *   - currentStatus: Boolean indicating if product is published.
   */
  const handlePublish = async (id, currentStatus) => {
    try {
      await api.post(`/products/${id}/publish`, { published: !currentStatus });
      message.success(!currentStatus ? 'Product published' : 'Product returned to draft');
      fetchProducts();
    } catch (error) {
      message.error('Failed to update published status');
    }
  };

  /**
   * Complete simulated maintenance, resetting rental counters back to zero.
   * 
   * Input:
   *   - id: Product database ID.
   */
  const handleServiceProduct = async (id) => {
    try {
      // Set stats counters back to 0 on the database
      await api.put(`/products/${id}`, {
        rentalCount: 0,
        totalRentalHours: 0,
      });
      message.success('Product serviced. Rental history reset for maintenance.');
      fetchProducts();
    } catch (error) {
      message.error('Failed to complete service maintenance');
    }
  };

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          
          {/* Settle service requirements based on triggers */}
          {(record.rentalCount >= RENTAL_COUNT_MAINTENANCE_TRIGGER || record.totalRentalHours >= RENTAL_HOURS_MAINTENANCE_TRIGGER) && (
            <Tag color="red" icon={<ToolOutlined />} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              Maintenance Required ({record.rentalCount} rents)
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'categoryName',
    },
    {
      title: 'Pricing / Day',
      dataIndex: 'salesPrice',
      key: 'salesPrice',
      render: (val, record) => <span className="tabular-numbers">{DISPLAY_CURRENCY_SYMBOL}{val?.toFixed(2)} / {record.periodicity}</span>,
    },
    {
      title: 'Deposit',
      dataIndex: 'securityDeposit',
      key: 'securityDeposit',
      render: val => <span className="tabular-numbers">{DISPLAY_CURRENCY_SYMBOL}{val?.toFixed(2)}</span>,
    },
    {
      title: 'Stock',
      dataIndex: 'qtyOnHand',
      key: 'qtyOnHand',
      render: val => <span className="tabular-numbers">{val}</span>,
    },
    {
      title: 'Utilization',
      key: 'utilization',
      render: (_, record) => {
        // Calculate mock utilization percentage relative to hours in a standard 30-day window
        const utilization = record.rentalCount > 0 ? Math.min((record.totalRentalHours / (30 * 24)) * 100, 100) : 0;
        return (
          <Tooltip title={`Total Rented: ${record.rentalCount} times, Total Hours: ${record.totalRentalHours}h`}>
            <Tag color="blue" icon={<PieChartOutlined />} className="status-tag">
              {utilization.toFixed(1)}%
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'published',
      key: 'published',
      render: (published) => (
        <Tag color={published ? 'green' : 'default'} className="status-tag">
          {published ? 'Published' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<GlobalOutlined />} onClick={() => handlePublish(record.id, record.published)} title={record.published ? "Unpublish" : "Publish"} />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          
          {(record.rentalCount >= RENTAL_COUNT_MAINTENANCE_TRIGGER || record.totalRentalHours >= RENTAL_HOURS_MAINTENANCE_TRIGGER) && (
            <Tooltip title="Complete service maintenance and reset logs">
              <Button type="text" style={{ color: '#16A34A' }} icon={<ToolOutlined />} onClick={() => handleServiceProduct(record.id)} />
            </Tooltip>
          )}

          <Popconfirm title="Delete product?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1F2937' }}>{CATALOGUE_HEADING_TITLE}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} style={{ backgroundColor: '#3651A5', borderColor: '#3651A5' }}>
          Add Product
        </Button>
      </div>

      <Card bordered={false} className="enterprise-card" style={{ padding: 0 }}>
        <Table 
          dataSource={products} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          size="small"
          className="dense-table"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProduct ? "Edit Product Details" : "Add New Product"}
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}
        okButtonProps={{ style: { backgroundColor: '#3651A5' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Product name is required' }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Please select a category' }]}>
            <Select placeholder="Select category">
              {categories.map(categoryItem => <Option key={categoryItem.id} value={categoryItem.id}>{categoryItem.name}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="type" label="Product Type" initialValue="RENTAL">
            <Select>
              <Option value="GOODS">Goods</Option>
              <Option value="SERVICE">Service</Option>
              <Option value="RENTAL">Rental</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="salesPrice"
                label="Rental Rate"
                rules={[
                  { required: true, message: 'Rate is required' },
                  {
                    validator: (_, value) => {
                      if (value !== undefined && parseFloat(value) <= 0) {
                        return Promise.reject(new Error('Rate must be greater than zero'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input type="number" step="0.01" prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="periodicity" label="Period" initialValue="DAY">
                <Select>
                  <Option value="HOUR">Hour</Option>
                  <Option value="DAY">Day</Option>
                  <Option value="WEEK">Week</Option>
                  <Option value="MONTH">Month</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="securityDeposit"
                label="Security Deposit"
                rules={[
                  { required: true, message: 'Deposit is required' },
                  {
                    validator: (_, value) => {
                      if (value !== undefined && parseFloat(value) <= 0) {
                        return Promise.reject(new Error('Deposit must be greater than zero'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input type="number" step="0.01" prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lateFeePerHour"
                label="Late Fee / Hour"
                rules={[
                  { required: true, message: 'Late fee is required' },
                  {
                    validator: (_, value) => {
                      if (value !== undefined && parseFloat(value) <= 0) {
                        return Promise.reject(new Error('Late fee rate must be greater than zero'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input type="number" step="0.01" prefix="₹" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="qtyOnHand"
            label="Stock Quantity (Qty on Hand)"
            rules={[
              { required: true, message: 'Stock count is required' },
              {
                validator: (_, value) => {
                  if (value !== undefined && parseInt(value, 10) <= 0) {
                    return Promise.reject(new Error('Quantity must be greater than zero'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item name="image" label="Product Image URL">
            <Input placeholder="https://unsplash.com/..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductsList;
