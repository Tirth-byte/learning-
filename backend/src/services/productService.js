const prisma = require('../config/prisma');

/**
 * Formula: Available quantity for a rental period = quantity on hand (representing currently in warehouse)
 * plus the quantity already picked up (which are currently out with active customers but belong to total capacity)
 * minus the quantity already committed in overlapping active rentals (Confirmed / Picked Up) for that same period.
 */
async function getProductAvailableQty(tx, productId, rentalStart, rentalEnd) {
  const product = await tx.product.findUnique({
    where: { id: productId },
  });
  if (!product) return 0;

  // Total capacity = current qtyOnHand + picked up items (which are physically out but part of total capacity)
  const pickedUpLines = await tx.rentalOrderLine.findMany({
    where: {
      productId,
      lineType: 'RENTAL',
      order: { status: 'PICKED_UP' }
    }
  });
  const currentlyPickedUp = pickedUpLines.reduce((sum, l) => sum + l.qty, 0);
  const totalCapacity = product.qtyOnHand + currentlyPickedUp;

  if (!rentalStart || !rentalEnd) {
    // If no dates are queried, default available quantity to current qtyOnHand (physical stock in warehouse)
    return product.qtyOnHand;
  }

  // Find all active CONFIRMED or PICKED_UP bookings that overlap with the requested period
  const overlappingLines = await tx.rentalOrderLine.findMany({
    where: {
      productId,
      lineType: 'RENTAL',
      order: {
        status: { in: ['CONFIRMED', 'PICKED_UP'] },
        rentalStart: { lte: new Date(rentalEnd) },
        rentalEnd: { gte: new Date(rentalStart) }
      }
    }
  });
  const committedQty = overlappingLines.reduce((sum, l) => sum + l.qty, 0);
  
  // Available stock is total capacity minus already committed units
  return Math.max(totalCapacity - committedQty, 0);
}

class ProductService {
  async getAllProducts({ categoryId, search, published, role, rentalStart, rentalEnd }) {
    const where = {};

    // Customers only see published products
    if (role === 'CUSTOMER' || published === 'true' || published === true) {
      where.published = true;
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        attributes: {
          include: {
            values: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach availableQty based on formula
    return Promise.all(products.map(async (product) => {
      const availableQty = await getProductAvailableQty(prisma, product.id, rentalStart, rentalEnd);
      return { ...product, availableQty };
    }));
  }

  async getProductById(id, { rentalStart, rentalEnd } = {}) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        attributes: {
          include: {
            values: true,
          },
        },
        pricelistItems: true,
      },
    });

    if (!product) {
      throw { statusCode: 404, message: 'Product not found' };
    }

