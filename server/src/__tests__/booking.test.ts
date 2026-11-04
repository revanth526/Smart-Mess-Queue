import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { env } from '../config/env';
import { bookingRepository } from '../repositories/booking.repository';
import { userRepository } from '../repositories/user.repository';
import { menuRepository } from '../repositories/menu.repository';
import { timeSlotRepository } from '../repositories/timeSlot.repository';
import { mealConfigRepository } from '../repositories/mealConfig.repository';
import { BookingStatus, EntryType, MealType, Role } from '@prisma/client';

// Mock dependencies
jest.mock('../repositories/booking.repository');
jest.mock('../repositories/user.repository');
jest.mock('../repositories/menu.repository');
jest.mock('../repositories/timeSlot.repository');
jest.mock('../repositories/mealConfig.repository');

const mockedBookingRepo = jest.mocked(bookingRepository);
const mockedUserRepo = jest.mocked(userRepository);
const mockedMenuRepo = jest.mocked(menuRepository);
const mockedTimeSlotRepo = jest.mocked(timeSlotRepository);
const mockedMealConfigRepo = jest.mocked(mealConfigRepository);

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

// Future date helpers
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowDateStr = tomorrow.toISOString().slice(0, 10);

const mockStudentUser = {
  id: 'student-uuid-1',
  name: 'Student One',
  email: 'student1@example.com',
  rollNo: 'CS2023001',
  role: Role.STUDENT,
  isActive: true,
  createdAt: new Date('2024-01-01'),
};

const mockMenu = {
  id: 'menu-uuid-1',
  messId: 'mess-uuid-1',
  date: new Date(`${tomorrowDateStr}T00:00:00.000Z`),
  mealType: MealType.LUNCH,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  dishes: [],
  slots: [],
};

const mockSlot = {
  id: 'slot-uuid-1',
  menuId: mockMenu.id,
  startTime: new Date(`${tomorrowDateStr}T12:00:00.000Z`),
  endTime: new Date(`${tomorrowDateStr}T12:30:00.000Z`),
  capacity: 50,
  currentBookings: 10,
  createdAt: new Date('2024-01-01'),
};

