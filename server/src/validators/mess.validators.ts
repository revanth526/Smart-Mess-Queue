import { z } from 'zod';

export const updateMessSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    location: z.string().trim().max(200).nullable().optional(),
    totalCapacity: z.number().int().positive('Total capacity must be positive').optional(),
    isActive: z.boolean().optional(),
  }),
});

export type UpdateMessInput = z.infer<typeof updateMessSchema>['body'];
