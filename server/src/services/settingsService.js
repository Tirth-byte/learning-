const prisma = require('../config/prisma');

class SettingsService {
  async getSettings() {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          companyName: 'Odoo Rent India',
          lateFeeEnabled: true,
          defaultLateFeePerHour: 100.0,
          gracePeriod: 15,
          defaultDepositPct: 20.0,
        },
      });
    }
    return settings;
  }

  async updateSettings(data) {
    const settings = await this.getSettings();
    const { companyName, lateFeeEnabled, defaultLateFeePerHour, gracePeriod, defaultDepositPct } = data;

    return prisma.settings.update({
      where: { id: settings.id },
      data: {
        companyName,
        lateFeeEnabled: lateFeeEnabled !== undefined ? !!lateFeeEnabled : undefined,
        defaultLateFeePerHour: defaultLateFeePerHour !== undefined ? parseFloat(defaultLateFeePerHour) : undefined,
        gracePeriod: gracePeriod !== undefined ? parseInt(gracePeriod, 10) : undefined,
        defaultDepositPct: defaultDepositPct !== undefined ? parseFloat(defaultDepositPct) : undefined,
      },
    });
  }
}

module.exports = new SettingsService();
