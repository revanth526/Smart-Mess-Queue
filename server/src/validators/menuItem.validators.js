const { z } = require('zod');

const createMenuItemSchema = z.object({
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

const updateMenuItemSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().max(50).nullable().optional(),
    defaultServingGrams: z.number().int().positive().nullable().optional(),
    isAvailable: z.boolean().optional(),
  }),
});

const updateMenuItemStatusSchema = z.object({
  body: z.object({
    isAvailable: z.boolean(),
  }),
});

module.exports = {
  createMenuItemSchema,
  updateMenuItemSchema,
  updateMenuItemStatusSchema,
};
