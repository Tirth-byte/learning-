import React, { useEffect, useState } from 'react';
import { Typography, Card, Spin, message, Row, Col, Statistic } from 'antd';
import { ClockCircleOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import api from '../../api/axios';

const { Title } = Typography;

const COLORS = ['#3651A5', '#16A34A', '#D97706', '#2563EB', '#DC2626', '#8B5CF6'];

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/reports');
        setReportData(response.data.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
        message.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading && !reportData) {
    return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  const revenueOverTime = reportData?.revenueOverTime || [];
  const revenueByCategory = reportData?.revenueByCategory || [];
  const mostRentedProducts = reportData?.mostRentedProducts || [];
  const lateReturnRate = reportData?.lateReturnRate || 0;

  return (
    <div className="fadeIn-animation" style={{ padding: '0 8px 24px 8px', backgroundColor: '#F5F6F8', minHeight: 'calc(100vh - 64px)' }}>
      <Title level={4} style={{ marginBottom: 24, color: '#1F2937' }}>Reports & Analytics</Title>

      <Row gutter={[16, 16]}>
        {/* KPI: Late Return Rate */}
        <Col xs={24} md={6}>
          <Card bordered={false} className="enterprise-card" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <Statistic
              title="Late Return Rate"
              value={lateReturnRate}
              precision={1}
              suffix="%"
              prefix={<ClockCircleOutlined style={{ color: '#DC2626' }} />}
              valueStyle={{ color: '#1F2937', className: 'tabular-numbers' }}
            />
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>
              Percentage of returned rentals that exceeded their return schedule.
            </div>
          </Card>
        </Col>

        {/* Chart: Revenue By Category */}
        <Col xs={24} md={18}>
          <Card 
            title={<><PieChartOutlined /> Revenue By Category</>} 
            bordered={false} 
            className="enterprise-card"
            headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}
          >
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {revenueByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={10} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span style={{ color: '#6B7280' }}>No category breakdown available</span>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Chart: Revenue Over Time */}
        <Col xs={24} lg={12}>
          <Card 
            title={<><LineChartOutlined /> Revenue History (Last 30 Days)</>} 
            bordered={false} 
            className="enterprise-card"
            headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}
          >
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: 10 }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Line name="Total Revenue" type="monotone" dataKey="revenue" stroke="#3651A5" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line name="Late Fee Portion" type="monotone" dataKey="lateFees" stroke="#D97706" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Chart: Most Rented Products & Utilization */}
        <Col xs={24} lg={12}>
          <Card 
            title={<><BarChartOutlined /> Top Product Utilization</>} 
            bordered={false} 
            className="enterprise-card"
            headStyle={{ borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}
          >
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostRentedProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: 10 }} tickFormatter={(name) => name.split(' ')[0]} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(value, name) => [name === 'utilization' ? `${value}%` : value, name === 'utilization' ? 'Asset Utilization' : 'Rent Count']} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar name="Asset Utilization" dataKey="utilization" fill="#3651A5" radius={[4, 4, 0, 0]} />
                  <Bar name="Rent Count" dataKey="count" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
