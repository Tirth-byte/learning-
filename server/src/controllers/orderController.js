/**
 * ----------------------------------------------------------------------------------
 * RENTAL ORDER CONTROLLER
 * 
 * WHAT THIS FILE DOES:
 * This file handles HTTP requests related to rental orders (e.g. creating quotations,
 * confirming bookings, logging pickups, returns, and customer checkouts). It reads parameters
 * from the client requests, calls the corresponding orderService functions, and sends
 * JSON results back to the browser.
 * 
 * HOW IT FITS INTO THE APP:
 * Express routes in 'routes/order.js' point to the methods defined in this controller class.
 * ----------------------------------------------------------------------------------
 */

const orderService = require('../services/orderService');

class OrderController {

  /**
   * Fetch all orders, filtered by the caller's role (Admin, Vendor, or Customer).
   * 
   * Input:
   *   - req.query: Optional filters like status or customerId
   *   - req.user: Decoded user info containing role and ID
   * Output:
   *   - HTTP 200 with an array of rental orders.
   */
  async getAllOrders(req, res, next) {
    try {
      const { customerId, status } = req.query;
      const { role, id: userId } = req.user;

      // Extract details. Customers see only their own orders. Vendors see only theirs.
      const orders = await orderService.getAllOrders({
        customerId: role === 'CUSTOMER' ? userId : customerId,
        vendorId: role === 'VENDOR' ? userId : undefined,
        status,
        role,
      });

      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch a single order by its database ID.
   * 
   * Input:
   *   - req.params.id: Order ID number in the database URL
   * Output:
   *   - HTTP 200 with the matching order object.
   */
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);
      return res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create an initial quotation draft in the system.
   * 
   * Input:
   *   - req.body: Quotation details (dates, products, quantities)
   *   - req.user: Logged-in user information
   * Output:
   *   - HTTP 201 with the created quotation object.
   */
  async createQuotation(req, res, next) {
    try {
      // Customers create quotations for themselves. Admins/vendors can specify the customer.
      const customerId = req.user.role === 'CUSTOMER' ? req.user.id : req.body.customerId;

      if (!customerId) {
        return res.status(400).json({ success: false, message: 'Customer ID is required' });
      }

      const order = await orderService.createQuotation(req.body, customerId);
      return res.status(201).json({ success: true, message: 'Quotation created successfully', data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a quotation as sent to the customer.
   * 
   * Input:
   *   - req.params.id: Order ID
   * Output:
   *   - HTTP 200 indicating success.
   */
  async sendQuotation(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.sendQuotation(id);
      return res.status(200).json({ success: true, message: 'Quotation sent successfully', data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm a quotation, reserving the items for the customer.
   * 
   * Input:
   *   - req.params.id: Order ID
   * Output:
   *   - HTTP 200 with updated order.
   */
  async confirmOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.confirmOrder(id);
      return res.status(200).json({ success: true, message: 'Order confirmed successfully', data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log that the customer has picked up the reserved items.
   * 
   * Input:
   *   - req.params.id: Order ID
   * Output:
   *   - HTTP 200 with the active order.
   */
  async pickupOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.pickupOrder(id);
      return res.status(200).json({ success: true, message: 'Order picked up successfully', data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel an order reservation or quotation.
   * 
   * Input:
   *   - req.params.id: Order ID
   * Output:
   *   - HTTP 200.
   */
  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.cancelOrder(id);
      return res.status(200).json({ success: true, message: 'Order cancelled successfully', data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log that items have been returned, computing late fees if applicable.
   * 
   * Input:
   *   - req.params.id: Order ID
   *   - req.body.actualReturn: Date string of return (optional)
   * Output:
   *   - HTTP 200.
   */
  async returnOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { actualReturn } = req.body;
      const order = await orderService.returnOrder(id, actualReturn);
      return res.status(200).json({ success: true, message: 'Order returned successfully', data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Perform immediate storefront checkout.
   * Creates confirmed booking, invoice, and payment in one transaction.
   * 
   * Input:
   *   - req.user.id: Logged in customer ID
   *   - req.body: Cart details (items, dates, delivery addresses)
   * Output:
   *   - HTTP 201 with the completed order.
   */
  async checkout(req, res, next) {
    try {
      const customerId = req.user.id;
      const order = await orderService.checkout(req.body, customerId);
      return res.status(201).json({ success: true, message: 'Order checked out successfully', data: order });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
