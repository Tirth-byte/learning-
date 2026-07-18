/**
 * ----------------------------------------------------------------------------------
 * STOREFRONT CUSTOMER HOME PAGE
 * 
 * WHAT THIS FILE DOES:
 * This file renders the public storefront catalog layout. It fetches the categories
 * and published products from the database, lets customers filter by category tabs,
 * and lists cards displaying images, stock statuses, descriptions, and rental rates.
 * 
 * HOW IT FITS INTO THE APP:
 * This is the entry page of the client application (loaded at route '/').
 * 
 * REFINE PASS ADDITIONS:
 *   - Framer Motion staggered card fades and vertical entry.
 *   - Clean skeleton loaders replacing the default spinner.
 *   - Fine-grained typography scale matching high-end storefront layouts.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Typography, Card, Col, Row, Spin, Button, Result, Badge, Radio, Tag } from 'antd';
import { ShoppingOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axios';

const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Change these values to adjust branding titles, tags, or default text.
// ----------------------------------------------------------------------------------

// CHANGE THIS TO MODIFY THE MAIN TITLE DISPLAYED IN THE HERO HEADER BANNER
const HERO_TITLE_TEXT = "Premium Electronics & Equipment Rentals";

// CHANGE THIS TO MODIFY THE MINI DESCRIPTION UNDER THE HERO HEADER
const HERO_DESCRIPTION_TEXT = "Rent top-tier corporate assets, camera gears, and construction tools with transparent security deposits, flexible dates, and automated late return rules.";

// CHANGE THIS TO MODIFY THE HERO FLOATING RIBBON OR BADGE STRING
const HERO_BADGE_LABEL = "⚡ Enterprise Rental Services";

// CHANGE THIS TO CHANGE THE DEFAULT DISPLAY CURRENCY SYMBOL
const DISPLAY_CURRENCY_SYMBOL = "₹";

// CHANGE THIS TO SET THE TRANSITION SPEED (SECONDS) FOR PAGE ENTRY
const ENTRANCE_TRANSITION_SPEED = 0.2;


/**
 * Structured product card catalog skeletons displaying as empty boxes while loading.
 */
