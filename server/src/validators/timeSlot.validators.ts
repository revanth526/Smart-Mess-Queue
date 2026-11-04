import { z } from 'zod';

export const generateSlotsSchema = z.object({
  body: z.object({
    menuId: z.string().min(1, 'menuId is required'),
  }),
});

export type GenerateSlotsInput = z.infer<typeof generateSlotsSchema>['body'];
