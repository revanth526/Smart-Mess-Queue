const { MealType, Role } = require('@prisma/client');
const { feedbackRepository } = require('../repositories/feedback.repository');
const { bookingRepository } = require('../repositories/booking.repository');
const { menuRepository } = require('../repositories/menu.repository');
const { foodLogRepository } = require('../repositories/foodLog.repository');
const { queueRepository } = require('../repositories/queue.repository');
const { messRepository } = require('../repositories/mess.repository');
const { NotFoundError, BadRequestError, ForbiddenError, ConflictError } = require('../errors');
const { parseDateOnly } = require('./foodLog.service');

function formatFeedback(f) {
  const dateStr =
    f.menu?.date instanceof Date
      ? f.menu.date.toISOString().split('T')[0]
      : f.menu?.date
        ? String(f.menu.date).split('T')[0]
        : '';

  return {
    id: f.id,
    studentId: f.studentId,
    bookingId: f.bookingId,
    menuId: f.menuId,
    rating: f.rating,
    comment: f.comment,
    createdAt:
      f.createdAt instanceof Date
        ? f.createdAt.toISOString()
        : f.createdAt
          ? String(f.createdAt)
          : new Date().toISOString(),
    updatedAt:
      f.updatedAt instanceof Date
        ? f.updatedAt.toISOString()
        : f.updatedAt
          ? String(f.updatedAt)
          : new Date().toISOString(),
    student: f.student
      ? {
          id: f.student.id,
          name: f.student.name,
          email: f.student.email,
          rollNo: f.student.rollNo || f.student.studentId || null,
          studentId: f.student.studentId || null,
        }
      : undefined,
    menu: f.menu
      ? {
          id: f.menu.id,
          messId: f.menu.messId,
          date: dateStr,
          mealType: f.menu.mealType,
        }
      : undefined,
    booking: f.booking
      ? {
          id: f.booking.id,
          status: f.booking.status,
          entryType: f.booking.entryType,
          bookedAt: f.booking.bookedAt?.toISOString() || null,
          servedAt: f.booking.servedAt?.toISOString() || null,
        }
      : undefined,
  };
}

class FeedbackService {
  constructor(
    feedbackRepo = feedbackRepository,
    bookingRepo = bookingRepository,
    menuRepo = menuRepository,
    foodLogRepo = foodLogRepository,
    queueRepo = queueRepository,
    messRepo = messRepository,
  ) {
    this.feedbackRepo = feedbackRepo;
    this.bookingRepo = bookingRepo;
    this.menuRepo = menuRepo;
    this.foodLogRepo = foodLogRepo;
    this.queueRepo = queueRepo;
    this.messRepo = messRepo;
  }

  /**
   * Submit feedback for an attended meal.
   * Enforces:
   * 1. Booking ownership (IDOR defense)
   * 2. Checked-in requirement (status must be CHECKED_IN, WAITING, SERVING, SERVED, or COMPLETED)
   * 3. Cannot submit feedback for cancelled, no-show, or un-checked-in meals
   * 4. One feedback per completed meal experience (duplicate prevention)
   */
  async createFeedback(studentId, input) {
    const bookingId = input.bookingId || input.booking_id || input.id;
    if (!bookingId) {
      throw new BadRequestError('INVALID_INPUT', 'Booking ID is required');
    }

    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    // Ownership check (IDOR protection)
    if (booking.studentId !== studentId) {
      throw new ForbiddenError('You can only submit feedback for your own booking');
    }

    // Booking cancellation / attendance check
    const currentStatus = String(booking.status || '').toUpperCase();
    if (currentStatus === 'CANCELLED') {
      throw new BadRequestError(
        'INVALID_BOOKING_STATUS',
        'Cannot submit feedback for a cancelled booking',
      );
    }

    if (currentStatus === 'NO_SHOW') {
      throw new BadRequestError(
        'INVALID_BOOKING_STATUS',
        'Cannot submit feedback for a meal you did not attend',
      );
    }

    // Students can rate ONLY AFTER they have checked in to that booking
    const checkedInStatuses = ['CHECKED_IN', 'WAITING', 'SERVING', 'SERVED', 'COMPLETED', 'WALK_IN'];
    if (!checkedInStatuses.includes(currentStatus)) {
      throw new BadRequestError(
        'NOT_CHECKED_IN',
        'You must check in to your meal booking before submitting a rating or review',
      );
    }

    // Future meal date check
    if (booking.menu) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const menuDate = new Date(booking.menu.date);
      if (menuDate > today) {
        throw new BadRequestError('FUTURE_MEAL', 'Cannot submit feedback for future meals');
      }
    }

