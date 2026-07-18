const prisma = require('../config/prisma');

class ProductService {
  async getAllProducts({ categoryId, search, published, role }) {
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

    return prisma.product.findMany({
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
  }

  async getProductById(id) {
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

    return product;
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
    } = productData;

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
