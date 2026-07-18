const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean the database in correct order
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.rentalOrderLine.deleteMany();
  await prisma.rentalOrder.deleteMany();
  await prisma.pricelistItem.deleteMany();
  await prisma.pricelist.deleteMany();
  await prisma.productAttributeValue.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleared.');

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const vendorPasswordHash = await bcrypt.hash('Vendor@123', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@rental.com',
      passwordHash: adminPasswordHash,
      name: 'Tirth Patel (Admin)',
      role: 'ADMIN',
      phone: '9876543210',
      companyName: 'Odoo Rent India',
      address: '101, Corporate Hub, SG Highway, Ahmedabad',
      gstNo: '24AAACO1234A1Z1',
    },
  });

  const vendor1 = await prisma.user.create({
    data: {
      email: 'vendor1@rental.com',
      passwordHash: vendorPasswordHash,
      name: 'ElectroRent Solutions',
      role: 'VENDOR',
      phone: '9988776655',
      companyName: 'ElectroRent Solutions',
      address: '402, Tech Plaza, Bangalore',
      gstNo: '29BBBCO5678B2Z2',
    },
  });

  const vendor2 = await prisma.user.create({
    data: {
      email: 'vendor2@rental.com',
      passwordHash: vendorPasswordHash,
      name: 'OfficeEase Furniture',
      role: 'VENDOR',
      phone: '9988776644',
      companyName: 'OfficeEase Furniture Ltd',
      address: '701, Furniture Park, Kirti Nagar, Delhi',
      gstNo: '07CCCCO9012C3Z3',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@rental.com',
      passwordHash: customerPasswordHash,
      name: 'Aarav Sharma',
      role: 'CUSTOMER',
      phone: '9876543211',
      address: 'A-45, Shanti Nagar, Bangalore',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@rental.com',
      passwordHash: customerPasswordHash,
      name: 'Priya Patel',
      role: 'CUSTOMER',
      phone: '9876543212',
      address: 'B-12, Green Acres, Ahmedabad',
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      email: 'customer3@rental.com',
      passwordHash: customerPasswordHash,
      name: 'Rahul Verma',
      role: 'CUSTOMER',
      phone: '9876543213',
      address: 'C-78, Safdarjung Enclave, Delhi',
    },
  });

  console.log('Users created.');

  // 4. Create Categories
  const catElectronics = await prisma.category.create({ data: { name: 'Electronics' } });
  const catFurniture = await prisma.category.create({ data: { name: 'Furniture' } });
  const catEquipment = await prisma.category.create({ data: { name: 'Equipment' } });

  console.log('Categories created.');

  // 5. Create Products
  const p1 = await prisma.product.create({
    data: {
      name: 'Epson EF-100 Smart Projector',
      type: 'RENTAL',
      categoryId: catElectronics.id,
      vendorId: vendor1.id,
      salesPrice: 500.0,
      costPrice: 350.0,
      qtyOnHand: 5,
      securityDeposit: 2000.0,
      periodicity: 'DAY',
      pickupTime: '10:00 AM',
      returnTime: '06:00 PM',
      lateFeePerHour: 150.0,
      published: true,
      images: ['https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500'],
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'MacBook Pro 16-inch M3',
      type: 'RENTAL',
      categoryId: catElectronics.id,
      vendorId: vendor1.id,
      salesPrice: 1500.0,
      costPrice: 1000.0,
      qtyOnHand: 3,
      securityDeposit: 5000.0,
      periodicity: 'DAY',
      pickupTime: '09:30 AM',
      returnTime: '06:30 PM',
      lateFeePerHour: 300.0,
      published: true,
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'],
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'JBL PartyBox 310 Speaker',
      type: 'RENTAL',
      categoryId: catElectronics.id,
      vendorId: vendor1.id,
      salesPrice: 800.0,
      costPrice: 500.0,
      qtyOnHand: 8,
      securityDeposit: 3000.0,
      periodicity: 'DAY',
      pickupTime: '10:00 AM',
      returnTime: '08:00 PM',
      lateFeePerHour: 200.0,
      published: true,
      images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500'],
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Ergonomic Office Chair',
      type: 'RENTAL',
      categoryId: catFurniture.id,
      vendorId: vendor2.id,
      salesPrice: 100.0,
      costPrice: 70.0,
      qtyOnHand: 25,
      securityDeposit: 500.0,
      periodicity: 'DAY',
      pickupTime: '09:00 AM',
      returnTime: '06:00 PM',
      lateFeePerHour: 25.0,
      published: true,
      images: ['https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500'],
    },
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'Executive Wooden Desk',
      type: 'RENTAL',
      categoryId: catFurniture.id,
      vendorId: vendor2.id,
      salesPrice: 200.0,
      costPrice: 120.0,
      qtyOnHand: 10,
      securityDeposit: 1000.0,
      periodicity: 'DAY',
      pickupTime: '09:00 AM',
      returnTime: '06:00 PM',
      lateFeePerHour: 50.0,
      published: true,
      images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500'],
    },
  });

  const p6 = await prisma.product.create({
    data: {
      name: 'Honda EU2200i Portable Generator',
      type: 'RENTAL',
      categoryId: catEquipment.id,
      vendorId: vendor1.id,
      salesPrice: 1200.0,
      costPrice: 800.0,
      qtyOnHand: 4,
      securityDeposit: 4000.0,
      periodicity: 'DAY',
      pickupTime: '08:00 AM',
      returnTime: '05:00 PM',
      lateFeePerHour: 250.0,
      published: true,
      images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500'],
    },
  });

  console.log('Products created.');

  // 6. Create Product Attributes (for variants)
  const attrColor = await prisma.productAttribute.create({
    data: {
      productId: p4.id,
      name: 'Color',
      displayType: 'PILLS',
    },
  });

  await prisma.productAttributeValue.createMany({
    data: [
      { attributeId: attrColor.id, value: 'Black' },
      { attributeId: attrColor.id, value: 'Grey' },
      { attributeId: attrColor.id, value: 'Blue' },
    ],
  });

  console.log('Product variants created.');

  // 7. Create Pricelists
  const publicPricelist = await prisma.pricelist.create({
    data: {
      name: 'Public Pricelist',
      isDefault: true,
    },
  });

  const weekendPricelist = await prisma.pricelist.create({
    data: {
      name: 'Weekend Promo Pricelist (20% off Electronics)',
      isDefault: false,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
    },
  });

  // Create pricelist items
  await prisma.pricelistItem.createMany({
    data: [
      { pricelistId: publicPricelist.id, productId: p1.id, period: 'DAY', price: 500.0 },
      { pricelistId: publicPricelist.id, productId: p2.id, period: 'DAY', price: 1500.0 },
      { pricelistId: publicPricelist.id, productId: p3.id, period: 'DAY', price: 800.0 },
      { pricelistId: weekendPricelist.id, productId: p1.id, period: 'DAY', price: 400.0 }, // 20% off
      { pricelistId: weekendPricelist.id, productId: p2.id, period: 'DAY', price: 1200.0 }, // 20% off
      { pricelistId: weekendPricelist.id, productId: p3.id, period: 'DAY', price: 640.0 }, // 20% off
    ],
  });

  console.log('Pricelists created.');

  // 8. Settings
  await prisma.settings.create({
    data: {
      companyName: 'Odoo Rent India',
      lateFeeEnabled: true,
      defaultLateFeePerHour: 100.0,
      gracePeriod: 15,
      defaultDepositPct: 20.0,
    },
  });

  console.log('Settings created.');

  // Helper date generators relative to today
  const now = new Date();
  const getRelativeDate = (days, hours = 0, mins = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours);
    d.setMinutes(d.getMinutes() + mins);
    return d;
  };
  // Absolute time on *today's* date, independent of the current clock time — used so
  // "due today" examples land inside today's window no matter when the seed is run.
  const todayAt = (hour) => {
    const d = new Date(now);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  // 9. Rental Orders & lines
  // Order 1: QUOTATION (Aarav Sharma - Projector, future)
  const order1 = await prisma.rentalOrder.create({
    data: {
      reference: 'SO0001',
      createdAt: getRelativeDate(0), // today
      customerId: customer1.id,
      vendorId: vendor1.id,
      status: 'QUOTATION',
      invoiceStatus: 'NOTHING_TO_INVOICE',
      rentalStart: getRelativeDate(5, 10),
      rentalEnd: getRelativeDate(8, 18),
      untaxed: 1500.0, // 3 days @ 500/day
      tax: 270.0, // 18%
      total: 1770.0,
      depositAmount: 2000.0,
      depositStatus: 'HELD',
      pricelistId: publicPricelist.id,
      lines: {
        create: [
          {
            productId: p1.id,
            lineType: 'RENTAL',
            description: 'Epson EF-100 Smart Projector',
            qty: 1,
            unit: 'Units',
            unitPrice: 500.0,
            taxPct: 18.0,
            subtotal: 1500.0,
            rentalStart: getRelativeDate(5, 10),
            rentalEnd: getRelativeDate(8, 18),
          },
          {
            lineType: 'DEPOSIT',
            description: 'Refundable Security Deposit',
            qty: 1,
            unit: 'Units',
            unitPrice: 2000.0,
            taxPct: 0.0,
            subtotal: 2000.0,
          },
        ],
      },
    },
  });

  // Order 2: QUOTATION_SENT (Priya Patel - Chairs, future)
  const order2 = await prisma.rentalOrder.create({
    data: {
      reference: 'SO0002',
      createdAt: getRelativeDate(-1), // yesterday
      customerId: customer2.id,
      vendorId: vendor2.id,
      status: 'QUOTATION_SENT',
      invoiceStatus: 'NOTHING_TO_INVOICE',
      rentalStart: getRelativeDate(2, 9),
      rentalEnd: getRelativeDate(7, 18),
      untaxed: 1000.0, // 2 chairs * 5 days @ 100/day = 1000
      tax: 180.0,
      total: 1180.0,
      depositAmount: 1000.0, // 500 deposit * 2 = 1000
      depositStatus: 'HELD',
      pricelistId: publicPricelist.id,
      lines: {
        create: [
          {
            productId: p4.id,
            lineType: 'RENTAL',
            description: 'Ergonomic Office Chair (Black)',
            qty: 2,
            unit: 'Units',
            unitPrice: 100.0,
            taxPct: 18.0,
            subtotal: 1000.0,
            rentalStart: getRelativeDate(2, 9),
            rentalEnd: getRelativeDate(7, 18),
          },
          {
            lineType: 'DEPOSIT',
            description: 'Refundable Security Deposit',
            qty: 1,
            unit: 'Units',
            unitPrice: 1000.0,
            taxPct: 0.0,
            subtotal: 1000.0,
          },
        ],
      },
    },
  });

  // Order 3: CONFIRMED (Rahul Verma - JBL Speaker, active)
  const order3 = await prisma.rentalOrder.create({
    data: {
      reference: 'SO0003',
      createdAt: getRelativeDate(0), // today — counts in Today / 7 days / 30 days
      customerId: customer3.id,
      vendorId: vendor1.id,
      status: 'CONFIRMED',
      invoiceStatus: 'INVOICED',
      rentalStart: getRelativeDate(-1, 10), // started yesterday
      rentalEnd: getRelativeDate(1, 18),   // ends tomorrow
      untaxed: 1600.0, // 2 days @ 800/day
      tax: 288.0,
      total: 1888.0,
      depositAmount: 3000.0,
      depositStatus: 'HELD',
      pricelistId: publicPricelist.id,
      lines: {
        create: [
          {
            productId: p3.id,
            lineType: 'RENTAL',
            description: 'JBL PartyBox 310 Speaker',
            qty: 1,
            unit: 'Units',
            unitPrice: 800.0,
            taxPct: 18.0,
            subtotal: 1600.0,
            rentalStart: getRelativeDate(-1, 10),
            rentalEnd: getRelativeDate(1, 18),
          },
          {
            lineType: 'DEPOSIT',
            description: 'Refundable Security Deposit',
            qty: 1,
            unit: 'Units',
            unitPrice: 3000.0,
            taxPct: 0.0,
            subtotal: 3000.0,
          },
        ],
      },
    },
  });

  // Create posted invoice for Confirmed order
  const invoice3 = await prisma.invoice.create({
    data: {
      reference: 'INV/2026/0001',
      orderId: order3.id,
      customerId: customer3.id,
      status: 'POSTED',
      invoiceDate: getRelativeDate(-1, 10),
      untaxed: 1600.0,
      tax: 288.0,
      total: 1888.0,
      lines: {
        create: [
          {
            productId: p3.id,
            description: 'JBL PartyBox 310 Speaker (Rental - 2 Days)',
            qty: 1,
            unit: 'Units',
            unitPrice: 800.0,
            taxPct: 18.0,
            amount: 1600.0,
          },
        ],
      },
    },
  });

  // Payments for Confirmed order
  await prisma.payment.createMany({
    data: [
      { orderId: order3.id, amount: 1888.0, method: 'UPI', type: 'RENTAL', date: getRelativeDate(-1, 10) },
      { orderId: order3.id, amount: 3000.0, method: 'UPI', type: 'DEPOSIT', date: getRelativeDate(-1, 10) },
    ],
  });

  // Order 4: PICKED_UP (Aarav Sharma - MacBook Pro, active)
  const order4 = await prisma.rentalOrder.create({
    data: {
      reference: 'SO0004',
      createdAt: getRelativeDate(-4), // 4 days ago — counts in 7 days / 30 days, not Today
      customerId: customer1.id,
      vendorId: vendor1.id,
      status: 'PICKED_UP',
      invoiceStatus: 'INVOICED',
      rentalStart: getRelativeDate(-2, 9), // started 2 days ago
      rentalEnd: getRelativeDate(1, 18),   // ends tomorrow
      untaxed: 4500.0, // 3 days @ 1500/day
      tax: 810.0,
      total: 5310.0,
      depositAmount: 5000.0,
      depositStatus: 'HELD',
      pricelistId: publicPricelist.id,
      lines: {
        create: [
          {
            productId: p2.id,
            lineType: 'RENTAL',
            description: 'MacBook Pro 16-inch M3',
            qty: 1,
            unit: 'Units',
            unitPrice: 1500.0,
            taxPct: 18.0,
            subtotal: 4500.0,
            rentalStart: getRelativeDate(-2, 9),
            rentalEnd: getRelativeDate(1, 18),
          },
          {
            lineType: 'DEPOSIT',
            description: 'Refundable Security Deposit',
            qty: 1,
            unit: 'Units',
            unitPrice: 5000.0,
            taxPct: 0.0,
            subtotal: 5000.0,
          },
        ],
      },
    },
  });

  // Create posted invoice for Picked Up order
  await prisma.invoice.create({
    data: {
      reference: 'INV/2026/0002',
      orderId: order4.id,
      customerId: customer1.id,
      status: 'POSTED',
      invoiceDate: getRelativeDate(-2, 9),
      untaxed: 4500.0,
      tax: 810.0,
      total: 5310.0,
      lines: {
        create: [
          {
            productId: p2.id,
            description: 'MacBook Pro 16-inch M3 (Rental - 3 Days)',
            qty: 1,
            unit: 'Units',
            unitPrice: 1500.0,
            taxPct: 18.0,
            amount: 4500.0,
          },
        ],
      },
    },
  });

  // Payments for Picked Up order
  await prisma.payment.createMany({
    data: [
      { orderId: order4.id, amount: 5310.0, method: 'CARD', type: 'RENTAL', date: getRelativeDate(-2, 9) },
      { orderId: order4.id, amount: 5000.0, method: 'CARD', type: 'DEPOSIT', date: getRelativeDate(-2, 9) },
    ],
  });

  // Order 5: RETURNED - ON TIME (Priya Patel - Wooden Desk, past)
  const order5 = await prisma.rentalOrder.create({
    data: {
      reference: 'SO0005',
      createdAt: getRelativeDate(-15), // 15 days ago — counts in 30 days only
      customerId: customer2.id,
      vendorId: vendor2.id,
      status: 'RETURNED',
      invoiceStatus: 'INVOICED',
      rentalStart: getRelativeDate(-10, 9),
      rentalEnd: getRelativeDate(-7, 18),
      actualReturn: getRelativeDate(-7, 17, 30), // returned 30 mins early
      untaxed: 600.0, // 3 days @ 200/day
      tax: 108.0,
      total: 708.0,
      depositAmount: 1000.0,
      depositStatus: 'REFUNDED',
      pricelistId: publicPricelist.id,
      lines: {
        create: [
          {
            productId: p5.id,
            lineType: 'RENTAL',
            description: 'Executive Wooden Desk',
            qty: 1,
            unit: 'Units',
            unitPrice: 200.0,
            taxPct: 18.0,
            subtotal: 600.0,
            rentalStart: getRelativeDate(-10, 9),
            rentalEnd: getRelativeDate(-7, 18),
          },
          {
            lineType: 'DEPOSIT',
            description: 'Refundable Security Deposit',
            qty: 1,
            unit: 'Units',
            unitPrice: 1000.0,
            taxPct: 0.0,
            subtotal: 1000.0,
          },
        ],
      },
    },
  });

  // Invoice for returned on-time order
  await prisma.invoice.create({
    data: {
      reference: 'INV/2026/0003',
      orderId: order5.id,
      customerId: customer2.id,
      status: 'POSTED',
      invoiceDate: getRelativeDate(-10, 9),
      untaxed: 600.0,
      tax: 108.0,
      total: 708.0,
      lines: {
        create: [
          {
            productId: p5.id,
            description: 'Executive Wooden Desk (Rental - 3 Days)',
            qty: 1,
            unit: 'Units',
            unitPrice: 200.0,
            taxPct: 18.0,
            amount: 600.0,
          },
        ],
      },
    },
  });

  // Payments for returned on-time order
  await prisma.payment.createMany({
    data: [
      { orderId: order5.id, amount: 708.0, method: 'CASH', type: 'RENTAL', date: getRelativeDate(-10, 9) },
      { orderId: order5.id, amount: 1000.0, method: 'CASH', type: 'DEPOSIT', date: getRelativeDate(-10, 9) },
      { orderId: order5.id, amount: -1000.0, method: 'CASH', type: 'DEPOSIT', date: getRelativeDate(-7, 17, 30) }, // refunded deposit
    ],
  });

  // Update product stats
  await prisma.product.update({
    where: { id: p5.id },
    data: {
      rentalCount: 1,
      totalRentalHours: 80, // roughly 3.3 days
    },
  });

  // Order 6: RETURNED - LATE (Rahul Verma - Projector, past)
  // Rental End: 2 days ago at 18:00
  // Actual Return: 2 days ago at 22:30 (4.5 hours late -> rounded to 5 hours late)
  // Late fee: 5h * 150 = 750 untaxed. Tax = 135 (18%). Total late fee = 885.
  // Original rental: 2 days @ 500/day = 1000 untaxed. Tax = 180. Total = 1180.
  // Combined order total: untaxed = 1750, tax = 315, total = 2065.
  // Deposit Amount: 2000. Late fee deducted from deposit.
  // Settle deposit: refund = 2000 - 885 = 1115. Deposit Status: DEDUCTED.
  const order6 = await prisma.rentalOrder.create({
    data: {
      reference: 'SO0006',
      createdAt: getRelativeDate(-22), // 22 days ago — counts in 30 days only
      customerId: customer3.id,
      vendorId: vendor1.id,
      status: 'RETURNED',
      invoiceStatus: 'INVOICED',
      rentalStart: getRelativeDate(-4, 10),
      rentalEnd: getRelativeDate(-2, 18),
      actualReturn: getRelativeDate(-2, 22, 30),
      untaxed: 1750.0, // 1000 (rental) + 750 (late fee)
      tax: 315.0,     // 180 (rental tax) + 135 (late fee tax)
      total: 2065.0,  // 1180 + 885
      depositAmount: 2000.0,
      depositStatus: 'DEDUCTED',
      pricelistId: publicPricelist.id,
      lines: {
        create: [
          {
            productId: p1.id,
            lineType: 'RENTAL',
            description: 'Epson EF-100 Smart Projector',
            qty: 1,
            unit: 'Units',
            unitPrice: 500.0,
            taxPct: 18.0,
            subtotal: 1000.0,
            rentalStart: getRelativeDate(-4, 10),
            rentalEnd: getRelativeDate(-2, 18),
          },
          {
            lineType: 'DEPOSIT',
            description: 'Refundable Security Deposit',
            qty: 1,
            unit: 'Units',
            unitPrice: 2000.0,
            taxPct: 0.0,
            subtotal: 2000.0,
          },
          {
            productId: p1.id,
            lineType: 'LATE_FEE',
            description: 'Late Return Fee - 5 Hours @ 150.00/hr',
            qty: 5,
            unit: 'Hours',
            unitPrice: 150.0,
            taxPct: 18.0,
            subtotal: 750.0,
            rentalStart: getRelativeDate(-2, 18),
            rentalEnd: getRelativeDate(-2, 22, 30),
          },
        ],
      },
    },
  });

  // Invoice for returned late order
  await prisma.invoice.create({
    data: {
      reference: 'INV/2026/0004',
      orderId: order6.id,
      customerId: customer3.id,
      status: 'POSTED',
      invoiceDate: getRelativeDate(-4, 10),
      untaxed: 1750.0,
      tax: 315.0,
      total: 2065.0,
      lines: {
        create: [
          {
            productId: p1.id,
            description: 'Epson EF-100 Smart Projector (Rental - 2 Days)',
            qty: 1,
            unit: 'Units',
            unitPrice: 500.0,
            taxPct: 18.0,
            amount: 1000.0,
          },
          {
            productId: p1.id,
            description: 'Late Return Fee - 5 Hours @ 150.00/hr',
            qty: 5,
            unit: 'Hours',
            unitPrice: 150.0,
            taxPct: 18.0,
            amount: 750.0,
          },
        ],
      },
    },
  });

  // Payments for returned late order
  await prisma.payment.createMany({
    data: [
      { orderId: order6.id, amount: 1180.0, method: 'UPI', type: 'RENTAL', date: getRelativeDate(-4, 10) },
      { orderId: order6.id, amount: 2000.0, method: 'UPI', type: 'DEPOSIT', date: getRelativeDate(-4, 10) },
      { orderId: order6.id, amount: 885.0, method: 'UPI', type: 'LATE_FEE', date: getRelativeDate(-2, 22, 30) }, // late fee paid
      { orderId: order6.id, amount: -1115.0, method: 'UPI', type: 'DEPOSIT', date: getRelativeDate(-2, 22, 30) }, // refunded deposit minus late fee
    ],
  });

  // Update product stats
  await prisma.product.update({
    where: { id: p1.id },
    data: {
      rentalCount: 1,
      totalRentalHours: 60, // roughly 2.5 days
    },
  });

  // Order 7: CANCELLED (Aarav Sharma - Office Desk, cancelled)
  await prisma.rentalOrder.create({
    data: {
      reference: 'SO0007',
      createdAt: getRelativeDate(-10), // 10 days ago (cancelled — excluded from sales)
      customerId: customer1.id,
      vendorId: vendor2.id,
      status: 'CANCELLED',
      invoiceStatus: 'NOTHING_TO_INVOICE',
      rentalStart: getRelativeDate(-20, 10),
      rentalEnd: getRelativeDate(-18, 18),
      untaxed: 400.0,
      tax: 72.0,
      total: 472.0,
      depositAmount: 1000.0,
      depositStatus: 'REFUNDED', // refunded because it was cancelled
      pricelistId: publicPricelist.id,
      lines: {
        create: [
          {
            productId: p5.id,
            lineType: 'RENTAL',
            description: 'Executive Wooden Desk',
            qty: 1,
            unit: 'Units',
            unitPrice: 200.0,
            taxPct: 18.0,
            subtotal: 400.0,
            rentalStart: getRelativeDate(-20, 10),
            rentalEnd: getRelativeDate(-18, 18),
          },
        ],
      },
    },
  });

  // 9b. Extra demo orders so every dashboard queue has live examples:
  // upcoming pickups, upcoming returns, due-today, and overdue.
  const makeDemoOrder = ({
    reference, createdAt, customerId, vendorId, status, product,
    unitPrice, days, rentalStart, rentalEnd, deposit, depositStatus = 'HELD',
  }) => {
    const untaxed = unitPrice * days;
    const tax = Math.round(untaxed * 0.18 * 100) / 100;
    return prisma.rentalOrder.create({
      data: {
        reference,
        createdAt,
        customerId,
        vendorId,
        status,
        invoiceStatus: 'NOTHING_TO_INVOICE',
        rentalStart,
        rentalEnd,
        untaxed,
        tax,
        total: untaxed + tax,
        depositAmount: deposit,
        depositStatus,
        pricelistId: publicPricelist.id,
        lines: {
          create: [
            {
              productId: product.id,
              lineType: 'RENTAL',
              description: product.name,
              qty: 1,
              unit: 'Units',
              unitPrice,
              taxPct: 18.0,
              subtotal: untaxed,
              rentalStart,
              rentalEnd,
            },
          ],
        },
      },
    });
  };

  // Upcoming pickups (CONFIRMED, starting within the next 7 days)
  await makeDemoOrder({ reference: 'SO0008', createdAt: getRelativeDate(-1), customerId: customer2.id, vendorId: vendor1.id, status: 'CONFIRMED', product: p2, unitPrice: 1500.0, days: 3, rentalStart: getRelativeDate(2, 10), rentalEnd: getRelativeDate(5, 18), deposit: 5000.0 });
  const order9 = await makeDemoOrder({ reference: 'SO0009', createdAt: getRelativeDate(0), customerId: customer3.id, vendorId: vendor1.id, status: 'CONFIRMED', product: p6, unitPrice: 1200.0, days: 2, rentalStart: getRelativeDate(4, 9), rentalEnd: getRelativeDate(6, 18), deposit: 4000.0 });

  // Upcoming returns (PICKED_UP, ending within the next 7 days)
  await makeDemoOrder({ reference: 'SO0010', createdAt: getRelativeDate(-3), customerId: customer1.id, vendorId: vendor1.id, status: 'PICKED_UP', product: p3, unitPrice: 800.0, days: 4, rentalStart: getRelativeDate(-1, 10), rentalEnd: getRelativeDate(3, 18), deposit: 3000.0 });
  await makeDemoOrder({ reference: 'SO0011', createdAt: getRelativeDate(-6), customerId: customer2.id, vendorId: vendor2.id, status: 'PICKED_UP', product: p4, unitPrice: 100.0, days: 7, rentalStart: getRelativeDate(-2, 10), rentalEnd: getRelativeDate(5, 18), deposit: 500.0 });

  // Due today (PICKED_UP, ending today)
  const order12 = await makeDemoOrder({ reference: 'SO0012', createdAt: getRelativeDate(0), customerId: customer3.id, vendorId: vendor1.id, status: 'PICKED_UP', product: p1, unitPrice: 500.0, days: 3, rentalStart: getRelativeDate(-3, 10), rentalEnd: todayAt(23), deposit: 2000.0 });

  // Overdue (PICKED_UP, ended in the past)
  await makeDemoOrder({ reference: 'SO0013', createdAt: getRelativeDate(-5), customerId: customer1.id, vendorId: vendor1.id, status: 'PICKED_UP', product: p2, unitPrice: 1500.0, days: 3, rentalStart: getRelativeDate(-5, 10), rentalEnd: getRelativeDate(-2, 18), deposit: 5000.0 });

  // 10. Notifications
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, orderId: order3.id, message: 'Rental SO0003 is due for pickup today.', type: 'PICKUP' },
      { userId: admin.id, orderId: order4.id, message: 'Rental SO0004 is active (Picked Up).', type: 'INFO' },
      { userId: customer3.id, orderId: order6.id, message: 'Your rental SO0006 was returned 5 hours late. Late fee applied.', type: 'ALERT' },
      { userId: admin.id, orderId: order9.id, message: 'Rental SO0009 is scheduled for pickup in 4 days.', type: 'PICKUP' },
      { userId: admin.id, orderId: order12.id, message: 'Rental SO0012 is due for return today.', type: 'ALERT' },
    ],
  });

  console.log('Rental orders, invoices, payments, and notifications seeded.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
