# Team Build Playbook — All Prompts, All 4 Members, In Order

One file, four tracks. Work down your own section. The **WAVE** markers tell everyone the global order; the **SYNC** points are where you merge and test together. Nobody skips ahead of a dependency.

## Roles
- **Tirth** — foundation + backend brain (scaffold, schema, order engine, late-fee/deposit, dashboard API).
- **Man** — admin UI + integration (shell, orders, invoice, dashboard screens).
- **Teammate 1** — Products & Pricelists (owns this vertical end to end).
- **Teammate 2** — Customer website + demo data + QR feature.

## First thing, everyone
Drop our four docs into a `/docs` folder in the repo. Everyone's first Claude Code message:
```
Read every file in /docs. This is a Rental Management System modeled on Odoo's
rental module: React + Ant Design frontend, Node + Express + Prisma + PostgreSQL
backend, monorepo (client/ + server/), backend layered routes→controllers→
services→prisma with business logic only in services. Confirm you understand the
architecture and the rental order state machine.
```

## Git rule
Tirth owns `main`. Everyone else works on their branch (`man/admin`, `t1/products`, `t2/customer`) and opens PRs. Pull `main` at every SYNC point.

---

## DESIGN RULES — paste at the top of EVERY frontend prompt

```
DESIGN RULES — follow strictly. Target: enterprise ERP / business SaaS admin
(Odoo, Linear, Stripe dashboard). Calm, dense, information-first.
Colors: primary #3651A5 (NOT default Ant Design blue); app bg #F5F6F8; cards
#FFFFFF; borders #E5E7EB; text #1F2937 / secondary #6B7280. Status colors only
inside tags: success #16A34A, warning #D97706, danger #DC2626, info #2563EB.
Type: Inter/system, restrained sizes, tabular numbers in tables.
Layout: fixed left sidebar + top bar (search + user) + content with breadcrumbs.
Data in Ant Design Tables (columns, filters, pagination, compact density). Forms
in cards, grouped by section/tabs. Radius 6px, 8px spacing scale, subtle borders
over heavy shadows.
DO NOT: purple/pink gradients, glassmorphism, emojis in UI, huge rounded corners,
gradient buttons, hero/landing styling on admin, illustrations, shadow everywhere.
Status = muted tags. It must look like software a company pays for, not an AI demo.
```

---

# ══════ WAVE 1 — FOUNDATION (Tirth builds alone; everyone else sets up env + reads docs) ══════

Nothing else can start until Tirth pushes the scaffold + schema. Man/T1/T2: clone, install, read docs, get PostgreSQL running locally while you wait.

### Tirth — Prompt 1 (scaffold)
```
[paste DESIGN RULES]
Scaffold the monorepo. client/: Vite + React + Ant Design + React Router + axios;
an Ant Design theme file using the DESIGN RULES tokens (colorPrimary #3651A5,
radius 6, Inter); an axios instance with base URL + JWT interceptor; a basic app
shell that renders. server/: Express with layered folders (config, middleware,
routes, controllers, services, utils, seed); Prisma pointing at a LOCAL
PostgreSQL DB; error-handling middleware; GET /api/health returning ok. Give me
exact install + run commands. Both apps must start cleanly.
```

### Tirth — Prompt 2 (schema)
```
Write the complete server/prisma/schema.prisma from /docs/architecture.md
section 9. Models: User (role ADMIN|VENDOR|CUSTOMER), Category, Product (type
GOODS|SERVICE|RENTAL, periodicity HOUR|DAY|NIGHT|WEEK|MONTH, securityDeposit,
lateFeePerHour, published, rentalCount, totalRentalHours), ProductAttribute,
ProductAttributeValue, Pricelist, PricelistItem, RentalOrder (status QUOTATION|
QUOTATION_SENT|CONFIRMED|PICKED_UP|RETURNED|CANCELLED, invoiceStatus,
depositStatus HELD|REFUNDED|DEDUCTED, rentalStart/End, actualReturn, untaxed/tax/
total, depositAmount), RentalOrderLine (lineType RENTAL|DEPOSIT|LATE_FEE|NOTE),
Invoice (status DRAFT|POSTED), InvoiceLine, Payment (method CASH|CARD|UPI, type
RENTAL|DEPOSIT|LATE_FEE), Notification, Settings. All relations + foreign keys.
Run the migration and generate the client.
```

### Tirth — Prompt 3 (seed)
```
Write server/src/seed with REALISTIC data (no "test123"). An admin, two vendors,
three customers with real names/addresses; 8–10 rental products across categories
(electronics, furniture, equipment) with real prices, deposits, late-fee rates;
a default pricelist + one custom; 6–8 orders spread across EVERY status including
one returned on-time and one returned late, so lists and dashboard look full. Add
a reset-and-reseed script.
```

