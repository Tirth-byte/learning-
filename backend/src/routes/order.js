/**
 * ----------------------------------------------------------------------------------
 * RENTAL ORDER ROUTER
 * 
 * WHAT THIS FILE DOES:
 * This file maps incoming API web requests for order searches, creation, confirmation,
 * pickups, returns, and checkouts to the corresponding action blocks in the OrderController.
 * 
 * HOW IT FITS INTO THE APP:
 * When users view their rentals, purchase items, or scan QR codes in the web interface,
 * the frontend sends requests to these endpoints.
 * ----------------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');

// ----------------------------------------------------------------------------------
// SECURED USER ROUTES (Requires logged in session token)
// ----------------------------------------------------------------------------------

// Retrieve list of orders matching the user
router.get('/', authMiddleware, orderController.getAllOrders);

// Retrieve details for a specific order
router.get('/:id', authMiddleware, orderController.getOrderById);

// Create a draft rental quotation
router.post('/', authMiddleware, orderController.createQuotation);

// Process dynamic checkout with automated payments (accessible to customer accounts)
router.post('/checkout', authMiddleware, orderController.checkout);

// Cancel a quotation or reservation
router.post('/:id/cancel', authMiddleware, orderController.cancelOrder);

// ----------------------------------------------------------------------------------
// PORTAL OFFICE ROUTES (Requires Admin or Vendor staff permissions)
// ----------------------------------------------------------------------------------

// Mark a quotation as sent to the user
router.post('/:id/send', authMiddleware, roleGuard('ADMIN', 'VENDOR'), orderController.sendQuotation);

// Confirm order reservation
router.post('/:id/confirm', authMiddleware, roleGuard('ADMIN', 'VENDOR'), orderController.confirmOrder);

// Mark reserved items as picked up
router.post('/:id/pickup', authMiddleware, roleGuard('ADMIN', 'VENDOR'), orderController.pickupOrder);

// Mark active items as returned (calculates overdue penalties if late return)
router.post('/:id/return', authMiddleware, roleGuard('ADMIN', 'VENDOR'), orderController.returnOrder);

module.exports = router;
