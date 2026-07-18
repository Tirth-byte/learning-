const invoiceService = require('../services/invoiceService');

class InvoiceController {
  async getAllInvoices(req, res, next) {
    try {
      const { role, id: userId } = req.user;
      const invoices = await invoiceService.getAllInvoices({
        customerId: role === 'CUSTOMER' ? userId : undefined,
        role,
      });
      return res.status(200).json({ success: true, data: invoices });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoiceById(id);
      return res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async createInvoiceFromOrder(req, res, next) {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID is required' });
      }
      const invoice = await invoiceService.createInvoiceFromOrder(orderId);
      return res.status(201).json({ success: true, message: 'Invoice created successfully', data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async postInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.postInvoice(id);
      return res.status(200).json({ success: true, message: 'Invoice posted successfully', data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async payInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.payInvoice(id, req.body);
      return res.status(200).json({ success: true, message: 'Payment recorded successfully', data: invoice });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvoiceController();
