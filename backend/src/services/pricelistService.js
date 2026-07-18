const prisma = require('../config/prisma');

class PricelistService {
  async getAllPricelists() {
    return prisma.pricelist.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPricelistById(id) {
    const pricelist = await prisma.pricelist.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!pricelist) {
      throw { statusCode: 404, message: 'Pricelist not found' };
    }

    return pricelist;
  }

  async getDefaultPricelist() {
    let pricelist = await prisma.pricelist.findFirst({
      where: { isDefault: true },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!pricelist) {
      // Fallback: search for any pricelist
      pricelist = await prisma.pricelist.findFirst({
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return pricelist;
  }

  async createPricelist(data) {
    const { name, isDefault, validFrom, validTo, items } = data;

    if (!name) {
      throw { statusCode: 400, message: 'Pricelist name is required' };
    }

    return prisma.$transaction(async (tx) => {
      // If setting this one to default, clear previous defaults
      if (isDefault) {
        await tx.pricelist.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const pricelist = await tx.pricelist.create({
        data: {
          name,
          isDefault: !!isDefault,
          validFrom: validFrom ? new Date(validFrom) : null,
          validTo: validTo ? new Date(validTo) : null,
        },
      });

      if (items && Array.isArray(items)) {
        await tx.pricelistItem.createMany({
          data: items.map((item) => ({
            pricelistId: pricelist.id,
            productId: parseInt(item.productId, 10),
            period: item.period || 'DAY',
            price: parseFloat(item.price),
          })),
        });
      }

      return tx.pricelist.findUnique({
        where: { id: pricelist.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async updatePricelist(id, data) {
    const pricelistId = parseInt(id, 10);
    const { name, isDefault, validFrom, validTo, items } = data;

    await this.getPricelistById(pricelistId);

    return prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.pricelist.updateMany({
          where: { isDefault: true, id: { not: pricelistId } },
          data: { isDefault: false },
        });
      }

      const pricelist = await tx.pricelist.update({
        where: { id: pricelistId },
        data: {
          name,
          isDefault: isDefault !== undefined ? !!isDefault : undefined,
          validFrom: validFrom ? new Date(validFrom) : undefined,
          validTo: validTo ? new Date(validTo) : undefined,
        },
      });

      if (items && Array.isArray(items)) {
        // Simple override for simplicity
        await tx.pricelistItem.deleteMany({ where: { pricelistId } });
        await tx.pricelistItem.createMany({
          data: items.map((item) => ({
            pricelistId,
            productId: parseInt(item.productId, 10),
            period: item.period || 'DAY',
            price: parseFloat(item.price),
          })),
        });
      }

      return tx.pricelist.findUnique({
        where: { id: pricelistId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async deletePricelist(id) {
    const pricelistId = parseInt(id, 10);
    const pricelist = await this.getPricelistById(pricelistId);

    if (pricelist.isDefault) {
      throw { statusCode: 400, message: 'Cannot delete the default pricelist' };
    }

    return prisma.pricelist.delete({
      where: { id: pricelistId },
    });
  }
}

module.exports = new PricelistService();
