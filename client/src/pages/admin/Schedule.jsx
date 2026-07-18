import React, { useEffect, useState } from 'react';
import { Calendar, Card, Badge, Spin, Typography, message, Modal, Descriptions, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
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

export default function Schedule() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data.data || []);
    } catch (e) {
      console.error(e);
      message.error('Failed to fetch schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const listData = [];

    orders.forEach((order) => {
      const startStr = new Date(order.rentalStart).toISOString().split('T')[0];
      const endStr = new Date(order.rentalEnd).toISOString().split('T')[0];
      
      if (startStr === dateStr) {
        listData.push({
          type: 'warning',
          content: `${order.reference} - Pickup`,
          order,
        });
      }
      
      if (endStr === dateStr) {
        let type = 'success';
        if (order.status === 'PICKED_UP') {
          const isOverdue = new Date(order.rentalEnd) < new Date();
          type = isOverdue ? 'error' : 'processing';
        } else if (order.status === 'RETURNED') {
          type = 'success';
        } else {
          type = 'default';
        }

        listData.push({
          type,
          content: `${order.reference} - Return`,
          order,
        });
      }
    });

    return listData;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map((item, index) => (
          <li key={index} style={{ marginBottom: 2 }}>
            <Badge 
              status={item.type} 
              text={
                <span 
                  style={{ fontSize: 11, cursor: 'pointer', fontWeight: 500 }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrder(item.order);
                    setModalOpen(true);
                  }}
                >
                  {item.content}
                </span>
              } 
            />
          </li>
        ))}
      </ul>
    );
  };

  if (loading && orders.length === 0) {
    return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8' }}>
      <Title level={4} style={{ marginBottom: 24, color: '#1F2937' }}>Rental Schedule</Title>

      <Card bordered={false} className="enterprise-card" style={{ padding: 12 }}>
        <Calendar 
          dateCellRender={dateCellRender} 
          onSelect={(date) => {
            // Optional cell click action
          }}
        />
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title={`Rental Order ${selectedOrder?.reference}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setModalOpen(false)}>
            Close
          </Button>,
          <Button 
            key="view" 
            type="primary" 
            style={{ backgroundColor: '#3651A5' }} 
            onClick={() => {
              setModalOpen(false);
              navigate(`/admin/orders/${selectedOrder.id}`);
            }}
          >
            Open Order Details
          </Button>,
        ]}
        width={600}
      >
        {selectedOrder && (
          <Descriptions bordered column={1} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Customer">{selectedOrder.customer?.name}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[selectedOrder.status]} className="status-tag">
                {selectedOrder.status.replace('_', ' ')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Rental Start">{new Date(selectedOrder.rentalStart).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Rental End">{new Date(selectedOrder.rentalEnd).toLocaleString()}</Descriptions.Item>
            {selectedOrder.actualReturn && (
              <Descriptions.Item label="Actual Return">{new Date(selectedOrder.actualReturn).toLocaleString()}</Descriptions.Item>
            )}
            <Descriptions.Item label="Rental Total">
              <Text strong>₹{selectedOrder.total.toFixed(2)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Security Deposit">
              ₹{selectedOrder.depositAmount.toFixed(2)} ({selectedOrder.depositStatus})
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
