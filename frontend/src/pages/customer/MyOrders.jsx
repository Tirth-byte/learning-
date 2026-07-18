/**
 * ----------------------------------------------------------------------------------
 * CUSTOMER ORDER HISTORY
 *
 * WHAT THIS FILE DOES:
 * Lists the signed-in customer's rental bookings as cards, and opens a detail drawer
 * showing the order lines — including any automatically posted late-fee line — plus
 * the tax breakdown and total.
 *
 * HOW IT FITS INTO THE APP:
 * Routed at '/my-orders' behind the auth guard. The backend scopes GET /orders to the
 * signed-in customer, so no client-side filtering by user is needed.
 *
 * WHERE TO CHANGE THINGS:
 *   - Card layout lives in storefront.css under the `.sf-order` rules.
 *   - Status colours are mapped centrally in components/ui ORDER_STATUS_TONE.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Button, Spin, Result, Modal, Table } from 'antd';
import { EyeOutlined, ProfileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { PageHeader, EmptyState, StatusPill, Surface, formatCurrency } from '../../components/ui';
import './storefront.css';

// Tax rate shown on the order detail breakdown, matching the backend calculation
const TAX_LABEL = 'Tax (18%)';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // The backend filters to the signed-in customer when the role is CUSTOMER
      const response = await api.get('/orders');
      setOrders(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Could not load your order history right now.');
    } finally {
      setLoading(false);
    }
  };

  /** Line-item columns for the detail modal. */
  const lineColumns = [
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Type',
      dataIndex: 'lineType',
      key: 'lineType',
      render: (type) => {
        // Late fee lines are the ones the system posts on a late return
        const tone = type === 'RENTAL' ? 'info' : type === 'DEPOSIT' ? 'neutral' : 'warning';
        return <span className={`pill pill-${tone} pill-plain`}>{type}</span>;
      },
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      align: 'right',
      render: (qty, record) => <span className="u-nums">{record.lineType === 'DEPOSIT' ? '—' : qty}</span>,
    },
    {
      title: 'Unit rate',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (value) => <span className="u-nums">{formatCurrency(value)}</span>,
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      align: 'right',
      render: (value) => <strong className="u-nums">{formatCurrency(value)}</strong>,
    },
  ];

  if (error) {
    return <Result status="error" title="Something went wrong" subTitle={error} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: '120px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="My rentals"
        subtitle="Every booking you've made, with its current status and totals."
      />

      {orders.length === 0 ? (
        <Surface pad={false}>
          <EmptyState
            icon={<ProfileOutlined />}
            title="No rentals yet"
            text="Once you book equipment, your orders and their return dates will appear here."
            actionLabel="Browse the catalog"
            to="/products"
          />
        </Surface>
      ) : (
        <div className="sf-orders">
          {orders.map((order) => {
            // Surface the auto-posted late fee if the backend added one
            const lateFeeLine = (order.lines || []).find((line) => line.lineType === 'LATE_FEE');

            return (
              <article className="sf-order" key={order.id}>
                <header className="sf-order-head">
                  <div>
                    <div className="sf-order-ref">{order.reference}</div>
                    <div className="sf-order-date">
                      Booked {dayjs(order.createdAt).format('DD MMM YYYY')}
                    </div>
                  </div>
                  <StatusPill status={order.status} />
                </header>

                <div className="sf-order-body">
                  <div className="sf-order-figures">
                    <div>
                      <span className="sf-figure-label">Rental period</span>
                      <span className="sf-figure-value" style={{ fontSize: 'var(--t-sm)' }}>
                        {dayjs(order.rentalStart).format('DD MMM')} – {dayjs(order.rentalEnd).format('DD MMM YYYY')}
                      </span>
                    </div>
                    <div>
                      <span className="sf-figure-label">Total</span>
                      <span className="sf-figure-value">{formatCurrency(order.total)}</span>
                    </div>
                    {lateFeeLine && (
                      <div>
                        <span className="sf-figure-label">Late fee</span>
                        <span className="sf-figure-value is-fee">
                          {formatCurrency(lateFeeLine.subtotal)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button icon={<EyeOutlined />} onClick={() => setSelectedOrder(order)}>
                    View details
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        title={`Rental order ${selectedOrder?.reference || ''}`}
        open={Boolean(selectedOrder)}
        onCancel={() => setSelectedOrder(null)}
        footer={<Button onClick={() => setSelectedOrder(null)}>Close</Button>}
        width={760}
        destroyOnClose
      >
        {selectedOrder && (
          <>
            <div className="sf-spec-grid" style={{ marginTop: 0 }}>
              <div className="sf-spec">
                <span className="sf-spec-label">Status</span>
                <StatusPill status={selectedOrder.status} />
              </div>
              <div className="sf-spec">
                <span className="sf-spec-label">Booked on</span>
                <span className="sf-spec-value">{dayjs(selectedOrder.createdAt).format('DD MMM YYYY')}</span>
              </div>
              <div className="sf-spec">
                <span className="sf-spec-label">Rental period</span>
                <span className="sf-spec-value">
                  {dayjs(selectedOrder.rentalStart).format('DD MMM HH:mm')} – {dayjs(selectedOrder.rentalEnd).format('DD MMM HH:mm')}
                </span>
              </div>
              <div className="sf-spec">
                <span className="sf-spec-label">Actual return</span>
                <span className="sf-spec-value">
                  {selectedOrder.actualReturn
                    ? dayjs(selectedOrder.actualReturn).format('DD MMM HH:mm')
                    : 'Not returned yet'}
                </span>
              </div>
            </div>

            <h3 className="u-h3" style={{ margin: 'var(--s-5) 0 var(--s-3)' }}>Order lines</h3>
            <Table
              dataSource={selectedOrder.lines || []}
              columns={lineColumns}
              rowKey="id"
              pagination={false}
              size="small"
              className="dense-table"
            />

            <div style={{ marginTop: 'var(--s-5)', marginLeft: 'auto', maxWidth: 300 }}>
              <div className="sf-summary-row">
                <span>Untaxed amount</span>
                <strong>{formatCurrency(selectedOrder.untaxed)}</strong>
              </div>
              <div className="sf-summary-row">
                <span>{TAX_LABEL}</span>
                <strong>{formatCurrency(selectedOrder.tax)}</strong>
              </div>
              <div className="sf-summary-row sf-summary-total">
                <span>Total</span>
                <strong>{formatCurrency(selectedOrder.total)}</strong>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MyOrders;