### Tirth — Prompt 4 (auth backend)
```
Build auth in the layered structure. POST /api/auth/register, /login,
/forgot-password. bcrypt hashing; login returns a JWT with userId + role.
Validation: unique email; password 6–12 chars with uppercase + lowercase +
special (@ $ & _); matches confirm. Wrong login returns "Invalid User ID or
Password". Add authMiddleware (verify JWT) and roleGuard(role).
```

**>>> Tirth pushes to `main` now. Everyone pulls. WAVE 2 begins. <<<**

---

# ══════ WAVE 2 — CORE (all four in parallel) ══════

## ── TIRTH (backend engine) ──

### Tirth — Prompt 5 (order lifecycle API)
```
Build the rental order engine (logic in services). POST /api/orders creates a
quotation with order lines. State-transition endpoints, each guarded (reject
invalid transitions): /orders/:id/send (Quotation→Quotation Sent), /confirm
(→Confirmed), /pickup (→Picked Up), /cancel (→Cancelled). Add a reference
generator (SO0001…) in utils and a totals calculator (untaxed, tax, total).
```

### Tirth — Prompt 6 (return engine + invoicing — the crown jewel)
```
Build POST /api/orders/:id/return INSIDE a Prisma transaction: confirm status is
PICKED_UP; lateHours = ceil((actualReturn − rentalEnd) in hours); if lateHours>0
create a RentalOrderLine lineType LATE_FEE amount = lateHours ×
product.lateFeePerHour, recompute total, set deposit refund = max(deposit −
lateFee, 0) with depositStatus DEDUCTED; else refund full (REFUNDED); set status
RETURNED; increment product rentalCount + totalRentalHours. Then invoicing: POST
/api/orders/:id/invoice (DRAFT from lines), /api/invoices/:id/post (→POSTED),
/api/invoices/:id/pay (record Payment). Test with seed: a late return must
auto-add the late-fee line and settle the deposit.
```

### Tirth — Prompt 7 (dashboard + reports API)
```
GET /api/dashboard: total Sales, Deposits Held, Late Fees Collected, counts Due
Today + Overdue, upcoming Pickups/Returns, filterable by today/7-days/month. GET
/api/reports: rental, late-fee, revenue summaries. Vendors see only their own
data; admin sees all.
```

## ── MAN (admin UI) ──

### Man — Prompt 1 (auth frontend) — needs Tirth P4
```
[paste DESIGN RULES]
Build professional Login, Sign Up, Reset Password pages (clean centered card,
logo slot). AuthContext holding user/token/role. On login redirect ADMIN/VENDOR
to admin dashboard, CUSTOMER to shopfront. Protected routes by role. Store token,
attach via axios interceptor. Show the backend's exact validation messages.
```

### Man — Prompt 2 (admin shell) — needs scaffold only
```
[paste DESIGN RULES]
Build the admin layout: fixed left sidebar (Orders, Schedule, Products, Reports,
Settings), top bar with search + user menu, content area with breadcrumbs. Apply
the theme. This frame hosts every admin page — export it so teammates mount their
pages inside it.
```

### Man — Prompt 3 (orders list + order form) — needs Tirth P5/P6
```
[paste DESIGN RULES]
Orders screen with List AND Kanban view (view switcher), statuses as muted tags.
Order form: customer, rental period, order-lines table with "Add a Product" and
"Add a note" (Product / Qty / Unit / Unit Price / Taxes / Amount, plus Untaxed +
Taxes + Total). Action buttons (Send, Confirm, Create Invoice, Pickup, Return)
that show/hide by status and call the order endpoints. This screen drives the
whole golden path.
```

### Man — Prompt 4 (invoice + dashboard UI) — needs Tirth P6/P7
```
[paste DESIGN RULES]
Invoice page (Draft/Posted, invoice lines, Post / Pay / Print). Dashboard: stat
cards (Sales, Deposits Held, Late Fees Collected, Due Today, Overdue) with
date-range filter + a Pickups/Returns section. Wire to /api/dashboard. Dense,
business-like, no oversized cards.
```

### Man — Prompt 5 (settings + profile)
```
[paste DESIGN RULES]
Settings page (admin only): late-fee rules, grace period, deposit rules, company
details. Profile page for all roles. Hide Settings for non-admins.
```

## ── TEAMMATE 1 (Products & Pricelists) ──
You own products end to end. Test each screen by refreshing and checking the seed data shows up.

### Teammate 1 — Prompt 1 (products + pricelist API) — needs schema + auth
```
Build products and pricelists in the layered structure (logic in services): full
CRUD for products and pricelists, plus POST /api/products/:id/publish (admin
only). Enforce roles with roleGuard.
```

