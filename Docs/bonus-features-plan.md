# Bonus Features — What to Actually Build

**Rule before anything here:** bonuses count for nothing if the golden path (quotation → confirm → invoice → pay → pickup → late return → auto late-fee → deposit settled → dashboard) isn't rock solid. Finish that first. Only then touch this list, in the order below.

All nine are addressed. Most cost little because we compute them from data we already have — no cloud, no external services.

---

## TIER 1 — DO THESE (cheap, flashy, fully offline)

**1. Barcode / QR scanning  ← highest ROI, build this first**
Generate a QR code for every product and every order (a JS library, works offline). At pickup/return, scan it with the device camera (html5-qrcode, runs in the browser, no internet) and the order pops up — click Return. This is the single most impressive live-demo moment and it needs zero backend magic.
*Schema:* none — the QR just encodes an ID we already have.
*Bonus:* this also counts as "mobile-first rental operations" (see #7).

**2. KPI & business analytics**
We're already building the dashboard and reports — extend them with charts: revenue over time, most-rented products, product utilization %, late-return rate, deposits held vs collected, revenue by category. High visual impact, data's already there.
*Schema:* none — computed from orders.

**3. Customizable dashboard widgets**
Let the admin filter the dashboard by date range (Today / 7 days / month) and toggle which stat cards show. A light version (show/hide + date filter) looks custom without much work.
*Schema:* none — a frontend preference.

**4. Automatic customer reminders**
Auto-generate reminders for orders due for pickup/return soon or overdue, and show them in an in-app notification bell. "SO0005 due tomorrow," "SO0010 overdue." We do it in-app (not real email), so it's fully local and still demos as real.
*Schema:* small — a `Notification` table (userId, orderId, message, type, read).

---

## TIER 2 — DO IF AHEAD OF SCHEDULE (smart, computed, low risk)

**5. Product availability forecasting**
We already store each order's rental period. From that, show each product's next available date and its utilization %. Ties directly into the Rental Scheduler calendar we're building.
*Schema:* none — computed from order dates.

**6. Predictive maintenance suggestions**
Count how many times / how many hours each product has been rented. When it crosses a threshold, flag it: "Projector rented 50 times — schedule maintenance." Sounds like ML, is actually a counter and an if-statement. Fully local.
*Schema:* add `rentalCount` and `totalRentalHours` to Product (bump them on each return).

**7. Mobile-first rental operations**
Make the customer site and the QR pickup/return flow work well on a phone. The QR-scan-to-return flow (#1) done on a phone *is* the mobile rental operation — so this is mostly free once #1 exists, plus responsive polish on the customer pages.
*Schema:* none.

---

## TIER 3 — SKIP (external dependencies or gimmicky; only fake if you're bored and way ahead)

**8. Smart pickup route optimization**
Real routing needs maps + geocoding, which means external APIs — against our local-only setup and a time sink. If you want the checkbox, fake it: sort today's pickups/deliveries by area/pincode and show them as an ordered "pickup route" list. No map, no external call. Otherwise skip.

**9. IoT-enabled asset tracking**
There's no real IoT in a 24-hour hackathon. Anything here is a simulated fake (a made-up "device status" field), which judges can see through and may probe. Skip it unless you have hours to burn — and even then it's the weakest item on the list.

---

## Build order for bonuses (after golden path is green)
1. QR scan (pickup/return) — biggest wow, offline, doubles as mobile
2. Analytics charts on the dashboard
3. In-app reminders (notification bell)
4. Dashboard date-filter / widget toggles
5. Availability forecast + predictive maintenance (both just computed from data)
6. Mobile polish
7. (only if bored) fake pickup-route list

## Schema hooks to add now so bonuses aren't bolt-ons later
- `Notification` table (for reminders)
- `Product.rentalCount`, `Product.totalRentalHours` (for predictive maintenance)
- Everything else is computed or frontend-only — no schema needed.

**Bottom line:** QR scanning + analytics charts + in-app reminders alone cover four of the nine bonuses, look genuinely impressive, and run entirely offline. That's where your bonus time should go.
