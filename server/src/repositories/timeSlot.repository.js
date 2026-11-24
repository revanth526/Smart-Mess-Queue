const prisma = require('../lib/prisma');

class TimeSlotRepository {
  async findByMenuId(menuId) {
    return prisma.timeSlot.findMany({
      where: { menuId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(id) {
    return prisma.timeSlot.findUnique({
      where: { id },
    });
  }

  async createMany(slots) {
    const result = await prisma.timeSlot.createMany({
      data: slots,
    });
    return result.count;
  }

  async deleteByMenuId(menuId) {
    const result = await prisma.timeSlot.deleteMany({
      where: { menuId },
    });
    return result.count;
  }

  async countBookingsInSlots(menuId) {
    const slots = await prisma.timeSlot.findMany({
      where: { menuId },
      select: { currentBookings: true },
    });
    return slots.reduce((sum, slot) => sum + slot.currentBookings, 0);
  }
}

const timeSlotRepository = new TimeSlotRepository();

module.exports = {
  TimeSlotRepository,
  timeSlotRepository,
};
