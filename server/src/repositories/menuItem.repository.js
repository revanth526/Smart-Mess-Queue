const prisma = require('../lib/prisma');

class MenuItemRepository {
  async findByMessId(messId, filter) {
    const where = { messId };

    if (filter?.isAvailable !== undefined) {
      where.isAvailable = filter.isAvailable;
    }

    if (filter?.category) {
      where.category = filter.category;
    }

    if (filter?.search) {
      where.name = {
        contains: filter.search,
        mode: 'insensitive',
      };
    }

    return prisma.menuItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id) {
    return prisma.menuItem.findUnique({
      where: { id },
    });
  }

  async findByNameAndMess(messId, name) {
    return prisma.menuItem.findUnique({
      where: {
        messId_name: { messId, name },
      },
    });
  }

  async create(data) {
    return prisma.menuItem.create({
      data: {
        messId: data.messId,
        name: data.name,
        category: data.category,
        defaultServingGrams: data.defaultServingGrams,
        isAvailable: data.isAvailable ?? true,
      },
    });
  }

  async update(id, data) {
    return prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return prisma.menuItem.delete({
      where: { id },
    });
  }

  async countMenuDishes(menuItemId) {
    return prisma.menuDish.count({
      where: { menuItemId },
    });
  }

  async countActiveMenuDishes(menuItemId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prisma.menuDish.count({
      where: {
        menuItemId,
        menu: {
          date: { gte: today },
        },
      },
    });
  }

  async detachMenuDishes(menuItemId) {
    return prisma.menuDish.updateMany({
      where: { menuItemId },
      data: { menuItemId: null },
    });
  }
}

const menuItemRepository = new MenuItemRepository();

module.exports = {
  MenuItemRepository,
  menuItemRepository,
};
