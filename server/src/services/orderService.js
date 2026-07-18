/**
 * ----------------------------------------------------------------------------------
 * RENTAL ORDER SERVICE
 * 
 * WHAT THIS FILE DOES:
 * This file contains all the core business calculations and database workflows for
 * rental orders. It handles creating quotes, completing customer checkouts, updating
 * order states (from quotations to confirmed, picked up, or cancelled), and processing
 * returned assets.
 * 
 * HOW IT FITS INTO THE APP:
 * The OrderController calls the functions in this service when API requests arrive
 * from storefront checkout screens, admin tables, or scanner popups.
 * ----------------------------------------------------------------------------------
 */

const prisma = require('../config/prisma');
const { generateOrderReference, generateInvoiceReference } = require('../utils/referenceGenerator');

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Change these constants below to adjust default tax rates and system behaviors.
// ----------------------------------------------------------------------------------

// CHANGE THIS TO ADJUST THE DEFAULT TAX RATE PERCENTAGE FOR RENTAL CHARGES
const DEFAULT_TAX_PERCENTAGE = 18.0;

// CHANGE THIS TO ADJUST THE TAX RATE PERCENTAGE FOR LATE RETURN PENALTY FEES
const LATE_FEE_TAX_PERCENTAGE = 18.0;

// CHANGE THIS TO ADJUST THE DEFAULT UNIT NAME PRINTED ON INVOICES
const DEFAULT_INVOICE_UNIT = 'Units';

// CHANGE THIS TO ADJUST THE TIME VALUE UNIT PRINTED ON LATE FEES
const LATE_FEE_TIME_UNIT = 'Hours';


class OrderService {