const mockMealConfig = {
  id: 'cfg-lunch-1',
  messId: 'mess-uuid-1',
  mealType: MealType.LUNCH,
  startTime: '11:30',
  endTime: '15:00',
  slotDurationMinutes: 30,
  bookingCutoffMinutes: 30,
  cancellationCutoffMinutes: 30,
  defaultSlotCapacity: 50,
  averageServingTimeSeconds: 30,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockBookingRecord = {
  id: 'booking-uuid-1',
  studentId: mockStudentUser.id,
  menuId: mockMenu.id,
  slotId: mockSlot.id,
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
  student: mockStudentUser,
  menu: {
    ...mockMenu,
    dishes: [
      {
        id: 'd1',
        menuId: mockMenu.id,
        menuItemId: 'item-1',
        dishName: 'Dal Makhani',
        dishCategory: 'Main',
        servingGrams: 150,
        sortOrder: 0,
        createdAt: new Date(),
      },
    ],
  },
  slot: mockSlot,
};

describe('Phase 3 — Student Booking Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserRepo.findById.mockResolvedValue(mockStudentUser as never);
    mockedMenuRepo.findById.mockResolvedValue(mockMenu as never);
    mockedTimeSlotRepo.findById.mockResolvedValue(mockSlot as never);
    mockedMealConfigRepo.findByMessAndMealType.mockResolvedValue(mockMealConfig as never);
    mockedBookingRepo.executeTransaction.mockImplementation(async (cb) => cb({} as never));
  });

  // ════════════════════════════════════════════════════════════
  // 1. AUTHORIZATION & ACCESS CONTROL
  // ════════════════════════════════════════════════════════════
  describe('Authorization & Access Control', () => {
    it('should reject unauthenticated request to POST /api/bookings with 401', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(401);
    });

    it('should allow authenticated STUDENT to book a slot', async () => {
      const token = getStudentToken();
      mockedBookingRepo.findByStudentAndMenu.mockResolvedValue(null);
      mockedBookingRepo.incrementSlotCapacity.mockResolvedValue(1);
      mockedBookingRepo.create.mockResolvedValue({ id: 'booking-uuid-1' } as never);
      mockedBookingRepo.findById.mockResolvedValue(mockBookingRecord as never);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.id).toBe('booking-uuid-1');
      expect(res.body.data.booking.status).toBe('BOOKED');
    });

    it('should reject MESS_ADMIN attempting to create student booking with 403', async () => {
      const adminToken = getAdminToken();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(403);
      expect(mockedBookingRepo.create).not.toHaveBeenCalled();
    });

    it('should prevent student from viewing another student booking (IDOR protection)', async () => {
      const student2Token = getOtherStudentToken('student-uuid-2');
      mockedBookingRepo.findById.mockResolvedValue(mockBookingRecord as never); // Owned by student-uuid-1

      const res = await request(app)
        .get(`/api/bookings/${mockBookingRecord.id}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ════════════════════════════════════════════════════════════
  // 2. AVAILABILITY & TIME WINDOW VALIDATION
  // ════════════════════════════════════════════════════════════
  describe('Availability & Time Window Rules', () => {
    it('should reject booking a slot that does not belong to the selected menu', async () => {
      const token = getStudentToken();
      mockedTimeSlotRepo.findById.mockResolvedValue({
        ...mockSlot,
        menuId: 'another-menu-id',
      } as never);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SLOT');
    });

    it('should reject booking a slot that has already started or passed', async () => {
      const token = getStudentToken();
      const pastTime = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      mockedTimeSlotRepo.findById.mockResolvedValue({
        ...mockSlot,
        startTime: pastTime,
      } as never);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PAST_SLOT');
    });

    it('should reject booking when booking cutoff deadline has passed', async () => {
      const token = getStudentToken();
      // Slot starts in 10 minutes, but cutoff is 30 minutes
      const soonTime = new Date(Date.now() + 10 * 60 * 1000);
      mockedTimeSlotRepo.findById.mockResolvedValue({
        ...mockSlot,
        startTime: soonTime,
      } as never);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BOOKING_CUTOFF_PASSED');
    });

    it('should reject booking if menu does not exist', async () => {
      const token = getStudentToken();
      mockedMenuRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ menuId: 'nonexistent-menu', slotId: mockSlot.id });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MENU_NOT_FOUND');
    });
  });

  // ════════════════════════════════════════════════════════════
  // 3. DUPLICATE BOOKINGS & REBOOKING
  // ════════════════════════════════════════════════════════════
  describe('Duplicate Bookings & Rebooking', () => {
    it('should reject duplicate booking if student already has active BOOKED reservation for meal', async () => {
      const token = getStudentToken();
      mockedBookingRepo.findByStudentAndMenu.mockResolvedValue({
        ...mockBookingRecord,
        status: BookingStatus.BOOKED,
      } as never);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_BOOKED');
      expect(mockedBookingRepo.incrementSlotCapacity).not.toHaveBeenCalled();
    });

    it('should allow rebooking if previous booking was CANCELLED (reactivates record)', async () => {
      const token = getStudentToken();
      mockedBookingRepo.findByStudentAndMenu.mockResolvedValue({
        ...mockBookingRecord,
        id: 'cancelled-booking-id',
        status: BookingStatus.CANCELLED,
      } as never);
      mockedBookingRepo.incrementSlotCapacity.mockResolvedValue(1);
      mockedBookingRepo.update.mockResolvedValue({
        id: 'cancelled-booking-id',
        status: BookingStatus.BOOKED,
      } as never);
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockBookingRecord,
        id: 'cancelled-booking-id',
        status: BookingStatus.BOOKED,
      } as never);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(201);
      expect(mockedBookingRepo.update).toHaveBeenCalledWith(
        'cancelled-booking-id',
        expect.objectContaining({
          status: BookingStatus.BOOKED,
        }),
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════
  // 4. ATOMIC CAPACITY & CONCURRENCY
  // ════════════════════════════════════════════════════════════
  describe('Atomic Capacity & Concurrency Protection', () => {
    it('should reject booking with 409 SLOT_FULL when atomic increment returns 0 rows', async () => {
      const token = getStudentToken();
      mockedBookingRepo.findByStudentAndMenu.mockResolvedValue(null);
      // Atomic increment returns 0: condition "currentBookings < capacity" failed in DB
      mockedBookingRepo.incrementSlotCapacity.mockResolvedValue(0);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ menuId: mockMenu.id, slotId: mockSlot.id });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SLOT_FULL');
      expect(mockedBookingRepo.create).not.toHaveBeenCalled();
    });

    it('CRITICAL CONCURRENCY: prevents overbooking when concurrent requests compete for last seat', async () => {
      // Simulate 5 concurrent requests competing for 1 remaining seat
      const totalCompetitors = 5;
      let remainingSeats = 1;

      mockedBookingRepo.findByStudentAndMenu.mockResolvedValue(null);
      mockedBookingRepo.incrementSlotCapacity.mockImplementation(async () => {
        if (remainingSeats > 0) {
          remainingSeats--;
          return 1; // 1 row updated -> Winner
        }
        return 0; // 0 rows updated -> Rejected at DB level
      });
      mockedBookingRepo.create.mockResolvedValue({ id: 'booking-winner' } as never);
      mockedBookingRepo.findById.mockResolvedValue(mockBookingRecord as never);

      const requests = Array.from({ length: totalCompetitors }, (_, i) => {
        const studentToken = getStudentToken(`competitor-${i}`);
        mockedUserRepo.findById.mockResolvedValue({
          id: `competitor-${i}`,
          role: Role.STUDENT,
          isActive: true,
        } as never);

        return request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ menuId: mockMenu.id, slotId: mockSlot.id });
      });

      const responses = await Promise.all(requests);

      const successCount = responses.filter((r) => r.status === 201).length;
      const fullCount = responses.filter(
        (r) => r.status === 409 && r.body.error.code === 'SLOT_FULL',
      ).length;

      expect(successCount).toBe(1);
      expect(fullCount).toBe(totalCompetitors - 1);
      expect(remainingSeats).toBe(0); // Exactly 0 seats remain, capacity was never exceeded!
    });
  });

  // ════════════════════════════════════════════════════════════
  // 5. CANCELLATION
  // ════════════════════════════════════════════════════════════
  describe('Booking Cancellation', () => {
    it('should successfully cancel booking and release slot capacity atomically', async () => {
      const token = getStudentToken();
      mockedBookingRepo.findById
        .mockResolvedValueOnce(mockBookingRecord as never) // Before cancel
        .mockResolvedValueOnce({
          ...mockBookingRecord,
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        } as never); // After cancel

      mockedBookingRepo.update.mockResolvedValue({} as never);
      mockedBookingRepo.decrementSlotCapacity.mockResolvedValue(1);

      const res = await request(app)
        .patch(`/api/bookings/${mockBookingRecord.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockedBookingRepo.update).toHaveBeenCalledWith(
        mockBookingRecord.id,
        expect.objectContaining({
          status: BookingStatus.CANCELLED,
        }),
        expect.anything(),
      );
      expect(mockedBookingRepo.decrementSlotCapacity).toHaveBeenCalledWith(
        mockBookingRecord.slotId,
        expect.anything(),
      );
    });

    it('should reject double cancellation with 400 ALREADY_CANCELLED', async () => {
      const token = getStudentToken();
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockBookingRecord,
        status: BookingStatus.CANCELLED,
      } as never);

      const res = await request(app)
        .patch(`/api/bookings/${mockBookingRecord.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ALREADY_CANCELLED');
      expect(mockedBookingRepo.decrementSlotCapacity).not.toHaveBeenCalled();
    });

    it('should reject cancellation attempt by another student with 403', async () => {
      const strangerToken = getOtherStudentToken('stranger-student-id');
      mockedBookingRepo.findById.mockResolvedValue(mockBookingRecord as never); // Owned by student-uuid-1

      const res = await request(app)
        .patch(`/api/bookings/${mockBookingRecord.id}/cancel`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(res.status).toBe(403);
      expect(mockedBookingRepo.update).not.toHaveBeenCalled();
    });

    it('should reject cancellation if cancellation deadline has passed', async () => {
      const token = getStudentToken();
      // Slot starts in 15 minutes, but cancellation cutoff is 30 minutes
      const soonSlot = {
        ...mockSlot,
        startTime: new Date(Date.now() + 15 * 60 * 1000),
      };
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockBookingRecord,
        slot: soonSlot,
      } as never);

      const res = await request(app)
        .patch(`/api/bookings/${mockBookingRecord.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANCELLATION_DEADLINE_PASSED');
    });
  });

  // ════════════════════════════════════════════════════════════
  // 6. BOOKING HISTORY
  // ════════════════════════════════════════════════════════════
  describe('Booking History & Listing', () => {
    it('should return student own bookings from GET /api/bookings', async () => {
      const token = getStudentToken();
      mockedBookingRepo.findMany.mockResolvedValue([mockBookingRecord as never]);

      const res = await request(app).get('/api/bookings').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings).toHaveLength(1);
      expect(mockedBookingRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: mockStudentUser.id,
        }),
      );
    });

    it('should also work with student alias route GET /api/student/bookings', async () => {
      const token = getStudentToken();
      mockedBookingRepo.findMany.mockResolvedValue([mockBookingRecord as never]);

      const res = await request(app)
        .get('/api/student/bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings).toHaveLength(1);
    });
  });
});
