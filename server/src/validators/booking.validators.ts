import { z } from 'zod';
import { MealType, BookingStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  body: z.object({
    menuId: z.string().min(1, 'menuId is required'),
    slotId: z.string().min(1, 'slotId is required'),
  }),
});

export const listBookingsQuerySchema = z.object({
  query: z
    .object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
        .optional(),
      mealType: z.nativeEnum(MealType).optional(),
      status: z.nativeEnum(BookingStatus).optional(),
    })
    .optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
