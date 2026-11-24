const prisma = require('../lib/prisma');
const { BookingStatus, EntryType } = require('@prisma/client');

const bookingInclude = {
  student: {
    select: {
      id: true,
      name: true,
      email: true,
      rollNo: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  },
  menu: {
    include: {
      dishes: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  },
  slot: true,
  feedback: true,
};

class BookingRepository {
  async count(where = {}) {
    return prisma.booking.count({ where });
  }

  async findById(id) {
    return prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
  }

  async findByStudentAndMenu(studentId, menuId) {
    return prisma.booking.findUnique({
      where: {
        studentId_menuId: {
          studentId,
          menuId,
        },
      },
      include: bookingInclude,
    });
  }

  async findMany(filter) {
    const where = {};

    if (filter.studentId) where.studentId = filter.studentId;
    if (filter.menuId) where.menuId = filter.menuId;
    if (filter.status) where.status = filter.status;

    if (filter.date || filter.mealType) {
      where.menu = {};
      if (filter.date) where.menu.date = filter.date;
      if (filter.mealType) where.menu.mealType = filter.mealType;
    }

    return prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data, tx) {
    const client = tx || prisma;
    return client.booking.create({
      data: {
        studentId: data.studentId,
        menuId: data.menuId,
        slotId: data.slotId,
        status: data.status || BookingStatus.BOOKED,
        entryType: data.entryType || EntryType.BOOKING,
        bookedAt: data.bookedAt || new Date(),
      },
    });
  }

  async update(id, data, tx) {
    const client = tx || prisma;
    return client.booking.update({
      where: { id },
      data,
    });
  }

  async incrementSlotCapacity(slotId, tx) {
    const client = tx || prisma;
    return client.$executeRaw`
      UPDATE time_slots
      SET "currentBookings" = "currentBookings" + 1
      WHERE id = ${slotId}
      AND "currentBookings" < capacity
    `;
  }

  async decrementSlotCapacity(slotId, tx) {
    const client = tx || prisma;
    return client.$executeRaw`
      UPDATE time_slots
      SET "currentBookings" = "currentBookings" - 1
      WHERE id = ${slotId}
      AND "currentBookings" > 0
    `;
  }

  async executeTransaction(fn) {
    return prisma.$transaction(fn);
  }
}

const bookingRepository = new BookingRepository();

module.exports = {
  BookingRepository,
  bookingRepository,
};
