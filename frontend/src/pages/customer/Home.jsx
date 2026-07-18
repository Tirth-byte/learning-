/**
 * ----------------------------------------------------------------------------------
 * STOREFRONT CATALOG PAGE
 *
 * WHAT THIS FILE DOES:
 * Lists published rental products. Supports filtering by category chip, sorting, and
 * a text search driven by the '?q=' parameter that the header search box writes.
 *
 * HOW IT FITS INTO THE APP:
 * Routed at '/products' inside CustomerLayout. The marketing page at '/' links here.
 *
 * WHERE TO CHANGE THINGS:
 *   - Page heading copy is in the constants below.
 *   - Card and grid styling live in storefront.css.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Select, Result } from 'antd';
import { ShoppingOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, EmptyState, formatCurrency } from '../../components/ui';
import './storefront.css';

// CHANGE THIS TO MODIFY THE CATALOG PAGE TITLE
const PAGE_TITLE = 'Equipment catalog';

// CHANGE THIS TO MODIFY THE SUBTITLE UNDER THE CATALOG TITLE
const PAGE_SUBTITLE =
  'Rent electronics, camera gear, furniture, and tools by the hour, day, week, or month. Deposits are shown up front and refunded on an on-time return.';

// Number of placeholder cards rendered while the catalog loads
const SKELETON_COUNT = 8;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
];

/** Placeholder grid shown while products are being fetched. */
const CatalogSkeleton = () => (
  <div className="sf-grid">
    {Array.from({ length: SKELETON_COUNT }, (_, index) => (
      <div className="sf-skeleton" key={index}>
        <div className="sf-skeleton-media" />
        <div className="sf-skeleton-body">
          <div className="sf-skeleton-line" style={{ width: '75%' }} />
          <div className="sf-skeleton-line" style={{ width: '45%' }} />
          <div className="sf-skeleton-line" style={{ width: '60%', height: 16 }} />
        </div>
      </div>
    ))}
  </div>
);

/** A single product tile. */
const ProductCard = ({ product, onOpen }) => {
  const inStock = product.qtyOnHand > 0;

  return (
    <article className="sf-card" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(event) => { if (event.key === 'Enter') onOpen(); }}>
      <div className="sf-card-media">
        {product.images?.length > 0 ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <ShoppingOutlined className="sf-card-placeholder" />
        )}

        {product.category?.name && <span className="sf-card-cat">{product.category.name}</span>}
        <span className="sf-card-stock">
          <span className={`pill ${inStock ? 'pill-success' : 'pill-warning'}`}>
            {inStock ? 'In stock' : 'Out of stock'}
          </span>
        </span>
      </div>

      <div className="sf-card-body">
        <h3 className="sf-card-name">{product.name}</h3>
        <p className="sf-card-desc">
          {product.description || 'Enterprise-grade equipment, serviced before every rental.'}
        </p>

        <div className="sf-card-foot">
          <span>
            <span className="sf-price">{formatCurrency(product.salesPrice)}</span>
            <span className="sf-price-unit"> / {product.periodicity?.toLowerCase() || 'day'}</span>
          </span>
          {product.securityDeposit > 0 && (
            <span className="sf-card-deposit">{formatCurrency(product.securityDeposit)} deposit</span>
          )}
        </div>
      </div>
    </article>
  );
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // The header search box writes '?q=', so the catalog reads it from the URL
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  /** Load published products. */
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

  /** Load the category list used by the filter chips. */
  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  /**
   * Apply the category filter, then the text query, then the sort.
   * Memoised so typing in the header does not re-sort on every unrelated render.
   */
  const visibleProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'ALL') {
      result = result.filter((product) => product.category?.name === selectedCategory);
    }

    if (searchQuery) {
      const needle = searchQuery.toLowerCase();
      result = result.filter((product) =>
        product.name?.toLowerCase().includes(needle) ||
        product.description?.toLowerCase().includes(needle) ||
        product.category?.name?.toLowerCase().includes(needle));
    }

    const sorted = [...result];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.salesPrice - b.salesPrice);
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.salesPrice - a.salesPrice);
    else if (sortBy === 'name') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return sorted;
  }, [products, selectedCategory, searchQuery, sortBy]);

  if (error) {
    return <Result status="error" title="Could not load the catalog" subTitle={error} />;
  }

  return (
    <div className="page">
      <PageHeader
        title={PAGE_TITLE}
        subtitle={PAGE_SUBTITLE}
        actions={
          !loading && (
            <span className="u-muted">
              {visibleProducts.length} {visibleProducts.length === 1 ? 'item' : 'items'}
            </span>
          )
        }
      />

      {loading ? (
        <CatalogSkeleton />
      ) : (
        <>
          <div className="sf-filters">
            <div className="sf-chips">
              <button
                type="button"
                className={`sf-chip${selectedCategory === 'ALL' ? ' is-active' : ''}`}
                onClick={() => setSelectedCategory('ALL')}
              >
                All equipment
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`sf-chip${selectedCategory === category.name ? ' is-active' : ''}`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <Select
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              style={{ width: 190 }}
              aria-label="Sort products"
            />
          </div>

          {searchQuery && (
            <p className="u-muted" style={{ marginBottom: 'var(--s-4)' }}>
              Showing results for <strong style={{ color: 'var(--ink)' }}>“{searchQuery}”</strong>
              {' · '}
              <button
                type="button"
                onClick={() => setSearchParams({})}
                style={{ background: 'none', border: 0, color: 'var(--brand-500)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                clear search
              </button>
            </p>
          )}

          {visibleProducts.length === 0 ? (
            <EmptyState
              icon={<InboxOutlined />}
              title="No matching equipment"
              text={
                searchQuery
                  ? `Nothing in the catalog matches “${searchQuery}”. Try a different term or clear the filters.`
                  : 'No published products in this category yet. Check back soon.'
              }
              actionLabel="Show everything"
              onAction={() => {
                setSelectedCategory('ALL');
                setSearchParams({});
              }}
            />
          ) : (
            <div className="sf-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpen={() => navigate(`/products/${product.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
