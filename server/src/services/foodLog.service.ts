import { MealType } from '@prisma/client';
import {
  foodLogRepository,
  FoodLogRepository,
  FoodLogWithRelations,
  MealContextCounts,
} from '../repositories/foodLog.repository';
import { messRepository, MessRepository } from '../repositories/mess.repository';
import { menuRepository, MenuRepository } from '../repositories/menu.repository';
import { NotFoundError, BadRequestError, ConflictError } from '../errors';
import {
  CreateFoodLogInput,
  UpdateFoodLogInput,
  FoodLogQueryParams,
  FoodLogAnalyticsQueryParams,
} from '../validators/foodLog.validators';

export interface FoodLogResponse {
  id: string;
  messId: string;
  menuId: string | null;
  date: string;
  mealType: MealType;
  preparedKg: number;
  servedKg: number;
  wastedKg: number;
  remainingKg: number;
  wastePercentage: number;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  mess?: {
    id: string;
    name: string;
    location: string | null;
  };
  menu?: {
    id: string;
    messId: string;
    date: string;
    mealType: MealType;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  };
  context?: MealContextCounts;
}

export interface FoodWasteSummary {
  totalPreparedKg: number;
  totalServedKg: number;
  totalWastedKg: number;
  totalRemainingKg: number;
  wastePercentage: number;
  recordCount: number;
}

export interface MealWasteBreakdown {
  mealType: MealType;
  totalPreparedKg: number;
  totalServedKg: number;
  totalWastedKg: number;
  totalRemainingKg: number;
  wastePercentage: number;
  recordCount: number;
}

export interface DateWasteBreakdown {
  date: string;
  totalPreparedKg: number;
  totalServedKg: number;
  totalWastedKg: number;
  totalRemainingKg: number;
  wastePercentage: number;
  recordCount: number;
}

export interface FoodWasteAnalytics {
  summary: FoodWasteSummary;
  byMeal: MealWasteBreakdown[];
  byDate: DateWasteBreakdown[];
}

export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function mapFoodLogToResponse(
  log: FoodLogWithRelations,
  context?: MealContextCounts,
): FoodLogResponse {
  const remainingKg = Number((log.preparedKg - log.servedKg - log.wastedKg).toFixed(3));
  const wastePercentage =
    log.preparedKg === 0 ? 0 : Number(((log.wastedKg / log.preparedKg) * 100).toFixed(2));

  const dateStr =
    log.date instanceof Date
      ? log.date.toISOString().split('T')[0]
      : String(log.date).split('T')[0];

  return {
    id: log.id,
    messId: log.messId,
    menuId: log.menuId,
    date: dateStr,
    mealType: log.mealType,
    preparedKg: log.preparedKg,
    servedKg: log.servedKg,
    wastedKg: log.wastedKg,
    remainingKg,
    wastePercentage,
    notes: log.notes,
    createdById: log.createdById,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
    mess: log.mess
      ? {
          id: log.mess.id,
          name: log.mess.name,
          location: log.mess.location,
        }
      : undefined,
    menu: log.menu
      ? {
          id: log.menu.id,
          messId: log.messId,
          date:
            log.menu.date instanceof Date
              ? log.menu.date.toISOString().split('T')[0]
              : String(log.menu.date).split('T')[0],
          mealType: log.menu.mealType,
        }
      : null,
    createdBy: log.createdBy
      ? {
          id: log.createdBy.id,
          name: log.createdBy.name,
          email: log.createdBy.email,
          role: log.createdBy.role,
        }
      : undefined,
    context,
  };
}

export class FoodLogService {
  constructor(
    private readonly foodLogRepo: FoodLogRepository = foodLogRepository,
    private readonly messRepo: MessRepository = messRepository,
    private readonly menuRepo: MenuRepository = menuRepository,
  ) {}

