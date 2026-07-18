import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Row, Col, Card, Spin, Button, Result, InputNumber, DatePicker, message, Divider, Tag, Descriptions } from 'antd';
import { ShoppingCartOutlined, LeftOutlined, SecurityScanOutlined, ToolOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [quantity, setQuantity] = useState(1);
  const [dates, setDates] = useState(null);

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      setProduct(response.data?.data);
    } catch (err) {
      console.error('Failed to fetch product', err);
      setError('Product not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!dates || !dates[0] || !dates[1]) {
      message.error('Please select rental dates');
      return;
    }

    const rentalStart = dates[0].toISOString();
    const rentalEnd = dates[1].toISOString();

    const cartItem = {
      product,
      qty: quantity,
      rentalStart,
      rentalEnd
    };

    try {
      const existingCart = JSON.parse(localStorage.getItem('rental_cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('rental_cart', JSON.stringify(existingCart));
      
      window.dispatchEvent(new Event('cartUpdated'));
      message.success(`${product.name} added to cart`);
      navigate('/cart');
    } catch (e) {
      message.error('Failed to add to cart');
    }
  };

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
  if (error || !product) return <Result status="404" title="404" subTitle={error} extra={<Button onClick={() => navigate('/')}>Back Home</Button>} />;

  const price = product.salesPrice || 0;
  const days = dates && dates[0] && dates[1] ? dates[1].diff(dates[0], 'day') + 1 : 0;
  
  const rentalSubtotal = price * quantity * (days > 0 ? days : 1);
  const depositTotal = (product.securityDeposit || 0) * quantity;
  const grandTotal = rentalSubtotal + depositTotal;

  // Forecast availability: if qtyOnHand > 0, it's available. If 0, next week.
  const isAvailable = product.qtyOnHand > 0;
  const nextAvailableText = isAvailable 
    ? 'Available Now' 
    : `Next Available: ${dayjs().add(5, 'day').format('MMM DD, YYYY')}`;

  const utilizationRate = product.rentalCount > 0 
    ? Math.min((product.totalRentalHours / (30 * 24)) * 100, 100).toFixed(1) 
    : '0';

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', maxWidth: '1000px', margin: '0 auto' }}>
      <Button icon={<LeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: '24px', paddingLeft: 0 }} type="link">
        Back to Products
      </Button>

      <Card bordered={false} className="enterprise-card" style={{ padding: 12 }}>
        <Row gutter={[32, 24]}>
          <Col xs={24} md={12}>
            <div style={{ backgroundColor: '#F5F6F8', height: '380px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Text type="secondary" style={{ fontSize: '18px' }}>No Product Image</Text>
              )}
            </div>
            
            {/* Asset Performance Summary Box */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <div style={{ flex: 1, background: '#F9FAFB', padding: '12px', borderRadius: 6, border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Utilization</Text>
                <Text strong style={{ fontSize: 16 }} className="tabular-numbers">{utilizationRate}%</Text>
              </div>
              <div style={{ flex: 1, background: '#F9FAFB', padding: '12px', borderRadius: 6, border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Rents Logged</Text>
                <Text strong style={{ fontSize: 16 }} className="tabular-numbers">{product.rentalCount} times</Text>
              </div>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Title level={3} style={{ margin: '0 0 4px 0', color: '#1F2937' }}>{product.name}</Title>
                <Tag color="#3651A5" className="status-tag" style={{ marginBottom: '16px' }}>{product.category?.name}</Tag>
              </div>
              <Tag color={isAvailable ? 'success' : 'warning'} className="status-tag">
                {nextAvailableText}
              </Tag>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '24px', color: '#3651A5' }} className="tabular-numbers">₹{price.toFixed(2)}</Text>
              <Text type="secondary" style={{ fontSize: '14px' }}> / {product.periodicity?.toLowerCase()}</Text>
            </div>

            <Paragraph style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: 20 }}>
              {product.description || 'Experience top-tier quality and enterprise-grade reliability with our business rentals. Fully sanitized, verified, and serviced prior to delivery.'}
            </Paragraph>

            <Descriptions column={2} size="small" bordered style={{ marginBottom: 24 }} contentStyle={{ className: 'tabular-numbers' }}>
              <Descriptions.Item label="Security Deposit">₹{product.securityDeposit?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Late Fee / Hour">₹{product.lateFeePerHour?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Periodicity">{product.periodicity}</Descriptions.Item>
              <Descriptions.Item label="Available Stock">{product.qtyOnHand} units</Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Rental Period</Text>
              <RangePicker 
                style={{ width: '100%' }} 
                disabledDate={disabledDate}
                onChange={(vals) => setDates(vals)}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Quantity</Text>
              <InputNumber 
                min={1} 
                max={product.qtyOnHand > 0 ? product.qtyOnHand : 1} 
                value={quantity} 
                onChange={setQuantity}
                style={{ width: '100%' }}
              />
            </div>

            {days > 0 && (
              <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '6px', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Col><Text type="secondary">Rental Charge:</Text></Col>
                  <Col><Text className="tabular-numbers">₹{price.toFixed(2)} x {days} days x {quantity} units = ₹{rentalSubtotal.toFixed(2)}</Text></Col>
                </Row>
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Col><Text type="secondary">Refundable Deposit:</Text></Col>
                  <Col><Text className="tabular-numbers">₹{product.securityDeposit?.toFixed(2)} x {quantity} units = ₹{depositTotal.toFixed(2)}</Text></Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Row justify="space-between">
                  <Col><Text strong style={{ fontSize: '15px' }}>Checkout Total (Due now):</Text></Col>
                  <Col><Text strong style={{ fontSize: '16px', color: '#3651A5' }} className="tabular-numbers">₹{grandTotal.toFixed(2)}</Text></Col>
                </Row>
              </div>
            )}

            <Button 
              type="primary" 
              size="large" 
              icon={<ShoppingCartOutlined />} 
              style={{ width: '100%', backgroundColor: '#3651A5', height: '44px', fontSize: '15px', borderRadius: 6 }}
              onClick={handleAddToCart}
              disabled={product.qtyOnHand <= 0}
            >
              {product.qtyOnHand > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ProductDetail;
