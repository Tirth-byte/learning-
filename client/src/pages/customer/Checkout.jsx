/**
 * ----------------------------------------------------------------------------------
 * CUSTOMER CHECKOUT PAGE
 * 
 * WHAT THIS FILE DOES:
 * This file provides a 3-step checkout wizard for customer bookings:
 *   1. Cart Summary (Review duration prices and security deposits)
 *   2. Delivery Information (Address inputs)
 *   3. Payment Settle (Simulated card inputs and checkout transaction dispatch)
 * 
 * HOW IT FITS INTO THE APP:
 * Customers are navigated here from the Shopping Cart page after selecting items to rent.
 * It submits the transaction payload to POST /api/orders/checkout.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Steps, Card, Button, Form, Input, Row, Col, Typography, Divider, message, Result, Radio, Descriptions } from 'antd';
import { CreditCardOutlined, CheckCircleOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Title, Text } = Typography;

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Change these values to adjust wizard step titles or checkout parameters.
// ----------------------------------------------------------------------------------

// CHANGE THESE TO RENAME THE TITLES DISPLAYED IN THE CHECKOUT PROGRESS BAR
const PROGRESS_STEP_TITLES = ['Cart Summary', 'Delivery Info', 'Payment Settle'];

// CHANGE THIS TO ADJUST THE MOCK TAX DISPLAY PERCENTAGE (Calculated client-side)
const CLIENT_DISPLAY_TAX_PERCENT = 18.0;


const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [deposits, setDeposits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [orderRef, setOrderRef] = useState('');
  
  const navigate = useNavigate();
  const [form] = Form.useForm();

  /**
   * Load active items from the browser localStorage on mount and compute pricing subtotals.
   * 
   * Input: None
   * Output: Updates component state variables.
   */
  useEffect(() => {
    // Read the temporary shopping cart array
    const items = JSON.parse(localStorage.getItem('rental_cart') || '[]');
    
    // Redirect the user back to the cart if they load checkout with an empty list
    if (items.length === 0 && currentStep < 3) {
      navigate('/cart');
    }
    setCartItems(items);
    
    // Calculate total base rental rates: quantity * rate * rental_days
    const calcSubtotal = items.reduce((acc, item) => {
      const price = item.product?.salesPrice || 0;
      const start = dayjs(item.rentalStart);
      const end = dayjs(item.rentalEnd);
      // We calculate difference in calendar days, adding 1 to make it inclusive
      const days = end.diff(start, 'day') + 1;
      return acc + (price * item.qty * (days > 0 ? days : 1));
    }, 0);
    
    // Calculate total security deposits held
    const calcDeposits = items.reduce((acc, item) => {
      const deposit = item.product?.securityDeposit || 0;
      return acc + (deposit * item.qty);
    }, 0);

    setSubtotal(calcSubtotal);
    setDeposits(calcDeposits);
  }, [navigate, currentStep]);

  // Grand total calculation combining base rental fees and security holdings
  const grandTotal = subtotal + deposits;

  /**
   * Increment step status tracker to show next section.
   */
  const handleNext = () => setCurrentStep(prev => prev + 1);

  /**
   * Decrement step status tracker to return to previous section.
   */
  const handlePrev = () => setCurrentStep(prev => prev - 1);

  /**
   * Capture and store delivery details submitted by the form.
   * 
   * Input:
   *   - values: Form fields containing street address, city, and zip.
   */
  const onDeliverySubmit = (values) => {
    setDeliveryInfo(values);
    handleNext();
  };

  /**
   * Dispatch the checkout details to the backend API transaction server.
   * 
   * Input: None
   * Output: Resolves or shows validation errors.
   */
  const processCompleteCheckout = async () => {
    try {
      setLoading(true);
      
      // Map cart items array to simple product key objects expected by the API
      const lines = cartItems.map(item => ({
        productId: item.product.id,
        qty: item.qty,
      }));

      // Build delivery checkout details payload
      const payload = {
        rentalStart: cartItems[0].rentalStart,
        rentalEnd: cartItems[0].rentalEnd,
        pickupType: 'DELIVERY',
        deliveryAddress: `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.zip}`,
        invoiceAddress: `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.zip}`,
        lines,
      };

      // Submit API write
      const response = await api.post('/orders/checkout', payload);
      setOrderRef(response.data.data.reference);

      // Clean local storage cart on success to prevent double purchases
      localStorage.removeItem('rental_cart');
      window.dispatchEvent(new Event('cartUpdated'));
      handleNext();
    } catch (err) {
      console.error('Checkout error:', err);
      message.error(err.response?.data?.message || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render the layout of the current wizard step based on step index.
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ marginTop: 16 }}>
            <Title level={5} style={{ margin: '0 0 16px 0' }}>Rental Cart Details</Title>
            {cartItems.map((item, idx) => {
              const start = dayjs(item.rentalStart);
              const end = dayjs(item.rentalEnd);
              const days = end.diff(start, 'day') + 1;
              const price = item.product?.salesPrice || 0;
              const itemTotal = price * item.qty * days;
              const deposit = (item.product?.securityDeposit || 0) * item.qty;

              return (
                <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Row justify="space-between">
                    <Col>
                      <Text strong style={{ fontSize: 13 }}>{item.product?.name}</Text>
                      <br/>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        📅 {start.format('MMM DD, YYYY')} - {end.format('MMM DD, YYYY')} ({days} days) × {item.qty} units
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        🛡️ Refundable Security Deposit: ₹{deposit.toFixed(2)}
                      </Text>
                    </Col>
                    <Col style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 13 }} className="tabular-numbers">₹{itemTotal.toFixed(2)}</Text>
                    </Col>
                  </Row>
                </div>
              );
            })}
            
            <div style={{ marginTop: 20 }}>
              <Descriptions size="small" column={1} colon={false} contentStyle={{ textAlign: 'right', display: 'block' }}>
                <Descriptions.Item label={<Text type="secondary">Rental Charge</Text>}>₹{subtotal.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label={<Text type="secondary">Refundable Deposit</Text>}>₹{deposits.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label={<Text strong style={{ fontSize: 14 }}>Grand Total Due</Text>}>
                  <Text strong style={{ fontSize: 18, color: '#3651A5' }} className="tabular-numbers">₹{grandTotal.toFixed(2)}</Text>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Button type="primary" size="large" onClick={handleNext} style={{ backgroundColor: '#3651A5', borderRadius: 6, fontSize: 13, height: 38 }}>
                Continue to Delivery
              </Button>
            </div>
          </div>
        );
      case 1:
        return (
          <div style={{ marginTop: 16 }}>
            <Title level={5} style={{ margin: '0 0 16px 0' }}><CarOutlined /> Delivery Address</Title>
            <Form form={form} layout="vertical" onFinish={onDeliverySubmit} initialValues={deliveryInfo || {}}>
              <Form.Item name="fullName" label={<span style={{ fontSize: 12, fontWeight: 500 }}>Recipient Name</span>} rules={[{ required: true, message: 'Recipient name is required' }]}>
                <Input placeholder="Aarav Sharma" />
              </Form.Item>
              <Form.Item name="address" label={<span style={{ fontSize: 12, fontWeight: 500 }}>Street Address</span>} rules={[{ required: true, message: 'Street Address is required' }]}>
                <Input placeholder="Flat 101, building name, Street" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="city" label={<span style={{ fontSize: 12, fontWeight: 500 }}>City</span>} rules={[{ required: true, message: 'City is required' }]}>
                    <Input placeholder="Mumbai" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="zip" label={<span style={{ fontSize: 12, fontWeight: 500 }}>ZIP Code</span>} rules={[{ required: true, message: 'ZIP is required' }]}>
                    <Input placeholder="400001" className="tabular-numbers" />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
                <Button onClick={handlePrev} style={{ borderRadius: 6 }}>Back</Button>
                <Button type="primary" htmlType="submit" style={{ backgroundColor: '#3651A5', borderRadius: 6 }}>Continue to Payment</Button>
              </div>
            </Form>
          </div>
        );
      case 2:
        return (
          <div style={{ marginTop: 16 }}>
            <Title level={5} style={{ margin: '0 0 16px 0' }}><CreditCardOutlined /> Settlement Summary</Title>
            <Card style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, marginBottom: 20 }}>
              <Descriptions size="small" column={1} colon={false} contentStyle={{ textAlign: 'right', display: 'block' }}>
                <Descriptions.Item label="Rental Total">₹{subtotal.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Refundable Deposits">₹{deposits.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label={<Text strong style={{ fontSize: 14 }}>Amount to Pay</Text>}>
                  <Text strong style={{ fontSize: 16, color: '#3651A5' }} className="tabular-numbers">₹{grandTotal.toFixed(2)}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form layout="vertical">
              <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Payment Method</span>} style={{ marginBottom: 16 }}>
                <Radio.Group defaultValue="card" style={{ width: '100%' }}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Radio.Button value="card" style={{ width: '100%', textAlign: 'center', height: 'auto', padding: '12px 0', borderRadius: 6 }}>
                        <CreditCardOutlined style={{ fontSize: 20, marginBottom: 4 }} /><br/>Card Payment
                      </Radio.Button>
                    </Col>
                    <Col span={12}>
                      <Radio.Button value="upi" style={{ width: '100%', textAlign: 'center', height: 'auto', padding: '12px 0', borderRadius: 6 }}>
                        <Text strong style={{ fontSize: 14 }}>UPI</Text><br/>GPay / PhonePe / BHIM
                      </Radio.Button>
                    </Col>
                  </Row>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Debit / Credit Card Number</span>}>
                <Input placeholder="4000 1234 5678 9010" className="tabular-numbers" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Expiry Date</span>}>
                    <Input placeholder="MM/YY" className="tabular-numbers" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>CVV</span>}>
                    <Input.Password placeholder="•••" className="tabular-numbers" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
                <Button onClick={handlePrev} disabled={loading} style={{ borderRadius: 6 }}>Back</Button>
                <Button 
                  type="primary" 
                  onClick={processCompleteCheckout} 
                  loading={loading}
                  style={{ backgroundColor: '#3651A5', borderRadius: 6, fontWeight: 500 }}
                >
                  Pay & Book Now
                </Button>
              </div>
            </Form>
          </div>
        );
      case 3:
        return (
          <Result
            status="success"
            title="Rental Booked Successfully!"
            subTitle={`Order reference: ${orderRef}. The transaction is complete and your invoice has been fully paid.`}
            extra={[
              <Button type="primary" key="orders" onClick={() => navigate('/my-orders')} style={{ backgroundColor: '#3651A5', borderRadius: 6 }}>
                My Rental Orders
              </Button>,
              <Button key="shop" onClick={() => navigate('/')} style={{ borderRadius: 6 }}>Continue Shopping</Button>,
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', maxWidth: '800px', margin: '0 auto', minHeight: '70vh' }}>
      {currentStep < 3 && (
        <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}>
          {PROGRESS_STEP_TITLES.map((titleText, idx) => (
            <Steps.Step key={idx} title={titleText} />
          ))}
        </Steps>
      )}
      
      <Card bordered={false} className="enterprise-card" style={{ padding: 12 }}>
        {renderStepContent()}
      </Card>
    </div>
  );
};

export default Checkout;
