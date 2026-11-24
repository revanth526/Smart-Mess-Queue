const prisma = require('../lib/prisma');
const { BookingStatus } = require('@prisma/client');

class MenuRepository {
  async findById(id) {
    return prisma.menu.findUnique({
      where: { id },
      include: {
        dishes: {
          orderBy: { sortOrder: 'asc' },
        },
        slots: {
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  async findByMessDateMealType(messId, date, mealType) {
    return prisma.menu.findUnique({
      where: {
        messId_date_mealType: {
          messId,
          date,
          mealType,
        },
      },
      include: {
        dishes: {
          orderBy: { sortOrder: 'asc' },
        },
        slots: {
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  async findAll(filter) {
    const where = {};

    if (filter.messId) {
      where.messId = filter.messId;
    }

    if (filter.date) {
      where.date = filter.date;
    } else if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = filter.startDate;
      if (filter.endDate) where.date.lte = filter.endDate;
    }

    if (filter.mealType) {
      where.mealType = filter.mealType;
    }

    return prisma.menu.findMany({
      where,
      include: {
        dishes: {
          orderBy: { sortOrder: 'asc' },
        },
        slots: {
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
    });
  }

  async create(data) {
    return prisma.menu.create({
      data: {
        messId: data.messId,
        date: data.date,
        mealType: data.mealType,
        dishes: data.dishes
          ? {
              create: data.dishes.map((dish, index) => ({
                menuItemId: dish.menuItemId || null,
                dishName: dish.dishName,
                dishCategory: dish.dishCategory || null,
                servingGrams: dish.servingGrams || null,
                sortOrder: dish.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        dishes: {
          orderBy: { sortOrder: 'asc' },
        },
        slots: {
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  async delete(id) {
    return prisma.$transaction(async (tx) => {
      // 1. Delete feedback records associated with this menu
      await tx.feedback.deleteMany({
        where: { menuId: id },
      });

      // 2. Delete queue entries associated with this menu (walk-ins, check-ins)
      await tx.queueEntry.deleteMany({
        where: { menuId: id },
      });

      // 3. Delete any remaining bookings for this menu (e.g. cancelled)
      await tx.booking.deleteMany({
        where: { menuId: id },
      });

      // 4. Detach food logs (set menuId to null to preserve historical waste records)
      await tx.foodLog.updateMany({
        where: { menuId: id },
        data: { menuId: null },
      });

      // 5. Delete time slots associated with this menu
      await tx.timeSlot.deleteMany({
        where: { menuId: id },
      });

      // 6. Delete dishes associated with this menu
      await tx.menuDish.deleteMany({
        where: { menuId: id },
      });

      // 7. Delete the menu record itself
      return tx.menu.delete({
        where: { id },
      });
    });
  }

  async addDish(menuId, dish) {
    return prisma.menuDish.create({
      data: {
        menuId,
        menuItemId: dish.menuItemId || null,
        dishName: dish.dishName,
        dishCategory: dish.dishCategory || null,
        servingGrams: dish.servingGrams || null,
        sortOrder: dish.sortOrder ?? 0,
      },
    });
  }

  async removeDish(dishId) {
    return prisma.menuDish.delete({
      where: { id: dishId },
    });
  }

  async findDishById(dishId) {
    return prisma.menuDish.findUnique({
      where: { id: dishId },
    });
  }

  async countBookings(menuId) {
    return prisma.booking.count({
      where: {
        menuId,
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
    });
  }
}

const menuRepository = new MenuRepository();

module.exports = {
  MenuRepository,
  menuRepository,
};