    const availableQty = await getProductAvailableQty(prisma, product.id, rentalStart, rentalEnd);
    return { ...product, availableQty };
  }

  async createProduct(productData, vendorId) {
    const {
      name,
      type,
      categoryId,
      salesPrice,
      costPrice,
      qtyOnHand,
      securityDeposit,
      periodicity,
      pickupTime,
      returnTime,
      lateFeePerHour,
      images,
      attributes,
    } = productData;

    if (!name || !categoryId) {
      throw { statusCode: 400, message: 'Product name and category are required' };
    }

    // Rule 4: Reject negative or zero quantities, prices, deposits, and late-fee rates on input
    if (salesPrice !== undefined && parseFloat(salesPrice) <= 0) {
      throw { statusCode: 400, message: 'Rental rate must be greater than zero' };
    }
    if (costPrice !== undefined && parseFloat(costPrice) <= 0) {
      throw { statusCode: 400, message: 'Purchase cost must be greater than zero' };
    }
    if (qtyOnHand !== undefined && parseInt(qtyOnHand, 10) <= 0) {
      throw { statusCode: 400, message: 'Quantity on hand must be greater than zero' };
    }
    if (securityDeposit !== undefined && parseFloat(securityDeposit) <= 0) {
      throw { statusCode: 400, message: 'Security deposit must be greater than zero' };
    }
    if (lateFeePerHour !== undefined && parseFloat(lateFeePerHour) <= 0) {
      throw { statusCode: 400, message: 'Late fee rate must be greater than zero' };
    }

    // Prepare create transaction to include nested attributes
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          type: type || 'RENTAL',
          categoryId: parseInt(categoryId, 10),
          vendorId: vendorId ? parseInt(vendorId, 10) : null,
          salesPrice: parseFloat(salesPrice || 0),
          costPrice: parseFloat(costPrice || 0),
          qtyOnHand: parseInt(qtyOnHand || 0, 10),
          securityDeposit: parseFloat(securityDeposit || 0),
          periodicity: periodicity || 'DAY',
          pickupTime,
          returnTime,
          lateFeePerHour: parseFloat(lateFeePerHour || 0),
          images: images || [],
          published: false, // Default to false, needs publish action
        },
      });

      if (attributes && Array.isArray(attributes)) {
        for (const attr of attributes) {
          const newAttr = await tx.productAttribute.create({
            data: {
              productId: product.id,
              name: attr.name,
              displayType: attr.displayType || 'PILLS',
            },
          });

          if (attr.values && Array.isArray(attr.values)) {
            await tx.productAttributeValue.createMany({
              data: attr.values.map((val) => ({
                attributeId: newAttr.id,
                value: val,
              })),
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          attributes: {
            include: {
              values: true,
            },
          },
        },
      });
    });
  }

  async updateProduct(id, productData) {
    const productId = parseInt(id, 10);
    const {
      name,
      type,
      categoryId,
      salesPrice,
      costPrice,
      qtyOnHand,
      securityDeposit,
      periodicity,
      pickupTime,
      returnTime,
      lateFeePerHour,
      images,
      published,
      rentalCount,
      totalRentalHours,
    } = productData;

    // Rule 4: Reject negative or zero quantities, prices, deposits, and late-fee rates on input
    if (salesPrice !== undefined && parseFloat(salesPrice) <= 0) {
      throw { statusCode: 400, message: 'Rental rate must be greater than zero' };
    }
    if (costPrice !== undefined && parseFloat(costPrice) <= 0) {
      throw { statusCode: 400, message: 'Purchase cost must be greater than zero' };
    }
    if (qtyOnHand !== undefined && parseInt(qtyOnHand, 10) <= 0) {
      throw { statusCode: 400, message: 'Quantity on hand must be greater than zero' };
    }
    if (securityDeposit !== undefined && parseFloat(securityDeposit) <= 0) {
      throw { statusCode: 400, message: 'Security deposit must be greater than zero' };
    }
    if (lateFeePerHour !== undefined && parseFloat(lateFeePerHour) <= 0) {
      throw { statusCode: 400, message: 'Late fee rate must be greater than zero' };
    }

    // Verify product exists
    await this.getProductById(productId);

    return prisma.product.update({
      where: { id: productId },
      data: {
        name,
        type,
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        salesPrice: salesPrice !== undefined ? parseFloat(salesPrice) : undefined,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
        qtyOnHand: qtyOnHand !== undefined ? parseInt(qtyOnHand, 10) : undefined,
        securityDeposit: securityDeposit !== undefined ? parseFloat(securityDeposit) : undefined,
        periodicity,
        pickupTime,
        returnTime,
        lateFeePerHour: lateFeePerHour !== undefined ? parseFloat(lateFeePerHour) : undefined,
        images,
        published,
        rentalCount: rentalCount !== undefined ? parseInt(rentalCount, 10) : undefined,
        totalRentalHours: totalRentalHours !== undefined ? parseInt(totalRentalHours, 10) : undefined,
      },
      include: {
        category: true,
        attributes: {
          include: {
            values: true,
          },
        },
      },
    });
  }

  async deleteProduct(id) {
    const productId = parseInt(id, 10);
    await this.getProductById(productId);

    return prisma.product.delete({
      where: { id: productId },
    });
  }

  async publishProduct(id, published) {
    const productId = parseInt(id, 10);
    await this.getProductById(productId);

    return prisma.product.update({
      where: { id: productId },
      data: { published: published === true || published === 'true' },
    });
  }

  async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = new ProductService();
