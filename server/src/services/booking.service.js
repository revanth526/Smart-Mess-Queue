const { bookingRepository } = require('../repositories/booking.repository');
const { userRepository } = require('../repositories/user.repository');
const { menuRepository } = require('../repositories/menu.repository');
const { timeSlotRepository } = require('../repositories/timeSlot.repository');
const { mealConfigRepository } = require('../repositories/mealConfig.repository');
const { NotFoundError, ConflictError, BadRequestError, ForbiddenError } = require('../errors');
const { BookingStatus, Role } = require('@prisma/client');

class BookingService {
  async createBooking(studentId, input) {
    const menuId = String(input.menuId || input.menu_id);
    const rawSlotId = String(
      input.slotId ||
        input.timeSlotId ||
        input.time_slot_id ||
        input.slot_id ||
        input.slotTime ||
        input.slot_time,
    );

    // 1. Validate student
    const student = await userRepository.findById(studentId);
    if (!student || !student.isActive) {
      throw new ForbiddenError('Student account is inactive or not found');
    }

    // 2. Validate menu
    const menu = await menuRepository.findById(menuId);
    if (!menu) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Selected menu not found');
    }

    // 3. Validate slot (try by ID, fallback to matching slot range/time for this menu)
    let slot = await timeSlotRepository.findById(rawSlotId);
    if (!slot && menu) {
      const menuSlots = await timeSlotRepository.findByMenuId(menu.id);
      slot = menuSlots.find((s) => {
        if (s.id === rawSlotId) return true;
        const startStr = new Date(s.startTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const endStr = new Date(s.endTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const range1 = `${startStr} - ${endStr}`;
        const range2 = `${startStr} – ${endStr}`;
        const range3 = `${startStr}-${endStr}`;
        return (
          rawSlotId === range1 ||
          rawSlotId === range2 ||
          rawSlotId === range3 ||
          rawSlotId === startStr ||
          input.slotTime === range1 ||
          input.slotTime === range2 ||
          input.slotTime === startStr
        );
      });
    }

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
    const slotStart = new Date(slot.startTime);
    const rawStartDiffMs = slotStart.getTime() - now.getTime();

    // Check for IST offset (+5.5 hours = +19,800,000 ms) in case slot was stored as IST wall-clock with 'Z'
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istStartDiffMs = rawStartDiffMs - istOffsetMs;

    let effectiveStartDiffMs = rawStartDiffMs;
    if (rawStartDiffMs > 4 * 60 * 60 * 1000 && rawStartDiffMs < 8 * 60 * 60 * 1000) {
      effectiveStartDiffMs = istStartDiffMs;
    }

    if (effectiveStartDiffMs <= 0) {
      throw new BadRequestError(
        'PAST_SLOT',
        'Cannot book a time slot that has already started or passed',
      );
    }

    const mealConfig = await mealConfigRepository.findByMessAndMealType(menu.messId, menu.mealType);

    if (mealConfig && mealConfig.bookingCutoffMinutes > 0) {
      const cutoffMs = mealConfig.bookingCutoffMinutes * 60 * 1000;
      if (effectiveStartDiffMs > 0 && effectiveStartDiffMs < cutoffMs) {
        throw new BadRequestError(
          'BOOKING_CUTOFF_PASSED',
          `Booking cutoff deadline of ${mealConfig.bookingCutoffMinutes} minutes before the slot has passed. Please select a later time slot.`,
        );
      }
    }

    // 5. Check duplicate active booking for (studentId, menuId)
    const existing = await bookingRepository.findByStudentAndMenu(studentId, menu.id);
    const activeStatuses = [
      BookingStatus.BOOKED,
      BookingStatus.CHECKED_IN,
      BookingStatus.WAITING,
      BookingStatus.SERVING,
      BookingStatus.SERVED,
      'COMPLETED',
    ];
    if (existing && activeStatuses.includes(existing.status)) {
      throw new ConflictError(
        'ALREADY_BOOKED',
        'You already have an active booking for this meal service',
      );
    }

    // 6. Transactional atomic capacity increment + booking create/reactivate
    let bookingId;

    await bookingRepository.executeTransaction(async (tx) => {
      // Atomic capacity increment with guard: currentBookings < capacity
      const rowsUpdated = await bookingRepository.incrementSlotCapacity(slot.id, tx);
      if (rowsUpdated === 0) {
        throw new ConflictError(
          'SLOT_FULL',
          'This time slot is fully booked. Please select another slot.',
        );
      }

      // If an existing record was previously CANCELLED or inactive, reactivate it to preserve unique constraint
      if (existing) {
        const reactivated = await bookingRepository.update(
          existing.id,
          {
            slot: { connect: { id: slot.id } },
            status: BookingStatus.BOOKED,
            bookedAt: new Date(),
            cancelledAt: null,
            noShowAt: null,
            checkedInAt: null,
            waitingAt: null,
            servingAt: null,
            servedAt: null,
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

    const result = await bookingRepository.findById(bookingId);
    return result;
  }

  async cancelBooking(bookingId, requestingUserId, requestingRole) {
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
      const slotStartRaw = new Date(booking.slot.startTime).getTime();
      let slotStart = slotStartRaw;
      const nowMs = Date.now();
      const rawStartDiffMs = slotStartRaw - nowMs;
      if (rawStartDiffMs < -4 * 3600 * 1000 && rawStartDiffMs > -8 * 3600 * 1000) {
        slotStart = slotStartRaw + 5.5 * 3600 * 1000;
      }
      const cancellationDeadline = new Date(slotStart - cutoffMs);

      if (nowMs > cancellationDeadline.getTime()) {
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
    return updated;
  }

  async getBookingById(bookingId, requestingUserId, requestingRole) {
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

  async listBookings(filter) {
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

const bookingService = new BookingService();

module.exports = {
  BookingService,
  bookingService,
};
