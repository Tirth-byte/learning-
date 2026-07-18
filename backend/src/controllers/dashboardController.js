const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const { role, id: userId } = req.user;
      const { dateRange } = req.query;

      const stats = await dashboardService.getStats({ role, userId, dateRange });
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const { role, id: userId } = req.user;
      const reports = await dashboardService.getReports({ role, userId });
      return res.status(200).json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
