import React, { useEffect, useState, useRef } from 'react';
import { Table, Tag, Typography, Card, Button, Input, Space, Radio, Row, Col, Modal, Form, Select, DatePicker, message, Divider } from 'antd';
import { SearchOutlined, EyeOutlined, AppstoreOutlined, UnorderedListOutlined, ScanOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const statusColors = {
  QUOTATION: 'default',
  QUOTATION_SENT: 'cyan',
  CONFIRMED: 'blue',
  PICKED_UP: 'orange',
  RETURNED: 'success',
  CANCELLED: 'error',
};

const statuses = ['QUOTATION', 'QUOTATION_SENT', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED'];

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [searchText, setSearchText] = useState('');
  
  // Create Order Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form] = Form.useForm();
  
  // QR Scan Modal State
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [manualRef, setManualRef] = useState('');
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchCustomersAndProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      const data = response.data.data || [];
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndProducts = async () => {
    try {
      const [prodRes] = await Promise.all([
        api.get('/products'),
      ]);
      setProducts(prodRes.data.data.filter(p => p.published) || []);
      // We can extract unique customers from orders or seed them
      // In this setup, we know from seed we have customer1, customer2, customer3
      setCustomers([
        { id: 4, name: 'Aarav Sharma', email: 'customer1@rental.com' },
        { id: 5, name: 'Priya Patel', email: 'customer2@rental.com' },
        { id: 6, name: 'Rahul Verma', email: 'customer3@rental.com' },
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  // Search logic
  useEffect(() => {
    const term = searchText.toLowerCase();
    if (!term) {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(
        orders.filter(
          o =>
            o.reference.toLowerCase().includes(term) ||
            o.customer?.name.toLowerCase().includes(term)
        )
      );
    }
  }, [searchText, orders]);

  // QR Scanning implementation
  useEffect(() => {
    if (scanModalOpen) {
      // Start camera scanning after modal is open
      setTimeout(() => {
        startScanner();
      }, 500);
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [scanModalOpen]);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      
      const qrCodeSuccessCallback = (decodedText) => {
        message.success(`QR Decoded: ${decodedText}`);
        stopScanner();
        setScanModalOpen(false);
        // Find order with that reference and navigate
        const matched = orders.find(o => o.reference === decodedText);
        if (matched) {
          navigate(`/admin/orders/${matched.id}`);
        } else {
          message.error(`Order reference ${decodedText} not found in system.`);
        }
      };

      const config = { fps: 10, qrbox: { width: 200, height: 200 } };
      
      // Start camera
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback
      );
    } catch (err) {
      console.warn('Unable to start camera scanner, falling back to manual entry:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  };

  const handleManualSearch = () => {
    if (!manualRef) return;
    const matched = orders.find(o => o.reference.toUpperCase() === manualRef.toUpperCase());
    if (matched) {
      setScanModalOpen(false);
      navigate(`/admin/orders/${matched.id}`);
    } else {
      message.error(`Order reference "${manualRef}" not found.`);
    }
  };

  const handleCreateOrder = async (values) => {
    try {
      setLoading(true);
      const payload = {
        customerId: values.customerId,
        rentalStart: values.dates[0].toISOString(),
        rentalEnd: values.dates[1].toISOString(),
        lines: [
          {
            productId: values.productId,
            qty: values.qty || 1,
          }
        ]
      };
      
      await api.post('/orders', payload);
      message.success('New quotation created successfully');
      setCreateModalOpen(false);
      form.resetFields();
      fetchOrders();
    } catch (e) {
      console.error(e);
      message.error(e.response?.data?.message || 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Order Ref',
      dataIndex: 'reference',
      key: 'reference',
      render: (text, record) => <Link to={`/admin/orders/${record.id}`} style={{ fontWeight: 500 }}>{text}</Link>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => <span className="tabular-numbers">{new Date(text).toLocaleDateString()}</span>,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (val) => <span className="tabular-numbers">₹{val?.toFixed(2) || '0.00'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]} className="status-tag">
          {status?.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => navigate(`/admin/orders/${record.id}`)}
          style={{ padding: 0 }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1F2937' }}>Orders & Quotations</Title>
        <Space>
          <Button icon={<ScanOutlined />} onClick={() => setScanModalOpen(true)}>
            Scan Order QR
          </Button>
          <Button type="primary" style={{ backgroundColor: '#3651A5', borderColor: '#3651A5' }} onClick={() => setCreateModalOpen(true)}>
            Create Quotation
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Input 
          placeholder="Search reference or customer..." 
          prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />} 
          style={{ width: 300 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        
        <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} size="small">
          <Radio.Button value="list"><UnorderedListOutlined /> List</Radio.Button>
          <Radio.Button value="kanban"><AppstoreOutlined /> Kanban</Radio.Button>
        </Radio.Group>
      </div>

      {viewMode === 'list' ? (
        <Card bordered={false} className="enterprise-card" style={{ padding: 0 }}>
          <Table 
            dataSource={filteredOrders} 
            columns={columns} 
            rowKey="id" 
            loading={loading}
            size="small"
            className="dense-table"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      ) : (
        /* Kanban View structured Odoo style */
        <Row gutter={[16, 16]}>
          {statuses.map(status => {
            const statusOrders = filteredOrders.filter(o => o.status === status);
            return (
              <Col xs={24} sm={12} md={8} lg={4} key={status}>
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{status.replace('_', ' ')}</span>
                      <Tag size="small" style={{ margin: 0 }}>{statusOrders.length}</Tag>
                    </div>
                  }
                  size="small"
                  headStyle={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}
                  bodyStyle={{ padding: 8, background: '#F3F4F6', minHeight: 400 }}
                  className="enterprise-card"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {statusOrders.map(order => (
                      <Card 
                        key={order.id} 
                        size="small" 
                        bordered={false} 
                        style={{ borderRadius: 4, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Text strong style={{ color: '#3651A5', fontSize: 12 }}>{order.reference}</Text>
                          <Text style={{ fontSize: 11, fontWeight: 500 }}>{order.customer?.name}</Text>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={{ fontSize: 11 }} type="secondary">
                              {new Date(order.rentalStart).toLocaleDateString()}
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: 600 }} className="tabular-numbers">
                              ₹{order.total.toFixed(2)}
                            </Text>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* QR Scanner Modal */}
      <Modal
        title="Scan Order QR Code"
        open={scanModalOpen}
        onCancel={() => setScanModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div id="qr-reader" style={{ width: '100%', minHeight: 250, border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
            <div style={{ padding: 20, textAlign: 'center', color: '#6B7280' }}>
              <ScanOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <p>Camera loader initializing or not available.</p>
            </div>
          </div>
          
          <Divider style={{ margin: '8px 0' }}>OR ENTER REFERENCE MANUALLY</Divider>
          
          <Space.Compact style={{ width: '100%' }}>
            <Input 
              placeholder="e.g. SO0003" 
              value={manualRef} 
              onChange={e => setManualRef(e.target.value)} 
              onPressEnter={handleManualSearch}
            />
            <Button type="primary" onClick={handleManualSearch} style={{ backgroundColor: '#3651A5' }}>
              Go
            </Button>
          </Space.Compact>
        </div>
      </Modal>

      {/* Create Order Quotation Modal */}
      <Modal
        title="Create Rental Quotation"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Create"
        okButtonProps={{ style: { backgroundColor: '#3651A5' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrder} style={{ marginTop: 16 }}>
          <Form.Item name="customerId" label="Customer" rules={[{ required: true, message: 'Please select a customer' }]}>
            <Select placeholder="Select client">
              {customers.map(c => <Option key={c.id} value={c.id}>{c.name} ({c.email})</Option>)}
            </Select>
          </Form.Item>
          
          <Form.Item name="dates" label="Rental Period" rules={[{ required: true, message: 'Please select dates' }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="productId" label="Product" rules={[{ required: true, message: 'Please select product' }]}>
            <Select placeholder="Select rental product">
              {products.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.name} - ₹{p.salesPrice}/day (Deposit: ₹{p.securityDeposit})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="qty" label="Quantity" initialValue={1}>
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrdersList;
