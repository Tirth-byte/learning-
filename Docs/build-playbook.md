# Build Playbook — Step-by-Step Claude Code Prompts

Paste these into Claude Code **one at a time, in order**. Don't jump ahead — each builds on the last. The order is deliberate: the golden path (the full rental lifecycle) comes before anything optional, so you always have a working demo.

## How to run this
- Work on a branch per person; commit after every prompt that passes.
- **After each prompt: run it and confirm it works before moving on.** If it breaks, fix it in that same prompt, don't stack the next one on a broken step.
- Drop our four docs (architecture, build-spec, project-description, bonus-features-plan) into a `/docs` folder in the repo so Claude Code has full context.
- **For every prompt that builds UI, paste the DESIGN RULES block (below) at the top of the prompt.** This is what keeps the site professional.
- Keep the seed data realistic from the start so screens never look fake or empty.

---

## DESIGN RULES (paste this at the top of EVERY frontend prompt)

```
DESIGN RULES — follow strictly. Target aesthetic: enterprise ERP / business
SaaS admin (think Odoo, Linear, Stripe dashboard). Calm, dense, information-first.

Colors:
- Primary: #3651A5 (professional indigo — NOT the default Ant Design blue).
- Backgrounds: app #F5F6F8, surfaces/cards #FFFFFF, borders #E5E7EB.
- Text: primary #1F2937, secondary #6B7280.
- Status colors ONLY inside tags/badges: success #16A34A, warning #D97706,
  danger #DC2626, info #2563EB.

Typography: Inter (or system font). Clear hierarchy, restrained sizes.
Tabular numbers in tables. No oversized headings.

Layout: fixed left sidebar nav + top bar (search + user menu) + content area
with breadcrumbs. Data in proper Ant Design Tables with columns, filters,
pagination, compact density. Forms inside cards, grouped into sections or tabs.

Border radius: 6px. Spacing on an 8px scale. Subtle borders over heavy shadows.

DO NOT: use purple/pink gradients, glassmorphism, emojis in the UI, huge
rounded corners, gradient buttons, hero/landing-page styling on admin screens,
playful illustrations, or drop shadows everywhere. Order status must render as
muted Ant Design Tags, not colorful pills. It should look like software a real
company pays for, not an AI demo.
```

---

# PHASE 0 — Foundation

**P0 — context**
```
Read every file in /docs. This is a Rental Management System modeled on Odoo's
rental module. We use React + Ant Design (frontend) and Node + Express + Prisma
+ PostgreSQL (backend), in a monorepo with client/ and server/. Backend is
layered: routes → controllers → services → prisma, with business logic ONLY in
services. Confirm you understand the architecture and the rental order state
machine before we start.
```

**P1 — scaffold the monorepo**
```
[paste DESIGN RULES]
Scaffold the project. In client/: Vite + React + Ant Design + React Router +
axios. Create an Ant Design theme file applying the DESIGN RULES tokens
(colorPrimary #3651A5, radius 6, Inter font), an axios instance with a base URL
and a JWT interceptor, and a basic app shell that renders. In server/: Express
with the layered folder structure (config, middleware, routes, controllers,
services, utils, seed), a Prisma setup pointing at a LOCAL PostgreSQL database,
an error-handling middleware, and a GET /api/health endpoint returning ok.
Give me the exact commands to install and run both. Both must start cleanly.
```

---

# PHASE 1 — Data model + seed

**P2 — Prisma schema**
```
Write the complete server/prisma/schema.prisma from /docs/architecture.md
section 9 and /docs/rental-build-spec.md. Include models: User (role ADMIN|
VENDOR|CUSTOMER), Category, Product (type GOODS|SERVICE|RENTAL, periodicity,
securityDeposit, lateFeePerHour, published, plus rentalCount and
totalRentalHours for the maintenance bonus), ProductAttribute,
ProductAttributeValue, Pricelist, PricelistItem, RentalOrder (status QUOTATION|
QUOTATION_SENT|CONFIRMED|PICKED_UP|RETURNED|CANCELLED, invoiceStatus,
depositStatus HELD|REFUNDED|DEDUCTED, rentalStart/End, actualReturn, totals),
RentalOrderLine (lineType RENTAL|DEPOSIT|LATE_FEE|NOTE), Invoice (status
DRAFT|POSTED), InvoiceLine, Payment (method CASH|CARD|UPI, type RENTAL|DEPOSIT|
LATE_FEE), Notification, and Settings. Add all relations and foreign keys as
described. Then run the migration and generate the client.
```

