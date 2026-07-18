# Odoo Rent — Rental Management System

A full-stack rental management platform covering the complete rental lifecycle —
from customer booking to quotation, confirmation, pickup, return, invoicing, and
deposit settlement — with a customer storefront and an operations portal for
admins and vendors.

---

## Tech Stack

**Frontend** — React 19 + Vite, Ant Design 6, React Router 7, Axios, Recharts
(reports), Framer Motion (animation), `html5-qrcode` / `qrcode.react` (pickup &
return scanning).

**Backend** — Node.js + Express, Prisma ORM, PostgreSQL, JWT auth, bcryptjs.

---

## Project Structure

```
rental-management-system/
├── frontend/                   # React + Vite frontend
│   └── src/
│       ├── api/                # Axios instance + interceptors
│       ├── components/         # Shared layouts (admin, customer, auth) + UI primitives
│       ├── context/            # AuthContext (session state)
│       ├── pages/              # Route screens (admin/, customer/, auth)
│       └── theme/              # Design tokens + Ant Design theme
│
├── backend/                    # Express + Prisma backend
│   ├── prisma/                 # schema.prisma + migrations
│   └── src/
│       ├── config/             # env + prisma client (single source of config)
│       ├── controllers/        # HTTP layer — parse request, shape response
│       ├── services/           # Business logic + database access
│       ├── middleware/         # Auth, role guard, error handler
│       ├── routes/             # Route → controller wiring
│       ├── utils/              # Helpers (reference generators)
│       └── seed/               # Demo data
│
└── Docs/                       # Specs, architecture notes, build playbooks
```

The backend follows a clean **route → controller → service** layering:
controllers handle HTTP concerns only, services own all business logic and Prisma
access. Environment access is centralised in `backend/src/config/env.js`.

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env          # then edit DATABASE_URL / JWT_SECRET
npm run prisma:migrate        # create the schema
npm run db:seed               # load demo data
npm run dev                   # API on http://localhost:5001
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                   # app on http://localhost:5173
```

Open **http://localhost:5173**.

---

## Demo Accounts

| Role | Email | Password | Sees |
|------|-------|----------|------|
| Admin | `admin@rental.com` | `Admin@123` | Full platform |
| Vendor | `vendor1@rental.com` | `Vendor@123` | Own products & orders |
| Customer | `customer1@rental.com` | `Customer@123` | Storefront & rentals |

The login screen also offers one-click demo sign-in for each role.

---

## Order Lifecycle

```
QUOTATION → QUOTATION_SENT → CONFIRMED → PICKED_UP → RETURNED
                                   └──────────────→ CANCELLED
```

Deposits are held on confirmation and refunded on return; late returns
auto-calculate a late fee that is deducted from the deposit. Storefront checkout
creates a `CONFIRMED` order with the invoice generated in the same transaction.

---

## API Overview

Base URL: `/api`

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/forgot-password`; `GET /auth/me`; `PUT /auth/profile`, `/auth/password` |
| Products | `GET /products`, `/products/:id`, `/products/categories`; `POST/PUT/DELETE` (admin/vendor) |
| Orders | `GET /orders`, `/orders/:id`; `POST /orders`, `/orders/checkout`, `/orders/:id/{send,confirm,pickup,return,cancel}` |
| Invoices | `GET /invoices`, `/invoices/:id`; `POST /invoices`, `/invoices/:id/{post,pay}` |
| Pricelists | `GET/POST/PUT/DELETE /pricelists` (admin) |
| Dashboard | `GET /dashboard/stats`, `/dashboard/reports` (admin/vendor) |
| Settings | `GET/PUT /settings` |

All protected routes require `Authorization: Bearer <token>`. Roles are enforced
server-side; the auth middleware re-validates the user on every request.

---

## Available Scripts

**backend** — `npm run dev` (nodemon) · `npm start` · `npm run prisma:migrate` ·
`npm run prisma:studio` · `npm run db:seed`

**frontend** — `npm run dev` · `npm run build` · `npm run preview` · `npm run lint`
