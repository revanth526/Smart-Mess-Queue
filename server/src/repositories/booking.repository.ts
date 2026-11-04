import prisma from '../lib/prisma';
import { Booking, BookingStatus, EntryType, MealType, Prisma } from '@prisma/client';

export type BookingWithDetails = Prisma.BookingGetPayload<{
  include: {
    student: {
      select: {
        id: true;
        name: true;
        email: true;
        rollNo: true;
        role: true;
        isActive: true;
        createdAt: true;
      };
    };
    menu: {
      include: {
        dishes: true;
      };
    };
    slot: true;
  };
}>;

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
        orderBy: { sortOrder: 'asc' as const },
      },
    },
  },
  slot: true,
  feedback: true,
};

export class BookingRepository {
  async count(where: Prisma.BookingWhereInput = {}): Promise<number> {
    return prisma.booking.count({ where });
  }
  async findById(id: string): Promise<BookingWithDetails | null> {
    return prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
  }

  async findByStudentAndMenu(
    studentId: string,
    menuId: string,
  ): Promise<BookingWithDetails | null> {
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

  async findMany(filter: {
    studentId?: string;
    menuId?: string;
    date?: Date;
    mealType?: MealType;
    status?: BookingStatus;
  }): Promise<BookingWithDetails[]> {
    const where: Prisma.BookingWhereInput = {};

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

  async create(
    data: {
      studentId: string;
      menuId: string;
      slotId: string;
      status?: BookingStatus;
      entryType?: EntryType;
      bookedAt?: Date;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Booking> {
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

  async update(
    id: string,
    data: Prisma.BookingUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Booking> {
    const client = tx || prisma;
    return client.booking.update({
      where: { id },
      data,
    });
  }

  async incrementSlotCapacity(slotId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx || prisma;
    return client.$executeRaw`
      UPDATE time_slots
      SET "currentBookings" = "currentBookings" + 1
      WHERE id = ${slotId}
      AND "currentBookings" < capacity
    `;
  }

  async decrementSlotCapacity(slotId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx || prisma;
    return client.$executeRaw`
      UPDATE time_slots
      SET "currentBookings" = "currentBookings" - 1
      WHERE id = ${slotId}
      AND "currentBookings" > 0
    `;
  }

  async executeTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  }
}

export const bookingRepository = new BookingRepository();
