const { BookingStatus, EntryType, QueueStatus, Role } = require('@prisma/client');
const { AppError } = require('../errors');
const { queueRepository } = require('../repositories/queue.repository');
const { bookingRepository } = require('../repositories/booking.repository');
const { menuRepository } = require('../repositories/menu.repository');
const { mealConfigRepository } = require('../repositories/mealConfig.repository');
const socketModule = require('../sockets');

class QueueService {
  constructor(
    queueRepo = queueRepository,
    bookingRepo = bookingRepository,
    menuRepo = menuRepository,
    mealConfigRepo = mealConfigRepository,
  ) {
    this.queueRepo = queueRepo;
    this.bookingRepo = bookingRepo;
    this.menuRepo = menuRepo;
    this.mealConfigRepo = mealConfigRepo;
  }

  /**
   * Student check-in for an active booking.
   * Validates student ownership, booking status, check-in time window,
   * prevents duplicate check-ins, and creates a QueueEntry with sequential queue number.
   */
  async checkIn(studentId, bookingId) {
    if (!bookingId) {
      throw new AppError(400, 'INVALID_BOOKING_ID', 'Booking ID is required for check-in');
    }

    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    }

    // Ownership check (IDOR protection)
    if (booking.studentId !== studentId) {
      throw new AppError(403, 'UNAUTHORIZED', 'You can only check in your own booking');
    }

    // Booking state check (case-insensitive check)
    const currentStatus = String(booking.status || '').toUpperCase();
    if (currentStatus === 'CANCELLED') {
      throw new AppError(400, 'INVALID_BOOKING_STATUS', 'Cannot check in a cancelled booking');
    }

    if (currentStatus === 'CHECKED_IN') {
      throw new AppError(400, 'ALREADY_CHECKED_IN', 'This booking has already been checked in');
    }

    if (currentStatus !== 'BOOKED') {
      throw new AppError(
        400,
        'INVALID_BOOKING_STATUS',
        `Booking is in ${booking.status} state (must be BOOKED to check in)`,
      );
    }

    // Duplicate check-in protection
    const existingEntry = await this.queueRepo.findByBookingId(bookingId);
    if (existingEntry) {
      throw new AppError(400, 'ALREADY_CHECKED_IN', 'This booking has already been checked in');
    }

    // Time window eligibility check
    if (booking.slot) {
      const now = new Date();
      const slotStart = new Date(booking.slot.startTime);
      const slotEnd = new Date(booking.slot.endTime);

      const rawStartDiffMs = slotStart.getTime() - now.getTime();
      const rawEndDiffMs = slotEnd.getTime() - now.getTime();

      // Check for IST offset (+5.5 hours = +19,800,000 ms) in case slot was stored as IST wall-clock with 'Z'
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istStartDiffMs = rawStartDiffMs - istOffsetMs;
      const istEndDiffMs = rawEndDiffMs - istOffsetMs;

      // Detect if raw difference is in the ~5.5 hour range (slot was stored in UTC representing IST wall-clock)
      let effectiveStartDiffMs = rawStartDiffMs;
      let effectiveEndDiffMs = rawEndDiffMs;

      if (rawStartDiffMs > 4 * 60 * 60 * 1000 && rawStartDiffMs < 8 * 60 * 60 * 1000) {
        effectiveStartDiffMs = istStartDiffMs;
        effectiveEndDiffMs = istEndDiffMs;
      }

      // Allow check-in up to 45 minutes before slot starts (e.g. at 16:16 for a 17:00 slot)
      const EARLY_CHECKIN_LIMIT_MS = 45 * 60 * 1000;
      // Allow 15 minutes grace period after slot ends
      const LATE_CHECKIN_GRACE_MS = 15 * 60 * 1000;

      if (effectiveStartDiffMs > EARLY_CHECKIN_LIMIT_MS) {
        const minutesUntil = Math.ceil(effectiveStartDiffMs / (60 * 1000));
        throw new AppError(
          400,
          'CHECK_IN_TOO_EARLY',
          `Check-in is not open yet. Your slot starts in ${minutesUntil} minutes (check-in opens 45 minutes before your time slot starts).`,
        );
      }

      if (effectiveEndDiffMs < -LATE_CHECKIN_GRACE_MS) {
        throw new AppError(
          400,
          'CHECK_IN_EXPIRED',
          'Check-in window for this slot has already expired',
        );
      }
    }

