const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, roleGuard('ADMIN', 'VENDOR'), dashboardController.getStats);
router.get('/reports', authMiddleware, roleGuard('ADMIN', 'VENDOR'), dashboardController.getReports);

module.exports = router;
