# Rental Management System — What We're Building

Read this fully. If a judge stops at your seat and asks anything, the answer is in here. Everyone should be able to explain the big picture, not just their own part.

---

## In one line
We're building software that lets a rental business run its entire operation from one place — listing products for rent, taking orders, invoicing, collecting payments and security deposits, handling pickups and returns, and automatically charging late fees when a customer returns late.

Think of a shop that rents out furniture, electronics, or equipment. Right now they track all of this on paper or spread across different tools. Our system puts it in one screen.

---

## Who uses it (three types of users)

**Admin** — runs the whole platform. Sets up products, prices, deposit rules, and late-fee rules. Sees every order and all the reports. Only the admin can change settings or publish products.

**Vendor** — a business that lists its own products for rent and manages its own orders and reports. The admin oversees all vendors.

**Customer** — the person renting. They browse products on a website, pick how long they want to rent, pay, and return the product later.

---

## The one flow that explains everything (the rental lifecycle)

This is the heart of the app. If you understand this, you understand the whole project. It follows the exact same steps Odoo's real rental software uses.

1. **Product is created.** The admin adds a product for rent — say a projector — with its rental price, a security deposit, and a late-fee rate per hour.

2. **Quotation.** A customer wants to rent it. We create a quotation (a price offer) with the product and the rental period. Its status is *Quotation*.

3. **Quotation Sent.** We send it to the customer. Status becomes *Quotation Sent*.

4. **Confirmed → Sale Order.** The customer agrees. We confirm it, and the quotation becomes a confirmed *Rental Order* (also called a Sale Order). This is a real, committed booking now.

5. **Invoice.** We generate an invoice from the order. It starts as *Draft*, and once finalized it becomes *Posted*.

6. **Payment + Deposit.** The customer pays the rental amount plus a refundable security deposit. The deposit is held, not spent.

7. **Pickup.** The customer collects the product. Status becomes *Picked Up*.

8. **Return.** The customer brings it back.
   - If on time: the full security deposit is refunded.
   - If late: the system automatically calculates the late fee (hours late × the rate), **adds it as a new line on the order**, deducts it from the deposit, and refunds whatever is left.

9. **Dashboard updates.** Every step feeds the operations dashboard — total sales, deposits currently held, late fees collected, what's due today, what's overdue.

**The star feature:** the late fee is not just a number we show. When the admin clicks Return on a late order, the system adds a "Late Fees" line to the order by itself and settles it against the deposit. This is exactly how Odoo does it, and it's the thing that will impress the judges most.

**Example of the late-fee math:** a product rented for 4 hours but returned at 4.5 hours counts as 1 hour late (we round partial hours up). If the rate is 150 per hour, the late fee is 1 × 150 = 150, taken from the deposit.

---

## The main modules (the parts of the app)

**Authentication** — sign up, log in, forgot password. Passwords must be 6–12 characters with an uppercase letter, a lowercase letter, and a special character. Emails must be unique. Each user has a role that controls what they can see.

**Product Management** — create and manage products. Each product has a type (Goods, Service, or Rental), a rental price by period (hour/day/week/month), a security deposit, and a late-fee rate. Only the admin can publish or unpublish a product.

**Pricelists** — there's one default price list for all products, and the admin can create extra ones (for example, a discounted price list for a certain period).

**Orders (Quotations & Rental Orders)** — the full lifecycle above. Orders are shown in both a list view and a kanban (card) view. Each order has order lines: the products, quantities, prices, and totals.

**Invoicing** — turn a confirmed order into an invoice that moves from Draft to Posted, with a printable/downloadable copy for the customer.

**Payments & Deposits** — collect payment by cash, card, or UPI. Track the security deposit through its life: held, then refunded or partly deducted.

**Return & Late Fees** — mark products as returned, auto-calculate late fees, add them to the order, and settle the deposit.

**Operations Dashboard** — the admin's home screen. Shows sales, deposits held, late fees collected, rentals due today, overdue rentals, and upcoming pickups and returns, so the manager can see priorities at a glance.

**Customer Website** — the front-facing side. Customers browse products by category, open a product, choose a rental period, add to cart, check out (with delivery or store pickup), pay with the deposit, download their invoice, and view their past orders.

**Settings (Admin only)** — configure late-fee rules, deposit rules, grace period, and company details.

---

## How the data connects (say this if asked about the data model)

Everything centers on the **Rental Order**.

- A **User** (customer) places many **Rental Orders**.
- A **Vendor** owns many **Products**. Every product belongs to a **Category**.
- Each product has prices in one or more **Pricelists**.
- A **Rental Order** has many **Order Lines** — each line points to a product (or is a special line like a deposit or a late fee).
- A **Rental Order** produces one **Invoice**, which has its own **Invoice Lines**.
- A **Rental Order** has one or more **Payments** (for rent, deposit, or late fee).

If you can draw that on paper, you can answer almost any data question.

---

## Why we built it this way (the tech, in plain terms)

- **React + Ant Design (the screens):** Ant Design gives us professional, business-looking tables and forms out of the box, which is the exact style the judges want and saves us hours.
- **Node + Express (the backend):** same language as the frontend, and we structured it in clean layers — routing, then business logic, then data access — so it looks and behaves like real company software.
- **PostgreSQL (the database), running locally:** our data is highly connected (orders, products, invoices, payments), so a relational database fits perfectly. It's also the same database Odoo itself uses.
- **Prisma (the bridge to the database):** it keeps our entire data model in one readable file, which doubles as our data-model diagram — we can literally show it to a judge.

---

## If a judge asks "how would this scale for a real company?"
We kept it local for the hackathon, but the design is ready to grow: add caching for frequent reads, a background job queue for invoices and late-fee processing and notifications, move the database to a managed cluster, and containerize the app. Because the backend separates business logic from everything else, none of that would require rewriting the core logic.

---

## Who owns what (so you answer confidently about your part)

- **Tirth** — the order lifecycle, the deposit and late-fee logic, the dashboard, and the overall data model.
- **Man** — the admin screens (order list, order form, product form) and connecting the frontend to the backend.
- **Teammate 1** — the product and pricelist screens, and the data-model explanation.
- **Teammate 2** — the customer website and the demo walkthrough, plus loading realistic sample data.

Rule for everyone: know your own part deeply, and know the lifecycle and data model well enough to explain the whole thing. When a judge asks about your module, you lead; the rest back you up with the same story.
