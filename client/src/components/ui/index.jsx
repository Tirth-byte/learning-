/**
 * ----------------------------------------------------------------------------------
 * SHARED UI PRIMITIVES
 *
 * WHAT THIS FILE DOES:
 * Small presentational building blocks used across the storefront and admin portal:
 * page headers, stat tiles, status pills, empty states, and section surfaces. They
 * carry no data-fetching logic — they render what a page hands them.
 *
 * HOW IT FITS INTO THE APP:
 * Every redesigned page imports from here instead of repeating inline styles, so a
 * spacing or color change lands everywhere at once.
 *
 * WHERE TO CHANGE THINGS:
 *   - Visual rules live in theme/ui.css under matching class names.
 *   - Order status colors are mapped in ORDER_STATUS_TONE below.
 * ----------------------------------------------------------------------------------
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd';

/**
 * Page title block with optional breadcrumbs, subtitle, and right-side actions.
 *
 * Input:  title, subtitle, crumbs [{label, to}], actions (node), eyebrow
 * Output: A consistent page masthead.
 */
export const PageHeader = ({ title, subtitle, crumbs, actions, eyebrow }) => (
  <>
    {crumbs && crumbs.length > 0 && (
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => (
          <React.Fragment key={crumb.label}>
            {index > 0 && <span className="crumbs-sep">/</span>}
            {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
          </React.Fragment>
        ))}
      </nav>
    )}

    <div className="page-head">
      <div className="page-head-text">
        {eyebrow && <div className="u-eyebrow">{eyebrow}</div>}
        <h1 className="u-h1">{title}</h1>
        {subtitle && <p className="u-body" style={{ maxWidth: '64ch' }}>{subtitle}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </div>
  </>
);

/**
 * Single metric tile. `tone` picks the accent rail color; `icon` is optional.
 */
export const StatTile = ({ label, value, icon, foot, tone = '' }) => (
  <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
    <div className="stat-top">
      <span className="stat-label">{label}</span>
      {icon && <span className="stat-icon">{icon}</span>}
    </div>
    <div className="stat-value">{value}</div>
    {foot && <div className="stat-foot">{foot}</div>}
  </div>
);

export const StatGrid = ({ children }) => <div className="stat-grid">{children}</div>;

/**
 * White panel. Pass `title` to get a bordered header row with optional `extra`.
 */
export const Surface = ({ title, extra, children, pad = true, className = '', style }) => (
  <section className={`surface ${className}`} style={style}>
    {title && (
      <header className="surface-head">
        <h2 className="u-h3">{title}</h2>
        {extra}
      </header>
    )}
    <div style={pad ? { padding: 'var(--s-6)' } : undefined}>{children}</div>
  </section>
);

/**
 * Maps a backend order/invoice status to a pill tone. Unknown values fall back to
 * neutral rather than throwing, so a new backend status never breaks the UI.
 */
export const ORDER_STATUS_TONE = {
  QUOTATION: 'neutral',
  QUOTATION_SENT: 'info',
  SALE_ORDER: 'info',
  CONFIRMED: 'info',
  PICKED_UP: 'warning',
  RETURNED: 'success',
  DONE: 'success',
  PAID: 'success',
  POSTED: 'success',
  DRAFT: 'neutral',
  CANCELLED: 'danger',
  OVERDUE: 'danger',
  LATE: 'danger',
};

/**
 * Status pill. Renders the raw status prettified (SALE_ORDER -> Sale Order).
 */
export const StatusPill = ({ status, tone, children }) => {
  const resolvedTone = tone || ORDER_STATUS_TONE[status] || 'neutral';
  const label = children || String(status || '').replace(/_/g, ' ').toLowerCase();

  return (
    <span className={`pill pill-${resolvedTone}`} style={{ textTransform: 'capitalize' }}>
      {label}
    </span>
  );
};

/**
 * Full-width empty state with an optional primary action.
 */
export const EmptyState = ({ icon, title, text, actionLabel, onAction, to }) => (
  <div className="empty">
    {icon && <div className="empty-icon">{icon}</div>}
    <div className="empty-title">{title}</div>
    {text && <p className="empty-text">{text}</p>}
    {actionLabel && (
      to ? (
        <Link to={to}><Button type="primary">{actionLabel}</Button></Link>
      ) : (
        <Button type="primary" onClick={onAction}>{actionLabel}</Button>
      )
    )}
  </div>
);

/**
 * Currency formatter shared by every page so totals never disagree on formatting.
 *
 * Input:  a number (or anything numeric-ish)
 * Output: '₹1,200.00'. Non-numeric input yields '₹0.00' rather than 'NaN'.
 */
export const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return `₹${safeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
