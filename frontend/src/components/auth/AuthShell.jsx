/**
 * ----------------------------------------------------------------------------------
 * AUTH PAGE SHELL
 *
 * WHAT THIS FILE DOES:
 * Provides the split-screen frame shared by Login, Register, and Forgot Password: a
 * gradient brand panel on the left and the form column on the right.
 *
 * HOW IT FITS INTO THE APP:
 * Wraps the three pages under pages/. Previously each page inlined its own copy of
 * this markup with a `display: 'none'` style and breakpoint keys React does not
 * understand, so the brand panel never rendered. Media queries in AuthShell.css now
 * handle the responsive behaviour correctly.
 *
 * WHERE TO CHANGE THINGS:
 *   - Brand panel copy is passed in per page, with defaults below.
 *   - Visual rules live in AuthShell.css.
 * ----------------------------------------------------------------------------------
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShopOutlined, CheckCircleFilled } from '@ant-design/icons';
import './AuthShell.css';

// CHANGE THIS TO RENAME THE BRAND ON AUTH SCREENS
const BRAND_NAME = 'Odoo Rent';

// Default selling points listed on the brand panel
const DEFAULT_HIGHLIGHTS = [
  'Quotations through to posted invoices',
  'Deposits held separately and refunded on return',
  'Late fees calculated and settled automatically',
];

const AuthShell = ({
  title,
  subtitle,
  children,
  panelTitle = 'The modern way to run rental operations.',
  panelText = 'Track inventory, draft quotations, post invoices, and settle late returns from one operational dashboard.',
  highlights = DEFAULT_HIGHLIGHTS,
  footer,
}) => (
  <div className="auth-shell">
    {/* Brand panel — hidden below 900px by CSS, not by an inline style */}
    <aside className="auth-panel">
      <div className="auth-panel-bg" />

      <div className="auth-panel-content">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark"><ShopOutlined /></span>
          {BRAND_NAME}
        </Link>

        <div>
          <div style={{ marginBottom: '24px', display: 'flex' }}>
            <img 
              src="/mascot.png" 
              alt="Rental Helper Mascot" 
              style={{ 
                width: '100px', 
                height: '100px', 
                filter: 'drop-shadow(0 12px 24px rgba(11, 21, 51, 0.4))'
              }} 
            />
          </div>
          <h2 className="auth-panel-title">{panelTitle}</h2>
          <p className="auth-panel-text">{panelText}</p>

          <ul className="auth-highlights">
            {highlights.map((highlight) => (
              <li key={highlight}>
                <CheckCircleFilled />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-panel-foot">Built on the Odoo rental lifecycle.</p>
      </div>
    </aside>

    <main className="auth-main">
      <div className="auth-form-wrap">
        {/* Compact logo shown only when the brand panel is hidden */}
        <Link to="/" className="auth-brand auth-brand-compact">
          <span className="auth-brand-mark"><ShopOutlined /></span>
          {BRAND_NAME}
        </Link>

        <header className="auth-head">
          <h1 className="u-h1">{title}</h1>
          {subtitle && <p className="u-body">{subtitle}</p>}
        </header>

        {children}

        {footer && <div className="auth-foot">{footer}</div>}
      </div>
    </main>
  </div>
);

export default AuthShell;
