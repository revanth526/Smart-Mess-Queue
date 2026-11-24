const prisma = require('../lib/prisma');
const { QueueStatus, EntryType } = require('@prisma/client');

class FoodLogRepository {
  async findById(id) {
    return prisma.foodLog.findUnique({
      where: { id },
      include: {
        mess: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        menu: {
          select: {
            id: true,
            date: true,
            mealType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findByMessDateMealType(messId, date, mealType) {
    return prisma.foodLog.findUnique({
      where: {
        messId_date_mealType: {
          messId,
          date,
          mealType,
        },
      },
      include: {
        mess: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        menu: {
          select: {
            id: true,
            date: true,
            mealType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async create(data) {
    return prisma.foodLog.create({
      data: {
        messId: data.messId,
        menuId: data.menuId || null,
        date: data.date,
        mealType: data.mealType,
        preparedKg: data.preparedKg,
        servedKg: data.servedKg,
        wastedKg: data.wastedKg,
        notes: data.notes || null,
        createdById: data.createdById,
      },
      include: {
        mess: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        menu: {
          select: {
            id: true,
            date: true,
            mealType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.foodLog.update({
      where: { id },
      data: {
        ...(data.preparedKg !== undefined ? { preparedKg: data.preparedKg } : {}),
        ...(data.servedKg !== undefined ? { servedKg: data.servedKg } : {}),
        ...(data.wastedKg !== undefined ? { wastedKg: data.wastedKg } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: {
        mess: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        menu: {
          select: {
            id: true,
            date: true,
            mealType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async delete(id) {
    return prisma.foodLog.delete({
      where: { id },
    });
  }

  async findAll(filter) {
    const where = {};

    if (filter.messId) where.messId = filter.messId;
    if (filter.mealType) where.mealType = filter.mealType;

    if (filter.date) {
      where.date = filter.date;
    } else if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = filter.startDate;
      if (filter.endDate) where.date.lte = filter.endDate;
    }

    return prisma.foodLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { mealType: 'asc' }],
      include: {
        mess: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        menu: {
          select: {
            id: true,
            date: true,
            mealType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getMealContext(menuId) {
    const [totalBookings, checkedInCount, servedCount, walkInCount] = await Promise.all([
      prisma.booking.count({ where: { menuId } }),
      prisma.queueEntry.count({
        where: {
          menuId,
          status: {
            in: [
              QueueStatus.CHECKED_IN,
              QueueStatus.WAITING,
              QueueStatus.SERVING,
              QueueStatus.SERVED,
            ],
          },
        },
      }),
      prisma.queueEntry.count({
        where: {
          menuId,
          status: QueueStatus.SERVED,
        },
      }),
      prisma.queueEntry.count({
        where: {
          menuId,
          entryType: EntryType.WALK_IN,
        },
      }),
    ]);

    return {
      totalBookings,
      checkedInCount,
      servedCount,
      walkInCount,
    };
  }
}

const foodLogRepository = new FoodLogRepository();

module.exports = {
  FoodLogRepository,
  foodLogRepository,
};
