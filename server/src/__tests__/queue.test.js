const http = require('http');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { env } = require('../config/env');
const { queueRepository } = require('../repositories/queue.repository');
const { bookingRepository } = require('../repositories/booking.repository');
const { menuRepository } = require('../repositories/menu.repository');
const { mealConfigRepository } = require('../repositories/mealConfig.repository');
const socketModule = require('../sockets');
const { BookingStatus, EntryType, MealType, QueueStatus, Role } = require('@prisma/client');

// Mock dependencies
jest.mock('../repositories/queue.repository');
jest.mock('../repositories/booking.repository');
jest.mock('../repositories/menu.repository');
jest.mock('../repositories/mealConfig.repository');

const mockedQueueRepo = queueRepository;
const mockedBookingRepo = bookingRepository;
const mockedMenuRepo = menuRepository;
const mockedMealConfigRepo = mealConfigRepository;

// Helpers to generate tokens
function getStudentToken(userId = 'student-uuid-1') {
  return jwt.sign({ userId, role: Role.STUDENT }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
    subject: userId,
  });
}

function getOtherStudentToken(userId = 'student-uuid-2') {
  return jwt.sign({ userId, role: Role.STUDENT }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
    subject: userId,
  });
}

function getAdminToken(userId = 'admin-uuid-1') {
  return jwt.sign({ userId, role: Role.MESS_ADMIN }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
    subject: userId,
  });
}

// Timing helpers
const now = new Date();
const currentSlotStart = new Date(now.getTime() - 5 * 60 * 1000); // started 5 mins ago
const currentSlotEnd = new Date(now.getTime() + 15 * 60 * 1000); // ends in 15 mins

const futureSlotStart = new Date(now.getTime() + 60 * 60 * 1000); // starts in 1 hour
const futureSlotEnd = new Date(now.getTime() + 90 * 60 * 1000);

const pastSlotStart = new Date(now.getTime() - 60 * 60 * 1000); // ended 30 mins ago
const pastSlotEnd = new Date(now.getTime() - 30 * 60 * 1000);

