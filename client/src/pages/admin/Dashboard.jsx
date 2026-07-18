/**
 * ----------------------------------------------------------------------------------
 * ADMIN OPERATIONS DASHBOARD PAGE
 * 
 * WHAT THIS FILE DOES:
 * This page displays operational statistics (Total Sales, Security Deposits, Late Fees,
 * Pickups, and Overdue Returns) and feeds tables/lists with recent orders, upcoming
 * pickups, and returns.
 * 
 * HOW IT FITS INTO THE APP:
 * This is the landing screen of the admin dashboard workspace (route '/admin/dashboard').
 * 
 * REFINE PASS ADDITIONS:
 *   - Framer Motion page slide & fade transitions (150-250ms).
 *   - Custom AnimatedNumber count-up hook for KPI metrics.
 *   - Clean UI skeleton loaders during queries (no plain spinners).
 *   - Standardized tabular numbers and line spacing to achieve Stripe/Linear aesthetics.
 * ----------------------------------------------------------------------------------
 */

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Radio, List, Tag } from 'antd';
import { DollarOutlined, ClockCircleOutlined, SwapOutlined, AlertOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axios';

const { Title, Text } = Typography;

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Change these constants to adjust layouts, animation timings, or colors.
// ----------------------------------------------------------------------------------

// CHANGE THESE TO DEFINE THE STACKED STATUS BADGE COLORS
const STATUS_TAG_COLOR_MAP = {
  QUOTATION: 'default',
  QUOTATION_SENT: 'cyan',
  CONFIRMED: 'blue',
  PICKED_UP: 'orange',
  RETURNED: 'success',
  CANCELLED: 'error',
};

// CHANGE THIS TO ADJUST THE TRANSITION SPEED (SECONDS) FOR ENTRANCE SLIDES
const ENTRANCE_TRANSITION_SPEED = 0.2;

// CHANGE THIS TO CHANGE THE DEFAULT DISPLAY CURRENCY PREFIX
const CURRENCY_DISPLAY_PREFIX = "₹";


/**
 * Dynamic count-up text element that ticks from 0 to the target value.
 * 
 * Input:
 *   - value: Target numerical display value
 *   - precision: Decimals to render (default: 0)
 *   - prefix: String currency prefix
 */
const AnimatedNumber = ({ value, precision = 0, prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startVal = 0;
    const endVal = parseFloat(value);
    if (isNaN(endVal)) return;
    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }
    
    // Animate ticks over 250 milliseconds
    const duration = 250;
    const timeInterval = 16; // ~60fps tick interval
    const totalSteps = duration / timeInterval;
    const increment = (endVal - startVal) / totalSteps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      startVal += increment;
      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setDisplayValue(endVal);
      } else {
        setDisplayValue(startVal);
      }
    }, timeInterval);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-numbers">
      {prefix}
      {displayValue.toFixed(precision)}
    </span>
  );
};


/**
 * Information-dense skeleton block loader matching Odoo/Stripe layout metrics.
 */
