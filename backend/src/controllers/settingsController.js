const settingsService = require('../services/settingsService');

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const settings = await settingsService.getSettings();
      return res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await settingsService.updateSettings(req.body);
      return res.status(200).json({ success: true, message: 'Settings updated successfully', data: settings });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
