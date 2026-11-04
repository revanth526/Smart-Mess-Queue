import { BookingStatus, EntryType, MealType, QueueEntry, QueueStatus, Role } from '@prisma/client';
import { AppError } from '../errors';
import { queueRepository, QueueRepository } from '../repositories/queue.repository';
import { bookingRepository, BookingRepository } from '../repositories/booking.repository';
import { menuRepository, MenuRepository } from '../repositories/menu.repository';
import { mealConfigRepository, MealConfigRepository } from '../repositories/mealConfig.repository';
import { emitQueueUpdated } from '../sockets';

export class QueueService {
  constructor(
    private readonly queueRepo: QueueRepository = queueRepository,
    private readonly bookingRepo: BookingRepository = bookingRepository,
    private readonly menuRepo: MenuRepository = menuRepository,
    private readonly mealConfigRepo: MealConfigRepository = mealConfigRepository,
  ) {}

  /**
   * Student check-in for an active booking.
   * Validates student ownership, booking status, check-in time window,
   * prevents duplicate check-ins, and creates a QueueEntry with sequential queue number.
   */
  async checkIn(studentId: string, bookingId: string): Promise<QueueEntry> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    }

    // Ownership check (IDOR protection)
    if (booking.studentId !== studentId) {
      throw new AppError(403, 'UNAUTHORIZED', 'You can only check in your own booking');
    }

    // Booking state check
    if (booking.status === BookingStatus.CANCELLED) {
      throw new AppError(400, 'INVALID_BOOKING_STATUS', 'Cannot check in a cancelled booking');
    }

    if (booking.status !== BookingStatus.BOOKED) {
      throw new AppError(
        400,
        'INVALID_BOOKING_STATUS',
        `Booking is already in ${booking.status} state`,
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
      // Check-in window opens 15 minutes before slot start
      const windowStart = new Date(booking.slot.startTime.getTime() - 15 * 60 * 1000);
      const windowEnd = new Date(booking.slot.endTime.getTime());

      if (now < windowStart) {
        throw new AppError(
          400,
          'CHECK_IN_TOO_EARLY',
          'Check-in opens 15 minutes before your time slot starts',
        );
      }

      if (now > windowEnd) {
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
    emitQueueUpdated(booking.menuId, {
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
  async createWalkIn(
    adminUserId: string,
    input: { menuId: string; slotId?: string; studentIdentifier?: string },
  ): Promise<QueueEntry> {
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
    emitQueueUpdated(input.menuId, {
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
  async markWaiting(userId: string, userRole: Role, entryId: string): Promise<QueueEntry> {
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

    emitQueueUpdated(entry.menuId, {
      type: 'MARK_WAITING',
      entryId: updated.id,
    });

    return updated;
  }

  /**
   * Start serving a queue entry (MESS_ADMIN only).
   * Valid transition: WAITING -> SERVING (or CHECKED_IN -> SERVING).
   */
  async startServing(adminUserId: string, entryId: string): Promise<QueueEntry> {
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

    emitQueueUpdated(entry.menuId, {
      type: 'START_SERVING',
      entryId: updated.id,
    });

    return updated;
  }

  /**
   * Complete serving a queue entry (MESS_ADMIN only).
   * Valid transition: SERVING -> SERVED.
   */
  async completeServing(adminUserId: string, entryId: string): Promise<QueueEntry> {
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

    emitQueueUpdated(entry.menuId, {
      type: 'COMPLETED',
      entryId: updated.id,
    });

    return updated;
  }

  /**
   * Mark a queue entry as NO_SHOW (MESS_ADMIN only).
   */
  async markNoShow(adminUserId: string, entryId: string): Promise<QueueEntry> {
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

    emitQueueUpdated(entry.menuId, {
      type: 'NO_SHOW',
      entryId: updated.id,
    });

    return updated;
  }

  /**
   * Live queue view for a meal service.
   */
  async getLiveQueue(menuId: string, slotId?: string) {
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
  async getMyQueueStatus(studentId: string, menuId?: string) {
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

    let position: number | null = null;
    let aheadCount: number | null = null;
    let estimatedWaitMinutes: number | null = null;

    if (activeEntry.status === QueueStatus.WAITING) {
      const posData = await this.queueRepo.getWaitingPosition(
        activeEntry.menuId,
        activeEntry.sequenceNumber,
      );
      aheadCount = posData.aheadCount;
      position = posData.position;

      // Look up average serving time from mealConfig
      const mealConfig = await this.mealConfigRepo.findByMessAndMealType(
        (activeEntry.menu as { messId: string }).messId,
        (activeEntry.menu as { mealType: MealType }).mealType,
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

export const queueService = new QueueService();
