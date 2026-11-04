import { BookingStatus, MealType, Role } from '@prisma/client';
import {
  feedbackRepository,
  FeedbackRepository,
  FeedbackWithDetails,
} from '../repositories/feedback.repository';
import { bookingRepository, BookingRepository } from '../repositories/booking.repository';
import { menuRepository, MenuRepository } from '../repositories/menu.repository';
import { foodLogRepository, FoodLogRepository } from '../repositories/foodLog.repository';
import { queueRepository, QueueRepository } from '../repositories/queue.repository';
import { messRepository, MessRepository } from '../repositories/mess.repository';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../errors';
import {
  CreateFeedbackInput,
  UpdateFeedbackInput,
  FeedbackQueryParams,
  FeedbackAnalyticsQueryParams,
} from '../validators/feedback.validators';
import { parseDateOnly } from './foodLog.service';

export interface FormattedFeedback {
  id: string;
  studentId: string;
  bookingId: string;
  menuId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
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
    date: string;
    mealType: MealType;
  };
  booking?: {
    id: string;
    status: string;
    entryType: string;
    bookedAt: string | null;
    servedAt: string | null;
  };
}

export interface FeedbackRatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface MealFeedbackBreakdown {
  mealType: MealType;
  averageRating: number;
  feedbackCount: number;
}

export interface FeedbackAnalyticsResponse {
  totalCount: number;
  averageRating: number;
  distribution: FeedbackRatingDistribution;
  byMeal: MealFeedbackBreakdown[];
  recentFeedback: FormattedFeedback[];
}

export interface OperationalDashboardMetricsResponse {
  todayMenusCount: number;
  totalBookings: number;
  checkedInCount: number;
  servingCount: number;
  servedCount: number;
  walkInCount: number;
  totalWaitingCount: number;
  foodPreparedKg: number;
  foodServedKg: number;
  foodWastedKg: number;
  wastePercentage: number;
  averageFeedbackRating: number;
  feedbackCount: number;
}

export function formatFeedback(f: FeedbackWithDetails): FormattedFeedback {
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
    student: f.student,
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

export class FeedbackService {
  constructor(
    private readonly feedbackRepo: FeedbackRepository = feedbackRepository,
    private readonly bookingRepo: BookingRepository = bookingRepository,
    private readonly menuRepo: MenuRepository = menuRepository,
    private readonly foodLogRepo: FoodLogRepository = foodLogRepository,
    private readonly queueRepo: QueueRepository = queueRepository,
    private readonly messRepo: MessRepository = messRepository,
  ) {}

  /**
   * Submit feedback for an attended meal.
   * Enforces:
   * 1. Booking ownership (IDOR defense)
   * 2. Completed service requirement (status must be SERVED)
   * 3. Cannot submit feedback for cancelled, no-show, or future meals
   * 4. One feedback per completed meal experience (duplicate prevention)
   */
  async createFeedback(studentId: string, input: CreateFeedbackInput): Promise<FormattedFeedback> {
    const booking = await this.bookingRepo.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    // Ownership check (IDOR protection)
    if (booking.studentId !== studentId) {
      throw new ForbiddenError('You can only submit feedback for your own booking');
    }

    // Booking completion check
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError(
        'INVALID_BOOKING_STATUS',
        'Cannot submit feedback for a cancelled booking',
      );
    }

    if (booking.status === BookingStatus.NO_SHOW) {
      throw new BadRequestError(
        'INVALID_BOOKING_STATUS',
        'Cannot submit feedback for a meal you did not attend',
      );
    }

    if (booking.status !== BookingStatus.SERVED) {
      throw new BadRequestError(
        'MEAL_NOT_COMPLETED',
        'Feedback can only be submitted after completing the meal service',
      );
    }

    // Future meal & time slot checks
    const now = new Date();
    if (booking.menu) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const menuDate = new Date(booking.menu.date);
      if (menuDate > today) {
        throw new BadRequestError('FUTURE_MEAL', 'Cannot submit feedback for future meals');
      }
    }

    if (booking.slot && new Date(booking.slot.startTime) > now) {
      throw new BadRequestError('FUTURE_MEAL', 'Cannot submit feedback for future time slot');
    }

    if (booking.servedAt && new Date(booking.servedAt) > now) {
      throw new BadRequestError(
        'FUTURE_MEAL',
        'Cannot submit feedback before service is completed',
      );
    }

    // Duplicate check
    const existing = await this.feedbackRepo.findByBookingId(input.bookingId);
    if (existing) {
      throw new ConflictError(
        'DUPLICATE_FEEDBACK',
        'Feedback has already been submitted for this meal',
      );
    }

    // Rating validation
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new BadRequestError('INVALID_RATING', 'Rating must be an integer between 1 and 5');
    }

    const created = await this.feedbackRepo.create({
      studentId,
      bookingId: input.bookingId,
      menuId: booking.menuId,
      rating: input.rating,
      comment: input.comment ? input.comment.trim() : null,
    });

    return formatFeedback(created);
  }

  /**
   * Edit feedback by the original student.
   * Preserves audit-relevant createdAt, updates rating/comment, and updates updatedAt.
   */
  async updateFeedback(
    studentId: string,
    id: string,
    input: UpdateFeedbackInput,
  ): Promise<FormattedFeedback> {
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
  async getFeedbackById(
    userId: string,
    role: Role,
    id: string,
    adminMessId?: string,
  ): Promise<FormattedFeedback> {
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
  async getMyFeedback(studentId: string): Promise<FormattedFeedback[]> {
    const feedbacks = await this.feedbackRepo.findByStudentId(studentId);
    return feedbacks.map((f) => formatFeedback(f));
  }

  /**
   * Admin: List feedback with filters.
   * Enforces mess existence check when messId is provided.
   */
  async listAdminFeedback(query: FeedbackQueryParams): Promise<FormattedFeedback[]> {
    if (query.messId) {
      const mess = await this.messRepo.findById(query.messId);
      if (!mess) {
        throw new NotFoundError('MESS_NOT_FOUND', 'Mess not found');
      }
    }
    const feedbacks = await this.feedbackRepo.findAll(query);
    return feedbacks.map((f) => formatFeedback(f));
  }

  /**
   * Deterministic feedback analytics for admin.
   * Enforces mess existence check when messId is provided.
   */
  async getAnalytics(query: FeedbackAnalyticsQueryParams): Promise<FeedbackAnalyticsResponse> {
    if (query.messId) {
      const mess = await this.messRepo.findById(query.messId);
      if (!mess) {
        throw new NotFoundError('MESS_NOT_FOUND', 'Mess not found');
      }
    }

    const filter: {
      messId?: string;
      menuId?: string;
      mealType?: MealType;
      startDate?: Date;
      endDate?: Date;
    } = {
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

    const distribution: FeedbackRatingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const mealMap = new Map<MealType, { sum: number; count: number }>();

    for (const f of feedbacks) {
      if (f.rating >= 1 && f.rating <= 5) {
        distribution[f.rating as keyof FeedbackRatingDistribution] += 1;
      }

      if (f.menu?.mealType) {
        const m = mealMap.get(f.menu.mealType) || { sum: 0, count: 0 };
        m.sum += f.rating;
        m.count += 1;
        mealMap.set(f.menu.mealType, m);
      }
    }

    const byMeal: MealFeedbackBreakdown[] = Object.values(MealType).map((mealType) => {
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
  async getOperationalMetrics(messId?: string): Promise<OperationalDashboardMetricsResponse> {
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
}

export const feedbackService = new FeedbackService();
