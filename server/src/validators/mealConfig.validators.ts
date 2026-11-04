import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateMealConfigSchema = z.object({
  body: z.object({
    startTime: z
      .string()
      .regex(timeRegex, 'startTime must be in HH:mm format (00:00 to 23:59)')
      .optional(),
    endTime: z
      .string()
      .regex(timeRegex, 'endTime must be in HH:mm format (00:00 to 23:59)')
      .optional(),
    slotDurationMinutes: z
      .number()
      .int()
      .positive('slotDurationMinutes must be greater than 0')
      .optional(),
    bookingCutoffMinutes: z
      .number()
      .int()
      .min(0, 'bookingCutoffMinutes cannot be negative')
      .optional(),
    cancellationCutoffMinutes: z
      .number()
      .int()
      .min(0, 'cancellationCutoffMinutes cannot be negative')
      .optional(),
    defaultSlotCapacity: z
      .number()
      .int()
      .positive('defaultSlotCapacity must be greater than 0')
      .optional(),
    averageServingTimeSeconds: z
      .number()
      .int()
      .positive('averageServingTimeSeconds must be greater than 0')
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

export type UpdateMealConfigInput = z.infer<typeof updateMealConfigSchema>['body'];
