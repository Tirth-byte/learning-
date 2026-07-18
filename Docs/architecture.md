# System Architecture — Rental Management System

The blueprint everyone builds against. Read it before writing code. It's also the document judges will grade hardest, so know it well enough to explain any part.

---

## 1. High-level architecture (3 tiers)

We use a classic three-tier design. Three clear layers, each with one job.

```
┌─────────────────────────────────────────────┐
│   PRESENTATION  →  React + Ant Design (SPA)   │   runs in the browser
│   the screens the user sees and clicks         │
└───────────────────────┬─────────────────────┘
                        │  HTTP requests (JSON)
                        │  JWT token in the header
                        ▼
┌─────────────────────────────────────────────┐
│   APPLICATION  →  Node + Express REST API      │   our server
│   validates, runs business logic, decides      │
└───────────────────────┬─────────────────────┘
                        │  Prisma (ORM)
                        ▼
┌─────────────────────────────────────────────┐
│   DATA  →  PostgreSQL (local)                  │   stores everything
│   tables, relationships, integrity             │
└─────────────────────────────────────────────┘
```

The frontend never touches the database directly. It only asks the backend. The backend is the only thing that talks to the database. That separation is the whole point.

**One-line version to say out loud:** "React frontend, a layered Node/Express API, and a local PostgreSQL database through Prisma. The frontend calls REST endpoints, the backend separates routing from business logic from data access, and Prisma is our single source of truth for the data model."

---

## 2. Request lifecycle (how one click travels)

Trace it end to end — this answers most "how does it work" questions:

```
Browser (React)
  → Axios sends an HTTP request with the JWT token
    → Express ROUTE matches the URL + method
      → MIDDLEWARE checks the token and the user's role
        → CONTROLLER reads the request, validates the input
          → SERVICE runs the business logic (the brain)
            → PRISMA runs the database queries
              → PostgreSQL reads/writes the data
            ← returns rows
          ← returns a result
        ← shapes the response
      ← sends JSON back
    ← 
  ← React updates the screen
```

Each arrow is a boundary. Data only crosses in this order — never skips a layer.

---

## 3. Repo structure (monorepo: one repo, two apps)

```
rental-management-system/
├── client/                      # React + Ant Design frontend
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # top-level routes
│       ├── api/                 # axios instance + API call functions
│       ├── components/          # reusable UI: tables, forms, layout, sidebar
│       ├── pages/
│       │   ├── admin/           # dashboard, orders, products, invoices, settings
│       │   └── customer/        # shopfront, product, cart, checkout, my-orders
│       ├── context/             # AuthContext: current user, token, role
│       └── theme/               # Ant Design theme (custom primary color)
│
├── server/                      # Node + Express backend
│   ├── prisma/
│   │   └── schema.prisma        # THE data model — single source of truth
│   └── src/
│       ├── index.js             # app entry: mounts middleware + routes
│       ├── config/              # prisma client, env config
│       ├── middleware/          # auth (verify JWT), roleGuard, errorHandler
│       ├── routes/              # URL → controller mapping ONLY (no logic)
│       ├── controllers/         # HTTP in/out + validation (no DB, no rules)
│       ├── services/            # ALL business logic (the brain)
│       ├── utils/               # late-fee calc, reference generator, helpers
│       └── seed/                # realistic demo data
│
└── README.md
```

---

## 4. Backend layers — who does what (never mix these)

This is the "big company" story. Each layer has exactly one responsibility.

