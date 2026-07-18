const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, invoiceController.getAllInvoices);
router.get('/:id', authMiddleware, invoiceController.getInvoiceById);

router.post('/', authMiddleware, roleGuard('ADMIN', 'VENDOR'), invoiceController.createInvoiceFromOrder);
router.post('/:id/post', authMiddleware, roleGuard('ADMIN', 'VENDOR'), invoiceController.postInvoice);
router.post('/:id/pay', authMiddleware, invoiceController.payInvoice);

module.exports = router;
