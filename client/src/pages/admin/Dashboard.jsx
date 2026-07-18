/**
 * ----------------------------------------------------------------------------------
 * ADMIN OPERATIONS DASHBOARD
 *
 * WHAT THIS FILE DOES:
 * The portal landing screen. Shows the five headline operational metrics (sales,
 * deposits held, late fees collected, pickups due, overdue returns), the most recent
 * orders, and the pickup/return queues for the days ahead.
 *
 * HOW IT FITS INTO THE APP:
 * Routed at '/admin/dashboard'. Reads GET /dashboard/stats (filtered by the selected
 * date range) and GET /orders.
 *
 * WHERE TO CHANGE THINGS:
 *   - Date range options are in DATE_RANGES below.
 *   - Stat tiles and layout primitives come from components/ui.
 * ----------------------------------------------------------------------------------
 */

import React, { useEffect, useState } from 'react';
import { Table, Segmented, Empty } from 'antd';
import {
  DollarOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  AlertOutlined,
  SafetyOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { PageHeader, StatGrid, StatTile, Surface, StatusPill, formatCurrency } from '../../components/ui';
import './admin.css';

// CHANGE THESE TO ADJUST THE DASHBOARD DATE FILTER OPTIONS
const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: '7 days', value: '7-days' },
  { label: '30 days', value: 'month' },
];

// How many recent orders to show in the table
const RECENT_ORDER_COUNT = 6;

/**
 * Counts up to a target value on mount, so metrics animate in rather than snapping.
 *
 * Input:  value (number), precision (decimals), currency (format as money)
 * Output: an animated numeric string.
 */
const AnimatedNumber = ({ value, precision = 0, currency = false }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const endValue = parseFloat(value);
    if (Number.isNaN(endValue)) return undefined;

    const durationMs = 420;
    const tickMs = 16;
    const totalSteps = Math.max(1, durationMs / tickMs);
    const increment = endValue / totalSteps;

    let currentStep = 0;
    let runningValue = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      runningValue += increment;
      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setDisplayValue(endValue);
      } else {
        setDisplayValue(runningValue);
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, [value]);

  if (currency) return <>{formatCurrency(displayValue)}</>;
  return <>{displayValue.toFixed(precision)}</>;
};

/** Placeholder shown while the first load is in flight. */
const DashboardSkeleton = () => (
  <div className="page">
    <div className="adm-skeleton-line" style={{ width: 220, height: 26, marginBottom: 28 }} />
    <div className="stat-grid">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="stat" key={index}>
          <div className="adm-skeleton-line" style={{ width: '60%', marginBottom: 14 }} />
          <div className="adm-skeleton-line" style={{ width: '45%', height: 22 }} />
        </div>
      ))}
    </div>
    <div className="adm-split" style={{ marginTop: 'var(--s-6)' }}>
      <div className="surface" style={{ height: 320 }} />
      <div className="surface" style={{ height: 320 }} />
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, ordersResponse] = await Promise.all([
          api.get(`/dashboard/stats?dateRange=${dateRange}`),
          api.get('/orders'),
        ]);
        setStats(statsResponse.data.data);
        setRecentOrders((ordersResponse.data.data || []).slice(0, RECENT_ORDER_COUNT));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [dateRange]);

  const orderColumns = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (text, record) => (
        <Link to={`/admin/orders/${record.id}`} className="adm-link">{text}</Link>
      ),
    },
    { title: 'Customer', dataIndex: ['customer', 'name'], key: 'customer' },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (value) => <span className="u-nums">{formatCurrency(value)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusPill status={status} />,
    },
  ];

  if (loading && !stats) return <DashboardSkeleton />;

  /** Compact queue list used for both pickups and returns. */
  const QueueList = ({ items, emptyText, dateField, flagOverdue }) => {
    if (!items || items.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
    }

    return (
      <ul className="adm-queue">
        {items.map((order) => {
          const date = dayjs(order[dateField]);
          const isOverdue = flagOverdue && date.isBefore(dayjs(), 'day');

          return (
            <li key={order.id}>
              <Link to={`/admin/orders/${order.id}`} className="adm-queue-item">
                <span className="adm-queue-body">
                  <strong>{order.reference}</strong>
                  <span>{order.customer?.name || 'Unknown customer'}</span>
                </span>
                <span className={`adm-queue-date${isOverdue ? ' is-overdue' : ''}`}>
                  {date.format('DD MMM')}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="page">
      <PageHeader
        title="Operations dashboard"
        subtitle="Live view of sales, deposits held, and what needs handling today."
        actions={
          <Segmented
            options={DATE_RANGES}
            value={dateRange}
            onChange={setDateRange}
          />
        }
      />

      <StatGrid>
        <StatTile
          label="Total sales"
          value={<AnimatedNumber value={stats?.totalSales || 0} currency />}
          icon={<DollarOutlined />}
          foot="Rental revenue in range"
        />
        <StatTile
          label="Deposits held"
          value={<AnimatedNumber value={stats?.depositsHeld || 0} currency />}
          icon={<SafetyOutlined />}
          foot="Refundable, not revenue"
          tone="teal"
        />
        <StatTile
          label="Late fees collected"
          value={<AnimatedNumber value={stats?.lateFeesCollected || 0} currency />}
          icon={<ClockCircleOutlined />}
          foot="Settled against deposits"
          tone="warning"
        />
        <StatTile
          label="Pickups due today"
          value={<AnimatedNumber value={stats?.dueTodayCount || 0} />}
          icon={<SwapOutlined />}
          foot="Scheduled to go out"
          tone="violet"
        />
        <StatTile
          label="Overdue returns"
          value={<AnimatedNumber value={stats?.overdueCount || 0} />}
          icon={<AlertOutlined />}
          foot="Past the return deadline"
          tone={stats?.overdueCount > 0 ? 'danger' : 'success'}
        />
      </StatGrid>

      <div className="adm-split">
        <Surface
          title="Recent orders"
          pad={false}
          extra={<Link to="/admin/orders" className="adm-link">View all <ArrowRightOutlined /></Link>}
        >
          <Table
            dataSource={recentOrders}
            columns={orderColumns}
            rowKey="id"
            pagination={false}
            size="small"
            className="dense-table"
            locale={{ emptyText: 'No orders yet' }}
          />
        </Surface>

        <div className="adm-stack">
          <Surface title="Upcoming pickups">
            <QueueList
              items={stats?.upcomingPickups}
              emptyText="No upcoming pickups"
              dateField="rentalStart"
            />
          </Surface>

          <Surface title="Upcoming returns">
            <QueueList
              items={stats?.upcomingReturns}
              emptyText="No upcoming returns"
              dateField="rentalEnd"
              flagOverdue
            />
          </Surface>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
