import { bookingRepository, BookingWithDetails } from '../repositories/booking.repository';
import { userRepository } from '../repositories/user.repository';
import { menuRepository } from '../repositories/menu.repository';
import { timeSlotRepository } from '../repositories/timeSlot.repository';
import { mealConfigRepository } from '../repositories/mealConfig.repository';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '../errors';
import { CreateBookingInput } from '../validators/booking.validators';
import { BookingStatus, MealType, Role } from '@prisma/client';

export class BookingService {
  async createBooking(studentId: string, input: CreateBookingInput): Promise<BookingWithDetails> {
    // 1. Validate student
    const student = await userRepository.findById(studentId);
    if (!student || !student.isActive) {
      throw new ForbiddenError('Student account is inactive or not found');
    }

    // 2. Validate menu
    const menu = await menuRepository.findById(input.menuId);
    if (!menu) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Selected menu not found');
    }

    // 3. Validate slot
    const slot = await timeSlotRepository.findById(input.slotId);
    if (!slot) {
      throw new NotFoundError('SLOT_NOT_FOUND', 'Selected time slot not found');
    }

    if (slot.menuId !== menu.id) {
      throw new BadRequestError(
        'INVALID_SLOT',
        'Selected time slot does not belong to this meal menu',
      );
    }

    // 4. Validate time rules (past slot & booking cutoff)
    const now = new Date();
    if (new Date(slot.startTime) <= now) {
      throw new BadRequestError(
        'PAST_SLOT',
        'Cannot book a time slot that has already started or passed',
      );
    }

    const mealConfig = await mealConfigRepository.findByMessAndMealType(menu.messId, menu.mealType);

    if (mealConfig) {
      const cutoffMs = mealConfig.bookingCutoffMinutes * 60 * 1000;
      if (new Date(slot.startTime).getTime() - now.getTime() < cutoffMs) {
        throw new BadRequestError(
          'BOOKING_CUTOFF_PASSED',
          `Booking cutoff deadline of ${mealConfig.bookingCutoffMinutes} minutes before the slot has passed`,
        );
      }
    }

    // 5. Check duplicate active booking for (studentId, menuId)
    const existing = await bookingRepository.findByStudentAndMenu(studentId, menu.id);
    if (existing && existing.status === BookingStatus.BOOKED) {
      throw new ConflictError(
        'ALREADY_BOOKED',
        'You already have an active booking for this meal service',
      );
    }

    // 6. Transactional atomic capacity increment + booking create/reactivate
    let bookingId: string;

    await bookingRepository.executeTransaction(async (tx) => {
      // Atomic capacity increment with guard: currentBookings < capacity
      const rowsUpdated = await bookingRepository.incrementSlotCapacity(slot.id, tx);
      if (rowsUpdated === 0) {
        throw new ConflictError(
          'SLOT_FULL',
          'This time slot is fully booked. Please select another slot.',
        );
      }

      // If an existing record was previously CANCELLED, reactivate it to preserve unique constraint
      if (existing && existing.status === BookingStatus.CANCELLED) {
        const reactivated = await bookingRepository.update(
          existing.id,
          {
            slot: { connect: { id: slot.id } },
            status: BookingStatus.BOOKED,
            bookedAt: new Date(),
            cancelledAt: null,
          },
          tx,
        );
        bookingId = reactivated.id;
      } else {
        const created = await bookingRepository.create(
          {
            studentId,
            menuId: menu.id,
            slotId: slot.id,
            status: BookingStatus.BOOKED,
            bookedAt: new Date(),
          },
          tx,
        );
        bookingId = created.id;
      }
    });

    const result = await bookingRepository.findById(bookingId!);
    return result!;
  }

  async cancelBooking(
    bookingId: string,
    requestingUserId: string,
    requestingRole: Role,
  ): Promise<BookingWithDetails> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    // IDOR protection: Student can only cancel their own booking
    if (requestingRole !== Role.MESS_ADMIN && booking.studentId !== requestingUserId) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    // State validation
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('ALREADY_CANCELLED', 'This booking is already cancelled');
    }

    if (booking.status !== BookingStatus.BOOKED) {
      throw new BadRequestError(
        'INVALID_BOOKING_STATUS',
        'Only active bookings in BOOKED status can be cancelled',
      );
    }

    // Check cancellation cutoff deadline
    const mealConfig = await mealConfigRepository.findByMessAndMealType(
      booking.menu.messId,
      booking.menu.mealType,
    );

    if (mealConfig && booking.slot) {
      const cutoffMs = mealConfig.cancellationCutoffMinutes * 60 * 1000;
      const cancellationDeadline = new Date(new Date(booking.slot.startTime).getTime() - cutoffMs);

      if (Date.now() > cancellationDeadline.getTime()) {
        throw new BadRequestError(
          'CANCELLATION_DEADLINE_PASSED',
          `Cancellation cutoff deadline of ${mealConfig.cancellationCutoffMinutes} minutes before the slot has passed`,
        );
      }
    }

    // Transactional status change + capacity decrement
    await bookingRepository.executeTransaction(async (tx) => {
      await bookingRepository.update(
        booking.id,
        {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        tx,
      );

      if (booking.slotId) {
        await bookingRepository.decrementSlotCapacity(booking.slotId, tx);
      }
    });

    const updated = await bookingRepository.findById(booking.id);
    return updated!;
  }

  async getBookingById(
    bookingId: string,
    requestingUserId: string,
    requestingRole: Role,
  ): Promise<BookingWithDetails> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    // IDOR protection: Students can only view their own bookings
    if (requestingRole !== Role.MESS_ADMIN && booking.studentId !== requestingUserId) {
      throw new ForbiddenError('You do not have permission to view this booking');
    }

    return booking;
  }

  async listBookings(filter: {
    studentId?: string;
    requestingUserId: string;
    requestingRole: Role;
    date?: string;
    mealType?: MealType;
    status?: BookingStatus;
  }): Promise<BookingWithDetails[]> {
    // If student, force filter to their own userId
    const targetStudentId =
      filter.requestingRole === Role.MESS_ADMIN ? filter.studentId : filter.requestingUserId;

    return bookingRepository.findMany({
      studentId: targetStudentId,
      date: filter.date ? new Date(`${filter.date}T00:00:00.000Z`) : undefined,
      mealType: filter.mealType,
      status: filter.status,
    });
  }
}

export const bookingService = new BookingService();
