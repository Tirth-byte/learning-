/**
 * ----------------------------------------------------------------------------------
 * CUSTOMER CHECKOUT PAGE
 *
 * WHAT THIS FILE DOES:
 * A three-step checkout wizard:
 *   1. Review  — the rental lines, their periods, and the deposit being held
 *   2. Delivery — where the equipment should go
 *   3. Payment  — simulated card capture, then submits the order
 * A fourth state confirms the booking once the API returns an order reference.
 *
 * HOW IT FITS INTO THE APP:
 * Reached from '/cart' behind the auth guard. Submits to POST /api/orders/checkout
 * and clears the localStorage cart on success so an order cannot be placed twice.
 *
 * WHERE TO CHANGE THINGS:
 *   - Step titles and the displayed tax rate are constants below.
 *   - Layout classes live in storefront.css and theme/ui.css.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Steps, Button, Form, Input, message, Result, Radio, Spin } from 'antd';
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  CarOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { PageHeader, Surface, formatCurrency } from '../../components/ui';
import './storefront.css';

// CHANGE THESE TO RENAME THE WIZARD STEPS
const STEP_TITLES = ['Review', 'Delivery', 'Payment'];

// CHANGE THIS TO ADJUST THE DISPLAYED TAX RATE (display only; the server is authoritative)
const DISPLAY_TAX_PERCENT = 18;

/** Inclusive rental day count for a cart line, floored at 1. */
const getRentalDays = (item) => {
  const days = dayjs(item.rentalEnd).diff(dayjs(item.rentalStart), 'day') + 1;
  return days > 0 ? days : 1;
};

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [orderRef, setOrderRef] = useState('');
  const navigate = useNavigate();
  const [deliveryForm] = Form.useForm();

  /**
   * Load the cart once on mount. If it is empty and no order has been placed yet,
   * send the user back to the cart page.
   *
   * This deliberately does not depend on currentStep: re-reading the cart after the
   * order succeeds would find it empty and bounce the user off the confirmation.
   */
  useEffect(() => {
    let items = [];
    try {
      items = JSON.parse(localStorage.getItem('rental_cart') || '[]');
    } catch (error) {
      items = [];
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    setCartItems(items);
  }, [navigate]);

  // ---- Totals --------------------------------------------------------------
  const rentalSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.salesPrice || 0) * item.qty * getRentalDays(item), 0);

  const depositTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.securityDeposit || 0) * item.qty, 0);

  const estimatedTax = rentalSubtotal * (DISPLAY_TAX_PERCENT / 100);
  const dueToday = rentalSubtotal + estimatedTax + depositTotal;

  /** Capture delivery details and advance. */
  const onDeliverySubmit = (values) => {
    setDeliveryInfo(values);
    setCurrentStep(2);
  };

  /**
   * Submit the order.
   *
   * Input:  cartItems + deliveryInfo from state
   * Output: sets orderRef and advances to the confirmation, clearing the cart.
   */
  const processCompleteCheckout = async () => {
    try {
      setLoading(true);

      const fullAddress = `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.zip}`;
      const payload = {
        // The API takes one rental window per order, so the first line's window applies
        rentalStart: cartItems[0].rentalStart,
        rentalEnd: cartItems[0].rentalEnd,
        pickupType: 'DELIVERY',
        deliveryAddress: fullAddress,
        invoiceAddress: fullAddress,
        lines: cartItems.map((item) => ({ productId: item.product.id, qty: item.qty })),
      };

      const response = await api.post('/orders/checkout', payload);
      setOrderRef(response.data.data.reference);

      // Clear the cart so a refresh cannot place the order twice
      localStorage.removeItem('rental_cart');
      window.dispatchEvent(new Event('cartUpdated'));
      setCurrentStep(3);
    } catch (err) {
      console.error('Checkout error:', err);
      message.error(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---- Confirmation --------------------------------------------------------
  if (currentStep === 3) {
    return (
      <div className="page page-narrow">
        <Surface>
          <Result
            status="success"
            title="Your rental is booked"
            subTitle={
              <>
                Order <strong>{orderRef}</strong> is confirmed. You can track its status,
                pickup, and return from your rentals page.
              </>
            }
            extra={[
              <Button type="primary" key="orders" onClick={() => navigate('/my-orders')}>
                View my rentals
              </Button>,
              <Button key="shop" onClick={() => navigate('/products')}>
                Continue shopping
              </Button>,
            ]}
          />
        </Surface>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: '120px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Checkout" subtitle="Confirm your rental, delivery, and payment details." />

      <Steps
        current={currentStep}
        style={{ marginBottom: 'var(--s-8)' }}
        items={[
          { title: STEP_TITLES[0], icon: <ProfileOutlined /> },
          { title: STEP_TITLES[1], icon: <CarOutlined /> },
          { title: STEP_TITLES[2], icon: <CreditCardOutlined /> },
        ]}
      />

      <div className="sf-cart">
        <div>
          {/* ------------------------------------------------ Step 1: Review */}
          {currentStep === 0 && (
            <Surface title="Review your rental" pad={false}>
              {cartItems.map((item, index) => {
                const days = getRentalDays(item);
                const lineTotal = (item.product?.salesPrice || 0) * item.qty * days;

                return (
                  <div className="sf-line" key={`${item.product?.id}-${index}`}>
                    <div className="sf-line-body">
                      <div className="sf-line-title">{item.product?.name}</div>
                      <div className="sf-line-meta">
                        <span>
                          {dayjs(item.rentalStart).format('DD MMM')} – {dayjs(item.rentalEnd).format('DD MMM YYYY')}
                        </span>
                        <span>{days} {days === 1 ? 'day' : 'days'}</span>
                        <span>Qty {item.qty}</span>
                      </div>
                      <span className="u-muted" style={{ fontSize: 'var(--t-2xs)' }}>
                        Deposit {formatCurrency((item.product?.securityDeposit || 0) * item.qty)} — refunded on an on-time return
                      </span>
                    </div>
                    <div className="sf-line-right">
                      <span className="sf-line-total">{formatCurrency(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}

              <div style={{ padding: 'var(--s-4)' }}>
                <Button type="primary" size="large" block onClick={() => setCurrentStep(1)}>
                  Continue to delivery
                </Button>
              </div>
            </Surface>
          )}

          {/* ---------------------------------------------- Step 2: Delivery */}
          {currentStep === 1 && (
            <Surface title="Delivery details">
              <Form
                form={deliveryForm}
                layout="vertical"
                onFinish={onDeliverySubmit}
                requiredMark={false}
                initialValues={deliveryInfo || undefined}
              >
                <Form.Item
                  name="address"
                  label="Street address"
                  rules={[{ required: true, message: 'Enter the delivery address.' }]}
                >
                  <Input size="large" placeholder="12 MG Road, Suite 4" />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 'var(--s-4)' }}>
                  <Form.Item
                    name="city"
                    label="City"
                    rules={[{ required: true, message: 'Enter the city.' }]}
                  >
                    <Input size="large" placeholder="Ahmedabad" />
                  </Form.Item>

                  <Form.Item
                    name="zip"
                    label="PIN code"
                    rules={[
                      { required: true, message: 'Enter the PIN code.' },
                      { pattern: /^\d{6}$/, message: 'Enter a 6-digit PIN code.' },
                    ]}
                  >
                    <Input size="large" placeholder="380001" maxLength={6} />
                  </Form.Item>
                </div>

                <div className="u-row" style={{ marginTop: 'var(--s-2)' }}>
                  <Button size="large" onClick={() => setCurrentStep(0)}>Back</Button>
                  <Button type="primary" size="large" htmlType="submit" className="u-grow">
                    Continue to payment
                  </Button>
                </div>
              </Form>
            </Surface>
          )}

          {/* ----------------------------------------------- Step 3: Payment */}
          {currentStep === 2 && (
            <Surface title="Payment">
              <div
                className="u-row"
                style={{
                  gap: 'var(--s-3)',
                  padding: 'var(--s-3) var(--s-4)',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--info-bg)',
                  marginBottom: 'var(--s-5)',
                }}
              >
                <LockOutlined style={{ color: 'var(--brand-600)' }} />
                <span style={{ fontSize: 'var(--t-xs)', color: 'var(--brand-700)' }}>
                  This is a demo checkout. No card is charged and no card details are stored.
                </span>
              </div>

              <Form layout="vertical" requiredMark={false} onFinish={processCompleteCheckout}>
                <Form.Item label="Payment method">
                  <Radio.Group defaultValue="card">
                    <Radio value="card">Card</Radio>
                    <Radio value="upi">UPI</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item label="Card number">
                  <Input size="large" placeholder="4242 4242 4242 4242" prefix={<CreditCardOutlined />} />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-4)' }}>
                  <Form.Item label="Expiry">
                    <Input size="large" placeholder="12 / 28" />
                  </Form.Item>
                  <Form.Item label="CVC">
                    <Input size="large" placeholder="123" maxLength={4} />
                  </Form.Item>
                </div>

                <div className="u-row" style={{ marginTop: 'var(--s-2)' }}>
                  <Button size="large" onClick={() => setCurrentStep(1)}>Back</Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                    className="u-grow"
                  >
                    Pay {formatCurrency(dueToday)}
                  </Button>
                </div>
              </Form>
            </Surface>
          )}
        </div>

        {/* -------------------------------------------------- Summary rail */}
        <div className="sf-summary">
          <Surface title="Order summary">
            <div className="sf-summary-row">
              <span>Rental subtotal</span>
              <strong>{formatCurrency(rentalSubtotal)}</strong>
            </div>
            <div className="sf-summary-row">
              <span>Tax ({DISPLAY_TAX_PERCENT}%)</span>
              <strong>{formatCurrency(estimatedTax)}</strong>
            </div>
            <div className="sf-summary-row">
              <span>Refundable deposit</span>
              <strong>{formatCurrency(depositTotal)}</strong>
            </div>
            <div className="sf-summary-row sf-summary-total">
              <span>Due today</span>
              <strong>{formatCurrency(dueToday)}</strong>
            </div>

            <div className="sf-assurances">
              <span className="sf-assurance">
                <SafetyCertificateOutlined />
                {formatCurrency(depositTotal)} is a deposit, refunded in full when you return on time.
              </span>
              <span className="sf-assurance">
                <CheckCircleOutlined />
                Final tax is calculated by the server when the order is confirmed.
              </span>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
