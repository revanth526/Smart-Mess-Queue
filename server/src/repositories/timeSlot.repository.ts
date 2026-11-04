import prisma from '../lib/prisma';
import { TimeSlot } from '@prisma/client';

export class TimeSlotRepository {
  async findByMenuId(menuId: string): Promise<TimeSlot[]> {
    return prisma.timeSlot.findMany({
      where: { menuId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(id: string): Promise<TimeSlot | null> {
    return prisma.timeSlot.findUnique({
      where: { id },
    });
  }

  async createMany(
    slots: Array<{
      menuId: string;
      startTime: Date;
      endTime: Date;
      capacity: number;
      currentBookings?: number;
    }>,
  ): Promise<number> {
    const result = await prisma.timeSlot.createMany({
      data: slots,
    });
    return result.count;
  }

  async deleteByMenuId(menuId: string): Promise<number> {
    const result = await prisma.timeSlot.deleteMany({
      where: { menuId },
    });
    return result.count;
  }

  async countBookingsInSlots(menuId: string): Promise<number> {
    const slots = await prisma.timeSlot.findMany({
      where: { menuId },
      select: { currentBookings: true },
    });
    return slots.reduce((sum, slot) => sum + slot.currentBookings, 0);
  }
}

export const timeSlotRepository = new TimeSlotRepository();
