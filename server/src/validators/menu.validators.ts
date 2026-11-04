import { z } from 'zod';
import { MealType } from '@prisma/client';

export const createMenuSchema = z.object({
  body: z.object({
    messId: z.string().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    mealType: z.nativeEnum(MealType),
    dishes: z
      .array(
        z.object({
          menuItemId: z.string().min(1).nullable().optional(),
          dishName: z.string().trim().min(1, 'Dish name is required').max(100),
          dishCategory: z.string().trim().max(50).nullable().optional(),
          servingGrams: z.number().int().positive().nullable().optional(),
          sortOrder: z.number().int().min(0).optional(),
        }),
      )
      .optional(),
  }),
});

export const addDishSchema = z.object({
  body: z.object({
    menuItemId: z.string().min(1).nullable().optional(),
    dishName: z.string().trim().min(1, 'Dish name is required').max(100),
    dishCategory: z.string().trim().max(50).nullable().optional(),
    servingGrams: z.number().int().positive().nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>['body'];
export type AddDishInput = z.infer<typeof addDishSchema>['body'];