  /**
   * Fetch all orders from the database, filtered by client or vendor ownership.
   * 
   * Input: 
   *   - filters: Object containing customerId, vendorId, status, and role
   * Output:
   *   - Array of rental order records with customer details, lines, and payments.
   */
  async getAllOrders({ customerId, vendorId, status, role }) {
    const databaseFilters = {};

    // Filter by customer if logged in user is a customer
    if (role === 'CUSTOMER') {
      databaseFilters.customerId = parseInt(customerId, 10);
    } 
    // Filter by vendor if logged in user is a vendor
    else if (role === 'VENDOR') {
      databaseFilters.vendorId = parseInt(vendorId, 10);
    } 
    // Filter by custom query customer parameter if provided by admins
    else if (customerId) {
      databaseFilters.customerId = parseInt(customerId, 10);
    }

    // Filter by order status (e.g. 'CONFIRMED', 'PICKED_UP') if selected
    if (status) {
      databaseFilters.status = status;
    }

    return prisma.rentalOrder.findMany({
      where: databaseFilters,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        vendor: {
          select: { id: true, name: true, companyName: true },
        },
        lines: {
          include: {
            product: true,
          },
        },
        invoice: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch a single order by its database ID, throwing a 404 error if not found.
   * 
   * Input:
   *   - id: The database ID number of the order
   * Output:
   *   - The matching rental order object with complete line item details.
   */
  async getOrderById(id) {
    const orderRecord = await prisma.rentalOrder.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true, address: true },
        },
        vendor: {
          select: { id: true, name: true, companyName: true, address: true, gstNo: true },
        },
        lines: {
          include: {
            product: true,
          },
        },
        invoice: {
          include: {
            lines: true,
          },
        },
        payments: true,
      },
    });

    if (!orderRecord) {
      throw { statusCode: 404, message: 'Order not found' };
    }

    return orderRecord;
  }

  /**
   * Create an initial quotation draft in the database.
   * 
   * Input:
   *   - orderData: Object containing date ranges, addresses, and individual line items.
   *   - customerId: Database ID of the customer requesting the rental.
   * Output:
   *   - The newly created draft quotation order database object.
   */
  async createQuotation(orderData, customerId) {
    const {
      vendorId,
      rentalStart,
      rentalEnd,
      pickupType,
      deliveryAddress,
      invoiceAddress,
      pricelistId,
      lines,
    } = orderData;

    // Validate that dates and line items exist
    if (!rentalStart || !rentalEnd || !lines || lines.length === 0) {
      throw { statusCode: 400, message: 'Rental start/end dates and order lines are required' };
    }

    // Generate unique serial reference e.g. RENT-2026-0001
    const orderReference = await generateOrderReference();
    const startDate = new Date(rentalStart);
    const endDate = new Date(rentalEnd);

    let calculatedUntaxedTotal = 0;
    let calculatedTaxTotal = 0;
    let calculatedSecurityDepositTotal = 0;

    const formattedOrderLines = [];

    // Loop through each product line to compute rental fees and hold values
    for (const item of lines) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId, 10) },
      });

      if (!product) {
        throw { statusCode: 404, message: `Product with ID ${item.productId} not found` };
      }

      const quantity = parseInt(item.qty || 1, 10);
      const ratePrice = parseFloat(item.unitPrice || product.salesPrice);
      const taxRatePercentage = parseFloat(item.taxPct || DEFAULT_TAX_PERCENTAGE);
      
      const lineSubtotal = quantity * ratePrice;
      const lineTaxAmount = (lineSubtotal * taxRatePercentage) / 100;

      calculatedUntaxedTotal += lineSubtotal;
      calculatedTaxTotal += lineTaxAmount;
      calculatedSecurityDepositTotal += (product.securityDeposit || 0) * quantity;

      formattedOrderLines.push({
        productId: product.id,
        lineType: 'RENTAL',
        description: product.name,
        qty: quantity,
        unit: DEFAULT_INVOICE_UNIT,
        unitPrice: ratePrice,
        taxPct: taxRatePercentage,
        subtotal: lineSubtotal,
        rentalStart: startDate,
        rentalEnd: endDate,
      });
    }

    // Add security deposit to lines if one is required
    if (calculatedSecurityDepositTotal > 0) {
      formattedOrderLines.push({
        lineType: 'DEPOSIT',
        description: 'Refundable Security Deposit',
        qty: 1,
        unit: DEFAULT_INVOICE_UNIT,
        unitPrice: calculatedSecurityDepositTotal,
        taxPct: 0.0,
        subtotal: calculatedSecurityDepositTotal,
      });
    }

    return prisma.rentalOrder.create({
      data: {
        reference: orderReference,
        customerId: parseInt(customerId, 10),
        vendorId: vendorId ? parseInt(vendorId, 10) : null,
        status: 'QUOTATION',
        invoiceStatus: 'NOTHING_TO_INVOICE',
        rentalStart: startDate,
        rentalEnd: endDate,
        pickupType: pickupType || 'STORE',
        deliveryAddress,
        invoiceAddress,
        pricelistId: pricelistId ? parseInt(pricelistId, 10) : null,
        untaxed: calculatedUntaxedTotal,
        tax: calculatedTaxTotal,
        total: calculatedUntaxedTotal + calculatedTaxTotal,
        depositAmount: calculatedSecurityDepositTotal,
        depositStatus: 'HELD',
        lines: {
          create: formattedOrderLines,
        },
      },
      include: {
        lines: true,
      },
    });
  }

  /**
   * Execute storefront checkout in a single secure database transaction.
   * Creates a confirmed booking, creates a posted invoice, and logs immediate payments.
   * 
   * Input:
   *   - orderData: Object containing date ranges, items, and address information.
   *   - customerId: Database ID of the customer completing the purchase.
   * Output:
   *   - The confirmed rental order database record.
   */
  async checkout(orderData, customerId) {
    const {
      rentalStart,
      rentalEnd,
      pickupType,
      deliveryAddress,
      invoiceAddress,
      lines,
    } = orderData;

    // Validate that dates and line items exist
    if (!rentalStart || !rentalEnd || !lines || lines.length === 0) {
      throw { statusCode: 400, message: 'Rental start/end dates and order lines are required' };
    }

    // Generate unique serial references
    const orderReference = await generateOrderReference();
    const invoiceReference = await generateInvoiceReference();
    
    const startDate = new Date(rentalStart);
    const endDate = new Date(rentalEnd);

    let calculatedUntaxedTotal = 0;
    let calculatedTaxTotal = 0;
    let calculatedSecurityDepositTotal = 0;

    const formattedOrderLines = [];
    const formattedInvoiceLines = [];

    // Loop through each product line to compute rental rates
    for (const item of lines) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId, 10) },
      });

      if (!product) {
        throw { statusCode: 404, message: `Product with ID ${item.productId} not found` };
      }

      const quantity = parseInt(item.qty || 1, 10);
      const ratePrice = parseFloat(product.salesPrice);
      const taxRatePercentage = DEFAULT_TAX_PERCENTAGE;
      
      const lineSubtotal = quantity * ratePrice;
      const lineTaxAmount = (lineSubtotal * taxRatePercentage) / 100;

      calculatedUntaxedTotal += lineSubtotal;
      calculatedTaxTotal += lineTaxAmount;
      calculatedSecurityDepositTotal += (product.securityDeposit || 0) * quantity;

      formattedOrderLines.push({
        productId: product.id,
        lineType: 'RENTAL',
        description: product.name,
        qty: quantity,
        unit: DEFAULT_INVOICE_UNIT,
        unitPrice: ratePrice,
        taxPct: taxRatePercentage,
        subtotal: lineSubtotal,
        rentalStart: startDate,
        rentalEnd: endDate,
      });

      formattedInvoiceLines.push({
        productId: product.id,
        description: `${product.name} (Rental)`,
        qty: quantity,
        unit: DEFAULT_INVOICE_UNIT,
        unitPrice: ratePrice,
        taxPct: taxRatePercentage,
        amount: lineSubtotal,
      });
    }

    // Add security deposit to lines if one is required
    if (calculatedSecurityDepositTotal > 0) {
      formattedOrderLines.push({
        lineType: 'DEPOSIT',
        description: 'Refundable Security Deposit',
        qty: 1,
        unit: DEFAULT_INVOICE_UNIT,
        unitPrice: calculatedSecurityDepositTotal,
        taxPct: 0.0,
        subtotal: calculatedSecurityDepositTotal,
      });
    }

    const orderGrandTotal = calculatedUntaxedTotal + calculatedTaxTotal;

    // Perform database writes as a transaction to guarantee data integrity
    return prisma.$transaction(async (tx) => {
      // Step 1: Create Confirmed Rental Order
      const createdOrder = await tx.rentalOrder.create({
        data: {
          reference: orderReference,
          customerId: parseInt(customerId, 10),
          status: 'CONFIRMED',
          invoiceStatus: 'INVOICED',
          rentalStart: startDate,
          rentalEnd: endDate,
          pickupType: pickupType || 'STORE',
          deliveryAddress,
          invoiceAddress,
          untaxed: calculatedUntaxedTotal,
          tax: calculatedTaxTotal,
          total: orderGrandTotal,
          depositAmount: calculatedSecurityDepositTotal,
          depositStatus: 'HELD',
          lines: {
            create: formattedOrderLines,
          },
        },
        include: {
          lines: true,
        }
      });

      // Step 2: Create Associated Invoice
      await tx.invoice.create({
        data: {
          reference: invoiceReference,
          orderId: createdOrder.id,
          customerId: parseInt(customerId, 10),
          status: 'POSTED',
          invoiceDate: new Date(),
          untaxed: calculatedUntaxedTotal,
          tax: calculatedTaxTotal,
          total: orderGrandTotal,
          lines: {
            create: formattedInvoiceLines,
          },
        }
      });

      // Step 3: Record Core Rental Payment Settle
      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          amount: orderGrandTotal,
          method: 'CARD',
          type: 'RENTAL',
          date: new Date(),
        }
      });

      // Step 4: Record Deposit Hold Payment Settle if applicable
      if (calculatedSecurityDepositTotal > 0) {
        await tx.payment.create({
          data: {
            orderId: createdOrder.id,
            amount: calculatedSecurityDepositTotal,
            method: 'CARD',
            type: 'DEPOSIT',
            date: new Date(),
          }
        });
      }

      return createdOrder;
    });
  }

  /**
   * Set status to Quotation Sent.
   * 
   * Input:
   *   - id: Database ID of the order.
   * Output:
   *   - Updated order record object.
   */
  async sendQuotation(id) {
    const order = await this.getOrderById(id);
    if (order.status !== 'QUOTATION') {
      throw { statusCode: 400, message: 'Only quotations can be sent' };
    }

    return prisma.rentalOrder.update({
      where: { id: order.id },
      data: { status: 'QUOTATION_SENT' },
    });
  }

  /**
   * Confirm quotation and reserve items.
   * 
   * Input:
   *   - id: Database ID of the order.
   * Output:
   *   - Updated order record object.
   */
  async confirmOrder(id) {
    const order = await this.getOrderById(id);
    if (order.status !== 'QUOTATION' && order.status !== 'QUOTATION_SENT') {
      throw { statusCode: 400, message: 'Only quotations or sent quotations can be confirmed' };
    }

    return prisma.rentalOrder.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        depositStatus: 'HELD',
      },
    });
  }

  /**
   * Set order status to Picked Up by user.
   * 
   * Input:
   *   - id: Database ID of the order.
   * Output:
   *   - Updated order record object.
   */
  async pickupOrder(id) {
    const order = await this.getOrderById(id);
    if (order.status !== 'CONFIRMED') {
      throw { statusCode: 400, message: 'Order must be confirmed before pickup' };
    }

    return prisma.rentalOrder.update({
      where: { id: order.id },
      data: { status: 'PICKED_UP' },
    });
  }

  /**
   * Cancel an order quotation or confirmed reservation.
   * 
   * Input:
   *   - id: Database ID of the order.
   * Output:
   *   - Updated order record object.
   */
  async cancelOrder(id) {
    const order = await this.getOrderById(id);
    if (['RETURNED', 'CANCELLED'].includes(order.status)) {
      throw { statusCode: 400, message: `Cannot cancel an order in ${order.status} state` };
    }

    return prisma.rentalOrder.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        depositStatus: order.depositStatus === 'HELD' ? 'REFUNDED' : order.depositStatus,
      },
    });
  }

  /**
   * Log returned assets, calculate potential overdue penalties, and settle deposits.
   * 
   * Input:
   *   - id: Database ID of the order being returned.
   *   - actualReturnTime: Date string indicating when return happened (default: current local time).
   * Output:
   *   - Updated rental order with dynamic lines and payment settle logs.
   */
  async returnOrder(id, actualReturnTime) {
    const order = await this.getOrderById(id);
    if (order.status !== 'PICKED_UP') {
      throw { statusCode: 400, message: 'Only picked up orders can be returned' };
    }

    const actualReturnDate = new Date(actualReturnTime || Date.now());
    const scheduledEndDate = new Date(order.rentalEnd);
    const actualStartDate = new Date(order.rentalStart);

    // Fetch system settings parameters for return grace periods
    const settings = await prisma.settings.findFirst();
    const gracePeriodMinutes = settings ? settings.gracePeriod : 0;
    const gracePeriodMilliseconds = gracePeriodMinutes * 60 * 1000;

    // Check if the current return date falls beyond the grace period window
    const differenceMilliseconds = actualReturnDate - scheduledEndDate;
    const isLateReturn = differenceMilliseconds > gracePeriodMilliseconds;

    let totalOverdueHours = 0;
    let lateFeeUntaxedAmount = 0;
    let lateFeeTaxAmount = 0;
    let lateFeeTotalAmount = 0;

    return prisma.$transaction(async (tx) => {
      // Step 1: If return is late, compute penalties and append a LATE_FEE line item
      if (isLateReturn) {
        // Find the primary product from the rental order to read its late-fee rate rules
        const primaryRentalLine = order.lines.find((line) => line.lineType === 'RENTAL');
        
        if (primaryRentalLine && primaryRentalLine.productId) {
          const product = await tx.product.findUnique({
            where: { id: primaryRentalLine.productId },
          });

          // Compute hourly fees (rounding partial hours up to favor the system)
          if (product && product.lateFeePerHour > 0) {
            const differenceHours = differenceMilliseconds / (1000 * 60 * 60);
            totalOverdueHours = Math.ceil(differenceHours);

            const lateRate = product.lateFeePerHour;
            lateFeeUntaxedAmount = totalOverdueHours * lateRate;
            lateFeeTaxAmount = (lateFeeUntaxedAmount * LATE_FEE_TAX_PERCENTAGE) / 100;
            lateFeeTotalAmount = lateFeeUntaxedAmount + lateFeeTaxAmount;

            // Save the computed penalty details as a new order line item
            await tx.rentalOrderLine.create({
              data: {
                orderId: order.id,
                productId: product.id,
                lineType: 'LATE_FEE',
                description: `Late Return Fee - ${totalOverdueHours} Hours @ ${lateRate.toFixed(2)}/hr`,
                qty: totalOverdueHours,
                unit: LATE_FEE_TIME_UNIT,
                unitPrice: lateRate,
                taxPct: LATE_FEE_TAX_PERCENTAGE,
                subtotal: lateFeeUntaxedAmount,
                rentalStart: scheduledEndDate,
                rentalEnd: actualReturnDate,
              },
            });
          }
        }
      }

      // Compute new order total amounts (Base fees + Late penalty additions)
      const updatedUntaxedTotal = order.untaxed + lateFeeUntaxedAmount;
      const updatedTaxTotal = order.tax + lateFeeTaxAmount;
      const updatedGrandTotal = updatedUntaxedTotal + updatedTaxTotal;

      // Step 2: Settle security deposit holds
      let refundAmount = 0;
      let depositSettlementStatus = 'REFUNDED';

      if (order.depositAmount > 0) {
        // Deduct overdue penalties from security deposit first if they exist
        if (lateFeeTotalAmount > 0) {
          refundAmount = Math.max(order.depositAmount - lateFeeTotalAmount, 0);
          depositSettlementStatus = 'DEDUCTED';
        } else {
          refundAmount = order.depositAmount;
          depositSettlementStatus = 'REFUNDED';
        }

        // Record deposit refund payment (negative number indicating cash outbound)
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: -refundAmount,
            method: 'UPI',
            type: 'DEPOSIT',
            date: actualReturnDate,
          },
        });

        // Record penalty settlement logic against deposit if applicable
        if (lateFeeTotalAmount > 0) {
          await tx.payment.create({
            data: {
              orderId: order.id,
              amount: lateFeeTotalAmount,
              method: 'UPI',
              type: 'LATE_FEE',
              date: actualReturnDate,
            },
          });
        }
      }

      // Step 3: Update Order Record with returned status
      await tx.rentalOrder.update({
        where: { id: order.id },
        data: {
          status: 'RETURNED',
          actualReturn: actualReturnDate,
          untaxed: updatedUntaxedTotal,
          tax: updatedTaxTotal,
          total: updatedGrandTotal,
          depositStatus: depositSettlementStatus,
        },
      });

      // Step 4: Increment product booking statistics
      const rentalLines = order.lines.filter((line) => line.lineType === 'RENTAL' && line.productId);
      const totalOrderRentalHours = Math.ceil((actualReturnDate - actualStartDate) / (1000 * 60 * 60));

      for (const line of rentalLines) {
        await tx.product.update({
          where: { id: line.productId },
          data: {
            rentalCount: { increment: 1 },
            totalRentalHours: { increment: totalOrderRentalHours },
          },
        });
      }

      // Step 5: Save automated customer in-app notification message
      await tx.notification.create({
        data: {
          userId: order.customerId,
          orderId: order.id,
          message: isLateReturn
            ? `Your rental ${order.reference} was returned ${totalOverdueHours} hours late. Late fee of ${lateFeeTotalAmount.toFixed(2)} deducted from your deposit.`
            : `Your rental ${order.reference} was returned on time. Security deposit fully refunded.`,
          type: isLateReturn ? 'ALERT' : 'INFO',
        },
      });

      return tx.rentalOrder.findUnique({
        where: { id: order.id },
        include: {
          lines: true,
          payments: true,
        },
      });
    });
  }
}

module.exports = new OrderService();
