import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { menuController } from '../controllers/menu.controller';
import { timeSlotController } from '../controllers/timeSlot.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { createBookingSchema } from '../validators/booking.validators';
import { Role } from '@prisma/client';

const router = Router();

// ── Student Booking Endpoints (Primary & Student Aliases) ─────

// POST /api/bookings & /api/student/bookings — Book meal slot (STUDENT only)
router.post(
  '/bookings',
  authenticate,
  authorize(Role.STUDENT),
  validate(createBookingSchema),
  bookingController.createBooking,
);
router.post(
  '/student/bookings',
  authenticate,
  authorize(Role.STUDENT),
  validate(createBookingSchema),
  bookingController.createBooking,
);

// GET /api/bookings & /api/student/bookings — List bookings (Student sees own, Admin sees all)
router.get('/bookings', authenticate, bookingController.listBookings);
router.get('/student/bookings', authenticate, bookingController.listBookings);

// GET /api/bookings/:id & /api/student/bookings/:id — Get booking details
router.get('/bookings/:id', authenticate, bookingController.getBookingById);
router.get('/student/bookings/:id', authenticate, bookingController.getBookingById);

// PATCH /api/bookings/:id/cancel & /api/student/bookings/:id/cancel — Cancel booking
router.patch('/bookings/:id/cancel', authenticate, bookingController.cancelBooking);
router.patch('/student/bookings/:id/cancel', authenticate, bookingController.cancelBooking);

// Student Menu & Slot viewing aliases
router.get('/student/menus', authenticate, menuController.listMenus);
router.get('/student/menus/:id', authenticate, menuController.getMenuById);
router.get('/student/time-slots', authenticate, timeSlotController.getTimeSlots);

export default router;