const CatalogSkeleton = () => {
  return (
    <div style={{ padding: '0 8px 24px 8px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ height: 150, backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 32 }} />
      <div style={{ width: 130, height: 16, backgroundColor: '#E5E7EB', marginBottom: 16, borderRadius: 2 }} />
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} style={{ width: 100, height: 28, backgroundColor: '#E5E7EB', borderRadius: 4 }} />
        ))}
      </div>

      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
          <Col xs={24} sm={12} md={8} lg={6} key={idx}>
            <Card bordered={false} className="enterprise-card" style={{ height: 320, padding: 12 }}>
              <div style={{ height: 140, backgroundColor: '#F3F4F6', borderRadius: 6, marginBottom: 12 }} />
              <div style={{ width: '80%', height: 14, backgroundColor: '#E5E7EB', marginBottom: 8, borderRadius: 2 }} />
              <div style={{ width: '40%', height: 10, backgroundColor: '#F3F4F6', marginBottom: 16, borderRadius: 2 }} />
              <div style={{ width: '60%', height: 18, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};


const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * Load categories and products on page load.
   */
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  /**
   * Fetch all published products from backend API.
   * 
   * Input: None
   * Output: Updates products state or sets error.
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setError('Could not load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch category list from backend API.
   * 
   * Input: None
   * Output: Updates categories state.
   */
  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Filter items in memory if category tab selection changes (defaults to 'ALL')
  const filteredProducts = selectedCategory === 'ALL'
    ? products
    : products.filter(p => p.category?.name === selectedCategory);

  if (loading) {
    return <CatalogSkeleton />;
  }

  if (error) {
    return <Result status="error" title="Error" subTitle={error} />;
  }

  // Animation variants
  const pageContainerVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: ENTRANCE_TRANSITION_SPEED, ease: 'easeOut' },
  };

  const gridVariants = {
    animate: { transition: { staggerChildren: 0.03 } }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, ease: 'easeOut' }
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={pageContainerVariants}
      className="fadeIn-animation" 
      style={{ padding: '0 8px 24px 8px', maxWidth: '1200px', margin: '0 auto' }}
    >
      
      {/* SaaS Premium Hero Banner */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #3651A5 0%, #1E293B 100%)', 
          borderRadius: 8, 
          padding: '48px 40px', 
          color: '#ffffff', 
          marginBottom: 32,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: 600, position: 'relative', zIndex: 2 }}>
          <Tag color="rgba(255, 255, 255, 0.15)" style={{ color: '#ffffff', border: 'none', marginBottom: 12, borderRadius: 4 }}>
            {HERO_BADGE_LABEL}
          </Tag>
          <Title level={2} style={{ color: '#ffffff', fontWeight: 700, margin: '0 0 12px 0', fontSize: 30 }}>
            {HERO_TITLE_TEXT}
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {HERO_DESCRIPTION_TEXT}
          </Paragraph>
          <Button type="primary" size="large" onClick={() => {
            const catalogSectionElement = document.getElementById('catalog-section');
            catalogSectionElement?.scrollIntoView({ behavior: 'smooth' });
          }} style={{ backgroundColor: '#ffffff', color: '#3651A5', border: 'none', fontWeight: 600, borderRadius: 6 }}>
            Browse Catalogue <RightOutlined style={{ fontSize: 10 }} />
          </Button>
        </div>
        
        {/* Abstract background graphics */}
        <div style={{ 
          position: 'absolute', 
          top: '-20%', 
          right: '-10%', 
          width: 320, 
          height: 320, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)',
          zIndex: 1
        }} />
      </div>

      <div id="catalog-section" style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: '#1F2937', margin: '0 0 16px 0' }}>Explore Catalog</Title>
        
        {/* Category filtering tab bar */}
        <Radio.Group 
          value={selectedCategory} 
          onChange={e => setSelectedCategory(e.target.value)} 
          buttonStyle="solid"
          style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}
        >
          <Radio.Button value="ALL" style={{ borderRadius: 6 }}>All Equipment</Radio.Button>
          {categories.map(categoryItem => (
            <Radio.Button key={categoryItem.id} value={categoryItem.name} style={{ borderRadius: 6 }}>
              {categoryItem.name}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {/* Staggered card grid */}
      <motion.div variants={gridVariants}>
        <Row gutter={[16, 16]}>
          {filteredProducts.map(product => {
            const isProductAvailable = product.qtyOnHand > 0;
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <motion.div variants={cardVariants} style={{ height: '100%' }}>
                  <Badge.Ribbon text={product.category?.name || 'Rental'} color="#3651A5">
                    <Card
                      hoverable
                      className="enterprise-card"
                      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                      cover={
                        <div style={{ height: '180px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid #E5E7EB' }} onClick={() => navigate(`/products/${product.id}`)}>
                          {product.images && product.images.length > 0 ? (
                            <img alt={product.name} src={product.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <ShoppingOutlined style={{ fontSize: '36px', color: '#9CA3AF' }} />
                          )}
                        </div>
                      }
                      actions={[
                        <Button 
                          type="primary" 
                          style={{ backgroundColor: '#3651A5', width: '85%', borderRadius: 6, fontWeight: 500 }} 
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          Rent Now
                        </Button>
                      ]}
                    >
                      <Meta
                        title={
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Text strong style={{ fontSize: '13px', color: '#1F2937' }}>{product.name}</Text>
                            <Tag color={isProductAvailable ? 'green' : 'orange'} className="status-tag" style={{ alignSelf: 'flex-start' }}>
                              {isProductAvailable ? 'In Stock' : 'Out of Stock'}
                            </Tag>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: '8px' }}>
                            <Text type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: '11px', minHeight: 32 }}>
                              {product.description || 'Enterprise-grade equipment.'}
                            </Text>
                            <div style={{ marginTop: '12px' }}>
                              <Text strong style={{ fontSize: '15px', color: '#3651A5' }} className="tabular-numbers">
                                {DISPLAY_CURRENCY_SYMBOL}{product.salesPrice.toFixed(2)}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '11px' }}> / {product.periodicity?.toLowerCase()}</Text>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Badge.Ribbon>
                </motion.div>
              </Col>
            );
          })}
        </Row>
      </motion.div>
      
      {filteredProducts.length === 0 && (
        <Result
          status="info"
          title="No Items Available"
          subTitle="No published products matched the selected filters."
        />
      )}
    </motion.div>
  );
};

export default Home;