  /**
   * Log food preparation, serving, and waste for a meal service.
   * Enforces data invariants, uniqueness per mess+date+meal, and links existing menu if found.
   */
  async createFoodLog(userId: string, input: CreateFoodLogInput): Promise<FoodLogResponse> {
    const mess = await this.messRepo.findById(input.messId);
    if (!mess) {
      throw new NotFoundError('MESS_NOT_FOUND', 'Mess not found');
    }

    const date = parseDateOnly(input.date);

    // Business Invariant checks
    if (input.preparedKg < 0 || input.servedKg < 0 || input.wastedKg < 0) {
      throw new BadRequestError('INVALID_QUANTITIES', 'Quantities must be non-negative');
    }

    if (
      Math.round((input.servedKg + input.wastedKg) * 1000) > Math.round(input.preparedKg * 1000)
    ) {
      throw new BadRequestError(
        'INVALID_FOOD_TOTALS',
        'Sum of served kg and wasted kg cannot exceed prepared kg',
      );
    }

    // Check for duplicate record: one record per mess + date + meal
    const existing = await this.foodLogRepo.findByMessDateMealType(
      input.messId,
      date,
      input.mealType,
    );
    if (existing) {
      throw new ConflictError(
        'DUPLICATE_FOOD_LOG',
        'A food log already exists for this mess, date, and meal type',
      );
    }

    // Attempt to link menu if not explicitly given
    let menuId = input.menuId || null;
    if (!menuId) {
      const menu = await this.menuRepo.findByMessDateMealType(input.messId, date, input.mealType);
      if (menu) {
        menuId = menu.id;
      }
    }

    const created = await this.foodLogRepo.create({
      messId: input.messId,
      menuId,
      date,
      mealType: input.mealType,
      preparedKg: input.preparedKg,
      servedKg: input.servedKg,
      wastedKg: input.wastedKg,
      notes: input.notes,
      createdById: userId,
    });

    let context: MealContextCounts | undefined;
    if (menuId) {
      context = await this.foodLogRepo.getMealContext(menuId);
    }

    return mapFoodLogToResponse(created, context);
  }

  /**
   * Update food log numbers or notes.
   * Validates updated values and enforces served + wasted <= prepared.
   */
  async updateFoodLog(id: string, input: UpdateFoodLogInput): Promise<FoodLogResponse> {
    const existing = await this.foodLogRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('FOOD_LOG_NOT_FOUND', 'Food log not found');
    }

    const newPrepared = input.preparedKg !== undefined ? input.preparedKg : existing.preparedKg;
    const newServed = input.servedKg !== undefined ? input.servedKg : existing.servedKg;
    const newWasted = input.wastedKg !== undefined ? input.wastedKg : existing.wastedKg;

    if (newPrepared < 0 || newServed < 0 || newWasted < 0) {
      throw new BadRequestError('INVALID_QUANTITIES', 'Quantities must be non-negative');
    }

    if (Math.round((newServed + newWasted) * 1000) > Math.round(newPrepared * 1000)) {
      throw new BadRequestError(
        'INVALID_FOOD_TOTALS',
        'Sum of served kg and wasted kg cannot exceed prepared kg',
      );
    }

    const updated = await this.foodLogRepo.update(id, input);

    let context: MealContextCounts | undefined;
    if (updated.menuId) {
      context = await this.foodLogRepo.getMealContext(updated.menuId);
    }