    // Execute check-in transactionally
    const entry = await this.queueRepo.executeTransaction(async (tx) => {
      const nextSeq = await this.queueRepo.getNextSequenceNumber(booking.menuId, tx);
      const now = new Date();

      const created = await this.queueRepo.create(
        {
          menuId: booking.menuId,
          slotId: booking.slotId,
          bookingId: booking.id,
          studentId: booking.studentId,
          entryType: EntryType.BOOKING,
          status: QueueStatus.CHECKED_IN,
          sequenceNumber: nextSeq,
          studentIdentifier: booking.student?.rollNo || booking.student?.name || null,
          checkedInAt: now,
        },
        tx,
      );

      // Update booking status to mirror attendance
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CHECKED_IN,
          checkedInAt: now,
        },
      });

      return created;
    });

    // Broadcast update via Socket.IO after transaction commit
    socketModule.emitQueueUpdated(booking.menuId, {
      type: 'CHECK_IN',
      entryId: entry.id,
      sequenceNumber: entry.sequenceNumber,
    });

    return entry;
  }

  /**
   * Admin creation of a walk-in queue entry.
   * Minimal requirements, no fake student user account created.
   */
  async createWalkIn(adminUserId, input) {
    const menu = await this.menuRepo.findById(input.menuId);
    if (!menu) {
      throw new AppError(404, 'MENU_NOT_FOUND', 'Menu not found');
    }

    // Create walk-in entry transactionally
    const entry = await this.queueRepo.executeTransaction(async (tx) => {
      const nextSeq = await this.queueRepo.getNextSequenceNumber(input.menuId, tx);
      const now = new Date();

      return this.queueRepo.create(
        {
          menuId: input.menuId,
          slotId: input.slotId || null,
          bookingId: null,
          studentId: null,
          entryType: EntryType.WALK_IN,
          status: QueueStatus.WAITING, // Walk-ins enter directly into waiting line
          sequenceNumber: nextSeq,
          studentIdentifier: input.studentIdentifier || `Walk-in #${nextSeq}`,
          checkedInAt: now,
        },
        tx,
      );
    });

    // Broadcast after commit
    socketModule.emitQueueUpdated(input.menuId, {
      type: 'WALK_IN',
      entryId: entry.id,
      sequenceNumber: entry.sequenceNumber,
    });

    return entry;
  }

  /**
   * Advance a CHECKED_IN entry into the WAITING line.
   * Can be invoked by student for their own entry, or MESS_ADMIN.
   */
  async markWaiting(userId, userRole, entryId) {
    const entry = await this.queueRepo.findById(entryId);
    if (!entry) {
      throw new AppError(404, 'QUEUE_ENTRY_NOT_FOUND', 'Queue entry not found');
    }

    // Student IDOR protection
    if (userRole === Role.STUDENT && entry.studentId !== userId) {
      throw new AppError(403, 'UNAUTHORIZED', 'You cannot advance another student queue entry');
    }

    // State transition validation
    if (entry.status === QueueStatus.WAITING) {
      throw new AppError(
        400,
        'INVALID_STATUS_TRANSITION',
        'Queue entry is already waiting in line',
      );
    }

    if (entry.status !== QueueStatus.CHECKED_IN) {
      throw new AppError(
        400,
        'INVALID_STATUS_TRANSITION',
        `Cannot transition to WAITING from ${entry.status}`,
      );
    }

    const updated = await this.queueRepo.executeTransaction(async (tx) => {
      const res = await this.queueRepo.updateStatus(entryId, QueueStatus.WAITING, undefined, tx);
      if (entry.bookingId) {
        await tx.booking.update({
          where: { id: entry.bookingId },
          data: { status: BookingStatus.WAITING, waitingAt: new Date() },
        });
      }
      return res;
    });

    socketModule.emitQueueUpdated(entry.menuId, {
      type: 'MARK_WAITING',
      entryId: updated.id,
    });

    return updated;
  }

  /**
   * Start serving a queue entry (MESS_ADMIN only).
   * Valid transition: WAITING -> SERVING (or CHECKED_IN -> SERVING).
   */
  async startServing(adminUserId, entryId) {
    const entry = await this.queueRepo.findById(entryId);
    if (!entry) {
      throw new AppError(404, 'QUEUE_ENTRY_NOT_FOUND', 'Queue entry not found');
    }

    if (entry.status === QueueStatus.SERVING) {
      throw new AppError(400, 'INVALID_STATUS_TRANSITION', 'Queue entry is already being served');
    }

    if (entry.status === QueueStatus.SERVED) {
      throw new AppError(
        400,
        'INVALID_STATUS_TRANSITION',
        'Cannot serve an entry that has already been served',
      );
    }

    if (entry.status !== QueueStatus.WAITING && entry.status !== QueueStatus.CHECKED_IN) {
      throw new AppError(
        400,
        'INVALID_STATUS_TRANSITION',
        `Cannot start serving from status ${entry.status}`,
      );
    }

    const now = new Date();
    const updated = await this.queueRepo.executeTransaction(async (tx) => {
      const res = await this.queueRepo.updateStatus(
        entryId,
        QueueStatus.SERVING,
        { servingStartedAt: now },
        tx,
      );

      if (entry.bookingId) {
        await tx.booking.update({
          where: { id: entry.bookingId },
          data: { status: BookingStatus.SERVING, servingAt: now },
        });
      }

      return res;
    });

    socketModule.emitQueueUpdated(entry.menuId, {
      type: 'START_SERVING',
      entryId: updated.id,
    });

    return updated;
  }

  /**
   * Complete serving a queue entry (MESS_ADMIN only).
   * Valid transition: SERVING -> SERVED.
   */
  async completeServing(adminUserId, entryId) {
    const entry = await this.queueRepo.findById(entryId);
    if (!entry) {
      throw new AppError(404, 'QUEUE_ENTRY_NOT_FOUND', 'Queue entry not found');
    }

    if (entry.status === QueueStatus.SERVED) {
      throw new AppError(400, 'INVALID_STATUS_TRANSITION', 'Queue entry has already been served');
    }

    if (entry.status !== QueueStatus.SERVING) {
      throw new AppError(
        400,
        'INVALID_STATUS_TRANSITION',
        `Entry must be in SERVING state before completing (current: ${entry.status})`,
      );
    }

    const now = new Date();
    const updated = await this.queueRepo.executeTransaction(async (tx) => {
      const res = await this.queueRepo.updateStatus(
        entryId,
        QueueStatus.SERVED,
        { servedAt: now },
        tx,
      );

      if (entry.bookingId) {
        await tx.booking.update({
          where: { id: entry.bookingId },
          data: { status: BookingStatus.SERVED, servedAt: now },
        });
      }

      return res;
    });

    socketModule.emitQueueUpdated(entry.menuId, {
      type: 'COMPLETED',
      entryId: updated.id,
    });

    return updated;
  }

  /**
   * Mark a queue entry as NO_SHOW (MESS_ADMIN only).
   */
  async markNoShow(adminUserId, entryId) {
    const entry = await this.queueRepo.findById(entryId);
    if (!entry) {
      throw new AppError(404, 'QUEUE_ENTRY_NOT_FOUND', 'Queue entry not found');
    }

    if (entry.status === QueueStatus.SERVED) {
      throw new AppError(400, 'INVALID_STATUS_TRANSITION', 'Cannot mark a served entry as no-show');
    }

    const now = new Date();
    const updated = await this.queueRepo.executeTransaction(async (tx) => {
      const res = await this.queueRepo.updateStatus(entryId, QueueStatus.NO_SHOW, undefined, tx);

      if (entry.bookingId) {
        await tx.booking.update({
          where: { id: entry.bookingId },
          data: { status: BookingStatus.NO_SHOW, noShowAt: now },
        });
      }

      return res;
    });

    socketModule.emitQueueUpdated(entry.menuId, {
      type: 'NO_SHOW',
      entryId: updated.id,
    });

    return updated;
  }

  /**
   * Live queue view for a meal service.
   */
  async getLiveQueue(menuId, slotId) {
    const menu = await this.menuRepo.findById(menuId);
    if (!menu) {
      throw new AppError(404, 'MENU_NOT_FOUND', 'Menu not found');
    }

    const queueData = await this.queueRepo.getLiveQueue(menuId, slotId);
    return {
      menuId,
      menu,
      ...queueData,
    };
  }

  /**
   * Student's current active queue status & calculated position.
   */
  async getMyQueueStatus(studentId, menuId) {
    const activeEntry = await this.queueRepo.findActiveEntryForStudent(studentId, menuId);

    if (!activeEntry) {
      return {
        hasActiveEntry: false,
        entry: null,
        position: null,
        aheadCount: null,
        currentlyServingSequence: null,
        estimatedWaitMinutes: null,
      };
    }

    let position = null;
    let aheadCount = null;
    let estimatedWaitMinutes = null;

    if (activeEntry.status === QueueStatus.WAITING) {
      const posData = await this.queueRepo.getWaitingPosition(
        activeEntry.menuId,
        activeEntry.sequenceNumber,
      );
      aheadCount = posData.aheadCount;
      position = posData.position;

      // Look up average serving time from mealConfig
      const mealConfig = await this.mealConfigRepo.findByMessAndMealType(
        activeEntry.menu.messId,
        activeEntry.menu.mealType,
      );
      const avgServingSeconds = mealConfig?.averageServingTimeSeconds || 30;
      estimatedWaitMinutes = Math.ceil((aheadCount * avgServingSeconds) / 60);
    } else if (activeEntry.status === QueueStatus.SERVING) {
      position = 0; // Currently being served
      aheadCount = 0;
      estimatedWaitMinutes = 0;
    }

    // Find current serving sequence
    const liveQueue = await this.queueRepo.getLiveQueue(activeEntry.menuId);
    const minServingSeq =
      liveQueue.currentlyServing.length > 0
        ? Math.min(...liveQueue.currentlyServing.map((e) => e.sequenceNumber))
        : null;

    return {
      hasActiveEntry: true,
      entry: activeEntry,
      position,
      aheadCount,
      currentlyServingSequence: minServingSeq,
      estimatedWaitMinutes,
    };
  }
}

const queueService = new QueueService();

module.exports = {
  QueueService,
  queueService,
};
