const prisma = require('../lib/prisma');

class FeedbackRepository {
  async findById(id) {
    return prisma.feedback.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
            studentId: true,
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

  async findByBookingId(bookingId) {
    return prisma.feedback.findUnique({
      where: { bookingId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
            studentId: true,
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

  async findByStudentId(studentId) {
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
            studentId: true,
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

  async delete(id) {
    return prisma.feedback.delete({
      where: { id },
    });
  }

  async create(data) {
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
            studentId: true,
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

  async update(id, data) {
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
            studentId: true,
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

  async findAll(filter) {
    const where = {};

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
        if (filter.startDate) {
          where.menu.date.gte =
            filter.startDate instanceof Date ? filter.startDate : new Date(filter.startDate);
        }
        if (filter.endDate) {
          where.menu.date.lte =
            filter.endDate instanceof Date ? filter.endDate : new Date(filter.endDate);
        }
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
            studentId: true,
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

const feedbackRepository = new FeedbackRepository();

module.exports = {
  FeedbackRepository,
  feedbackRepository,
};
