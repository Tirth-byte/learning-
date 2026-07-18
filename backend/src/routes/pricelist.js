const express = require('express');
const router = express.Router();
const pricelistController = require('../controllers/pricelistController');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, pricelistController.getAllPricelists);
router.get('/:id', authMiddleware, pricelistController.getPricelistById);

router.post('/', authMiddleware, roleGuard('ADMIN'), pricelistController.createPricelist);
router.put('/:id', authMiddleware, roleGuard('ADMIN'), pricelistController.updatePricelist);
router.delete('/:id', authMiddleware, roleGuard('ADMIN'), pricelistController.deletePricelist);

module.exports = router;
