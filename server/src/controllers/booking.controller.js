const { bookingService } = require('../services/booking.service');
const { queueService } = require('../services/queue.service');
const { sendSuccess } = require('../utils/apiResponse');
const { BadRequestError } = require('../errors');

class BookingController {
  async checkIn(req, res, next) {
    try {
      const studentId = req.user?.userId || req.body?.studentId || req.params?.studentId;
      const bookingId =
        req.params?.id ||
        req.params?.bookingId ||
        req.body?.bookingId ||
        req.body?.id;

      if (!bookingId) {
        throw new BadRequestError('INVALID_BOOKING_ID', 'Booking ID is required for check-in');
      }

      const entry = await queueService.checkIn(studentId, String(bookingId));
      sendSuccess({ res, data: { entry, message: 'Checked in successfully' }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }
  async createBooking(req, res, next) {
    try {
      const studentId = req.user?.userId || req.user?.id || req.body?.studentId;
      const booking = await bookingService.createBooking(studentId, req.body);
      sendSuccess({ res, data: { booking }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const bookingId = String(req.params.id || req.params.bookingId);
      const booking = await bookingService.cancelBooking(
        bookingId,
        req.user.userId,
        req.user.role,
      );
      sendSuccess({ res, data: { booking, message: 'Booking cancelled successfully' } });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req, res, next) {
    try {
      const bookingId = String(req.params.id || req.params.bookingId);
      const booking = await bookingService.getBookingById(
        bookingId,
        req.user.userId,
        req.user.role,
      );
      sendSuccess({ res, data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  async listBookings(req, res, next) {
    try {
      const date = req.query.date;
      const mealType = req.query.mealType;
      const status = req.query.status;
      const studentId = req.query.studentId;

      const bookings = await bookingService.listBookings({
        studentId,
        requestingUserId: req.user.userId,
        requestingRole: req.user.role,
        date,
        mealType,
        status,
      });

      sendSuccess({ res, data: { bookings } });
    } catch (error) {
      next(error);
    }
  }
}

const bookingController = new BookingController();

module.exports = {
  BookingController,
  bookingController,
};
