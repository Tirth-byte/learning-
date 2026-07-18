const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, roleGuard, optionalAuthMiddleware } = require('../middleware/authMiddleware');

router.get('/categories', productController.getCategories);
router.get('/', optionalAuthMiddleware, productController.getAllProducts);
router.get('/:id', optionalAuthMiddleware, productController.getProductById);

router.post('/', authMiddleware, roleGuard('ADMIN', 'VENDOR'), productController.createProduct);
router.put('/:id', authMiddleware, roleGuard('ADMIN', 'VENDOR'), productController.updateProduct);
router.delete('/:id', authMiddleware, roleGuard('ADMIN'), productController.deleteProduct);
router.post('/:id/publish', authMiddleware, roleGuard('ADMIN'), productController.publishProduct);

module.exports = router;