- **routes/** — pure wiring. `POST /api/orders/:id/return → orderController.returnOrder`. No logic here, ever.
- **controllers/** — handle the HTTP part: read the request, validate input, call a service, send the response. No database calls and no business rules here.
- **services/** — the brain. Order state changes, late-fee calculation, deposit settlement, invoice generation, dashboard totals. All the value lives here.
- **prisma (data access)** — talks to the database. Nothing else.

**Why we split it this way (say this if asked):** separation of concerns. If we want to change how late fees work, we touch one service and nothing else breaks. If a judge asks "where is your business logic," the answer is one clean word: `services`.

---

## 5. API design (REST, resource-based)

Base path: `/api`. Resources are nouns; state changes are explicit action endpoints.

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`

**Products**
- `GET /api/products`, `GET /api/products/:id`
- `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- `POST /api/products/:id/publish` (admin only)

**Pricelists** — `GET/POST/PUT` `/api/pricelists`

**Orders (the state machine)**
- `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`
- `POST /api/orders/:id/send`     → Quotation → Quotation Sent
- `POST /api/orders/:id/confirm`  → Quotation Sent → Confirmed (Rental Order)
- `POST /api/orders/:id/pickup`   → Confirmed → Picked Up
- `POST /api/orders/:id/return`   → Picked Up → Returned (runs late-fee + deposit logic)
- `POST /api/orders/:id/cancel`   → Cancelled

**Invoices**
- `POST /api/orders/:id/invoice` (create draft from order)
- `POST /api/invoices/:id/post`  → Draft → Posted
- `POST /api/invoices/:id/pay`

**Dashboard & Reports**
- `GET /api/dashboard` (aggregated stat cards)
- `GET /api/reports`

Those action endpoints (`/send`, `/confirm`, `/pickup`, `/return`) are the order's state transitions. Clean, obvious, and easy to defend.

---

## 6. Authentication & roles

- Passwords are hashed with **bcrypt** — we never store plain passwords.
- Login returns a **JWT** that carries the user's id and role.
- The client stores the token and sends it on every request: `Authorization: Bearer <token>`.
- **`authMiddleware`** verifies the token. **`roleGuard('ADMIN')`** restricts routes by role.
- Three roles: **ADMIN, VENDOR, CUSTOMER**. Enforced on the backend routes AND reflected in the UI (customers never see admin screens).
- Sign-up rules from the mockup: unique email; password 6–12 chars with an uppercase, a lowercase, and a special character (`@ $ & _`); password must match confirm-password.

This is the role-based access control the brief specifically asks for.

---

## 7. The Order state machine (the heart of the system)

Every rental order moves through fixed states. Transitions are only allowed in one direction, and each transition is guarded (you cannot confirm an order that's already returned).

```
                    ┌──────────────┐
                    │  QUOTATION   │
                    └──────┬───────┘
                     send  │
                    ┌──────▼────────┐
                    │ QUOTATION_SENT│
                    └──────┬────────┘
                   confirm │
                    ┌──────▼────────┐
                    │  CONFIRMED    │  (Rental Order / Sale Order)
                    └──────┬────────┘
                    pickup │
                    ┌──────▼────────┐
                    │  PICKED_UP    │
                    └──────┬────────┘
                    return │  ← late-fee + deposit settlement runs HERE
                    ┌──────▼────────┐
                    │  RETURNED     │
                    └───────────────┘

   CANCELLED  ← reachable from Quotation / Quotation Sent / Confirmed
```

Two other status tracks run alongside it:
- **Invoice status:** `NOTHING_TO_INVOICE → INVOICED`
- **Invoice document:** `DRAFT → POSTED`
- **Deposit status:** `HELD → REFUNDED` (on-time) or `DEDUCTED` (late)

The service checks the current state before every transition. That guard *is* the business rulebook.

---

## 8. The business-logic engines (the crown jewels — all in `services/`)

These are the parts that win. Know where each lives.

**a) Late-fee engine** (`orderService.returnOrder`)
On return: `lateHours = ceil((actualReturn − rentalEnd) in hours)`. If `lateHours > 0`, `lateFee = lateHours × product.lateFeePerHour`, then insert a new order line `lineType = LATE_FEE`, and recompute the order total.
Example: rented 4h, returned 4.5h → 1h late → `1 × 150 = 150`.

**b) Deposit settlement** (same return step)
`refund = max(deposit − lateFee, 0)`. Set deposit status to REFUNDED or DEDUCTED. On-time returns refund the full deposit.

**c) Invoice generation** (`invoiceService.createFromOrder`)
Copy the confirmed order's lines into invoice lines, compute untaxed + tax + total, create the invoice as DRAFT.

**d) Dashboard aggregation** (`dashboardService.getStats`)
Group orders by status and date to produce the cards: Sales, Deposits Held, Late Fees Collected, Due Today, Overdue, upcoming Pickups/Returns.

**e) Reference generator** (`utils`)
Sequential human-readable IDs: orders `SO0001…`, invoices `INV/2026/0001…`.

---

## 9. How all the data connects (the ER story)

The **RentalOrder** is the spine everything hangs off.

- **User** (customer) `1 → many` **RentalOrder**
- **User** (vendor) `1 → many` **Product**; every **Product** belongs to one **Category**
- **Product** `1 → many` **PricelistItem** `many → 1` **Pricelist**
- **RentalOrder** `1 → many` **RentalOrderLine** `many → 0..1` **Product**
  (a line can also be a DEPOSIT, LATE_FEE, or NOTE line with no product)
- **RentalOrder** `1 → 0..1` **Invoice** `1 → many` **InvoiceLine**
- **RentalOrder** `1 → many` **Payment** (type: RENTAL / DEPOSIT / LATE_FEE)

Foreign keys enforce this in the database, so you can't, for example, have an order line pointing at a product that doesn't exist. That integrity is a maturity signal — mention it.

---

## 10. Worked example — trace one real action end to end

**"Admin clicks Return on a late order."** This single trace answers most judge questions:

1. React calls `POST /api/orders/42/return` with the actual return time, token attached.
2. `authMiddleware` verifies the JWT and confirms the role is ADMIN.
3. `orderController.returnOrder` reads the body, then calls `orderService.returnOrder(42, actualReturn)`.
4. The service (inside a **database transaction**): loads the order + lines + product via Prisma → checks status is `PICKED_UP` → computes late hours → creates a `LATE_FEE` line → recomputes the total → sets the deposit to DEDUCTED/REFUNDED → sets status to `RETURNED`.
5. Prisma writes it all to PostgreSQL — all-or-nothing, because it's one transaction.
6. Updated order returns as JSON → React updates the order screen, and the dashboard now shows the new late-fee total.

---

## 11. Data integrity — transactions

Any action that touches multiple tables at once (a return creates a line + updates the order + updates the deposit) runs inside a **Prisma transaction**. Either every change happens or none does — the data can never end up half-updated. Combined with foreign keys, this is how we keep the database always correct.

---

## 12. How it scales in a real company (the closing answer)

We ran it locally for the hackathon, but the design is built to grow: add caching for frequent reads, a background job queue for invoice/late-fee/notification processing, move PostgreSQL to a managed cluster with read replicas, and containerize the apps behind a load balancer. Because business logic is isolated in the service layer, none of that requires rewriting the core logic — you scale the edges, not the brain.
```
