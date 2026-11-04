import { z } from 'zod';

export const createMenuItemSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters'),
    category: z.string().trim().max(50).nullable().optional(),
    defaultServingGrams: z
      .number()
      .int()
      .positive('Serving size must be positive')
      .nullable()
      .optional(),
    isAvailable: z.boolean().optional(),
    messId: z.string().min(1).optional(),
  }),
});

export const updateMenuItemSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().max(50).nullable().optional(),
    defaultServingGrams: z.number().int().positive().nullable().optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const updateMenuItemStatusSchema = z.object({
  body: z.object({
    isAvailable: z.boolean(),
  }),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>['body'];
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>['body'];
export type UpdateMenuItemStatusInput = z.infer<typeof updateMenuItemStatusSchema>['body'];
