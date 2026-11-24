const { Router } = require('express');
const { bookingController } = require('../controllers/booking.controller');
const { menuController } = require('../controllers/menu.controller');
const { timeSlotController } = require('../controllers/timeSlot.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createBookingSchema } = require('../validators/booking.validators');
const { Role } = require('@prisma/client');

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

// POST /api/bookings/:id/checkin & aliases — Student check-in
router.post('/bookings/:id/check-in', authenticate, authorize(Role.STUDENT), bookingController.checkIn);
router.post('/bookings/:id/checkin', authenticate, authorize(Role.STUDENT), bookingController.checkIn);
router.post('/student/bookings/:id/check-in', authenticate, authorize(Role.STUDENT), bookingController.checkIn);
router.post('/student/bookings/:id/checkin', authenticate, authorize(Role.STUDENT), bookingController.checkIn);
router.post('/check-in', authenticate, authorize(Role.STUDENT), bookingController.checkIn);
router.post('/checkin', authenticate, authorize(Role.STUDENT), bookingController.checkIn);

// Student Menu & Slot viewing aliases
router.get('/student/menus', authenticate, menuController.listMenus);
router.get('/student/menus/:id', authenticate, menuController.getMenuById);
router.get('/student/time-slots', authenticate, timeSlotController.getTimeSlots);

module.exports = router;
module.exports.default = router;
