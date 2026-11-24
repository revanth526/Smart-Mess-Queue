import { z } from 'zod';
import { MealType } from '../types/index.js';

export const createFoodLogBodySchema = z
  .object({
    messId: z.string().min(1, 'Mess ID is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    mealType: z.nativeEnum(MealType, {
      errorMap: () => ({ message: 'Invalid meal type' }),
    }),
    menuId: z.string().min(1).nullable().optional(),
    preparedKg: z
      .number({ invalid_type_error: 'Prepared kg must be a number' })
      .min(0, 'Prepared kg must be non-negative')
      .refine((val) => !isNaN(val) && isFinite(val), 'Prepared kg must be a finite number'),
    servedKg: z
      .number({ invalid_type_error: 'Served kg must be a number' })
      .min(0, 'Served kg must be non-negative')
      .refine((val) => !isNaN(val) && isFinite(val), 'Served kg must be a finite number'),
    wastedKg: z
      .number({ invalid_type_error: 'Wasted kg must be a number' })
      .min(0, 'Wasted kg must be non-negative')
      .refine((val) => !isNaN(val) && isFinite(val), 'Wasted kg must be a finite number'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),
  })
  .refine(
    (data) => {
      // Use round with epsilon to prevent JS float imprecision issues (e.g. 0.1 + 0.2)
      return (
        Math.round((data.servedKg + data.wastedKg) * 1000) <= Math.round(data.preparedKg * 1000)
      );
    },
    {
      message: 'Sum of served kg and wasted kg cannot exceed prepared kg',
      path: ['servedKg'],
    },
  );

export const updateFoodLogBodySchema = z
  .object({
    preparedKg: z
      .number({ invalid_type_error: 'Prepared kg must be a number' })
      .min(0, 'Prepared kg must be non-negative')
      .refine((val) => !isNaN(val) && isFinite(val), 'Prepared kg must be a finite number')
      .optional(),
    servedKg: z
      .number({ invalid_type_error: 'Served kg must be a number' })
      .min(0, 'Served kg must be non-negative')
      .refine((val) => !isNaN(val) && isFinite(val), 'Served kg must be a finite number')
      .optional(),
    wastedKg: z
      .number({ invalid_type_error: 'Wasted kg must be a number' })
      .min(0, 'Wasted kg must be non-negative')
      .refine((val) => !isNaN(val) && isFinite(val), 'Wasted kg must be a finite number')
      .optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),
  })
  .refine(
    (data) => {
      if (
        data.preparedKg !== undefined &&
        data.servedKg !== undefined &&
        data.wastedKg !== undefined
      ) {
        return (
          Math.round((data.servedKg + data.wastedKg) * 1000) <= Math.round(data.preparedKg * 1000)
        );
      }
      return true;
    },
    {
      message: 'Sum of served kg and wasted kg cannot exceed prepared kg',
      path: ['servedKg'],
    },
  );

export const foodLogQuerySchema = z.object({
  messId: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  mealType: z.nativeEnum(MealType).optional(),
});

export const foodLogAnalyticsQuerySchema = z.object({
  messId: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  mealType: z.nativeEnum(MealType).optional(),
});
