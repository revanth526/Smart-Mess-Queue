const { QueueStatus } = require('@prisma/client');
const prisma = require('../lib/prisma');

class QueueRepository {
  async findById(id, tx) {
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

  async findByBookingId(bookingId, tx) {
    const client = tx || prisma;
    return client.queueEntry.findUnique({
      where: { bookingId },
    });
  }

  async findActiveEntryForStudent(studentId, menuId, tx) {
    const client = tx || prisma;
    const where = {
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
  async getNextSequenceNumber(menuId, tx) {
    // Lock the menu row for the duration of this transaction
    await tx.$executeRaw`SELECT id FROM menus WHERE id = ${menuId} FOR UPDATE`;

    const result = await tx.$queryRaw`
      SELECT COALESCE(MAX("sequenceNumber"), 0) + 1 AS next_seq
      FROM queue_entries
      WHERE "menuId" = ${menuId}
    `;

    return Number(result[0]?.next_seq || 1);
  }

  async create(data, tx) {
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

  async updateStatus(id, status, timestamps, tx) {
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

  async getLiveQueue(menuId, slotId, tx) {
    const client = tx || prisma;
    const baseFilter = {
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

  async getWaitingPosition(menuId, sequenceNumber, tx) {
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

  async findByMenuId(menuId) {
    return prisma.queueEntry.findMany({
      where: { menuId },
    });
  }

  async findByMenuIds(menuIds) {
    if (menuIds.length === 0) return [];
    return prisma.queueEntry.findMany({
      where: { menuId: { in: menuIds } },
    });
  }

  async executeTransaction(fn) {
    return prisma.$transaction(fn);
  }
}

const queueRepository = new QueueRepository();

module.exports = {
  QueueRepository,
  queueRepository,
};
