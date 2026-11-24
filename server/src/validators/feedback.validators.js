const { z } = require('zod');
const { MealType } = require('@prisma/client');

const createFeedbackBodySchema = z
  .object({
    bookingId: z.string().optional(),
    booking_id: z.string().optional(),
    id: z.string().optional(),
    menuId: z.string().optional(),
    menu_id: z.string().optional(),
    mealType: z.string().optional(),
    rating: z.coerce
      .number({ invalid_type_error: 'Rating must be a number' })
      .int('Rating must be an integer')
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    comment: z.string().trim().max(500, 'Comment cannot exceed 500 characters').nullable().optional(),
    comments: z.string().trim().max(500, 'Comment cannot exceed 500 characters').nullable().optional(),
  })
  .refine((data) => Boolean(data.bookingId || data.booking_id || data.id), {
    message: 'Booking ID is required',
    path: ['bookingId'],
  })
  .transform((data) => ({
    bookingId: data.bookingId || data.booking_id || data.id,
    menuId: data.menuId || data.menu_id,
    mealType: data.mealType,
    rating: data.rating,
    comment:
      data.comment !== undefined
        ? data.comment
        : data.comments !== undefined
          ? data.comments
          : null,
  }));

const updateFeedbackBodySchema = z
  .object({
    rating: z.coerce
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
    comments: z
      .string()
      .trim()
      .max(500, 'Comment cannot exceed 500 characters')
      .nullable()
      .optional(),
  })
  .transform((data) => ({
    rating: data.rating,
    comment:
      data.comment !== undefined
        ? data.comment
        : data.comments !== undefined
          ? data.comments
          : undefined,
  }))
  .refine(
    (data) => data.rating !== undefined || data.comment !== undefined,
    'At least one field (rating or comment) must be provided for update',
  );

const feedbackQuerySchema = z.object({
  menuId: z.string().optional(),
  messId: z.string().optional(),
  mealType: z.nativeEnum(MealType).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
});

const feedbackAnalyticsQuerySchema = z.object({
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

const createFeedbackSchema = z.object({
  body: createFeedbackBodySchema,
});

const updateFeedbackSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Feedback ID is required'),
  }),
  body: updateFeedbackBodySchema,
});

const getFeedbackByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Feedback ID is required'),
  }),
  query: z
    .object({
      messId: z.string().optional(),
    })
    .optional(),
});

const operationalMetricsSchema = z.object({
  query: z
    .object({
      messId: z.string().optional(),
    })
    .optional(),
});

const listFeedbackSchema = z.object({
  query: feedbackQuerySchema,
});

const feedbackAnalyticsSchema = z.object({
  query: feedbackAnalyticsQuerySchema,
});

module.exports = {
  createFeedbackBodySchema,
  updateFeedbackBodySchema,
  feedbackQuerySchema,
  feedbackAnalyticsQuerySchema,
  createFeedbackSchema,
  updateFeedbackSchema,
  getFeedbackByIdSchema,
  operationalMetricsSchema,
  listFeedbackSchema,
  feedbackAnalyticsSchema,
};