    return mapFoodLogToResponse(updated, context);
  }

  /**
   * Get single food log by ID.
   */
  async getFoodLogById(id: string): Promise<FoodLogResponse> {
    const log = await this.foodLogRepo.findById(id);
    if (!log) {
      throw new NotFoundError('FOOD_LOG_NOT_FOUND', 'Food log not found');
    }

    let context: MealContextCounts | undefined;
    if (log.menuId) {
      context = await this.foodLogRepo.getMealContext(log.menuId);
    }

    return mapFoodLogToResponse(log, context);
  }

  /**
   * List historical food logs with filters.
   */
  async listFoodLogs(query: FoodLogQueryParams): Promise<FoodLogResponse[]> {
    const filter: {
      messId?: string;
      date?: Date;
      startDate?: Date;
      endDate?: Date;
      mealType?: MealType;
    } = {
      messId: query.messId,
      mealType: query.mealType,
    };

    if (query.date) {
      filter.date = parseDateOnly(query.date);
    } else {
      if (query.startDate) filter.startDate = parseDateOnly(query.startDate);
      if (query.endDate) filter.endDate = parseDateOnly(query.endDate);
    }

    const logs = await this.foodLogRepo.findAll(filter);
    return logs.map((l) => mapFoodLogToResponse(l));
  }

  /**
   * Deterministic analytics calculations for food logs.
   */
  async getAnalytics(query: FoodLogAnalyticsQueryParams): Promise<FoodWasteAnalytics> {
    const filter: {
      messId?: string;
      date?: Date;
      startDate?: Date;
      endDate?: Date;
      mealType?: MealType;
    } = {
      messId: query.messId,
      mealType: query.mealType,
    };

    if (query.date) {
      filter.date = parseDateOnly(query.date);
    } else {
      if (query.startDate) filter.startDate = parseDateOnly(query.startDate);
      if (query.endDate) filter.endDate = parseDateOnly(query.endDate);
    }

    const logs = await this.foodLogRepo.findAll(filter);

    let totalPreparedKg = 0;
    let totalServedKg = 0;
    let totalWastedKg = 0;

    const mealMap = new Map<
      MealType,
      { prepared: number; served: number; wasted: number; count: number }
    >();
    const dateMap = new Map<
      string,
      { prepared: number; served: number; wasted: number; count: number }
    >();

    for (const log of logs) {
      totalPreparedKg += log.preparedKg;
      totalServedKg += log.servedKg;
      totalWastedKg += log.wastedKg;

      // Group by mealType
      const m = mealMap.get(log.mealType) || { prepared: 0, served: 0, wasted: 0, count: 0 };
      m.prepared += log.preparedKg;
      m.served += log.servedKg;
      m.wasted += log.wastedKg;
      m.count += 1;
      mealMap.set(log.mealType, m);

      // Group by date
      const dateStr =
        log.date instanceof Date
          ? log.date.toISOString().split('T')[0]
          : String(log.date).split('T')[0];

      const d = dateMap.get(dateStr) || { prepared: 0, served: 0, wasted: 0, count: 0 };
      d.prepared += log.preparedKg;
      d.served += log.servedKg;
      d.wasted += log.wastedKg;
      d.count += 1;
      dateMap.set(dateStr, d);
    }

    totalPreparedKg = Number(totalPreparedKg.toFixed(3));
    totalServedKg = Number(totalServedKg.toFixed(3));
    totalWastedKg = Number(totalWastedKg.toFixed(3));
    const totalRemainingKg = Number((totalPreparedKg - totalServedKg - totalWastedKg).toFixed(3));
    const wastePercentage =
      totalPreparedKg === 0 ? 0 : Number(((totalWastedKg / totalPreparedKg) * 100).toFixed(2));

    const summary: FoodWasteSummary = {
      totalPreparedKg,
      totalServedKg,
      totalWastedKg,
      totalRemainingKg,
      wastePercentage,
      recordCount: logs.length,
    };

    const byMeal: MealWasteBreakdown[] = Object.values(MealType).map((mealType) => {
      const data = mealMap.get(mealType) || { prepared: 0, served: 0, wasted: 0, count: 0 };
      const prep = Number(data.prepared.toFixed(3));
      const serv = Number(data.served.toFixed(3));
      const wast = Number(data.wasted.toFixed(3));
      const rem = Number((prep - serv - wast).toFixed(3));
      const pct = prep === 0 ? 0 : Number(((wast / prep) * 100).toFixed(2));
      return {
        mealType,
        totalPreparedKg: prep,
        totalServedKg: serv,
        totalWastedKg: wast,
        totalRemainingKg: rem,
        wastePercentage: pct,
        recordCount: data.count,
      };
    });

    const byDate: DateWasteBreakdown[] = Array.from(dateMap.entries())
      .sort(([d1], [d2]) => d1.localeCompare(d2))
      .map(([date, data]) => {
        const prep = Number(data.prepared.toFixed(3));
        const serv = Number(data.served.toFixed(3));
        const wast = Number(data.wasted.toFixed(3));
        const rem = Number((prep - serv - wast).toFixed(3));
        const pct = prep === 0 ? 0 : Number(((wast / prep) * 100).toFixed(2));
        return {
          date,
          totalPreparedKg: prep,
          totalServedKg: serv,
          totalWastedKg: wast,
          totalRemainingKg: rem,
          wastePercentage: pct,
          recordCount: data.count,
        };
      });

    return {
      summary,
      byMeal,
      byDate,
    };
  }
}

export const foodLogService = new FoodLogService();
