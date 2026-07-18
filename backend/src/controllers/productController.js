const productService = require('../services/productService');

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const { categoryId, search, published, rentalStart, rentalEnd } = req.query;
      const role = req.user ? req.user.role : 'CUSTOMER';
      const products = await productService.getAllProducts({ categoryId, search, published, role, rentalStart, rentalEnd });
      return res.status(200).json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const { rentalStart, rentalEnd } = req.query;
      const product = await productService.getProductById(id, { rentalStart, rentalEnd });
      return res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      // VENDORS can create their own products, ADMINS can create for anyone or default
      const vendorId = req.user.role === 'VENDOR' ? req.user.id : req.body.vendorId;
      const product = await productService.createProduct(req.body, vendorId);
      return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);
      return res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async publishProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { published } = req.body;
      const product = await productService.publishProduct(id, published);
      return res.status(200).json({
        success: true,
        message: published ? 'Product published successfully' : 'Product unpublished successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      return res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
