import { z } from 'zod';

export const checkInSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'bookingId is required'),
  }),
});

export const walkInSchema = z.object({
  body: z.object({
    menuId: z.string().min(1, 'menuId is required'),
    slotId: z.string().min(1, 'slotId is required').optional(),
    studentIdentifier: z.string().min(1).max(100).optional(),
  }),
});

export const getLiveQueueSchema = z.object({
  query: z.object({
    menuId: z.string().min(1, 'menuId is required'),
    slotId: z.string().min(1, 'slotId is required').optional(),
  }),
});

export const getMyQueueSchema = z.object({
  query: z
    .object({
      menuId: z.string().min(1, 'menuId is required').optional(),
    })
    .optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>['body'];
export type WalkInInput = z.infer<typeof walkInSchema>['body'];
export type GetLiveQueueQuery = z.infer<typeof getLiveQueueSchema>['query'];
export type GetMyQueueQuery = z.infer<typeof getMyQueueSchema>['query'];
