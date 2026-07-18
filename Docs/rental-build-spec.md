# Rental Management — Build Spec (from the Odoo mockup)

**Core truth:** the mockup is a rebuild of **Odoo's Rental module**. Judges are Odoo people. Mirror Odoo's exact conventions and you win. Build ONE flawless end-to-end lifecycle before anything else.

---

## THE GOLDEN PATH (must work flawlessly — this is 70% of the score)
This single flow demonstrates the entire business lifecycle. Build and protect it first.

1. Admin/Vendor creates a **Product** (type = Rental) with rental price, **security deposit**, **late-fee/hour**
2. Admin creates a **Quotation** for a customer → add product + rental period (order lines)
3. **Send** → status `Quotation Sent`
4. **Confirm** → becomes **Sale Order / Rental Order** (status `Confirmed`)
5. **Create Invoice** → `Draft` → **Post** → `Posted`
6. Collect **Payment + Deposit**
7. **Pickup** → status `Picked Up`
8. **Return** → if late: system **auto-adds a "Late Fees" order line** = `hours_late × rate`, **deducts from deposit, refunds the rest**
9. **Dashboard** updates: Sales, Deposits Held, Late Fees Collected, Due Today, Overdue

If only this works with the exact Odoo state names + the auto late-fee line, you place well.

---

## ODOO-FIDELITY CHECKLIST (these specific details are the differentiators)
- [ ] Order states named exactly: **Quotation → Quotation Sent → Sale Order (Rental Order) → Picked Up → Returned / Cancelled**
- [ ] Invoice states: **Draft → Posted**
- [ ] **Late fee auto-added as an order line** on Return (not just a number) — `hours_late × late_fee_per_hour`, round partial hours UP (4.5h vs 4h rented = 1h late)
- [ ] **Deposit added as a service line / tracked**, held until return, then refunded or deducted
- [ ] Order form with **order lines**: "Add a Product" / "Add a note", Product / Qty / Unit / Unit Price / Taxes / Amount, Untaxed + Taxes + Total
- [ ] Product Type field: **Goods / Service / Rental**
- [ ] **Pricelist**: one default for all products + ability to create custom ones (per hour/day/night/week/month)
- [ ] Orders shown in **List + Kanban** view (view switcher)
- [ ] Backend sidebar: **Orders / Schedule / Products / Reports / Settings**
- [ ] **Settings visible to Admin only**; late-fee config lives there

---

## DATA MODEL (draw this ER diagram — Prisma-ready)
Spine = **RentalOrder** with a status state machine.

- **User** — name, email(unique), passwordHash, **role: ADMIN | VENDOR | CUSTOMER**, phone, gstNo, address, companyName
- **Category** — name (product category dropdown)
- **Product** — name, **type: GOODS|SERVICE|RENTAL**, categoryId, vendorId, images, salesPrice, costPrice, qtyOnHand, **securityDeposit**, **periodicity: HOUR|DAY|NIGHT|WEEK|MONTH**, pickupTime, returnTime, **lateFeePerHour**, published(bool)
- **ProductAttribute** — productId, name(Brand/Color/Size), displayType: RADIO|PILLS  *(bonus)*
- **ProductAttributeValue** — attributeId, value  *(bonus)*
- **Pricelist** — name, isDefault, validFrom, validTo
- **PricelistItem** — pricelistId, productId, period, price
- **RentalOrder** — reference(SO000x), customerId, vendorId, **status**, invoiceStatus(NOTHING_TO_INVOICE|INVOICED), rentalStart, rentalEnd, actualReturn, pickupType(DELIVERY|STORE), deliveryAddress, invoiceAddress, pricelistId, untaxed, tax, total, **depositAmount, depositStatus: HELD|REFUNDED|DEDUCTED**
- **RentalOrderLine** — orderId, productId(nullable), **lineType: RENTAL|DEPOSIT|LATE_FEE|NOTE**, description, qty, unit, unitPrice, taxPct, subtotal, rentalStart, rentalEnd
- **Invoice** — reference(INV/2026/000x), orderId, customerId, **status: DRAFT|POSTED**, invoiceDate, untaxed, tax, total
- **InvoiceLine** — invoiceId, productId, description, qty, unit, unitPrice, taxPct, amount
- **Payment** — orderId, amount, **method: CASH|CARD|UPI|WALLET**, **type: RENTAL|DEPOSIT|LATE_FEE**, date
- **Settings** — lateFeeEnabled, defaultLateFeePerHour, gracePeriod, defaultDepositPct, companyName

**Relations to say out loud:** User(customer) 1–* Order · User(vendor) 1–* Product · Category 1–* Product · Product 1–* PricelistItem *–1 Pricelist · Order 1–* OrderLine *–0..1 Product · Order 1–0..1 Invoice 1–* InvoiceLine · Order 1–* Payment.

**Late-fee engine (the money shot):** on Return, if `actualReturn > rentalEnd` → `lateHours = ceil(diff in hours)`, `lateFee = lateHours × product.lateFeePerHour`, insert `OrderLine(lineType=LATE_FEE)`, recompute total, `deposit -= lateFee`, refund remainder.

---

## PRIORITY TIERS

**MUST (golden path + backend star):**
Auth+roles · Product mgmt (Rental type, deposit, late fee, pricing) · Order lifecycle w/ order lines · Invoice Draft→Posted · Payment+deposit · Return w/ auto late-fee line + deposit settlement · Operations Dashboard · Order List+Kanban

**SHOULD:**
Customer frontend (browse → product page → rental period → cart → checkout delivery/store → pay+deposit → download invoice → my orders) · Pricelists (default+custom) · Realistic seed data

**BONUS (only if ahead):**
Rental Scheduler calendar · Attributes & Variants (variant-picker dialog on add-to-cart) · Quotation Templates · Reports PDF/Excel export · Separate vendor reporting

---

## ROLES (mapped to this build)
- **Tirth — architect + order engine.** RentalOrder state machine, invoice, **deposit + late-fee auto-line logic**, dashboard aggregation, ER diagram. The crown jewels — don't delegate the money logic.
- **Man — backend admin UI + wiring.** Odoo-style order list/kanban, order form with lines, product form. Second hardest.
- **Teammate 1 — Product + Pricelist module.** Product create form (tabs: General / Rental / Pricelist), product list. Self-contained + understandable. Becomes the **ER-diagram explainer** for judges.
- **Teammate 2 — Customer frontend + demo.** Browse/product/cart/checkout (mostly read screens + one order-create call to the same backend). Owns **realistic seed data** + is the **demo walker**. Visually big, logically simple — safe for a newer member with Claude Code.

Auth is scaffolded early by Tirth, shared by all.

---

## STACK (locked)
React + **Ant Design** (Odoo-style admin tables/forms/kanban out of the box — change theme color off default blue) · Node + Express, layered `routes→controllers→services→prisma` · **PostgreSQL local** + **Prisma** (schema.prisma = your "how data connects" answer, show it to judges).

## Auth rules from the mockup (implement exactly)
Email unique · password 6–12 chars w/ upper+lower+special(@ $ & _) · Password==Confirm · wrong creds → "Invalid User ID or Password" · Forgot Password → reset page → "reset link sent" message.

## Sequencing note
Hour 1 = paper (ER diagram + assign modules). Then Tirth scaffolds + builds the order engine while Man builds admin UI. Get the golden path green EARLY, then layer customer frontend + polish + seed data. Bonus features only after golden path is bulletproof.
