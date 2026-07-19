/**
 * ----------------------------------------------------------------------------------
 * PUBLIC MARKETING LANDING PAGE
 *
 * WHAT THIS FILE DOES:
 * Renders the public homepage at '/'. It explains the rental lifecycle, highlights the
 * automated late-fee settlement, and routes visitors into either the storefront
 * catalog ('/products') or the sign-up flow.
 *
 * HOW IT FITS INTO THE APP:
 * This is a top-level route in App.jsx and deliberately sits OUTSIDE CustomerLayout,
 * because that layout constrains its children to a 1200px column, which would break
 * the full-bleed hero and gradient sections used here.
 *
 * WHERE TO CHANGE THINGS:
 *   - All page copy lives in the CONTENT constants below.
 *   - Colors, spacing, and gradients live in Landing.css.
 * ----------------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Edit these to change wording without touching any markup below.
// ----------------------------------------------------------------------------------

// CHANGE THIS TO RENAME THE PRODUCT ACROSS THE WHOLE LANDING PAGE
const BRAND_NAME = 'Odoo Rent Shop';

// CHANGE THIS TO MODIFY THE MAIN HERO HEADLINE (the gradient word is separate below)
const HERO_HEADLINE_LEAD = 'Rental operations,';
const HERO_HEADLINE_ACCENT = 'fully settled.';

// CHANGE THIS TO MODIFY THE PARAGRAPH UNDER THE HERO HEADLINE
const HERO_SUBCOPY =
  'Quotations, orders, invoices, deposits, pickups and returns in one system. When a return runs late, the fee is calculated, added to the order, and settled against the deposit — without anyone touching a spreadsheet.';

// CHANGE THIS TO SET THE DISPLAY CURRENCY SYMBOL USED IN THE HERO PANEL
const DISPLAY_CURRENCY_SYMBOL = '₹';

// CHANGE THIS TO ADJUST HOW FAR THE USER SCROLLS BEFORE THE NAV TURNS SOLID (pixels)
const NAV_SOLIDIFY_SCROLL_OFFSET = 40;

// ----------------------------------------------------------------------------------
// INLINE ICONS
// Kept local so the landing page has no icon-library dependency and stays self-contained.
// ----------------------------------------------------------------------------------

const Icon = ({ path, size = 20, fill = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

const ArrowRight = () => <Icon size={16} path={<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>} />;
const Check = () => <Icon size={17} path={<path d="M20 6 9 17l-5-5" />} />;
const Cube = () => (
  <Icon path={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>} />
);
const Clock = () => <Icon path={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />;
const Shield = () => <Icon path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>} />;
const Receipt = () => (
  <Icon path={<><path d="M4 2v20l2.5-1.5L9 22l2.5-1.5L14 22l2.5-1.5L19 22V2l-2.5 1.5L14 2l-2.5 1.5L9 2 6.5 3.5z" /><path d="M8 8h8" /><path d="M8 12h6" /></>} />
);
const Chart = () => <Icon path={<><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" /></>} />;
const Users = () => (
  <Icon path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />
);
const Calendar = () => (
  <Icon path={<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>} />
);

// ----------------------------------------------------------------------------------
// PAGE CONTENT
// ----------------------------------------------------------------------------------

const FEATURE_CARDS = [
  {
    icon: <Clock />,
    title: 'Automated late-fee settlement',
    body: 'Partial hours round up, the fee posts as a new line on the order, and the balance is deducted from the held deposit. No manual math, no disputes.',
  },
  {
    icon: <Shield />,
    title: 'Deposits held, not spent',
    body: 'Security deposits are tracked separately from revenue for their whole life, then refunded in full on an on-time return or net of fees on a late one.',
  },
  {
    icon: <Receipt />,
    title: 'Quotation to posted invoice',
    body: 'Every order walks the same audited path — quotation, sent, confirmed, invoiced, paid — so the books always reconcile against the schedule.',
  },
  {
    icon: <Cube />,
    title: 'Products priced by period',
    body: 'Rate goods, services, and rental items by hour, day, week, or month. Add extra pricelists for seasonal or negotiated rates on top of the default.',
  },
  {
    icon: <Calendar />,
    title: 'Pickup and return schedule',
    body: 'One calendar shows what leaves today, what comes back today, and what is already overdue, so nothing sits unnoticed in a customer’s hands.',
  },
  {
    icon: <Chart />,
    title: 'Operations dashboard',
    body: 'Live totals for sales, deposits currently held, late fees collected, and overdue returns — updated by the same events that drive the orders.',
  },
];

const LIFECYCLE_STEPS = [
  { title: 'Quotation', body: 'Pick the product and rental window. A priced offer is created and sent to the customer.' },
  { title: 'Confirmed order', body: 'The customer accepts and the quotation becomes a committed rental order with reserved stock.' },
  { title: 'Invoice & deposit', body: 'An invoice is drafted then posted. The customer pays the rent plus a refundable deposit.' },
  { title: 'Pickup', body: 'The item is collected and the order moves to Picked Up. The return clock starts.' },
  { title: 'Return & settle', body: 'On time, the deposit is refunded in full. Late, the fee posts to the order and settles against it.' },
];

const ROLE_CARDS = [
  {
    tag: 'Customer',
    title: 'Rent in a few clicks',
    body: 'Browse the catalog, choose a rental window, and check out with the deposit shown up front.',
    points: ['Transparent deposit and late-fee terms', 'Order history and live status', 'Self-serve checkout'],
    cta: 'Browse the catalog',
    to: '/products',
    featured: false,
  },
  {
    tag: 'Vendor',
    title: 'Run your own listings',
    body: 'List products, manage the orders they generate, and track your own revenue and returns.',
    points: ['Own products and pricelists', 'Order and return queue', 'Revenue and late-fee reports'],
    cta: 'Create an account',
    to: '/register',
    featured: true,
  },
  {
    tag: 'Admin',
    title: 'Oversee the platform',
    body: 'Set deposit and late-fee rules, publish products, and see every order across every vendor.',
    points: ['Platform-wide order visibility', 'Deposit and late-fee rules', 'Full reporting suite'],
    cta: 'Open the portal',
    to: '/login',
    featured: false,
  },
];

const CAPABILITY_STATS = [
  { value: '9', label: 'Lifecycle stages tracked end to end' },
  { value: '3', label: 'Roles with scoped permissions' },
  { value: '4', label: 'Rental periods, hour through month' },
  { value: '0', label: 'Late fees calculated by hand' },
];

const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Catalog', to: '/products' },
      { label: 'How it works', to: '/#lifecycle' },
      { label: 'For vendors', to: '/register' },
      { label: 'Pricing rules', to: '/products' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Log in', to: '/login' },
      { label: 'Create account', to: '/register' },
      { label: 'My orders', to: '/my-orders' },
      { label: 'Reset password', to: '/forgot-password' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/' },
      { label: 'Support', to: '/' },
      { label: 'Terms', to: '/' },
      { label: 'Privacy', to: '/' },
    ],
  },
];

// ----------------------------------------------------------------------------------
// SECTION COMPONENTS
// ----------------------------------------------------------------------------------

/**
 * Fixed top navigation. Starts transparent over the gradient hero and turns into a
 * frosted white bar once the user scrolls, matching the hero's contrast in both states.
 */
