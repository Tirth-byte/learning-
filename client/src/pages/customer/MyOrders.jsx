import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, Spin, Result, Space, Modal, Card } from 'antd';
import { EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Title, Text } = Typography;

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // The backend automatically filters orders for the logged-in customer when role is CUSTOMER
      const response = await api.get('/orders');
      setOrders(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Could not load your order history at this time.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'QUOTATION': return 'default';
      case 'QUOTATION_SENT': return 'cyan';
      case 'CONFIRMED': return 'blue';
      case 'PICKED_UP': return 'orange';
      case 'RETURNED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'Order Ref',
      dataIndex: 'reference',
      key: 'reference',
      render: (text, record) => <Text strong style={{ color: '#3651A5' }}>{text}</Text>,
    },
    {
      title: 'Booking Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (text) => text ? dayjs(text).format('MMM DD, YYYY') : 'N/A',
    },
    {
      title: 'Rental Total',
      dataIndex: 'total',
      key: 'total',
      render: (amount) => <span className="tabular-numbers">₹{amount.toFixed(2)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} className="status-tag">
          {status?.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} style={{ padding: 0 }}>
          View Details
        </Button>
      ),
    },
  ];

  if (error) {
    return <Result status="error" title="Error" subTitle={error} />;
  }

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={4} style={{ color: '#1F2937', marginBottom: '24px' }}>My Rental Bookings</Title>
      
      <Card bordered={false} className="enterprise-card" style={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={orders} 
          rowKey="id"
          loading={loading}
          size="small"
          className="dense-table"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal 
        title={<Text strong style={{ fontSize: 16 }}>Rental Order {selectedOrder?.reference}</Text>} 
        open={isModalVisible} 
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>Close</Button>
        ]}
        width={700}
        destroyOnClose
      >
        {selectedOrder && (
          <div style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 20 }} size={4}>
              <Text strong>Order Ref: <Text type="secondary">{selectedOrder.reference}</Text></Text>
              <Text strong>Status: <Tag color={getStatusColor(selectedOrder.status)} className="status-tag">{(selectedOrder.status || '').replace('_', ' ')}</Tag></Text>
              <Text strong>Rental Period: <Text type="secondary">{dayjs(selectedOrder.rentalStart).format('MMM DD, YYYY HH:mm')} - {dayjs(selectedOrder.rentalEnd).format('MMM DD, YYYY HH:mm')}</Text></Text>
              {selectedOrder.actualReturn && (
                <Text strong>Actual Return: <Text type="secondary">{dayjs(selectedOrder.actualReturn).format('MMM DD, YYYY HH:mm')}</Text></Text>
              )}
            </Space>

            <Title level={5} style={{ fontSize: 14, margin: '16px 0 8px 0' }}>Booking Items</Title>
            <Table 
              dataSource={selectedOrder.lines || []}
              rowKey="id"
              pagination={false}
              size="small"
              className="dense-table"
              columns={[
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                },
                {
                  title: 'Line Type',
                  dataIndex: 'lineType',
                  key: 'lineType',
                  render: type => <Tag color={type === 'RENTAL' ? 'blue' : type === 'DEPOSIT' ? 'orange' : 'red'}>{type}</Tag>
                },
                {
                  title: 'Qty',
                  dataIndex: 'qty',
                  key: 'qty',
                  render: (qty, record) => <span className="tabular-numbers">{record.lineType === 'DEPOSIT' ? '-' : qty}</span>
                },
                {
                  title: 'Unit Rate',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  render: (val) => <span className="tabular-numbers">₹{val.toFixed(2)}</span>
                },
                {
                  title: 'Subtotal',
                  dataIndex: 'subtotal',
                  key: 'subtotal',
                  render: (val) => <span className="tabular-numbers" style={{ fontWeight: 500 }}>₹{val.toFixed(2)}</span>
                }
              ]}
              style={{ marginBottom: 20 }}
            />
            
            <div style={{ textAlign: 'right', borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Untaxed Amount: <span className="tabular-numbers">₹{selectedOrder.untaxed.toFixed(2)}</span></div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>Tax Amount (18%): <span className="tabular-numbers">₹{selectedOrder.tax.toFixed(2)}</span></div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                Total Due: <span className="tabular-numbers" style={{ color: '#3651A5' }}>₹{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyOrders;
