const prisma = require('../config/prisma');
const { generateInvoiceReference } = require('../utils/referenceGenerator');

class InvoiceService {
  async getAllInvoices({ customerId, role }) {
    const where = {};

    if (role === 'CUSTOMER') {
      where.customerId = parseInt(customerId, 10);
    }

    return prisma.invoice.findMany({
      where,
      include: {
        order: {
          select: { reference: true, rentalStart: true, rentalEnd: true },
        },
        customer: {
          select: { id: true, name: true, email: true },
        },
        lines: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        order: {
          include: {
            payments: true,
          },
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true, address: true },
        },
        lines: true,
      },
    });

    if (!invoice) {
      throw { statusCode: 404, message: 'Invoice not found' };
    }

    return invoice;
  }

  async createInvoiceFromOrder(orderId) {
    const parsedOrderId = parseInt(orderId, 10);

    const order = await prisma.rentalOrder.findUnique({
      where: { id: parsedOrderId },
      include: {
        lines: true,
        invoice: true,
      },
    });

    if (!order) {
      throw { statusCode: 404, message: 'Order not found' };
    }

    if (order.invoice) {
      throw { statusCode: 400, message: 'An invoice already exists for this order' };
    }

    if (!['CONFIRMED', 'PICKED_UP', 'RETURNED'].includes(order.status)) {
      throw { statusCode: 400, message: 'Can only invoice confirmed, picked up, or returned orders' };
    }

    const ref = await generateInvoiceReference();

    // Copy order lines to invoice lines, EXCLUDING DEPOSIT lines
    const invoiceableLines = order.lines.filter((l) => l.lineType === 'RENTAL' || l.lineType === 'LATE_FEE');

    let untaxedTotal = 0;
    let taxTotal = 0;

    const invoiceLinesData = invoiceableLines.map((line) => {
      const lineAmount = line.subtotal;
      const lineTax = (lineAmount * line.taxPct) / 100;

      untaxedTotal += lineAmount;
      taxTotal += lineTax;

      return {
        productId: line.productId,
        description: line.productId
          ? `${line.description} (${line.lineType === 'LATE_FEE' ? 'Late Return Charge' : 'Rental'})`
          : line.description,
        qty: line.qty,
        unit: line.unit,
        unitPrice: line.unitPrice,
        taxPct: line.taxPct,
        amount: lineAmount,
      };
    });

    return prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          reference: ref,
          orderId: order.id,
          customerId: order.customerId,
          status: 'DRAFT',
          untaxed: untaxedTotal,
          tax: taxTotal,
          total: untaxedTotal + taxTotal,
          lines: {
            create: invoiceLinesData,
          },
        },
        include: {
          lines: true,
        },
      });

      // 2. Update order invoice status
      await tx.rentalOrder.update({
        where: { id: order.id },
        data: {
          invoiceStatus: 'INVOICED',
        },
      });

      return invoice;
    });
  }

  async postInvoice(id) {
    const invoice = await this.getInvoiceById(id);
    if (invoice.status !== 'DRAFT') {
      throw { statusCode: 400, message: 'Only draft invoices can be posted' };
    }

    return prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'POSTED',
        invoiceDate: new Date(),
      },
    });
  }

  async payInvoice(id, paymentData) {
    const { method, amount } = paymentData;
    if (!method || !amount) {
      throw { statusCode: 400, message: 'Payment method and amount are required' };
    }

    const invoice = await this.getInvoiceById(id);
    if (invoice.status !== 'POSTED') {
      throw { statusCode: 400, message: 'Cannot record payment on a draft invoice' };
    }

    // Rule 3 & 4: Validate payment amount and check it does not exceed the outstanding amount due
    const paymentAmount = Math.round(parseFloat(amount) * 100) / 100;
    if (paymentAmount <= 0) {
      throw { statusCode: 400, message: 'Payment amount must be greater than zero' };
    }

    const totalPaid = Math.round(invoice.order.payments
      .filter(p => p.type === 'RENTAL' || p.type === 'LATE_FEE')
      .reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    const amountDue = Math.round((invoice.order.total - totalPaid) * 100) / 100;

    if (paymentAmount > amountDue) {
      throw { 
        statusCode: 400, 
        message: `Payment amount (₹${paymentAmount.toFixed(2)}) cannot exceed the amount due (₹${amountDue.toFixed(2)})` 
      };
    }

    const methodUpper = method.toUpperCase();
    if (!['CASH', 'CARD', 'UPI', 'WALLET'].includes(methodUpper)) {
      throw { statusCode: 400, message: `Invalid payment method: ${method}` };
    }

    return prisma.$transaction(async (tx) => {
      // Rule 2: Wallet check validation
      if (methodUpper === 'WALLET') {
        const customer = await tx.user.findUnique({
          where: { id: invoice.customerId },
        });
        if (!customer) {
          throw { statusCode: 404, message: 'Customer not found' };
        }
        if (customer.walletBalance < paymentAmount) {
          throw { 
            statusCode: 400, 
            message: `Insufficient wallet balance (Required: ₹${paymentAmount.toFixed(2)}, Available: ₹${customer.walletBalance.toFixed(2)})` 
          };
        }
        
        // Deduct payment from wallet (never allow negative wallet)
        await tx.user.update({
          where: { id: customer.id },
          data: { walletBalance: { decrement: paymentAmount } },
        });
      }

      // Create Payment record for RENTAL
      await tx.payment.create({
        data: {
          orderId: invoice.orderId,
          amount: paymentAmount,
          method: methodUpper,
          type: 'RENTAL',
          date: new Date(),
        },
      });

      // Fetch the updated invoice with payments
      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          order: {
            include: {
              payments: true,
            },
          },
          customer: true,
          lines: true,
        },
      });
    });
  }
}

module.exports = new InvoiceService();
