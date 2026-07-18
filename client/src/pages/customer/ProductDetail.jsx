/**
 * ----------------------------------------------------------------------------------
 * PRODUCT DETAIL PAGE
 *
 * WHAT THIS FILE DOES:
 * Shows one rental product and its booking panel: rental window, quantity, a live
 * price breakdown (rent + refundable deposit), and the add-to-cart action.
 *
 * HOW IT FITS INTO THE APP:
 * Routed at '/products/:id'. Adding to cart writes into localStorage under
 * 'rental_cart' and fires a 'cartUpdated' event that the header listens for.
 *
 * WHERE TO CHANGE THINGS:
 *   - Pricing math lives in the derived values inside the component.
 *   - Layout lives in storefront.css under the `.sf-detail` rules.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Result, InputNumber, DatePicker, message } from 'antd';
import {
  ShoppingCartOutlined,
  LeftOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { StatusPill, formatCurrency } from '../../components/ui';
import './storefront.css';

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
      setError('We could not find that product.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Persist the configured rental into the cart, then go to the cart page.
   *
   * Input:  component state (product, quantity, dates)
   * Output: writes localStorage 'rental_cart' and navigates to '/cart'.
   */
  const handleAddToCart = () => {
    if (!dates || !dates[0] || !dates[1]) {
      message.error('Choose a rental period first.');
      return;
    }

    const cartItem = {
      product,
      qty: quantity,
      rentalStart: dates[0].toISOString(),
      rentalEnd: dates[1].toISOString(),
    };

    try {
      const existingCart = JSON.parse(localStorage.getItem('rental_cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('rental_cart', JSON.stringify(existingCart));

      window.dispatchEvent(new Event('cartUpdated'));
      message.success(`${product.name} added to your cart.`);
      navigate('/cart');
    } catch (err) {
      message.error('Could not add this item to the cart.');
    }
  };

  // Past dates cannot be booked
  const disabledDate = (current) => current && current < dayjs().startOf('day');

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: '120px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <Result
        status="404"
        title="Product not found"
        subTitle={error}
        extra={<Button type="primary" onClick={() => navigate('/products')}>Back to catalog</Button>}
      />
    );
  }

  // ---- Derived pricing -----------------------------------------------------
  const unitPrice = product.salesPrice || 0;
  // Inclusive day count: a Mon-Tue booking is 2 days, not 1
  const rentalDays = dates?.[0] && dates?.[1] ? dates[1].diff(dates[0], 'day') + 1 : 0;
  const billedDays = rentalDays > 0 ? rentalDays : 1;
  const rentalSubtotal = unitPrice * quantity * billedDays;
  const depositTotal = (product.securityDeposit || 0) * quantity;
  const dueToday = rentalSubtotal + depositTotal;

  const inStock = product.qtyOnHand > 0;
  const utilizationRate = product.rentalCount > 0
    ? Math.min((product.totalRentalHours / (30 * 24)) * 100, 100).toFixed(1)
    : '0';

  return (
    <div className="page">
      <Button
        type="link"
        icon={<LeftOutlined />}
        onClick={() => navigate('/products')}
        style={{ paddingLeft: 0, marginBottom: 'var(--s-4)' }}
      >
        Back to catalog
      </Button>

      <div className="sf-detail">
        {/* ---------------------------------------------------------- Media */}
        <div>
          <div className="sf-gallery">
            {product.images?.length > 0 ? (
              <img src={product.images[0]} alt={product.name} />
            ) : (
              <ShoppingOutlined style={{ fontSize: 56, color: 'var(--faint)' }} />
            )}
          </div>

          <div className="sf-metrics">
            <div className="sf-metric">
              <span className="sf-metric-label">Utilization</span>
              <span className="sf-metric-value">{utilizationRate}%</span>
            </div>
            <div className="sf-metric">
              <span className="sf-metric-label">Times rented</span>
              <span className="sf-metric-value">{product.rentalCount || 0}</span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------- Booking */}
        <div className="sf-booking">
          <div className="u-row u-wrap">
            {product.category?.name && (
              <span className="pill pill-info pill-plain">{product.category.name}</span>
            )}
            <StatusPill tone={inStock ? 'success' : 'warning'}>
              {inStock ? `${product.qtyOnHand} available` : 'Out of stock'}
            </StatusPill>
          </div>

          <h1 className="sf-detail-title">{product.name}</h1>

          <div className="sf-detail-price">
            <strong>{formatCurrency(unitPrice)}</strong>
            <span className="u-muted">per {product.periodicity?.toLowerCase() || 'day'}</span>
          </div>

          <p className="u-body">
            {product.description ||
              'Serviced and inspected before every rental, with transparent deposit and return terms.'}
          </p>

          <div className="sf-spec-grid">
            <div className="sf-spec">
              <span className="sf-spec-label">Security deposit</span>
              <span className="sf-spec-value">{formatCurrency(product.securityDeposit)}</span>
            </div>
            <div className="sf-spec">
              <span className="sf-spec-label">Late fee per hour</span>
              <span className="sf-spec-value">{formatCurrency(product.lateFeePerHour)}</span>
            </div>
            <div className="sf-spec">
              <span className="sf-spec-label">Billing period</span>
              <span className="sf-spec-value" style={{ textTransform: 'capitalize' }}>
                {product.periodicity?.toLowerCase() || '—'}
              </span>
            </div>
            <div className="sf-spec">
              <span className="sf-spec-label">In stock</span>
              <span className="sf-spec-value">{product.qtyOnHand} units</span>
            </div>
          </div>

          <div className="sf-field">
            <label className="sf-field-label" htmlFor="rental-period">Rental period</label>
            <RangePicker
              id="rental-period"
              style={{ width: '100%' }}
              size="large"
              disabledDate={disabledDate}
              onChange={setDates}
            />
          </div>

          <div className="sf-field">
            <label className="sf-field-label" htmlFor="rental-qty">Quantity</label>
            <InputNumber
              id="rental-qty"
              min={1}
              max={inStock ? product.qtyOnHand : 1}
              value={quantity}
              onChange={(value) => setQuantity(value || 1)}
              size="large"
              style={{ width: '100%' }}
            />
          </div>

          {/* Breakdown appears only once a period is chosen */}
          {rentalDays > 0 && (
            <div className="sf-quote">
              <div className="sf-quote-row">
                <span>
                  Rental · {formatCurrency(unitPrice)} × {billedDays} {billedDays === 1 ? 'day' : 'days'} × {quantity}
                </span>
                <span>{formatCurrency(rentalSubtotal)}</span>
              </div>
              <div className="sf-quote-row">
                <span>Refundable deposit × {quantity}</span>
                <span>{formatCurrency(depositTotal)}</span>
              </div>
              <div className="sf-quote-row sf-quote-total">
                <span>Due today</span>
                <span>{formatCurrency(dueToday)}</span>
              </div>
              <p className="sf-quote-note">
                The deposit is refunded in full when the item is returned on time.
              </p>
            </div>
          )}

          <Button
            type="primary"
            size="large"
            block
            icon={<ShoppingCartOutlined />}
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            {inStock ? 'Add to cart' : 'Out of stock'}
          </Button>

          <div className="sf-assurances">
            <span className="sf-assurance">
              <SafetyCertificateOutlined />
              Deposit held separately and refunded in full on an on-time return.
            </span>
            <span className="sf-assurance">
              <ClockCircleOutlined />
              Late returns are charged {formatCurrency(product.lateFeePerHour)} per hour, rounded up.
            </span>
            <span className="sf-assurance">
              <CheckCircleFilled />
              Inspected and serviced before every rental.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
