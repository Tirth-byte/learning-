# The Whole App, Explained Simply

## The one-sentence idea
Our app is like a shop that rents things out. Think of a bike rental stand: you borrow a bike, you leave a little money as a deposit so they trust you, you bring the bike back on time, and if you're late you pay a small fine. Our app does exactly this — but for any rental business, and it runs the whole thing on a computer instead of on paper.

Keep that picture in your head the whole time:
- **Renting a thing** = a rental order
- **The money you leave behind** = the security deposit
- **The fine for being late** = the late fee
- **Bringing it back** = the return

Everything in the app is just those four ideas dressed up.

---

## The app has two sides

**Side 1 — The Customer Website (the shopfront).**
This is what a normal customer sees. It looks like any online shop. They browse things, pick one, choose how long to rent it, pay, and later return it.

**Side 2 — The Admin Backend (the shop's office computer).**
This is what the shop staff (admin/vendor) use. It's where they add products, handle orders, make invoices, take deposits, and mark things as picked up or returned. It looks like proper business software, not a shop.

Same app, two doors. Which door you get depends on who logs in.

---

## Part 1: The Customer Website — page by page

**1. Splash screen**
The little welcome screen when the app opens. Just a logo for a second.

**2. Login page**
You type your email and password to get in. If they're wrong, it says "Invalid User ID or Password."

**3. Sign-up page**
New customers make an account here. They enter name, email, password. Rules: email must be new (not already used), password must be 6–12 characters with a capital letter, a small letter, and a special character like @ or $.

**4. Reset password page**
If you forgot your password, you enter your email and it says "a reset link has been sent to your email."

**5. Home page**
The shop's main page. It shows all the products you can rent, a search bar, and a dropdown of categories (like Electronics, Furniture). This is where the customer starts looking.

**6. Product page**
You click a product and see its details: pictures, description, and the price to rent it (per hour, per day, per week). Here you choose your rental period — when you'll take it and when you'll return it — and click "Add to Cart." If the product has choices (like colors or sizes), a little box pops up to pick one.

**7. Cart / Order summary**
Shows everything you're about to rent, the rental dates, and the total price. You can remove items or save them for later.

**8. Checkout — done in three steps (you see a breadcrumb: Order → Address → Payment)**
- *Order:* confirm what you're renting.
- *Address:* choose home delivery (enter your address) or pick it up from the store yourself.
- *Payment:* pay the rental price plus the security deposit, using card or UPI.

**9. Payment success page**
Says "Your payment has been processed" and "Thank you for your order." You can download your invoice (a printable bill).

**10. My Account pages**
Where a customer manages their own stuff: My Orders (past and current rentals), My Profile (name, photo, address), Wishlist (saved items), Settings, and Logout.

---

## Part 2: The Admin Backend — page by page

The office side. It has a menu on the side with: **Orders, Schedule, Products, Reports, Settings.**

**1. Dashboard**
The staff's home screen — a quick health check of the business. Big number cards show: total Sales, Deposits currently Held, Late Fees collected, and what's happening Today vs the Last 7 Days. It also shows what's due for pickup and return. One glance tells the manager what needs attention.

**2. Orders list**
A table of every rental order: order number, customer, pickup date, return date, status, and total. You can view it as a list or as a kanban (cards grouped by status). The status of each order is one of: Quotation → Quotation Sent → Sale Order (confirmed) → Picked Up → Returned, or Cancelled.

**3. Order form (the most important screen)**
This is where a rental is built and moved through its life. It shows the customer, the rental period, and the order lines (each product being rented, its quantity, price, and total, plus "Add a Product" and "Add a note" buttons). At the top are action buttons that change depending on the stage:
- *Send* — sends the quotation to the customer (status → Quotation Sent)
- *Confirm* — turns the quotation into a real Rental Order
- *Create Invoice* — makes the bill
- *Pickup* — marks the product as collected
- *Return* — marks it returned, and if it's late, the app automatically adds a "Late Fees" line here and takes it out of the deposit.

**4. Invoice page**
The bill made from an order. It starts as *Draft* and becomes *Posted* once finalized. Staff can print it, send it, or record a payment against it.

**5. Products list + Product form**
Where staff add and manage products. The product form has tabs:
- *General* — name, category, price, images.
- *Rental* — how it's rented (per hour/day/night/week), the security deposit amount, and the late-fee rate per hour.
- *Attributes & Variants* — options like Brand, Color, Size.
- *Sales* — extra sales settings.
Only the admin can publish a product (make it visible to customers).

**6. Pricelists**
A price list is a set of prices. There's one default list used for all products, and staff can make extra ones — for example, a special discounted list for a certain time period.

**7. Quotation Template**
A ready-made quotation the staff can reuse, so they don't rebuild a common quote from scratch every time.

**8. Rental Scheduler (calendar)**
A calendar showing which products are booked on which days, and which are free — plus pickups, returns, and anything running late. It helps staff see the whole month at a glance.

**9. Reports**
Business reports the admin can view and export as PDF or Excel — sales, late fees, and so on. Admins see everything; individual vendors only see their own.

**10. Settings / Configuration (admin only)**
Where the rules live: late-fee amount, grace period, deposit rules, and company details. Regular users can't see this.

---

## Part 3: The whole workflow as one short story

Follow one projector through the system. This is the story to tell a judge.

1. **The admin adds the projector** as a product — rental price, a security deposit, and a late-fee rate per hour.
2. **A customer wants it.** Either the customer books it on the website, or the staff make a **quotation** for them in the office.
3. **The quotation is sent** to the customer (status: Quotation Sent).
4. **The customer agrees, and staff confirm it.** The quotation becomes a real **Rental Order**.
5. **Staff create an invoice** (the bill). It goes from Draft to Posted.
6. **The customer pays** the rental price plus the refundable **security deposit**. The deposit is held safely, not spent.
7. **The customer picks up the projector** (status: Picked Up).
8. **The customer returns it.**
   - On time → they get their full deposit back.
   - Late → the app works out the fine (hours late × the rate), **adds it as a new line on the order by itself**, takes it from the deposit, and refunds whatever's left. Example: rented for 4 hours, returned at 4.5 hours = 1 hour late; at 150 per hour, that's a 150 fine from the deposit.
9. **The dashboard updates** — the sale, the deposit, and any late fee all show up in the numbers.

That's the entire app. Every screen exists to support one of those nine steps.

---

## The one thing to never forget
The clever part — the part that wins — is step 8: **when a return is late, the system adds the late fee to the order automatically and settles it against the deposit.** Most people would just show a number. We actually add the line and refund the rest. That is exactly how the real Odoo software does it, and it's what tells the judges we truly understood the business.
