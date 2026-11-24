const { z } = require('zod');
const { MealType, BookingStatus } = require('@prisma/client');

const createBookingBodySchema = z
  .object({
    menuId: z.union([z.string(), z.number()]).optional(),
    menu_id: z.union([z.string(), z.number()]).optional(),
    slotId: z.union([z.string(), z.number()]).optional(),
    timeSlotId: z.union([z.string(), z.number()]).optional(),
    time_slot_id: z.union([z.string(), z.number()]).optional(),
    slot_id: z.union([z.string(), z.number()]).optional(),
    slotTime: z.string().optional(),
    slot_time: z.string().optional(),
    date: z.string().optional(),
    mealType: z.string().optional(),
  })
  .refine((data) => Boolean(data.menuId || data.menu_id), {
    message: 'menuId is required',
    path: ['menuId'],
  })
  .refine(
    (data) =>
      Boolean(
        data.slotId ||
          data.timeSlotId ||
          data.time_slot_id ||
          data.slot_id ||
          data.slotTime ||
          data.slot_time,
      ),
    {
      message: 'slotId is required',
      path: ['slotId'],
    },
  )
  .transform((data) => ({
    menuId: String(data.menuId || data.menu_id),
    slotId: String(
      data.slotId ||
        data.timeSlotId ||
        data.time_slot_id ||
        data.slot_id ||
        data.slotTime ||
        data.slot_time,
    ),
    slotTime: data.slotTime || data.slot_time,
    date: data.date,
    mealType: data.mealType,
  }));

const createBookingSchema = z.object({
  body: createBookingBodySchema,
});

const listBookingsQuerySchema = z.object({
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

module.exports = {
  createBookingSchema,
  listBookingsQuerySchema,
};
