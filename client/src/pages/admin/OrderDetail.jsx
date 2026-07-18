import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Typography, Tag, Button, Table, Row, Col, Space, Spin, message, Divider, Modal, Input, Radio, Alert } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, CheckCircleOutlined, SafetyOutlined, CalendarOutlined, TransactionOutlined } from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const statusColors = {
  QUOTATION: 'default',
  QUOTATION_SENT: 'cyan',
  CONFIRMED: 'blue',
  PICKED_UP: 'orange',
  RETURNED: 'success',
  CANCELLED: 'error',
};

const depositColors = {
  HELD: 'orange',
  REFUNDED: 'success',
  DEDUCTED: 'danger',
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('UPI');

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderRes = await api.get(`/orders/${id}`);
      setOrder(orderRes.data.data);
      if (orderRes.data.data?.invoice) {
        setPayAmount(orderRes.data.data.invoice.total);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      message.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      await api.post(`/orders/${id}/${action}`);
      message.success(`Order action "${action}" completed successfully`);
      fetchOrderDetails();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || `Failed to execute action: ${action}`;
      message.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setActionLoading(true);
      await api.post('/invoices', { orderId: order.id });
      message.success('Invoice draft created successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error(error);
      message.error('Failed to create invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostInvoice = async (invoiceId) => {
    try {
      setActionLoading(true);
      await api.post(`/invoices/${invoiceId}/post`);
      message.success('Invoice posted successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error(error);
      message.error('Failed to post invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      setActionLoading(true);
      await api.post(`/invoices/${order.invoice.id}/pay`, {
        method: payMethod,
        amount: payAmount,
      });
      message.success('Payment recorded successfully');
      setPayModalOpen(false);
      fetchOrderDetails();
    } catch (error) {
      console.error(error);
      message.error('Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !order) {
    return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  const lineColumns = [
    {
      title: 'Line Type',
      dataIndex: 'lineType',
      key: 'lineType',
      render: type => <Tag color={type === 'RENTAL' ? 'blue' : type === 'LATE_FEE' ? 'red' : 'default'}>{type}</Tag>
    },
    { 
      title: 'Description', 
      dataIndex: 'description', 
      key: 'description' 
    },
    { 
      title: 'Qty', 
      dataIndex: 'qty', 
      key: 'qty', 
      render: (qty, record) => <span className="tabular-numbers">{record.lineType === 'DEPOSIT' ? '-' : qty}</span> 
    },
    { 
      title: 'Unit Price', 
      dataIndex: 'unitPrice', 
      key: 'unitPrice', 
      render: val => <span className="tabular-numbers">₹{val.toFixed(2)}</span> 
    },
    { 
      title: 'Tax %', 
      dataIndex: 'taxPct', 
      key: 'taxPct', 
      render: val => <span className="tabular-numbers">{val}%</span> 
    },
    { 
      title: 'Subtotal', 
      dataIndex: 'subtotal', 
      key: 'subtotal', 
      render: val => <span className="tabular-numbers" style={{ fontWeight: 500 }}>₹{val.toFixed(2)}</span> 
    },
  ];

  const paymentColumns = [
    { 
      title: 'Date', 
      dataIndex: 'date', 
      key: 'date', 
      render: d => new Date(d).toLocaleString() 
    },
    { 
      title: 'Type', 
      dataIndex: 'type', 
      key: 'type', 
      render: t => <Tag color={t === 'DEPOSIT' ? 'orange' : t === 'LATE_FEE' ? 'red' : 'blue'}>{t}</Tag> 
    },
    { 
      title: 'Method', 
      dataIndex: 'method', 
      key: 'method' 
    },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount', 
      render: val => (
        <span className="tabular-numbers" style={{ color: val < 0 ? '#DC2626' : '#16A34A', fontWeight: 500 }}>
          {val < 0 ? `-₹${Math.abs(val).toFixed(2)}` : `+₹${val.toFixed(2)}`}
        </span>
      ) 
    },
  ];

  return (
    <div style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/orders')} style={{ paddingLeft: 0, color: '#6B7280' }}>
          Back to Orders
        </Button>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1F2937' }}>Order {order.reference}</Title>
          <Space style={{ marginTop: 8 }}>
            <Tag color={statusColors[order.status]} className="status-tag">
              {order.status.replace('_', ' ')}
            </Tag>
            {order.depositAmount > 0 && (
              <Tag color={depositColors[order.depositStatus]} className="status-tag">
                Deposit {order.depositStatus}
              </Tag>
            )}
          </Space>
        </div>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
          
          {/* Transition buttons based on states */}
          {order.status === 'QUOTATION' && (
            <Button type="primary" onClick={() => handleAction('send')} loading={actionLoading}>
              Send Quotation
            </Button>
          )}
          {order.status === 'QUOTATION_SENT' && (
            <Button type="primary" onClick={() => handleAction('confirm')} loading={actionLoading}>
              Confirm Order
            </Button>
          )}
          {order.status === 'CONFIRMED' && (
            <>
              {!order.invoice && (
                <Button onClick={handleCreateInvoice} loading={actionLoading}>
                  Create Invoice
                </Button>
              )}
              <Button type="primary" onClick={() => handleAction('pickup')} loading={actionLoading}>
                Deliver / Pickup Items
              </Button>
            </>
          )}
          {order.status === 'PICKED_UP' && (
            <Button type="primary" onClick={() => handleAction('return')} loading={actionLoading}>
              Receive Return
            </Button>
          )}
          {['QUOTATION', 'QUOTATION_SENT', 'CONFIRMED'].includes(order.status) && (
            <Button danger onClick={() => handleAction('cancel')} loading={actionLoading}>
              Cancel Order
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={17}>
          {/* Order lines */}
          <Card bordered={false} className="enterprise-card" title="Order Lines" headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }} style={{ marginBottom: 16 }}>
            <Table 
              dataSource={order.lines} 
              columns={lineColumns} 
              rowKey="id" 
              pagination={false}
              size="small"
              className="dense-table"
            />
            <Row justify="end" style={{ marginTop: 16 }}>
              <Col span={8}>
                <Descriptions column={1} size="small" colon={false} labelStyle={{ color: '#6B7280' }} contentStyle={{ textAlign: 'right', display: 'block' }}>
                  <Descriptions.Item label="Untaxed Total">₹{order.untaxed.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="Taxes (18%)">₹{order.tax.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="Total Amount" contentStyle={{ fontSize: 16, fontWeight: 700, color: '#3651A5' }}>
                    ₹{order.total.toFixed(2)}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          {/* Invoicing Info */}
          <Card bordered={false} className="enterprise-card" title="Billing & Invoices" headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }} style={{ marginBottom: 16 }}>
            {order.invoice ? (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Invoice Ref">
                  <Text strong>{order.invoice.reference}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={order.invoice.status === 'POSTED' ? 'success' : 'orange'}>
                    {order.invoice.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Invoice Total">
                  ₹{order.invoice.total.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Actions">
                  <Space>
                    {order.invoice.status === 'DRAFT' && (
                      <Button size="small" type="primary" onClick={() => handlePostInvoice(order.invoice.id)} loading={actionLoading}>
                        Post Invoice
                      </Button>
                    )}
                    {order.invoice.status === 'POSTED' && (
                      <Button size="small" type="primary" style={{ backgroundColor: '#16A34A' }} onClick={() => setPayModalOpen(true)}>
                        Record Payment
                      </Button>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert message="No invoice generated for this order yet." type="info" showIcon />
            )}
          </Card>

          {/* Payments transaction list */}
          {order.payments && order.payments.length > 0 && (
            <Card bordered={false} className="enterprise-card" title="Transaction Log" headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}>
              <Table
                dataSource={order.payments}
                columns={paymentColumns}
                rowKey="id"
                pagination={false}
                size="small"
                className="dense-table"
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={7}>
          {/* Offline QR Scanner Destination Code */}
          <Card bordered={false} className="enterprise-card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: '0 0 12px 0' }}>Order QR Reference</Title>
            <div style={{ background: '#fff', padding: 12, display: 'inline-block', border: '1px solid #E5E7EB', borderRadius: 6 }}>
              <QRCodeSVG value={order.reference} size={130} />
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#6B7280' }}>
              Scan this QR from the operations console to quickly load this rental lifecycle.
            </div>
          </Card>

          {/* Customer info */}
          <Card bordered={false} className="enterprise-card" title="Customer Information" headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }} style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" labelStyle={{ color: '#6B7280' }}>
              <Descriptions.Item label="Client">{order.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{order.customer?.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{order.customer?.phone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Address">{order.customer?.address || 'N/A'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Schedule dates */}
          <Card bordered={false} className="enterprise-card" title="Rental Schedule" headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}>
            <Descriptions column={1} size="small" labelStyle={{ color: '#6B7280' }}>
              <Descriptions.Item label="Start Date">{new Date(order.rentalStart).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="End Date">{new Date(order.rentalEnd).toLocaleString()}</Descriptions.Item>
              {order.actualReturn && (
                <Descriptions.Item label="Actual Return">{new Date(order.actualReturn).toLocaleString()}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Record Payment Modal */}
      <Modal
        title="Record Invoice Payment"
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        onOk={handleRecordPayment}
        confirmLoading={actionLoading}
        okText="Record Payment"
        okButtonProps={{ style: { backgroundColor: '#16A34A' } }}
      >
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text type="secondary">Amount Due</Text>
            <Input 
              prefix="₹" 
              type="number" 
              value={payAmount} 
              onChange={e => setPayAmount(parseFloat(e.target.value))} 
              className="tabular-numbers"
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Payment Method</Text>
            <Radio.Group value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <Radio.Button value="CASH">Cash</Radio.Button>
              <Radio.Button value="CARD">Card</Radio.Button>
              <Radio.Button value="UPI">UPI</Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetail;
