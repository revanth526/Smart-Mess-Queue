import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { sendSuccess } from '../utils/apiResponse';
import { MealType, BookingStatus } from '@prisma/client';

export class BookingController {
  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.userId;
      const booking = await bookingService.createBooking(studentId, req.body);
      sendSuccess({ res, data: { booking }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = String(req.params.id || req.params.bookingId);
      const booking = await bookingService.cancelBooking(
        bookingId,
        req.user!.userId,
        req.user!.role,
      );
      sendSuccess({ res, data: { booking, message: 'Booking cancelled successfully' } });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = String(req.params.id || req.params.bookingId);
      const booking = await bookingService.getBookingById(
        bookingId,
        req.user!.userId,
        req.user!.role,
      );
      sendSuccess({ res, data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  async listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const mealType = req.query.mealType as MealType | undefined;
      const status = req.query.status as BookingStatus | undefined;
      const studentId = req.query.studentId as string | undefined;

      const bookings = await bookingService.listBookings({
        studentId,
        requestingUserId: req.user!.userId,
        requestingRole: req.user!.role,
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

export const bookingController = new BookingController();