**P3 — realistic seed data**
```
Write server/src/seed with REALISTIC data (no "test123"). Create: an admin, two
vendors, three customers with real-sounding names and addresses; 8–10 rental
products across categories (electronics, furniture, equipment) with real prices,
security deposits, and late-fee rates; a default pricelist plus one custom one;
and 6–8 rental orders spread across every status (quotation, quotation sent,
confirmed, picked up, returned on-time, returned late) so the dashboard and
lists look populated. Add a script to reset and reseed.
```

---

# PHASE 2 — Authentication

**P4 — auth backend**
```
Build auth in the layered structure. Endpoints: POST /api/auth/register, /login,
/forgot-password. Hash passwords with bcrypt; login returns a JWT with userId
and role. Validation: unique email; password 6–12 chars with an uppercase, a
lowercase, and a special char (@ $ & _); password matches confirm. Wrong login
returns the message "Invalid User ID or Password". Add authMiddleware (verify
JWT) and roleGuard(role) middleware.
```

**P5 — auth frontend**
```
[paste DESIGN RULES]
Build professional Login, Sign Up, and Reset Password pages (clean centered card,
company logo slot — not playful). Add an AuthContext holding the user, token, and
role. On login, redirect ADMIN/VENDOR to the admin dashboard and CUSTOMER to the
shopfront. Add protected routes by role. Store the token and attach it via the
axios interceptor. Show the exact validation messages from the backend.
```

---

# PHASE 3 — Core backend engine (the golden path)

**P6 — products + pricelists API**
```
Build products and pricelists in the layered structure: full CRUD for products
and pricelists, plus POST /api/products/:id/publish (admin only). Business logic
lives in services. Enforce roles.
```

**P7 — order lifecycle API**
```
Build the rental order engine. POST /api/orders creates a quotation with order
lines. Add state-transition endpoints, each guarded (reject invalid transitions):
/send (Quotation→Quotation Sent), /confirm (→Confirmed), /pickup (→Picked Up),
/cancel (→Cancelled). Add a reference generator (SO0001…) in utils, and a totals
calculator (untaxed, tax, total) in the order service. All logic in services.
```

**P8 — the return engine + invoicing (the crown jewel)**
```
Build POST /api/orders/:id/return INSIDE a Prisma transaction. Steps: confirm
status is PICKED_UP; compute lateHours = ceil((actualReturn − rentalEnd) in
hours); if lateHours > 0, create a RentalOrderLine with lineType LATE_FEE and
amount = lateHours × product.lateFeePerHour, recompute the order total, and set
deposit refund = max(deposit − lateFee, 0) with depositStatus DEDUCTED; else
refund full deposit (REFUNDED); set status RETURNED; increment product
rentalCount and totalRentalHours. Then build invoicing: POST /api/orders/:id/
invoice (create DRAFT from order lines), /api/invoices/:id/post (→POSTED),
/api/invoices/:id/pay (record a Payment). Verify with the seed: returning a late
order must auto-add the late-fee line and settle the deposit.
```

**P9 — dashboard + reports API**
```
Build GET /api/dashboard returning aggregated stats: total Sales, Deposits Held,
Late Fees Collected, counts Due Today and Overdue, and upcoming Pickups/Returns,
each filterable by date range (today / 7 days / month). Build GET /api/reports
returning rental, late-fee, and revenue summaries. Vendors see only their own
data; admin sees all.
```

---

# PHASE 4 — Admin UI (the star of the show)

**P10 — admin shell**
```
[paste DESIGN RULES]
Build the admin layout: fixed left sidebar (Orders, Schedule, Products, Reports,
Settings), a top bar with search and a user menu, a content area with
breadcrumbs. Apply the theme. This is the frame every admin page renders inside.
```

**P11 — products + pricelist screens**
```
[paste DESIGN RULES]
Build the Products list (Ant Design Table: name, category, type, price, deposit,
published tag, actions) and the Product form with tabs: General (name, category,
images, price), Rental (periodicity, security deposit, late-fee/hour, pickup/
return times), Attributes & Variants (Brand/Color/Size with values), Sales.
Admin-only Publish/Unpublish. Build a simple Pricelist screen. Wire to the P6 API.
```