### Teammate 1 — Prompt 2 (product screens) — mount inside Man's admin shell
```
[paste DESIGN RULES]
Build inside the existing admin shell. Products list (Ant Design Table: name,
category, type, price, deposit, a published tag, actions). Product form with tabs:
General (name, category, images, price), Rental (periodicity, security deposit,
late-fee/hour, pickup/return times), Attributes & Variants (Brand/Color/Size with
values), Sales. Admin-only Publish/Unpublish button. Wire to the products API.
```

### Teammate 1 — Prompt 3 (pricelist screen)
```
[paste DESIGN RULES]
Build a Pricelist screen inside the admin shell: list pricelists, mark one
default, and add per-period prices (hour/day/night/week/month) per product. Wire
to the pricelist API.
```

## ── TEAMMATE 2 (Customer website + demo) ──
You own the shopper's side. Test by logging in as a seeded customer.

### Teammate 2 — Prompt 1 (shopfront + product page) — needs products API (T1 P1) + auth
```
[paste DESIGN RULES] (customer side may be slightly warmer but still clean)
Customer layout with search bar + profile on every page. Home: product grid with
category dropdown + search. Product page: images, description, price per period,
a rental-period picker (start/end date-time), a variant picker dialog when the
product has variants, Add to Cart.
```

### Teammate 2 — Prompt 2 (cart + checkout + my orders) — needs order API (Tirth P5)
```
[paste DESIGN RULES]
Cart (items, rental dates, totals, remove/save-for-later). Checkout in three
steps with breadcrumb Order → Address → Payment: home delivery (address form) or
store pickup; pay rental + deposit by card/UPI. On success, confirmation +
downloadable invoice. My Orders + My Profile pages. Checkout must create a real
order via POST /api/orders so the admin side sees it.
```

---

# ══════ SYNC A — CHECKPOINT 1 (golden path) ══════
Merge Tirth + Man + Teammate 1. Together, verify in the UI: create a quotation → Send → Confirm → Create Invoice → Post → Pay → Pickup → Return LATE. The late-fee line must auto-appear, the deposit must settle, and the dashboard must update. **Do not go further until this is green.**

# ══════ SYNC B — CHECKPOINT 2 (loop closed) ══════
Merge Teammate 2. A customer booking on the website must appear as an order in the admin backend. Fix wiring until it does.

---

# ══════ WAVE 3 — BONUSES (only after both checkpoints) ══════
See /docs/bonus-features-plan.md. Assignments:

### Teammate 2 — Prompt 3 (QR scanning — highest impact, do first)
```
[paste DESIGN RULES]
Generate a QR code for each product and each order (offline library). Add a
mobile-friendly pickup/return view with a "Scan" button that opens the device
camera (html5-qrcode, fully client-side), reads the code, opens the matching
order, and lets the user mark Pickup or Return. No cloud/backend dependency.
```

### Man — Prompt 6 (analytics + scheduler + notification bell)
```
[paste DESIGN RULES]
1) Dashboard charts (recharts): revenue over time, most-rented products,
utilization %, late-return rate, revenue by category; add date-range filter and
toggle-able stat cards. 2) Rental Scheduler: a month calendar showing bookings
per day with availability status and pickup/return markers. 3) A notification
bell in the top bar listing reminders. Business-style, not flashy.
```

### Tirth — Prompt 8 (bonus backend)
```
Backend for bonuses: auto-generate Notification records for orders due for
pickup/return soon or overdue. Add endpoints/aggregations for the analytics
charts. Add a product availability calculator (next-available date + utilization %
from order periods) and a predictive-maintenance flag when rentalCount or
totalRentalHours cross a threshold.
```

### Teammate 1 — Prompt 4 (product-side bonus displays)
```
[paste DESIGN RULES]
On the product list/detail, show next-available date + utilization %, and a
"Schedule maintenance" flag when the maintenance threshold is crossed. Wire to
Tirth's availability + maintenance endpoints.
```

---

# ══════ WAVE 4 — INTEGRATION + POLISH (all, led by Tirth + Man) ══════

### Final — Prompt (integration + professional polish)
```
[paste DESIGN RULES]
Full integration pass: every screen links correctly, roles gate the right pages,
the customer→admin order flow is seamless. Add loading, empty, and error states
everywhere (no blank screens). Make the customer site + QR pickup/return work on
a phone. Refresh seed data so everything looks realistic for the demo. Final
visual polish against DESIGN RULES — must look like professional software, not an
AI demo. Then output the exact golden-path demo script to show judges.
```

---

## The two rules that decide the outcome
1. **Never cross a SYNC point with a broken golden path.** A working lifecycle beats ten half-built screens.
2. **Paste DESIGN RULES with every UI prompt**, and after each screen ask: *does this look like paid software or an AI demo?* If the second, tell Claude Code "make it more restrained and enterprise, follow DESIGN RULES" before moving on.
