import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Button, List, Popconfirm, Empty, Divider, Tag } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCart = () => {
    try {
      const items = JSON.parse(localStorage.getItem('rental_cart') || '[]');
      setCartItems(items);
    } catch (e) {
      setCartItems([]);
    }
  };

  const handleRemove = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    localStorage.setItem('rental_cart', JSON.stringify(newCart));
    setCartItems(newCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = item.product?.salesPrice || 0;
      const start = dayjs(item.rentalStart);
      const end = dayjs(item.rentalEnd);
      const days = end.diff(start, 'day') + 1;
      return acc + (price * item.qty * (days > 0 ? days : 1));
    }, 0);
  };

  const calculateDeposits = () => {
    return cartItems.reduce((acc, item) => {
      const deposit = item.product?.securityDeposit || 0;
      return acc + (deposit * item.qty);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const deposits = calculateDeposits();
  const grandTotal = subtotal + deposits;

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '48px 8px', textAlign: 'center' }}>
        <Card className="enterprise-card" style={{ maxWidth: 500, margin: '0 auto', padding: '24px' }}>
          <Empty 
            description={<Text style={{ fontSize: 14, color: '#6B7280' }}>Your rental cart is currently empty</Text>} 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16, backgroundColor: '#3651A5', borderRadius: 6 }}>
            Browse Fleet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={4} style={{ color: '#1F2937', marginBottom: '24px' }}>
        <ShoppingCartOutlined style={{ marginRight: 8, color: '#3651A5' }} />
        Review Selected Rentals
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <List
            itemLayout="horizontal"
            dataSource={cartItems}
            renderItem={(item, index) => {
              const price = item.product?.salesPrice || 0;
              const start = dayjs(item.rentalStart);
              const end = dayjs(item.rentalEnd);
              const days = end.diff(start, 'day') + 1;
              const rentalCost = price * item.qty * (days > 0 ? days : 1);
              const securityDeposit = (item.product?.securityDeposit || 0) * item.qty;

              return (
                <List.Item
                  className="enterprise-card"
                  style={{ backgroundColor: '#fff', padding: '16px', marginBottom: '12px', display: 'flex' }}
                  actions={[
                    <Popconfirm title="Remove item?" onConfirm={() => handleRemove(index)}>
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ width: 70, height: 70, backgroundColor: '#F3F4F6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                        {item.product?.images && item.product.images.length > 0 ? (
                          <img src={item.product.images[0]} alt={item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ShoppingCartOutlined style={{ fontSize: 20, color: '#9CA3AF' }} />
                        )}
                      </div>
                    }
                    title={<Text strong style={{ fontSize: 14 }}>{item.product?.name}</Text>}
                    description={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          📅 Duration: {start.format('MMM DD, YYYY')} - {end.format('MMM DD, YYYY')} ({days} days)
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          📦 Quantity: {item.qty} × ₹{price.toFixed(2)}/day
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          🛡️ Held Deposit: ₹{securityDeposit.toFixed(2)}
                        </Text>
                      </div>
                    }
                  />
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <Tag color="blue" className="status-tag" style={{ margin: '0 0 4px 0' }}>Rental fee</Tag>
                    <br />
                    <Text strong style={{ fontSize: 15, color: '#3651A5' }} className="tabular-numbers">₹{rentalCost.toFixed(2)}</Text>
                  </div>
                </List.Item>
              );
            }}
          />
        </Col>

        <Col xs={24} lg={8}>
          <Card bordered={false} className="enterprise-card" title="Rental Estimate" headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}>
            <Row justify="space-between" style={{ marginBottom: 12 }}>
              <Col><Text type="secondary">Rental Subtotal</Text></Col>
              <Col><Text className="tabular-numbers">₹{subtotal.toFixed(2)}</Text></Col>
            </Row>
            
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Col><Text type="secondary">Security Deposits</Text></Col>
              <Col><Text className="tabular-numbers">₹{deposits.toFixed(2)}</Text></Col>
            </Row>
            
            <div style={{ background: '#F9FAFB', padding: 8, borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 11, color: '#6B7280', marginBottom: 16 }}>
              Security deposits are fully refundable on return of equipment.
            </div>

            <Divider style={{ margin: '12px 0' }} />
            
            <Row justify="space-between" style={{ marginBottom: 24 }}>
              <Col><Text strong style={{ fontSize: 14 }}>Total Due Now</Text></Col>
              <Col><Text strong style={{ fontSize: 18, color: '#3651A5' }} className="tabular-numbers">₹{grandTotal.toFixed(2)}</Text></Col>
            </Row>

            <Button 
              type="primary" 
              size="large" 
              block 
              style={{ backgroundColor: '#3651A5', height: '40px', borderRadius: 6, fontSize: 14, fontWeight: 500 }}
              onClick={() => navigate('/checkout')}
            >
              Confirm & Book <RightOutlined />
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Cart;