const LandingNav = ({ user }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > NAV_SOLIDIFY_SCROLL_OFFSET);
    handleScroll(); // Account for a page restored mid-scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Admins and vendors get a portal link; customers get their orders.
  const isStaff = user?.role === 'ADMIN' || user?.role === 'VENDOR';

  return (
    <nav className={`lp-nav${isScrolled ? ' lp-nav-solid' : ''}`}>
      <div className="lp-wrap lp-nav-inner">
        <Link to="/" className="lp-logo">
          <span className="lp-logo-mark"><Cube /></span>
          {BRAND_NAME}
        </Link>

        <div className="lp-nav-links">
          <a className="lp-nav-link" href="#features">Features</a>
          <a className="lp-nav-link" href="#lifecycle">How it works</a>
          <a className="lp-nav-link" href="#late-fees">Late fees</a>
          <Link className="lp-nav-link" to="/products">Catalog</Link>
        </div>

        <div className="lp-nav-actions">
          {user ? (
            <Link className="lp-btn lp-btn-glass lp-btn-sm" to={isStaff ? '/admin/dashboard' : '/my-orders'}>
              {isStaff ? 'Go to portal' : 'My orders'} <ArrowRight />
            </Link>
          ) : (
            <>
              <Link className="lp-nav-ghost" to="/login">Log in</Link>
              <Link className="lp-btn lp-btn-glass lp-btn-sm" to="/register">
                Start renting <ArrowRight />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

/**
 * Hero: headline on the left, a mock settled order summary on the right. The panel
 * intentionally shows a LATE return so the product's signature feature is visible
 * above the fold.
 */
const LandingHero = ({ onBrowse }) => (
  <header className="lp-hero">
    <div className="lp-hero-bg" />
    <div className="lp-hero-bloom lp-hero-bloom-a" />
    <div className="lp-hero-bloom lp-hero-bloom-b" />

    <div className="lp-wrap lp-hero-grid">
      <div className="lp-hero-copy">
        <span className="lp-hero-badge">
          <b>New</b> Automatic late-fee posting on return
        </span>

        <h1 className="lp-h1">
          {HERO_HEADLINE_LEAD}<br />
          <span className="lp-grad-text">{HERO_HEADLINE_ACCENT}</span>
        </h1>

        <p className="lp-hero-lead">{HERO_SUBCOPY}</p>

        <div className="lp-hero-cta">
          <button type="button" className="lp-btn lp-btn-light" onClick={onBrowse}>
            Browse the catalog <ArrowRight />
          </button>
          <Link className="lp-btn lp-btn-glass" to="/register">Create an account</Link>
        </div>

        <p className="lp-hero-note">No setup fee · Deposits refunded in full on time</p>
      </div>

      {/* Mock order summary & mascot character */}
      <div style={{ position: 'relative' }}>
        {/* Mascot helper floating overlapping the panel */}
        <div className="lp-hero-mascot-wrapper">
          <img src="/mascot.png" alt="Odoo Rent Mascot" className="lp-hero-mascot" />
        </div>

        <div className="lp-panel" role="img" aria-label="Example rental order settled after a late return">
          <div className="lp-panel-head">
            <div>
              <div className="lp-panel-title">Order R-2041 · Projector</div>
              <div className="lp-panel-sub">4 hour rental · returned 4h 30m</div>
            </div>
            <span className="lp-chip lp-chip-amber">Returned late</span>
          </div>

          <div className="lp-panel-body">
            <div className="lp-row">
              <span className="lp-row-label">Rental charge</span>
              <span className="lp-row-value">{DISPLAY_CURRENCY_SYMBOL}1,200.00</span>
            </div>
            <div className="lp-row">
              <span className="lp-row-label">
                Security deposit
                <span className="lp-row-hint">Held, not recognised as revenue</span>
              </span>
              <span className="lp-row-value">{DISPLAY_CURRENCY_SYMBOL}2,000.00</span>
            </div>
            <div className="lp-row lp-row-flag">
              <span className="lp-row-label">
                Late fees
                <span className="lp-row-hint">1 hr × {DISPLAY_CURRENCY_SYMBOL}150 · added automatically</span>
              </span>
              <span className="lp-row-value">+{DISPLAY_CURRENCY_SYMBOL}150.00</span>
            </div>
            <div className="lp-row lp-row-total">
              <span className="lp-row-label">Deposit refunded</span>
              <span className="lp-row-value">{DISPLAY_CURRENCY_SYMBOL}1,850.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
);

/**
 * Category strip standing in for the usual logo wall — these are the equipment
 * classes the catalog carries rather than invented customer logos.
 */
const LandingTrustBar = () => (
  <section className="lp-wrap lp-trust">
    <p className="lp-trust-label">Built for every kind of rental inventory</p>
    <div className="lp-trust-row">
      {['Electronics', 'Camera gear', 'Office furniture', 'Construction tools', 'Event equipment'].map((category) => (
        <span className="lp-trust-item" key={category}>
          <Cube /> {category}
        </span>
      ))}
    </div>
  </section>
);

const LandingFeatures = () => (
  <section className="lp-section" id="features">
    <div className="lp-wrap">
      <div className="lp-section-head">
        <span className="lp-eyebrow">Platform</span>
        <h2 className="lp-h2">Everything the shop floor actually needs</h2>
        <p className="lp-lead">
          One system for the catalog, the money, and the calendar — so an order’s status is the
          same fact whether you read it from the dashboard, the invoice, or the return desk.
        </p>
      </div>

      <div className="lp-grid">
        {FEATURE_CARDS.map((feature) => (
          <article className="lp-card" key={feature.title}>
            <div className="lp-card-icon">{feature.icon}</div>
            <h3 className="lp-h3">{feature.title}</h3>
            <p className="lp-body">{feature.body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const LandingLifecycle = () => (
  <section className="lp-section lp-section-tint" id="lifecycle">
    <div className="lp-wrap">
      <div className="lp-section-head lp-section-head-center">
        <span className="lp-eyebrow">How it works</span>
        <h2 className="lp-h2">One path, from offer to settled deposit</h2>
        <p className="lp-lead">
          Every rental follows the same five moves. Each one writes to the ledger and the
          dashboard as it happens, so the numbers never need reconciling after the fact.
        </p>
      </div>

      <div className="lp-life">
        {LIFECYCLE_STEPS.map((step) => (
          <div className="lp-step" key={step.title}>
            <h3 className="lp-h3">{step.title}</h3>
            <p className="lp-body">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/**
 * The deep-dive on late fees, the feature that most distinguishes this system.
 * Pairs plain-language rules with a dark panel showing the resulting order lines.
 */
const LandingLateFees = () => (
  <section className="lp-section" id="late-fees">
    <div className="lp-wrap lp-split">
      <div className="lp-split-copy">
        <span className="lp-eyebrow">The star feature</span>
        <h2 className="lp-h2">A late return settles itself</h2>
        <p className="lp-lead">
          The late fee is not a number shown on a screen for someone to key in elsewhere. Marking
          the return writes a real line to the real order and settles it against the real deposit.
        </p>

        <div className="lp-checklist">
          <p className="lp-check"><Check /><span><b>Partial hours round up.</b> A 4 hour rental returned at 4h 30m counts as one full hour late.</span></p>
          <p className="lp-check"><Check /><span><b>The fee posts to the order.</b> A “Late Fees” line is appended, so the invoice total reflects it.</span></p>
          <p className="lp-check"><Check /><span><b>The deposit absorbs it.</b> The fee is deducted and the remainder is refunded automatically.</span></p>
          <p className="lp-check"><Check /><span><b>The dashboard follows.</b> Late-fee revenue and deposits held both update from the same event.</span></p>
        </div>
      </div>

      <div className="lp-code">
        <div className="lp-code-head">
          <span className="lp-dot" style={{ background: '#ff5f57' }} />
          <span className="lp-dot" style={{ background: '#febc2e' }} />
          <span className="lp-dot" style={{ background: '#28c840' }} />
          <span className="lp-code-file">order R-2041 — on return</span>
        </div>
        <pre>
          <span className="lp-c-com">{'// rented 4h · returned 4h 30m · rate ₹150/hr'}</span>{'\n'}
          <span className="lp-c-key">hoursLate</span>{'   = ceil(0.5)     '}<span className="lp-c-com">→</span> <span className="lp-c-num">1</span>{'\n'}
          <span className="lp-c-key">lateFee</span>{'     = 1 × 150       '}<span className="lp-c-com">→</span> <span className="lp-c-num">150.00</span>{'\n\n'}
          <span className="lp-c-com">{'// appended to the order automatically'}</span>{'\n'}
          {'order.lines.'}<span className="lp-c-key">push</span>{'({\n'}
          {'  name:   '}<span className="lp-c-str">{"'Late Fees'"}</span>{',\n'}
          {'  qty:    '}<span className="lp-c-num">1</span>{',\n'}
          {'  price:  '}<span className="lp-c-num">150.00</span>{'\n})\n\n'}
          <span className="lp-c-key">deposit</span>{'     = '}<span className="lp-c-num">2000.00</span>{'\n'}
          <span className="lp-c-key">refund</span>{'      = 2000 − 150   '}<span className="lp-c-com">→</span> <span className="lp-c-num">1850.00</span>
        </pre>
      </div>
    </div>
  </section>
);

const LandingStats = () => (
  <section className="lp-stats">
    <div className="lp-wrap lp-stats-grid">
      {CAPABILITY_STATS.map((stat) => (
        <div key={stat.label}>
          <div className="lp-stat-value">{stat.value}</div>
          <div className="lp-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  </section>
);

const LandingRoles = () => (
  <section className="lp-section">
    <div className="lp-wrap">
      <div className="lp-section-head lp-section-head-center">
        <span className="lp-eyebrow">Who it’s for</span>
        <h2 className="lp-h2">One system, three points of view</h2>
        <p className="lp-lead">
          Customers, vendors, and admins share the same orders and the same numbers — each sees
          exactly the slice their role permits.
        </p>
      </div>

      <div className="lp-grid">
        {ROLE_CARDS.map((role) => (
          <article className={`lp-role${role.featured ? ' lp-role-featured' : ''}`} key={role.tag}>
            <span className="lp-role-tag">{role.tag}</span>
            <h3 className="lp-h3">{role.title}</h3>
            <p className="lp-body">{role.body}</p>
            <ul>
              {role.points.map((point) => (
                <li key={point}><Users /> {point}</li>
              ))}
            </ul>
            <Link className={`lp-btn ${role.featured ? 'lp-btn-primary' : 'lp-btn-ghost'}`} to={role.to}>
              {role.cta} <ArrowRight />
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const LandingCta = () => (
  <section className="lp-cta">
    <div className="lp-wrap">
      <h2 className="lp-h2">Put the whole rental cycle on one screen</h2>
      <p className="lp-cta-lead">
        Start with the catalog, or create an account and take an order all the way through to a
        settled deposit.
      </p>
      <div className="lp-cta-actions">
        <Link className="lp-btn lp-btn-light" to="/products">Browse the catalog <ArrowRight /></Link>
        <Link className="lp-btn lp-btn-glass" to="/register">Create an account</Link>
      </div>
    </div>
  </section>
);

const LandingFooter = () => (
  <footer className="lp-footer">
    <div className="lp-wrap">
      <div className="lp-footer-grid">
        <div className="lp-footer-brand">
          <Link to="/" className="lp-logo">
            <span className="lp-logo-mark"><Cube /></span>
            {BRAND_NAME}
          </Link>
          <p className="lp-footer-blurb">
            Rental management from quotation to settled deposit, modelled on the Odoo rental
            lifecycle.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading}>
            <h4>{column.heading}</h4>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}><Link to={link.to}>{link.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="lp-footer-base">
        <span>{BRAND_NAME} © 2026. India Operations.</span>
        <span>Deposits are held separately and refunded on return.</span>
      </div>
    </div>
  </footer>
);

// ----------------------------------------------------------------------------------
// PAGE
// ----------------------------------------------------------------------------------

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="lp-root">
      <LandingNav user={user} />
      <LandingHero onBrowse={() => navigate('/products')} />
      <LandingTrustBar />
      <LandingFeatures />
      <LandingLifecycle />
      <LandingLateFees />
      <LandingStats />
      <LandingRoles />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