    const now = new Date();
    // Do not block ratings while student is in the queue (CHECKED_IN or WAITING)
    const inQueueStatuses = ['CHECKED_IN', 'WAITING'];
    if (
      booking.slot &&
      new Date(booking.slot.startTime) > now &&
      !inQueueStatuses.includes(currentStatus)
    ) {
      throw new BadRequestError('FUTURE_MEAL', 'Cannot submit feedback for future time slot');
    }

    if (booking.servedAt && new Date(booking.servedAt) > now) {
      throw new BadRequestError(
        'FUTURE_MEAL',
        'Cannot submit feedback before service is completed',
      );
    }

    // Duplicate check
    const existing = await this.feedbackRepo.findByBookingId(bookingId);
    if (existing) {
      throw new ConflictError(
        'DUPLICATE_FEEDBACK',
        'Feedback has already been submitted for this meal',
      );
    }

    // Rating validation
    const rating = Number(input.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestError('INVALID_RATING', 'Rating must be an integer between 1 and 5');
    }

    const comment =
      input.comment !== undefined
        ? input.comment
        : input.comments !== undefined
          ? input.comments
          : null;

    const created = await this.feedbackRepo.create({
      studentId,
      bookingId,
      menuId: booking.menuId || input.menuId,
      rating,
      comment: comment ? String(comment).trim() : null,
    });

