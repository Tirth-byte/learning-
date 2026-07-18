const prisma = require('../config/prisma');

class DashboardService {
  async getStats({ role, userId, dateRange }) {
    // scopeWhere: vendor ownership only. Used by the operational queues (due today,
    // overdue, upcoming pickups/returns) which are driven by rental dates and must
    // NOT be hidden by the selected createdAt window.
    // where: scopeWhere PLUS the createdAt date-range, used by the financial metrics.
    const scopeWhere = {};
    const where = {};
    const paymentWhere = {};

    if (role === 'VENDOR') {
      scopeWhere.vendorId = parseInt(userId, 10);
      where.vendorId = parseInt(userId, 10);
      paymentWhere.order = { vendorId: parseInt(userId, 10) };
    }

    // Date range filter
    const now = new Date();
    let startDate;

    if (dateRange === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (dateRange === '7-days') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    if (startDate) {
      where.createdAt = { gte: startDate };
      paymentWhere.date = { gte: startDate };
    }

    // 1. Total Sales (total of confirmed, picked up, returned orders)
    const salesOrders = await prisma.rentalOrder.findMany({
      where: {
        ...where,
        status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
      },
      select: { total: true },
    });
    const totalSales = salesOrders.reduce((sum, order) => sum + order.total, 0);

    // 2. Deposits Held (where status is CONFIRMED or PICKED_UP and depositStatus is HELD)
    const heldDeposits = await prisma.rentalOrder.findMany({
      where: {
        ...where,
        status: { in: ['CONFIRMED', 'PICKED_UP'] },
        depositStatus: 'HELD',
      },
      select: { depositAmount: true },
    });
    const depositsHeld = heldDeposits.reduce((sum, order) => sum + order.depositAmount, 0);

    // 3. Late Fees Collected (sum of LATE_FEE order lines)
    const lateFeeLines = await prisma.rentalOrderLine.findMany({
      where: {
        lineType: 'LATE_FEE',
        order: {
          ...where,
          status: 'RETURNED',
        },
      },
      select: { subtotal: true },
    });
    const lateFeesCollected = lateFeeLines.reduce((sum, line) => sum + line.subtotal, 0);

    // 4. Due Today (rentalEnd is today, status is PICKED_UP)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dueTodayCount = await prisma.rentalOrder.count({
      where: {
        ...scopeWhere,
        status: 'PICKED_UP',
        rentalEnd: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 5. Overdue (rentalEnd is in the past, status is PICKED_UP)
    const overdueCount = await prisma.rentalOrder.count({
      where: {
        ...scopeWhere,
        status: 'PICKED_UP',
        rentalEnd: {
          lt: new Date(),
        },
      },
    });

    // 6. Upcoming Pickups (CONFIRMED status, starting within next 7 days)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const upcomingPickups = await prisma.rentalOrder.findMany({
      where: {
        ...scopeWhere,
        status: 'CONFIRMED',
        rentalStart: {
          gte: new Date(),
          lte: sevenDaysLater,
        },
      },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { rentalStart: 'asc' },
      take: 5,
    });

    // 7. Upcoming Returns (PICKED_UP status, ending within next 7 days)
    const upcomingReturns = await prisma.rentalOrder.findMany({
      where: {
        ...scopeWhere,
        status: 'PICKED_UP',
        rentalEnd: {
          gte: new Date(),
          lte: sevenDaysLater,
        },
      },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { rentalEnd: 'asc' },
      take: 5,
    });

    return {
      totalSales,
      depositsHeld,
      lateFeesCollected,
      dueTodayCount,
      overdueCount,
      upcomingPickups,
      upcomingReturns,
    };
  }

  async getReports({ role, userId }) {
    const where = {};
    if (role === 'VENDOR') {
      where.vendorId = parseInt(userId, 10);
    }

    // 1. Revenue over time (last 30 days)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last30Days.push({
        date: d.toISOString().split('T')[0],
        revenue: 0,
        lateFees: 0,
      });
    }

    const orders = await prisma.rentalOrder.findMany({
      where: {
        ...where,
        status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
      },
      include: {
        lines: true,
      },
    });

    orders.forEach((order) => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      const dayData = last30Days.find((day) => day.date === dateStr);
      if (dayData) {
        dayData.revenue += order.total;
        const lateLineTotal = order.lines
          .filter((l) => l.lineType === 'LATE_FEE')
          .reduce((sum, l) => sum + l.subtotal * 1.18, 0); // inclusive of tax approx
        dayData.lateFees += lateLineTotal;
      }
    });

    // 2. Revenue by Category
    const categoryTotals = {};
    const orderLines = await prisma.rentalOrderLine.findMany({
      where: {
        lineType: 'RENTAL',
        order: {
          ...where,
          status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
        },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    orderLines.forEach((line) => {
      if (line.product && line.product.category) {
        const catName = line.product.category.name;
        categoryTotals[catName] = (categoryTotals[catName] || 0) + line.subtotal;
      }
    });

    const revenueByCategory = Object.keys(categoryTotals).map((name) => ({
      name,
      value: categoryTotals[name],
    }));

    // 3. Most Rented Products
    const products = await prisma.product.findMany({
      where: where.vendorId ? { vendorId: where.vendorId } : {},
      orderBy: { rentalCount: 'desc' },
      select: {
        id: true,
        name: true,
        rentalCount: true,
        totalRentalHours: true,
        qtyOnHand: true,
      },
      take: 5,
    });

    const mostRentedProducts = products.map((p) => {
      // Calculate basic utilization: rented times * average duration / total possible hours
      // Assume a product can be rented 24 hours a day
      const averageDuration = p.rentalCount > 0 ? p.totalRentalHours / p.rentalCount : 0;
      const utilization = p.rentalCount > 0 ? Math.min((p.totalRentalHours / (30 * 24)) * 100, 100) : 0;
      return {
        name: p.name,
        count: p.rentalCount,
        hours: p.totalRentalHours,
        utilization: parseFloat(utilization.toFixed(1)),
      };
    });

    // 4. Late Return Rate
    const totalReturned = await prisma.rentalOrder.count({
      where: {
        ...where,
        status: 'RETURNED',
      },
    });

    const totalLateReturned = await prisma.rentalOrder.count({
      where: {
        ...where,
        status: 'RETURNED',
        depositStatus: 'DEDUCTED',
      },
    });

    const lateReturnRate = totalReturned > 0 ? (totalLateReturned / totalReturned) * 100 : 0;

    return {
      revenueOverTime: last30Days,
      revenueByCategory,
      mostRentedProducts,
      lateReturnRate: parseFloat(lateReturnRate.toFixed(1)),
    };
  }
}

module.exports = new DashboardService();