const DashboardSkeleton = () => {
  return (
    <div style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ width: 160, height: 20, backgroundColor: '#E5E7EB', borderRadius: 4 }} />
        <div style={{ width: 180, height: 28, backgroundColor: '#E5E7EB', borderRadius: 4 }} />
      </div>
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4, 5].map((idx) => (
          <Col xs={24} sm={12} md={8} lg={4} key={idx}>
            <Card bordered={false} className="enterprise-card" style={{ height: 84, padding: '12px 16px' }}>
              <div style={{ width: '70%', height: 12, backgroundColor: '#F3F4F6', marginBottom: 8, borderRadius: 2 }} />
              <div style={{ width: '45%', height: 20, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card bordered={false} className="enterprise-card" style={{ height: 280, padding: 16 }}>
            <div style={{ width: '25%', height: 14, backgroundColor: '#E5E7EB', marginBottom: 16, borderRadius: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4].map(row => (
                <div key={row} style={{ width: '100%', height: 36, backgroundColor: '#F9FAFB', borderRadius: 4 }} />
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card bordered={false} className="enterprise-card" style={{ height: 132, padding: 16 }}>
              <div style={{ width: '40%', height: 12, backgroundColor: '#E5E7EB', marginBottom: 12, borderRadius: 2 }} />
              <div style={{ width: '90%', height: 20, backgroundColor: '#F3F4F6', borderRadius: 2 }} />
            </Card>
            <Card bordered={false} className="enterprise-card" style={{ height: 132, padding: 16 }}>
              <div style={{ width: '40%', height: 12, backgroundColor: '#E5E7EB', marginBottom: 12, borderRadius: 2 }} />
              <div style={{ width: '90%', height: 20, backgroundColor: '#F3F4F6', borderRadius: 2 }} />
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};


const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  /**
   * Load dashboard metrics when selected date range filters change.
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsResponse = await api.get(`/dashboard/stats?dateRange=${dateRange}`);
        setStats(statsResponse.data.data);
        
        const ordersResponse = await api.get('/orders');
        const orders = ordersResponse.data.data || [];
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [dateRange]);

  const columns = [
    { 
      title: 'Order Ref', 
      dataIndex: 'reference', 
      key: 'reference', 
      render: (text, record) => <Link to={`/admin/orders/${record.id}`} style={{ fontWeight: 500 }}>{text}</Link> 
    },
    { 
      title: 'Customer', 
      dataIndex: ['customer', 'name'], 
      key: 'customer' 
    },
    { 
      title: 'Total', 
      dataIndex: 'total', 
      key: 'total', 
      render: val => <span className="tabular-numbers">{CURRENCY_DISPLAY_PREFIX}{val?.toFixed(2) || '0.00'}</span> 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: status => (
        <Tag color={STATUS_TAG_COLOR_MAP[status]} className="status-tag">
          {status?.replace('_', ' ')}
        </Tag>
      )
    },
  ];

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  // Define transition animation configurations
  const pageContainerAnimation = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: ENTRANCE_TRANSITION_SPEED, ease: 'easeOut' },
  };

  const staggerCardContainer = {
    animate: { transition: { staggerChildren: 0.04 } }
  };

  const statCardAnimation = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.15, ease: 'easeOut' }
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={pageContainerAnimation}
      style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1F2937' }}>Operations Dashboard</Title>
        <Radio.Group value={dateRange} onChange={e => setDateRange(e.target.value)} size="small">
          <Radio.Button value="today">Today</Radio.Button>
          <Radio.Button value="7-days">Last 7 Days</Radio.Button>
          <Radio.Button value="month">Last 30 Days</Radio.Button>
        </Radio.Group>
      </div>
      
      {/* Dynamic count-up metric grid */}
      <motion.div variants={staggerCardContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <motion.div variants={statCardAnimation}>
              <Card bordered={false} className="enterprise-card" style={{ padding: '4px 0' }}>
                <Statistic 
                  title="Total Sales" 
                  value={stats?.totalSales || 0} 
                  formatter={val => <AnimatedNumber value={val} precision={2} prefix={CURRENCY_DISPLAY_PREFIX} />}
                  prefix={<DollarOutlined style={{ color: '#3651A5' }} />} 
                  valueStyle={{ color: '#1F2937', fontSize: 18 }} 
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={5}>
            <motion.div variants={statCardAnimation}>
              <Card bordered={false} className="enterprise-card" style={{ padding: '4px 0' }}>
                <Statistic 
                  title="Security Deposits Held" 
                  value={stats?.depositsHeld || 0} 
                  formatter={val => <AnimatedNumber value={val} precision={2} prefix={CURRENCY_DISPLAY_PREFIX} />}
                  prefix={<SafetyOutlined style={{ color: '#16A34A' }} />} 
                  valueStyle={{ color: '#1F2937', fontSize: 18 }} 
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={5}>
            <motion.div variants={statCardAnimation}>
              <Card bordered={false} className="enterprise-card" style={{ padding: '4px 0' }}>
                <Statistic 
                  title="Late Fees Collected" 
                  value={stats?.lateFeesCollected || 0} 
                  formatter={val => <AnimatedNumber value={val} precision={2} prefix={CURRENCY_DISPLAY_PREFIX} />}
                  prefix={<ClockCircleOutlined style={{ color: '#D97706' }} />} 
                  valueStyle={{ color: '#1F2937', fontSize: 18 }} 
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={12} lg={5}>
            <motion.div variants={statCardAnimation}>
              <Card bordered={false} className="enterprise-card" style={{ padding: '4px 0' }}>
                <Statistic 
                  title="Pickups Due Today" 
                  value={stats?.dueTodayCount || 0} 
                  formatter={val => <AnimatedNumber value={val} precision={0} />}
                  prefix={<SwapOutlined style={{ color: '#2563EB' }} />} 
                  valueStyle={{ color: '#1F2937', fontSize: 18 }} 
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={12} lg={5}>
            <motion.div variants={statCardAnimation}>
              <Card bordered={false} className="enterprise-card" style={{ padding: '4px 0' }}>
                <Statistic 
                  title="Overdue Returns" 
                  value={stats?.overdueCount || 0} 
                  formatter={val => <AnimatedNumber value={val} precision={0} />}
                  prefix={<AlertOutlined style={{ color: '#DC2626' }} />} 
                  valueStyle={{ color: '#1F2937', fontSize: 18 }} 
                />
              </Card>
            </motion.div>
          </Col>
        </Row>
      </motion.div>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Recent orders table */}
        <Col xs={24} lg={16}>
          <Card title="Recent Orders" bordered={false} className="enterprise-card" headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}>
            <Table
              dataSource={recentOrders}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              className="dense-table"
            />
          </Card>
        </Col>

        {/* Action item lists */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Upcoming Pickups" bordered={false} className="enterprise-card" size="small" headStyle={{ borderBottom: '1px solid #E5E7EB' }}>
              <List
                dataSource={stats?.upcomingPickups || []}
                size="small"
                renderItem={order => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div>
                        <Link to={`/admin/orders/${order.id}`} style={{ fontWeight: 500 }}>{order.reference}</Link>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{order.customer?.name}</Text>
                      </div>
                      <Text style={{ fontSize: 11 }} className="tabular-numbers">{new Date(order.rentalStart).toLocaleDateString()}</Text>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: 'No upcoming pickups' }}
              />
            </Card>
            <Card title="Upcoming Returns" bordered={false} className="enterprise-card" size="small" headStyle={{ borderBottom: '1px solid #E5E7EB' }}>
              <List
                dataSource={stats?.upcomingReturns || []}
                size="small"
                renderItem={order => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div>
                        <Link to={`/admin/orders/${order.id}`} style={{ fontWeight: 500 }}>{order.reference}</Link>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{order.customer?.name}</Text>
                      </div>
                      <Text style={{ fontSize: 11 }} className="tabular-numbers" type={new Date(order.rentalEnd) < new Date() ? 'danger' : 'warning'}>
                        {new Date(order.rentalEnd).toLocaleDateString()}
                      </Text>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: 'No upcoming returns' }}
              />
            </Card>
          </div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Dashboard;