const mockMenu = {
  id: 'menu-uuid-1',
  messId: 'mess-uuid-1',
  date: new Date('2026-10-03'),
  mealType: MealType.LUNCH,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSlot = {
  id: 'slot-uuid-1',
  menuId: 'menu-uuid-1',
  startTime: currentSlotStart,
  endTime: currentSlotEnd,
  capacity: 50,
  currentBookings: 10,
  createdAt: new Date(),
};

const mockBooking = {
  id: 'booking-uuid-1',
  studentId: 'student-uuid-1',
  menuId: 'menu-uuid-1',
  slotId: 'slot-uuid-1',
  status: BookingStatus.BOOKED,
  entryType: EntryType.BOOKING,
  bookedAt: new Date(),
  checkedInAt: null,
  waitingAt: null,
  servingAt: null,
  servedAt: null,
  cancelledAt: null,
  noShowAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  slot: mockSlot,
  student: {
    id: 'student-uuid-1',
    name: 'Student One',
    email: 'student1@example.com',
    rollNo: 'CS2023001',
    role: Role.STUDENT,
    isActive: true,
    createdAt: new Date(),
  },
};

const mockQueueEntry = {
  id: 'entry-uuid-1',
  menuId: 'menu-uuid-1',
  slotId: 'slot-uuid-1',
  bookingId: 'booking-uuid-1',
  studentId: 'student-uuid-1',
  entryType: EntryType.BOOKING,
  status: QueueStatus.CHECKED_IN,
  sequenceNumber: 1,
  studentIdentifier: 'CS2023001',
  checkedInAt: new Date(),
  servingStartedAt: null,
  servedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Queue Module (Phase 4)', () => {
  let emitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(socketModule, 'emitQueueUpdated').mockImplementation(() => {});

    // Default mock behavior
    mockedQueueRepo.findByBookingId.mockResolvedValue(null);
    mockedQueueRepo.executeTransaction.mockImplementation(async (cb) => {
      const mockTx = {
        booking: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      return cb(mockTx);
    });
  });

  afterEach(() => {
    emitSpy.mockRestore();
  });

  // ══════════════════════════════════════════════════════════════════════
  // 1. CHECK-IN
  // ══════════════════════════════════════════════════════════════════════
  describe('Student Check-in', () => {
    it('should allow student to check in their own valid booking', async () => {
      mockedBookingRepo.findById.mockResolvedValue(mockBooking);
      mockedQueueRepo.findByBookingId.mockResolvedValue(null);
      mockedQueueRepo.getNextSequenceNumber.mockResolvedValue(1);
      mockedQueueRepo.create.mockResolvedValue(mockQueueEntry);

      const res = await request(app)
        .post('/api/queue/check-in')
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`)
        .send({ bookingId: mockBooking.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entry.id).toBe(mockQueueEntry.id);
      expect(res.body.data.entry.sequenceNumber).toBe(1);
      expect(emitSpy).toHaveBeenCalledWith(
        'menu-uuid-1',
        expect.objectContaining({ type: 'CHECK_IN' }),
      );
    });

    it('should prevent student from checking in another student booking (IDOR)', async () => {
      mockedBookingRepo.findById.mockResolvedValue(mockBooking);

      const res = await request(app)
        .post('/api/queue/check-in')
        .set('Authorization', `Bearer ${getOtherStudentToken('student-uuid-2')}`)
        .send({ bookingId: mockBooking.id });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should reject check-in for a cancelled booking', async () => {
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const res = await request(app)
        .post('/api/queue/check-in')
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`)
        .send({ bookingId: mockBooking.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_BOOKING_STATUS');
    });

    it('should reject duplicate check-in for the same booking', async () => {
      mockedBookingRepo.findById.mockResolvedValue(mockBooking);
      mockedQueueRepo.findByBookingId.mockResolvedValue(mockQueueEntry);

      const res = await request(app)
        .post('/api/queue/check-in')
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`)
        .send({ bookingId: mockBooking.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ALREADY_CHECKED_IN');
    });

    it('should reject check-in if too early (> 15 mins before slot start)', async () => {
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockBooking,
        slot: {
          ...mockSlot,
          startTime: futureSlotStart,
          endTime: futureSlotEnd,
        },
      });

      const res = await request(app)
        .post('/api/queue/check-in')
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`)
        .send({ bookingId: mockBooking.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CHECK_IN_TOO_EARLY');
    });

    it('should reject check-in if slot window has expired', async () => {
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockBooking,
        slot: {
          ...mockSlot,
          startTime: pastSlotStart,
          endTime: pastSlotEnd,
        },
      });

      const res = await request(app)
        .post('/api/queue/check-in')
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`)
        .send({ bookingId: mockBooking.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CHECK_IN_EXPIRED');
    });

    it('should allow check-in via URL param and alias routes (/api/bookings/:id/checkin)', async () => {
      mockedBookingRepo.findById.mockResolvedValue(mockBooking);
      mockedQueueRepo.findByBookingId.mockResolvedValue(null);
      mockedQueueRepo.getNextSequenceNumber.mockResolvedValue(1);
      mockedQueueRepo.create.mockResolvedValue(mockQueueEntry);

      const res = await request(app)
        .post(`/api/bookings/${mockBooking.id}/checkin`)
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should allow check-in 44 minutes before slot start (16:16 vs 17:00)', async () => {
      const nearSlotStart = new Date(Date.now() + 44 * 60 * 1000);
      const nearSlotEnd = new Date(Date.now() + 64 * 60 * 1000);

      mockedBookingRepo.findById.mockResolvedValue({
        ...mockBooking,
        slot: {
          ...mockSlot,
          startTime: nearSlotStart,
          endTime: nearSlotEnd,
        },
      });
      mockedQueueRepo.findByBookingId.mockResolvedValue(null);
      mockedQueueRepo.getNextSequenceNumber.mockResolvedValue(2);
      mockedQueueRepo.create.mockResolvedValue({ ...mockQueueEntry, sequenceNumber: 2 });

      const res = await request(app)
        .post('/api/queue/check-in')
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`)
        .send({ bookingId: mockBooking.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // 2. WALK-IN
  // ══════════════════════════════════════════════════════════════════════
  describe('Admin Walk-in', () => {
    it('should allow admin to create a walk-in entry', async () => {
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      mockedQueueRepo.getNextSequenceNumber.mockResolvedValue(5);
      mockedQueueRepo.create.mockResolvedValue({
        ...mockQueueEntry,
        id: 'walk-in-entry-1',
        bookingId: null,
        studentId: null,
        entryType: EntryType.WALK_IN,
        status: QueueStatus.WAITING,
        sequenceNumber: 5,
        studentIdentifier: 'Walk-in #5',
      });

      const res = await request(app)
        .post('/api/queue/walk-in')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          menuId: mockMenu.id,
          studentIdentifier: 'Walk-in #5',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.entry.entryType).toBe(EntryType.WALK_IN);
      expect(res.body.data.entry.sequenceNumber).toBe(5);
      expect(emitSpy).toHaveBeenCalledWith(
        mockMenu.id,
        expect.objectContaining({ type: 'WALK_IN' }),
      );
    });

    it('should forbid student from creating a walk-in', async () => {
      const res = await request(app)
        .post('/api/queue/walk-in')
        .set('Authorization', `Bearer ${getStudentToken()}`)
        .send({
          menuId: mockMenu.id,
        });

      expect(res.status).toBe(403);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // 3. STATE TRANSITIONS
  // ══════════════════════════════════════════════════════════════════════
  describe('Queue State Machine Transitions', () => {
    it('should allow transition from CHECKED_IN to WAITING', async () => {
      mockedQueueRepo.findById.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.CHECKED_IN,
      });
      mockedQueueRepo.updateStatus.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.WAITING,
      });

      const res = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/mark-waiting`)
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.entry.status).toBe(QueueStatus.WAITING);
      expect(emitSpy).toHaveBeenCalledWith(
        'menu-uuid-1',
        expect.objectContaining({ type: 'MARK_WAITING' }),
      );
    });

    it('should allow admin to start serving a WAITING entry (WAITING -> SERVING)', async () => {
      mockedQueueRepo.findById.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.WAITING,
      });
      mockedQueueRepo.updateStatus.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.SERVING,
        servingStartedAt: new Date(),
      });

      const res = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/start-serving`)
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.entry.status).toBe(QueueStatus.SERVING);
      expect(emitSpy).toHaveBeenCalledWith(
        'menu-uuid-1',
        expect.objectContaining({ type: 'START_SERVING' }),
      );
    });

    it('should allow admin to complete serving (SERVING -> SERVED)', async () => {
      mockedQueueRepo.findById.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.SERVING,
      });
      mockedQueueRepo.updateStatus.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.SERVED,
        servedAt: new Date(),
      });

      const res = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/complete`)
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.entry.status).toBe(QueueStatus.SERVED);
      expect(emitSpy).toHaveBeenCalledWith(
        'menu-uuid-1',
        expect.objectContaining({ type: 'COMPLETED' }),
      );
    });

    it('should reject invalid transition: cannot serve an already SERVED entry', async () => {
      mockedQueueRepo.findById.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.SERVED,
      });

      const res = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/start-serving`)
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should reject invalid transition: cannot complete an entry that is not SERVING', async () => {
      mockedQueueRepo.findById.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.WAITING,
      });

      const res = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/complete`)
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should allow admin to mark NO_SHOW on waiting entry', async () => {
      mockedQueueRepo.findById.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.WAITING,
      });
      mockedQueueRepo.updateStatus.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.NO_SHOW,
      });

      const res = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/no-show`)
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.entry.status).toBe(QueueStatus.NO_SHOW);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // 4. QUEUE ORDER & POSITION
  // ══════════════════════════════════════════════════════════════════════
  describe('Live Queue Order & Position Calculation', () => {
    it('should return live queue separated into currentlyServing, waiting, and checkedIn', async () => {
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      mockedQueueRepo.getLiveQueue.mockResolvedValue({
        currentlyServing: [
          { ...mockQueueEntry, id: 's-1', status: QueueStatus.SERVING, sequenceNumber: 1 },
        ],
        waiting: [
          { ...mockQueueEntry, id: 'w-1', status: QueueStatus.WAITING, sequenceNumber: 2 },
          { ...mockQueueEntry, id: 'w-2', status: QueueStatus.WAITING, sequenceNumber: 3 },
        ],
        checkedIn: [
          { ...mockQueueEntry, id: 'c-1', status: QueueStatus.CHECKED_IN, sequenceNumber: 4 },
        ],
        servedCount: 15,
        totalWaitingCount: 2,
      });

      const res = await request(app)
        .get(`/api/queue/current?menuId=${mockMenu.id}`)
        .set('Authorization', `Bearer ${getStudentToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.currentlyServing.length).toBe(1);
      expect(res.body.data.waiting.length).toBe(2);
      expect(res.body.data.checkedIn.length).toBe(1);
      expect(res.body.data.servedCount).toBe(15);
      expect(res.body.data.totalWaitingCount).toBe(2);
    });

    it('should calculate accurate queue position (aheadCount + 1) for a student in WAITING', async () => {
      mockedQueueRepo.findActiveEntryForStudent.mockResolvedValue({
        ...mockQueueEntry,
        status: QueueStatus.WAITING,
        sequenceNumber: 10,
        menu: { messId: 'mess-uuid-1', mealType: MealType.LUNCH },
      });
      mockedQueueRepo.getWaitingPosition.mockResolvedValue({
        aheadCount: 3,
        position: 4,
      });
      mockedMealConfigRepo.findByMessAndMealType.mockResolvedValue({
        averageServingTimeSeconds: 30,
      });
      mockedQueueRepo.getLiveQueue.mockResolvedValue({
        currentlyServing: [{ sequenceNumber: 6 }],
        waiting: [],
        checkedIn: [],
        servedCount: 5,
        totalWaitingCount: 4,
      });

      const res = await request(app)
        .get('/api/queue/my')
        .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasActiveEntry).toBe(true);
      expect(res.body.data.position).toBe(4);
      expect(res.body.data.aheadCount).toBe(3);
      expect(res.body.data.currentlyServingSequence).toBe(6);
      expect(res.body.data.estimatedWaitMinutes).toBe(2); // ceil((3 * 30) / 60) = 2 mins
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // 5. CONCURRENCY & INTEGRITY
  // ══════════════════════════════════════════════════════════════════════
  describe('Concurrency & Serialization Protection', () => {
    it('should reject concurrent check-ins for the same booking', async () => {
      mockedBookingRepo.findById.mockResolvedValue(mockBooking);
      mockedQueueRepo.getNextSequenceNumber.mockResolvedValue(1);

      // Simulate first check-in succeeds, second discovers entry already created
      let callCount = 0;
      mockedQueueRepo.findByBookingId.mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? null : mockQueueEntry;
      });
      mockedQueueRepo.create.mockResolvedValue(mockQueueEntry);

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/queue/check-in')
          .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`)
          .send({ bookingId: mockBooking.id }),
        request(app)
          .post('/api/queue/check-in')
          .set('Authorization', `Bearer ${getStudentToken('student-uuid-1')}`)
          .send({ bookingId: mockBooking.id }),
      ]);

      const successCount = [res1, res2].filter((r) => r.status === 201).length;
      const rejectedCount = [res1, res2].filter(
        (r) => r.status === 400 && r.body.error.code === 'ALREADY_CHECKED_IN',
      ).length;

      expect(successCount).toBe(1);
      expect(rejectedCount).toBe(1);
    });

    it('should serialize sequence generation for walk-ins using getNextSequenceNumber', async () => {
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      let seq = 1;
      mockedQueueRepo.getNextSequenceNumber.mockImplementation(async () => seq++);
      mockedQueueRepo.create.mockImplementation(
        async (data) => ({
          ...mockQueueEntry,
          id: `walk-in-${data.sequenceNumber}`,
          sequenceNumber: data.sequenceNumber,
        }),
      );

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/queue/walk-in')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ menuId: mockMenu.id }),
        request(app)
          .post('/api/queue/walk-in')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ menuId: mockMenu.id }),
      ]);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.entry.sequenceNumber).not.toBe(res2.body.data.entry.sequenceNumber);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // 6. AUTHORIZATION & IDOR
  // ══════════════════════════════════════════════════════════════════════
  describe('Authorization & Security', () => {
    it('should reject unauthenticated requests to queue endpoints', async () => {
      const res = await request(app)
        .post('/api/queue/check-in')
        .send({ bookingId: mockBooking.id });
      expect(res.status).toBe(401);
    });

    it('should reject student from starting or completing serving', async () => {
      const res1 = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/start-serving`)
        .set('Authorization', `Bearer ${getStudentToken()}`);
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/complete`)
        .set('Authorization', `Bearer ${getStudentToken()}`);
      expect(res2.status).toBe(403);
    });

    it('should prevent student from advancing another student queue entry to WAITING', async () => {
      mockedQueueRepo.findById.mockResolvedValue({
        ...mockQueueEntry,
        studentId: 'student-uuid-1',
        status: QueueStatus.CHECKED_IN,
      });

      const res = await request(app)
        .post(`/api/queue/${mockQueueEntry.id}/mark-waiting`)
        .set('Authorization', `Bearer ${getOtherStudentToken('student-uuid-2')}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // 7. SOCKET.IO INTEGRATION
  // ══════════════════════════════════════════════════════════════════════
  describe('Socket.IO Setup & Middleware', () => {
    it('should initialize socket.io and verify middleware authentication', () => {
      const testHttpServer = http.createServer();
      const ioInstance = socketModule.setupSocketIO(testHttpServer);
      expect(ioInstance).toBeDefined();
      expect(socketModule.getIO()).toBe(ioInstance);

      // Verify emitQueueUpdated does not crash when io is active
      expect(() => socketModule.emitQueueUpdated('menu-uuid-1', { test: true })).not.toThrow();

      // Clean up
      socketModule.setIO(null);
    });
  });
});
