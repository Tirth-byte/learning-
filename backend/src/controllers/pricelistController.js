const pricelistService = require('../services/pricelistService');

class PricelistController {
  async getAllPricelists(req, res, next) {
    try {
      const pricelists = await pricelistService.getAllPricelists();
      return res.status(200).json({ success: true, data: pricelists });
    } catch (error) {
      next(error);
    }
  }

  async getPricelistById(req, res, next) {
    try {
      const { id } = req.params;
      const pricelist = await pricelistService.getPricelistById(id);
      return res.status(200).json({ success: true, data: pricelist });
    } catch (error) {
      next(error);
    }
  }

  async createPricelist(req, res, next) {
    try {
      const pricelist = await pricelistService.createPricelist(req.body);
      return res.status(201).json({ success: true, message: 'Pricelist created successfully', data: pricelist });
    } catch (error) {
      next(error);
    }
  }

  async updatePricelist(req, res, next) {
    try {
      const { id } = req.params;
      const pricelist = await pricelistService.updatePricelist(id, req.body);
      return res.status(200).json({ success: true, message: 'Pricelist updated successfully', data: pricelist });
    } catch (error) {
      next(error);
    }
  }

  async deletePricelist(req, res, next) {
    try {
      const { id } = req.params;
      await pricelistService.deletePricelist(id);
      return res.status(200).json({ success: true, message: 'Pricelist deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PricelistController();