**P12 — orders list + order form**
```
[paste DESIGN RULES]
Build the Orders screen with a List view AND a Kanban view (view switcher),
statuses as muted tags. Build the Order form: customer, rental period, and an
order-lines table with "Add a Product" and "Add a note", showing Product / Qty /
Unit / Unit Price / Taxes / Amount and Untaxed + Taxes + Total. Add the action
buttons (Send, Confirm, Create Invoice, Pickup, Return) that show/hide based on
status and call the P7/P8 endpoints. This screen must drive the whole golden path.
```

**P13 — invoice page + dashboard**
```
[paste DESIGN RULES]
Build the Invoice page (Draft/Posted state, invoice lines, Post / Pay / Print).
Build the Dashboard: stat cards (Sales, Deposits Held, Late Fees Collected, Due
Today, Overdue) with the date-range filter, plus a Pickups/Returns section. Wire
to the P9 API. Clean, dense, business-like — no oversized cards.
```

**P14 — settings + profile**
```
[paste DESIGN RULES]
Build the Settings page (admin only): late-fee rules, grace period, deposit
rules, company details. Build the user Profile page (visible to all roles under
profile only). Enforce that Settings is hidden for non-admins.
```

**CHECKPOINT:** the golden path must now work fully in the UI — create a quotation, send, confirm, invoice, pay, pickup, return-late (late fee auto-appears, deposit settles), dashboard updates. Do not proceed until this is green.

---

# PHASE 5 — Customer website

**P15 — shopfront + product page**
```
[paste DESIGN RULES] (customer side may be a bit warmer but still clean/professional)
Build the customer layout with a search bar and profile on every page. Home page:
product grid with a category dropdown and search. Product page: images,
description, price per period, a rental-period picker (start/end date-time),
a variant picker dialog if the product has variants, and Add to Cart.
```

**P16 — cart + checkout + my orders**
```
[paste DESIGN RULES]
Build the Cart (items, rental dates, totals, remove/save-for-later). Build
Checkout as three steps with a breadcrumb Order → Address → Payment: choose home
delivery (address form) or store pickup; pay rental + deposit by card/UPI. On
success show a confirmation and let the customer download the invoice. Build My
Orders and My Profile. Checkout must create a real order the admin side can see.
```

**CHECKPOINT:** a customer booking on the site must appear as an order in the admin backend. That closes the loop.

---

# PHASE 6 — Bonuses (only after both checkpoints are green; see /docs/bonus-features-plan.md)

**P17 — QR scanning (do this first — highest impact)**
```
[paste DESIGN RULES]
Generate a QR code for each product and each order (offline library). On the
admin order screen and a mobile-friendly pickup/return view, add a "Scan"
button that opens the device camera (html5-qrcode, fully client-side), reads the
code, opens the matching order, and lets the user mark Pickup or Return. No
backend/cloud dependency.
```

**P18 — analytics + dashboard widgets**
```
[paste DESIGN RULES]
Add charts to the dashboard (recharts): revenue over time, most-rented products,
product utilization %, late-return rate, revenue by category. Add date-range
filtering and let the admin toggle which stat cards show. Business-style charts,
not flashy.
```

**P19 — reminders, forecasting, maintenance, scheduler**
```
[paste DESIGN RULES]
1) In-app reminders: auto-generate Notification records for orders due for
pickup/return soon or overdue; show a notification bell with a list.
2) Availability forecast: on each product, show next available date and
utilization %, computed from order rental periods.
3) Predictive maintenance: flag products whose rentalCount/totalRentalHours
cross a threshold ("schedule maintenance").
4) Rental Scheduler: a month calendar showing bookings per day with
availability status and pickup/return markers.
```

---

# PHASE 7 — Integration + polish + demo

**P20 — integration and professional polish pass**
```
[paste DESIGN RULES]
Do a full integration pass: make sure every screen links correctly, roles gate
the right pages, and the customer→admin order flow is seamless. Add proper
loading and empty and error states everywhere (no blank screens). Make the
customer site and the QR pickup/return flow work well on a phone. Refresh the
seed data so everything looks realistic for the demo. Final visual polish
against the DESIGN RULES — this must look like professional software, not an
AI-generated demo. Then walk me through the exact golden-path demo script to
show the judges.
```

---

## The rule that keeps it professional
Paste the DESIGN RULES with every UI prompt, and after each screen ask yourself one question: *does this look like software a company would pay for, or like an AI demo?* If it's the second, tell Claude Code "make this more restrained and enterprise, follow the DESIGN RULES" before moving on. Consistency across screens is what reads as professional.