    return formatFeedback(created);
  }

  /**
   * Edit feedback by the original student.
   * Preserves audit-relevant createdAt, updates rating/comment, and updates updatedAt.
   */
  async updateFeedback(studentId, id, input) {
    const existing = await this.feedbackRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('FEEDBACK_NOT_FOUND', 'Feedback not found');
    }

    // Ownership check
    if (existing.studentId !== studentId) {
      throw new ForbiddenError('You can only edit your own feedback');
    }

    if (input.rating !== undefined) {
      if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
        throw new BadRequestError('INVALID_RATING', 'Rating must be an integer between 1 and 5');
      }
    }

    const updated = await this.feedbackRepo.update(id, {
      rating: input.rating,
      comment:
        input.comment !== undefined ? (input.comment ? input.comment.trim() : null) : undefined,
    });

    return formatFeedback(updated);
  }

  /**
   * Get single feedback by ID. Accessible by author or any MESS_ADMIN.
   * If MESS_ADMIN provides adminMessId, access is restricted to that mess.
   */
  async getFeedbackById(userId, role, id, adminMessId) {
    const feedback = await this.feedbackRepo.findById(id);
    if (!feedback) {
      throw new NotFoundError('FEEDBACK_NOT_FOUND', 'Feedback not found');
    }

    if (role === Role.MESS_ADMIN) {
      if (adminMessId) {
        const mess = await this.messRepo.findById(adminMessId);
        if (!mess) {
          throw new NotFoundError('MESS_NOT_FOUND', 'Mess not found');
        }
        if (feedback.menu?.messId && feedback.menu.messId !== adminMessId) {
          throw new ForbiddenError('You do not have access to feedback from another mess');
        }
      }
    } else if (feedback.studentId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return formatFeedback(feedback);
  }

  /**
   * List feedback submitted by the authenticated student.
   */
  async getMyFeedback(studentId) {
    const feedbacks = await this.feedbackRepo.findByStudentId(studentId);
    return feedbacks.map((f) => formatFeedback(f));
  }

  /**
   * Admin: List feedback with filters.
   * Enforces mess existence check when messId is provided.
   */
  async listAdminFeedback(query) {
    if (query.messId) {
      const mess = await this.messRepo.findById(query.messId);
      if (!mess) {
        throw new NotFoundError('MESS_NOT_FOUND', 'Mess not found');
      }
    }
    const filter = { ...query };
    if (filter.startDate) filter.startDate = parseDateOnly(filter.startDate);
    if (filter.endDate) filter.endDate = parseDateOnly(filter.endDate);
    const feedbacks = await this.feedbackRepo.findAll(filter);
    return feedbacks.map((f) => formatFeedback(f));
  }

  /**
   * Deterministic feedback analytics for admin.
   * Enforces mess existence check when messId is provided.
   */
  async getAnalytics(query) {
    if (query.messId) {
      const mess = await this.messRepo.findById(query.messId);
      if (!mess) {
        throw new NotFoundError('MESS_NOT_FOUND', 'Mess not found');
      }
    }

    const filter = {
      messId: query.messId,
      menuId: query.menuId,
      mealType: query.mealType,
    };

    if (query.startDate) filter.startDate = parseDateOnly(query.startDate);
    if (query.endDate) filter.endDate = parseDateOnly(query.endDate);

    const feedbacks = await this.feedbackRepo.findAll(filter);

    const totalCount = feedbacks.length;
    const sumRating = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const averageRating = totalCount === 0 ? 0 : Number((sumRating / totalCount).toFixed(2));

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const mealMap = new Map();

    for (const f of feedbacks) {
      if (f.rating >= 1 && f.rating <= 5) {
        distribution[f.rating] += 1;
      }

      if (f.menu?.mealType) {
        const m = mealMap.get(f.menu.mealType) || { sum: 0, count: 0 };
        m.sum += f.rating;
        m.count += 1;
        mealMap.set(f.menu.mealType, m);
      }
    }

    const byMeal = Object.values(MealType).map((mealType) => {
      const data = mealMap.get(mealType) || { sum: 0, count: 0 };
      const avg = data.count === 0 ? 0 : Number((data.sum / data.count).toFixed(2));
      return {
        mealType,
        averageRating: avg,
        feedbackCount: data.count,
      };
    });

    const recentFeedback = feedbacks.slice(0, 10).map((f) => formatFeedback(f));

    return {
      totalCount,
      averageRating,
      distribution,
      byMeal,
      recentFeedback,
    };
  }

  /**
   * Consolidated operational dashboard metrics combining
   * today's meals, live queues, bookings, food waste, and feedback.
   * Eliminates N+1 loop queries using batch operations.
   */
  async getOperationalMetrics(messId) {
    if (messId) {
      const mess = await this.messRepo.findById(messId);
      if (!mess) {
        throw new NotFoundError('MESS_NOT_FOUND', 'Mess not found');
      }
    }

    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    const todayDate = parseDateOnly(todayDateStr);

    // 1. Menus today
    const todayMenus = await this.menuRepo.findAll({
      messId,
      date: todayDate,
    });

    // 2. Queue & Booking aggregates for today's menus in batch (avoid N+1 queries)
    const menuIds = todayMenus.map((m) => m.id);
    let totalBookings = 0;
    let checkedInCount = 0;
    let servingCount = 0;
    let servedCount = 0;
    let walkInCount = 0;
    let totalWaitingCount = 0;

    if (menuIds.length > 0) {
      const [queueEntries, bookingsCount] = await Promise.all([
        this.queueRepo.findByMenuIds(menuIds),
        this.bookingRepo.count({ menuId: { in: menuIds } }),
      ]);
      totalBookings = bookingsCount;
      for (const q of queueEntries || []) {
        if (q.entryType === 'WALK_IN') walkInCount++;
        if (q.status === 'CHECKED_IN') checkedInCount++;
        if (q.status === 'WAITING') totalWaitingCount++;
        if (q.status === 'SERVING') servingCount++;
        if (q.status === 'SERVED') servedCount++;
      }
    }

    // 3. Food waste logs today
    const foodLogs = await this.foodLogRepo.findAll({
      messId,
      date: todayDate,
    });

    const foodPreparedKg = Number(foodLogs.reduce((acc, l) => acc + l.preparedKg, 0).toFixed(2));
    const foodServedKg = Number(foodLogs.reduce((acc, l) => acc + l.servedKg, 0).toFixed(2));
    const foodWastedKg = Number(foodLogs.reduce((acc, l) => acc + l.wastedKg, 0).toFixed(2));
    const wastePercentage =
      foodPreparedKg === 0 ? 0 : Number(((foodWastedKg / foodPreparedKg) * 100).toFixed(2));

    // 4. Feedback metrics (overall / filtered by messId)
    const feedbackAnalytics = await this.getAnalytics({ messId });

    return {
      todayMenusCount: todayMenus.length,
      totalBookings,
      checkedInCount,
      servingCount,
      servedCount,
      walkInCount,
      totalWaitingCount,
      foodPreparedKg,
      foodServedKg,
      foodWastedKg,
      wastePercentage,
      averageFeedbackRating: feedbackAnalytics.averageRating,
      feedbackCount: feedbackAnalytics.totalCount,
    };
  }

  async deleteFeedback(userId, userRole, id) {
    const feedback = await this.feedbackRepo.findById(id);
    if (!feedback) {
      throw new NotFoundError('FEEDBACK_NOT_FOUND', 'Feedback not found');
    }
    // Only author student or MESS_ADMIN can delete/moderate
    if (userRole !== Role.MESS_ADMIN && feedback.studentId !== userId) {
      throw new ForbiddenError('You can only delete your own feedback');
    }
    return this.feedbackRepo.delete(id);
  }
}

const feedbackService = new FeedbackService();

module.exports = {
  formatFeedback,
  FeedbackService,
  feedbackService,
};
