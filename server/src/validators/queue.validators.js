const { z } = require('zod');

const checkInSchema = z.object({
  body: z
    .object({
      bookingId: z.string().min(1).optional(),
      id: z.string().min(1).optional(),
    })
    .optional(),
  params: z
    .object({
      bookingId: z.string().min(1).optional(),
      id: z.string().min(1).optional(),
    })
    .optional(),
});

const walkInSchema = z.object({
  body: z.object({
    menuId: z.string().min(1, 'menuId is required'),
    slotId: z.string().min(1, 'slotId is required').optional(),
    studentIdentifier: z.string().min(1).max(100).optional(),
  }),
});

const getLiveQueueSchema = z.object({
  query: z.object({
    menuId: z.string().min(1, 'menuId is required'),
    slotId: z.string().min(1, 'slotId is required').optional(),
  }),
});

const getMyQueueSchema = z.object({
  query: z
    .object({
      menuId: z.string().min(1, 'menuId is required').optional(),
    })
    .optional(),
});

module.exports = {
  checkInSchema,
  walkInSchema,
  getLiveQueueSchema,
  getMyQueueSchema,
};
