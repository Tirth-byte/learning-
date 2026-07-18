/**
 * ----------------------------------------------------------------------------------
 * CART PAGE
 *
 * WHAT THIS FILE DOES:
 * Lists the rental lines the customer has configured, lets them adjust quantities or
 * remove lines, and totals the rent and refundable deposits before checkout.
 *
 * HOW IT FITS INTO THE APP:
 * Routed at '/cart'. The cart is client-side only, stored in localStorage under
 * 'rental_cart'; every mutation fires 'cartUpdated' so the header badge stays right.
 *
 * WHERE TO CHANGE THINGS:
 *   - Totals math lives in the derived values in the component.
 *   - Layout lives in storefront.css under the `.sf-cart` and `.sf-line` rules.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Button, Popconfirm, InputNumber, message } from 'antd';
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { PageHeader, EmptyState, Surface, formatCurrency } from '../../components/ui';
import './storefront.css';

const STORAGE_KEY = 'rental_cart';

/**
 * Inclusive rental day count for a cart line. A Mon–Tue booking bills 2 days.
 * Falls back to 1 so a malformed date range never produces a zero charge.
 */
const getRentalDays = (item) => {
  const start = dayjs(item.rentalStart);
  const end = dayjs(item.rentalEnd);
  const days = end.diff(start, 'day') + 1;
  return days > 0 ? days : 1;
};

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  /** Read the cart from localStorage, tolerating corrupt data. */
  const loadCart = () => {
    try {
      setCartItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch (error) {
      setCartItems([]);
    }
  };

  /** Write the cart back and notify the header badge. */
  const persistCart = (nextCart) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
    setCartItems(nextCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemove = (index) => {
    const nextCart = cartItems.filter((_, itemIndex) => itemIndex !== index);
    persistCart(nextCart);
    message.success('Item removed from your cart.');
  };

  /** Change the quantity on a line state. */
  const handleQuantityChange = (index, value) => {
    const nextCart = cartItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, qty: value } : item);
    persistCart(nextCart);
  };

  /** Calculate error for cart lines inline */
  const getLineError = (item) => {
    const qty = item.qty;
    if (qty === null || qty === undefined) {
      return 'Quantity is required.';
    }
    if (qty <= 0) {
      return 'Quantity must be greater than zero.';
    }
    const limit = item.product?.availableQty !== undefined ? item.product.availableQty : item.product?.qtyOnHand;
    if (qty > limit) {
      return `Quantity cannot exceed available stock (${limit} units).`;
    }
    return '';
  };

  const hasErrors = cartItems.some(item => getLineError(item) !== '');

  // ---- Totals --------------------------------------------------------------
  const rentalSubtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.salesPrice || 0;
    return sum + price * item.qty * getRentalDays(item);
  }, 0);

  const depositTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.securityDeposit || 0) * item.qty, 0);

  const dueToday = rentalSubtotal + depositTotal;

  if (cartItems.length === 0) {
    return (
      <div className="page page-narrow">
        <PageHeader title="Your cart" />
        <Surface pad={false}>
          <EmptyState
            icon={<ShoppingCartOutlined />}
            title="Your cart is empty"
            text="Browse the catalog and pick a rental window to get started."
            actionLabel="Browse the catalog"
            to="/products"
          />
        </Surface>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Your cart"
        subtitle={`${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} ready to book.`}
      />

      <div className="sf-cart">
        {/* -------------------------------------------------------- Lines */}
        <Surface pad={false}>
          {cartItems.map((item, index) => {
            const days = getRentalDays(item);
            const lineTotal = (item.product?.salesPrice || 0) * item.qty * days;
            const lineDeposit = (item.product?.securityDeposit || 0) * item.qty;

            return (
              <div className="sf-line" key={`${item.product?.id}-${index}`}>
                <div className="sf-line-media">
                  {item.product?.images?.length > 0 ? (
                    <img src={item.product.images[0]} alt={item.product.name} />
                  ) : (
                    <ShoppingOutlined style={{ fontSize: 24, color: 'var(--faint)' }} />
                  )}
                </div>

                <div className="sf-line-body">
                  <div className="sf-line-title">{item.product?.name}</div>

                  <div className="sf-line-meta">
                    <span>
                      {dayjs(item.rentalStart).format('DD MMM')} – {dayjs(item.rentalEnd).format('DD MMM YYYY')}
                    </span>
                    <span>{days} {days === 1 ? 'day' : 'days'}</span>
                    <span>{formatCurrency(item.product?.salesPrice)} / {item.product?.periodicity?.toLowerCase() || 'day'}</span>
                  </div>

                  <div className="u-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="u-muted" style={{ fontSize: 'var(--t-2xs)' }}>Qty</span>
                      <InputNumber
                        size="small"
                        value={item.qty}
                        onChange={(value) => handleQuantityChange(index, value)}
                        style={{ width: 68 }}
                      />
                      {lineDeposit > 0 && (
                        <span className="u-muted" style={{ fontSize: 'var(--t-2xs)' }}>
                          + {formatCurrency(lineDeposit)} deposit
                        </span>
                      )}
                    </div>
                    {getLineError(item) && (
                      <span style={{ color: 'var(--danger)', fontSize: 'var(--t-2xs)', fontWeight: 500 }}>
                        {getLineError(item)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="sf-line-right">
                  <span className="sf-line-total">{formatCurrency(lineTotal)}</span>
                  <Popconfirm
                    title="Remove this item?"
                    okText="Remove"
                    cancelText="Keep"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleRemove(index)}
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                      Remove
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            );
          })}
        </Surface>

        {/* ------------------------------------------------------ Summary */}
        <div className="sf-summary">
          <Surface title="Order summary">
            <div className="sf-summary-row">
              <span>Rental subtotal</span>
              <strong>{formatCurrency(rentalSubtotal)}</strong>
            </div>
            <div className="sf-summary-row">
              <span>Refundable deposits</span>
              <strong>{formatCurrency(depositTotal)}</strong>
            </div>
            <div className="sf-summary-row sf-summary-total">
              <span>Due today</span>
              <strong>{formatCurrency(dueToday)}</strong>
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<RightOutlined />}
              style={{ marginTop: 'var(--s-4)' }}
              onClick={() => navigate('/checkout')}
              disabled={hasErrors}
            >
              Proceed to checkout
            </Button>

            <Button
              type="text"
              block
              style={{ marginTop: 'var(--s-2)' }}
              onClick={() => navigate('/products')}
            >
              Continue shopping
            </Button>

            <div className="sf-assurances">
              <span className="sf-assurance">
                <SafetyCertificateOutlined />
                {formatCurrency(depositTotal)} of this total is a refundable deposit, returned in full on an on-time return.
              </span>
              <span className="sf-assurance">
                <ClockCircleOutlined />
                Late returns are billed per hour and settled against the deposit automatically.
              </span>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
};

export default Cart;
