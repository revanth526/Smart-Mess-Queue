import prisma from '../lib/prisma';
import { Feedback, MealType, Prisma } from '@prisma/client';

export type FeedbackWithDetails = Feedback & {
  student?: {
    id: string;
    name: string;
    email: string | null;
    studentId?: string | null;
    rollNo: string | null;
  };
  menu?: {
    id: string;
    messId: string;
    date: Date;
    mealType: MealType;
  };
  booking?: {
    id: string;
    status: string;
    entryType: string;
    bookedAt: Date | null;
    servedAt: Date | null;
  };
};

export class FeedbackRepository {
  async findById(id: string): Promise<FeedbackWithDetails | null> {
    return prisma.feedback.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
          },
        },
        menu: {
          select: {
            id: true,
            messId: true,
            date: true,
            mealType: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            entryType: true,
            bookedAt: true,
            servedAt: true,
          },
        },
      },
    });
  }

  async findByBookingId(bookingId: string): Promise<FeedbackWithDetails | null> {
    return prisma.feedback.findUnique({
      where: { bookingId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
          },
        },
        menu: {
          select: {
            id: true,
            messId: true,
            date: true,
            mealType: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            entryType: true,
            bookedAt: true,
            servedAt: true,
          },
        },
      },
    });
  }

  async findByStudentId(studentId: string): Promise<FeedbackWithDetails[]> {
    return prisma.feedback.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
          },
        },
        menu: {
          select: {
            id: true,
            messId: true,
            date: true,
            mealType: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            entryType: true,
            bookedAt: true,
            servedAt: true,
          },
        },
      },
    });
  }

  async create(data: {
    studentId: string;
    bookingId: string;
    menuId: string;
    rating: number;
    comment?: string | null;
  }): Promise<FeedbackWithDetails> {
    return prisma.feedback.create({
      data: {
        studentId: data.studentId,
        bookingId: data.bookingId,
        menuId: data.menuId,
        rating: data.rating,
        comment: data.comment || null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
          },
        },
        menu: {
          select: {
            id: true,
            messId: true,
            date: true,
            mealType: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            entryType: true,
            bookedAt: true,
            servedAt: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      rating?: number;
      comment?: string | null;
    },
  ): Promise<FeedbackWithDetails> {
    return prisma.feedback.update({
      where: { id },
      data: {
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.comment !== undefined ? { comment: data.comment } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
          },
        },
        menu: {
          select: {
            id: true,
            messId: true,
            date: true,
            mealType: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            entryType: true,
            bookedAt: true,
            servedAt: true,
          },
        },
      },
    });
  }

  async findAll(filter: {
    menuId?: string;
    messId?: string;
    mealType?: MealType;
    rating?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FeedbackWithDetails[]> {
    const where: Prisma.FeedbackWhereInput = {};

    if (filter.rating !== undefined) {
      where.rating = filter.rating;
    }
    if (filter.menuId) {
      where.menuId = filter.menuId;
    }
    if (filter.messId || filter.mealType || filter.startDate || filter.endDate) {
      where.menu = {};
      if (filter.messId) where.menu.messId = filter.messId;
      if (filter.mealType) where.menu.mealType = filter.mealType;
      if (filter.startDate || filter.endDate) {
        where.menu.date = {};
        if (filter.startDate) where.menu.date.gte = filter.startDate;
        if (filter.endDate) where.menu.date.lte = filter.endDate;
      }
    }

    return prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
          },
        },
        menu: {
          select: {
            id: true,
            messId: true,
            date: true,
            mealType: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            entryType: true,
            bookedAt: true,
            servedAt: true,
          },
        },
      },
    });
  }
}

export const feedbackRepository = new FeedbackRepository();
