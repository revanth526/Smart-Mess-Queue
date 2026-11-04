import { z } from 'zod';
import { MealType } from '../types';

export const createFeedbackBodySchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z
    .number({ invalid_type_error: 'Rating must be a number' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(500, 'Comment cannot exceed 500 characters').nullable().optional(),
});

export const updateFeedbackBodySchema = z
  .object({
    rating: z
      .number({ invalid_type_error: 'Rating must be a number' })
      .int('Rating must be an integer')
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5')
      .optional(),
    comment: z
      .string()
      .trim()
      .max(500, 'Comment cannot exceed 500 characters')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => data.rating !== undefined || data.comment !== undefined,
    'At least one field (rating or comment) must be provided for update',
  );

export const feedbackQuerySchema = z.object({
  menuId: z.string().optional(),
  messId: z.string().optional(),
  mealType: z.nativeEnum(MealType).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const feedbackAnalyticsQuerySchema = z.object({
  messId: z.string().optional(),
  menuId: z.string().optional(),
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

export type CreateFeedbackInput = z.infer<typeof createFeedbackBodySchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackBodySchema>;
export type FeedbackQueryParams = z.infer<typeof feedbackQuerySchema>;
export type FeedbackAnalyticsQueryParams = z.infer<typeof feedbackAnalyticsQuerySchema>;
