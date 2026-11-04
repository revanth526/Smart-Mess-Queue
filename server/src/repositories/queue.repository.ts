import { Prisma, QueueEntry, QueueStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export class QueueRepository {
  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<
    (QueueEntry & { menu?: unknown; slot?: unknown; student?: unknown; booking?: unknown }) | null
  > {
    const client = tx || prisma;
    return client.queueEntry.findUnique({
      where: { id },
      include: {
        menu: true,
        slot: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        booking: true,
      },
    });
  }

  async findByBookingId(
    bookingId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<QueueEntry | null> {
    const client = tx || prisma;
    return client.queueEntry.findUnique({
      where: { bookingId },
    });
  }

  async findActiveEntryForStudent(
    studentId: string,
    menuId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<(QueueEntry & { menu?: unknown; slot?: unknown }) | null> {
    const client = tx || prisma;
    const where: Prisma.QueueEntryWhereInput = {
      studentId,
      status: { in: [QueueStatus.CHECKED_IN, QueueStatus.WAITING, QueueStatus.SERVING] },
      ...(menuId ? { menuId } : {}),
    };

    return client.queueEntry.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        menu: true,
        slot: true,
      },
    });
  }

  /**
   * Concurrency-safe sequence generator.
   * Serializes on the parent Menu row for this meal session to prevent race conditions.
   */
  async getNextSequenceNumber(menuId: string, tx: Prisma.TransactionClient): Promise<number> {
    // Lock the menu row for the duration of this transaction
    await tx.$executeRaw`SELECT id FROM menus WHERE id = ${menuId} FOR UPDATE`;

    const result = await tx.$queryRaw<{ next_seq: string | number }[]>`
      SELECT COALESCE(MAX("sequenceNumber"), 0) + 1 AS next_seq
      FROM queue_entries
      WHERE "menuId" = ${menuId}
    `;

    return Number(result[0]?.next_seq || 1);
  }

  async create(
    data: Prisma.QueueEntryUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<QueueEntry> {
    const client = tx || prisma;
    return client.queueEntry.create({
      data,
      include: {
        menu: true,
        slot: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    status: QueueStatus,
    timestamps?: { servingStartedAt?: Date; servedAt?: Date },
    tx?: Prisma.TransactionClient,
  ): Promise<QueueEntry> {
    const client = tx || prisma;
    return client.queueEntry.update({
      where: { id },
      data: {
        status,
        ...(timestamps?.servingStartedAt !== undefined
          ? { servingStartedAt: timestamps.servingStartedAt }
          : {}),
        ...(timestamps?.servedAt !== undefined ? { servedAt: timestamps.servedAt } : {}),
      },
      include: {
        menu: true,
        slot: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getLiveQueue(
    menuId: string,
    slotId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    currentlyServing: QueueEntry[];
    waiting: QueueEntry[];
    checkedIn: QueueEntry[];
    servedCount: number;
    totalWaitingCount: number;
  }> {
    const client = tx || prisma;
    const baseFilter: Prisma.QueueEntryWhereInput = {
      menuId,
      ...(slotId ? { slotId } : {}),
    };

    const [currentlyServing, waiting, checkedIn, servedCount] = await Promise.all([
      client.queueEntry.findMany({
        where: { ...baseFilter, status: QueueStatus.SERVING },
        orderBy: { servingStartedAt: 'asc' },
        include: {
          student: {
            select: { id: true, name: true, rollNo: true },
          },
          slot: true,
        },
      }),
      client.queueEntry.findMany({
        where: { ...baseFilter, status: QueueStatus.WAITING },
        orderBy: { sequenceNumber: 'asc' },
        include: {
          student: {
            select: { id: true, name: true, rollNo: true },
          },
          slot: true,
        },
      }),
      client.queueEntry.findMany({
        where: { ...baseFilter, status: QueueStatus.CHECKED_IN },
        orderBy: { sequenceNumber: 'asc' },
        include: {
          student: {
            select: { id: true, name: true, rollNo: true },
          },
          slot: true,
        },
      }),
      client.queueEntry.count({
        where: { ...baseFilter, status: QueueStatus.SERVED },
      }),
    ]);

    return {
      currentlyServing,
      waiting,
      checkedIn,
      servedCount,
      totalWaitingCount: waiting.length,
    };
  }

  async getWaitingPosition(
    menuId: string,
    sequenceNumber: number,
    tx?: Prisma.TransactionClient,
  ): Promise<{ aheadCount: number; position: number }> {
    const client = tx || prisma;
    const aheadCount = await client.queueEntry.count({
      where: {
        menuId,
        status: QueueStatus.WAITING,
        sequenceNumber: { lt: sequenceNumber },
      },
    });

    return {
      aheadCount,
      position: aheadCount + 1,
    };
  }

  async findByMenuId(menuId: string): Promise<QueueEntry[]> {
    return prisma.queueEntry.findMany({
      where: { menuId },
    });
  }

  async findByMenuIds(menuIds: string[]): Promise<QueueEntry[]> {
    if (menuIds.length === 0) return [];
    return prisma.queueEntry.findMany({
      where: { menuId: { in: menuIds } },
    });
  }

  async executeTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  }
}

export const queueRepository = new QueueRepository();
