import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { env } from '../config/env';
import { feedbackRepository } from '../repositories/feedback.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { menuRepository } from '../repositories/menu.repository';
import { foodLogRepository } from '../repositories/foodLog.repository';
import { queueRepository } from '../repositories/queue.repository';
import { messRepository } from '../repositories/mess.repository';
import { BookingStatus, EntryType, MealType, QueueStatus, Role } from '@prisma/client';

// Mock repositories
jest.mock('../repositories/feedback.repository');
jest.mock('../repositories/booking.repository');
jest.mock('../repositories/menu.repository');
jest.mock('../repositories/foodLog.repository');
jest.mock('../repositories/queue.repository');
jest.mock('../repositories/mess.repository');

const mockedFeedbackRepo = jest.mocked(feedbackRepository);
const mockedBookingRepo = jest.mocked(bookingRepository);
const mockedMenuRepo = jest.mocked(menuRepository);
const mockedFoodLogRepo = jest.mocked(foodLogRepository);
const mockedQueueRepo = jest.mocked(queueRepository);
const mockedMessRepo = jest.mocked(messRepository);

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

const mockMenu = {
  id: 'menu-uuid-1',
  messId: 'mess-uuid-1',
  date: new Date('2026-10-05T00:00:00.000Z'),
  mealType: MealType.LUNCH,
  createdAt: new Date(),
  updatedAt: new Date(),
  dishes: [],
  slots: [],
};

const mockServedBooking = {
  id: 'booking-uuid-1',
  studentId: 'student-uuid-1',
  menuId: 'menu-uuid-1',
  slotId: 'slot-uuid-1',
  status: BookingStatus.SERVED,
  entryType: EntryType.BOOKING,
  bookedAt: new Date('2026-10-05T08:00:00.000Z'),
  cancelledAt: null,
  checkInAt: new Date('2026-10-05T12:05:00.000Z'),
  servingAt: new Date('2026-10-05T12:15:00.000Z'),
  servedAt: new Date('2026-10-05T12:20:00.000Z'),
  createdAt: new Date('2026-10-05T08:00:00.000Z'),
  updatedAt: new Date('2026-10-05T12:20:00.000Z'),
  menu: mockMenu,
  student: {
    id: 'student-uuid-1',
    name: 'John Doe',
    email: 'john@student.edu',
    rollNo: 'S101',
  },
  feedback: null,
};

const mockFeedbackRecord = {
  id: 'feedback-uuid-1',
  studentId: 'student-uuid-1',
  bookingId: 'booking-uuid-1',
  menuId: 'menu-uuid-1',
  rating: 5,
  comment: 'Delicious meal and fast service!',
  createdAt: new Date('2026-10-05T12:30:00.000Z'),
  updatedAt: new Date('2026-10-05T12:30:00.000Z'),
  student: {
    id: 'student-uuid-1',
    name: 'John Doe',
    email: 'john@student.edu',
    rollNo: 'S101',
  },
  menu: mockMenu,
  booking: mockServedBooking,
};

describe('Feedback Module (Phase 6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMessRepo.findById.mockResolvedValue({
      id: 'mess-uuid-1',
      name: 'North Dining Hall',
      location: 'North Campus',
      totalCapacity: 200,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  describe('POST /api/feedback', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/feedback').send({
        bookingId: 'booking-uuid-1',
        rating: 4,
        comment: 'Good food',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-student role (MESS_ADMIN) with 403', async () => {
      const adminToken = getAdminToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 4,
          comment: 'Good food',
        });

      expect(res.status).toBe(403);
    });

    it('should validate rating bounds (reject 0, negative, >5, decimal)', async () => {
      const studentToken = getStudentToken();

      // rating: 0
      let res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId: 'booking-uuid-1', rating: 0 });
      expect(res.status).toBe(422);

      // rating: 6
      res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId: 'booking-uuid-1', rating: 6 });
      expect(res.status).toBe(422);

      // rating: 3.5 (must be integer)
      res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId: 'booking-uuid-1', rating: 3.5 });
      expect(res.status).toBe(422);
    });

    it('should validate comment length (max 500 chars)', async () => {
      const studentToken = getStudentToken();
      const longComment = 'a'.repeat(501);

      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 4,
          comment: longComment,
        });

      expect(res.status).toBe(422);
    });

    it('should reject if booking does not exist (404)', async () => {
      mockedBookingRepo.findById.mockResolvedValue(null);

      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'nonexistent-booking',
          rating: 4,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/Booking not found/i);
    });

    it('should prevent student from submitting feedback for another student booking (403)', async () => {
      // Booking belongs to student-uuid-1, but requester is student-uuid-2
      mockedBookingRepo.findById.mockResolvedValue(mockServedBooking as any);

      const otherStudentToken = getOtherStudentToken('student-uuid-2');
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 4,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/own booking/i);
    });

    it.each([
      [BookingStatus.BOOKED, 'completing the meal'],
      [BookingStatus.CHECKED_IN, 'completing the meal'],
      [BookingStatus.WAITING, 'completing the meal'],
      [BookingStatus.SERVING, 'completing the meal'],
    ])('should reject feedback for in-progress status %s with 400', async (status, errSnippet) => {
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockServedBooking,
        status,
      } as any);

      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 4,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(new RegExp(errSnippet, 'i'));
    });

    it('should reject feedback for CANCELLED booking with 400', async () => {
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockServedBooking,
        status: BookingStatus.CANCELLED,
      } as any);

      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 4,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/cancelled booking/i);
    });

    it('should reject feedback for NO_SHOW booking with 400', async () => {
      mockedBookingRepo.findById.mockResolvedValue({
        ...mockServedBooking,
        status: BookingStatus.NO_SHOW,
      } as any);

      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 4,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/did not attend/i);
    });

    it('should reject feedback for future meal booking with 400', async () => {
      const futureMenu = {
        ...mockMenu,
        date: new Date('2099-01-01T00:00:00.000Z'),
      };
      const futureBooking = {
        ...mockServedBooking,
        menu: futureMenu,
      };
      mockedBookingRepo.findById.mockResolvedValue(futureBooking as any);

      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/future meals/i);
    });

    it('should reject feedback if time slot start time is in future with 400', async () => {
      const futureSlotBooking = {
        ...mockServedBooking,
        slot: {
          id: 'slot-future',
          startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      };
      mockedBookingRepo.findById.mockResolvedValue(futureSlotBooking as any);

      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/future time slot/i);
    });

    it('should reject feedback if booking servedAt is in future with 400', async () => {
      const futureServedBooking = {
        ...mockServedBooking,
        servedAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in the future
      };
      mockedBookingRepo.findById.mockResolvedValue(futureServedBooking as any);

      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/before service is completed/i);
    });

    it('should reject duplicate feedback for the same booking with 409 Conflict', async () => {
      mockedBookingRepo.findById.mockResolvedValue(mockServedBooking as any);
      mockedFeedbackRepo.findByBookingId.mockResolvedValue(mockFeedbackRecord as any);

      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 4,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already.*submitted/i);
    });

    it('should successfully submit feedback for completed meal and derive identity from token', async () => {
      mockedBookingRepo.findById.mockResolvedValue(mockServedBooking as any);
      mockedFeedbackRepo.findByBookingId.mockResolvedValue(null);
      mockedFeedbackRepo.create.mockResolvedValue(mockFeedbackRecord as any);

      const studentToken = getStudentToken('student-uuid-1');
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: 'booking-uuid-1',
          rating: 5,
          comment: 'Delicious meal and fast service!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.feedback.rating).toBe(5);
      expect(res.body.data.feedback.comment).toBe('Delicious meal and fast service!');
      expect(res.body.data.feedback.studentId).toBe('student-uuid-1');
      expect(mockedFeedbackRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-uuid-1',
          bookingId: 'booking-uuid-1',
          rating: 5,
          comment: 'Delicious meal and fast service!',
        }),
      );
    });
  });

  describe('GET /api/feedback/my', () => {
    it('should return list of feedback submitted by logged-in student', async () => {
      mockedFeedbackRepo.findByStudentId.mockResolvedValue([mockFeedbackRecord as any]);

      const studentToken = getStudentToken('student-uuid-1');
      const res = await request(app)
        .get('/api/feedback/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.feedbacks).toHaveLength(1);
      expect(res.body.data.feedbacks[0].id).toBe('feedback-uuid-1');
      expect(mockedFeedbackRepo.findByStudentId).toHaveBeenCalledWith('student-uuid-1');
    });

    it('should reject unauthenticated call with 401', async () => {
      const res = await request(app).get('/api/feedback/my');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/feedback/:id', () => {
    it('should return feedback for the author student', async () => {
      mockedFeedbackRepo.findById.mockResolvedValue(mockFeedbackRecord as any);

      const studentToken = getStudentToken('student-uuid-1');
      const res = await request(app)
        .get('/api/feedback/feedback-uuid-1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.feedback.id).toBe('feedback-uuid-1');
    });

    it('should return feedback for MESS_ADMIN even if not author', async () => {
      mockedFeedbackRepo.findById.mockResolvedValue(mockFeedbackRecord as any);

      const adminToken = getAdminToken('admin-uuid-1');
      const res = await request(app)
        .get('/api/feedback/feedback-uuid-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.feedback.id).toBe('feedback-uuid-1');
    });

    it('should allow MESS_ADMIN to view feedback when scoped to matching messId', async () => {
      mockedFeedbackRepo.findById.mockResolvedValue(mockFeedbackRecord as any);

      const adminToken = getAdminToken('admin-uuid-1');
      const res = await request(app)
        .get('/api/feedback/feedback-uuid-1?messId=mess-uuid-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.feedback.id).toBe('feedback-uuid-1');
    });

    it('should reject MESS_ADMIN from viewing feedback from another mess (403 Forbidden)', async () => {
      mockedMessRepo.findById.mockResolvedValue({
        id: 'mess-uuid-2',
        name: 'South Mess',
      } as any);
      mockedFeedbackRepo.findById.mockResolvedValue(mockFeedbackRecord as any); // belongs to mess-uuid-1

      const adminToken = getAdminToken('admin-uuid-1');
      const res = await request(app)
        .get('/api/feedback/feedback-uuid-1?messId=mess-uuid-2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/another mess/i);
    });

    it('should return 404 if MESS_ADMIN requests feedback with non-existent messId', async () => {
      mockedMessRepo.findById.mockResolvedValue(null);
      mockedFeedbackRepo.findById.mockResolvedValue(mockFeedbackRecord as any);

      const adminToken = getAdminToken('admin-uuid-1');
      const res = await request(app)
        .get('/api/feedback/feedback-uuid-1?messId=nonexistent-mess')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MESS_NOT_FOUND');
    });

    it('should prevent non-author student from viewing another student feedback (403)', async () => {
      mockedFeedbackRepo.findById.mockResolvedValue(mockFeedbackRecord as any);

      const otherStudentToken = getOtherStudentToken('student-uuid-2');
      const res = await request(app)
        .get('/api/feedback/feedback-uuid-1')
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 if feedback does not exist', async () => {
      mockedFeedbackRepo.findById.mockResolvedValue(null);

      const studentToken = getStudentToken('student-uuid-1');
      const res = await request(app)
        .get('/api/feedback/nonexistent-id')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/feedback/:id', () => {
    it('should allow author student to edit feedback', async () => {
      mockedFeedbackRepo.findById.mockResolvedValue(mockFeedbackRecord as any);
      mockedFeedbackRepo.update.mockResolvedValue({
        ...mockFeedbackRecord,
        rating: 4,
        comment: 'Updated review',
      } as any);

      const studentToken = getStudentToken('student-uuid-1');
      const res = await request(app)
        .patch('/api/feedback/feedback-uuid-1')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 4,
          comment: 'Updated review',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.feedback.rating).toBe(4);
      expect(res.body.data.feedback.comment).toBe('Updated review');
      expect(mockedFeedbackRepo.update).toHaveBeenCalledWith('feedback-uuid-1', {
        rating: 4,
        comment: 'Updated review',
      });
    });

    it('should reject edit by another student (403)', async () => {
      mockedFeedbackRepo.findById.mockResolvedValue(mockFeedbackRecord as any);

      const otherStudentToken = getOtherStudentToken('student-uuid-2');
      const res = await request(app)
        .patch('/api/feedback/feedback-uuid-1')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({ rating: 2 });

      expect(res.status).toBe(403);
      expect(mockedFeedbackRepo.update).not.toHaveBeenCalled();
    });

    it('should reject invalid rating update', async () => {
      const studentToken = getStudentToken('student-uuid-1');
      const res = await request(app)
        .patch('/api/feedback/feedback-uuid-1')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ rating: 7 });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/feedback (Admin Listing)', () => {
    it('should allow MESS_ADMIN to list feedbacks', async () => {
      mockedFeedbackRepo.findAll.mockResolvedValue([mockFeedbackRecord as any]);

      const adminToken = getAdminToken();
      const res = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.feedbacks).toHaveLength(1);
    });

    it('should allow MESS_ADMIN to filter feedbacks by messId', async () => {
      mockedFeedbackRepo.findAll.mockResolvedValue([mockFeedbackRecord as any]);

      const adminToken = getAdminToken();
      const res = await request(app)
        .get('/api/feedback?messId=mess-uuid-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockedFeedbackRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ messId: 'mess-uuid-1' }),
      );
    });

    it('should reject MESS_ADMIN listing with non-existent messId (404)', async () => {
      mockedMessRepo.findById.mockResolvedValue(null);

      const adminToken = getAdminToken();
      const res = await request(app)
        .get('/api/feedback?messId=nonexistent-mess')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MESS_NOT_FOUND');
    });

    it('should reject student from accessing admin list with 403', async () => {
      const studentToken = getStudentToken();
      const res = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/feedback/analytics & /summary', () => {
    it('should compute deterministic analytics correctly', async () => {
      const f1 = {
        ...mockFeedbackRecord,
        id: 'f1',
        rating: 5,
        menu: { ...mockMenu, mealType: MealType.LUNCH },
      };
      const f2 = {
        ...mockFeedbackRecord,
        id: 'f2',
        rating: 3,
        menu: { ...mockMenu, mealType: MealType.LUNCH },
      };
      const f3 = {
        ...mockFeedbackRecord,
        id: 'f3',
        rating: 4,
        menu: { ...mockMenu, mealType: MealType.DINNER },
      };

      mockedFeedbackRepo.findAll.mockResolvedValue([f1, f2, f3] as any);

      const adminToken = getAdminToken();
      const res = await request(app)
        .get('/api/feedback/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalCount).toBe(3);
      // (5 + 3 + 4) / 3 = 4.0
      expect(res.body.data.averageRating).toBe(4);
      expect(res.body.data.distribution).toEqual({
        1: 0,
        2: 0,
        3: 1,
        4: 1,
        5: 1,
      });
      // Check meal breakdown
      const lunchBreakdown = res.body.data.byMeal.find((m: any) => m.mealType === MealType.LUNCH);
      expect(lunchBreakdown).toBeDefined();
      expect(lunchBreakdown.feedbackCount).toBe(2);
      expect(lunchBreakdown.averageRating).toBe(4); // (5 + 3) / 2 = 4.0
    });

    it('should allow access via /summary and /admin/feedback/summary aliases', async () => {
      mockedFeedbackRepo.findAll.mockResolvedValue([mockFeedbackRecord as any]);

      const adminToken = getAdminToken();
      const res1 = await request(app)
        .get('/api/feedback/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .get('/api/admin/feedback/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(200);
    });

    it('should reject analytics request with non-existent messId (404)', async () => {
      mockedMessRepo.findById.mockResolvedValue(null);

      const adminToken = getAdminToken();
      const res = await request(app)
        .get('/api/feedback/analytics?messId=nonexistent-mess')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MESS_NOT_FOUND');
    });

    it('should return safe zeros when no feedback exists', async () => {
      mockedFeedbackRepo.findAll.mockResolvedValue([]);

      const adminToken = getAdminToken();
      const res = await request(app)
        .get('/api/feedback/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalCount).toBe(0);
      expect(res.body.data.averageRating).toBe(0);
      expect(res.body.data.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });

    it('should reject student access with 403', async () => {
      const studentToken = getStudentToken();
      const res = await request(app)
        .get('/api/feedback/analytics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/feedback/operational-metrics', () => {
    it('should aggregate today operational metrics across modules in batch', async () => {
      mockedMenuRepo.findAll.mockResolvedValue([mockMenu as any]);
      mockedQueueRepo.findByMenuIds.mockResolvedValue([
        { entryType: EntryType.WALK_IN, status: QueueStatus.WAITING } as any,
        { entryType: EntryType.BOOKING, status: QueueStatus.CHECKED_IN } as any,
        { entryType: EntryType.BOOKING, status: QueueStatus.SERVING } as any,
        { entryType: EntryType.BOOKING, status: QueueStatus.SERVED } as any,
      ]);

      mockedBookingRepo.count.mockResolvedValue(20);

      mockedFoodLogRepo.findAll.mockResolvedValue([
        {
          preparedKg: 100,
          servedKg: 85,
          wastedKg: 10,
        } as any,
      ]);

      mockedFeedbackRepo.findAll.mockResolvedValue([
        {
          ...mockFeedbackRecord,
          id: 'f-op-1',
          rating: 5,
          menu: mockMenu,
        } as any,
        {
          ...mockFeedbackRecord,
          id: 'f-op-2',
          rating: 4,
          menu: mockMenu,
        } as any,
      ]);

      const adminToken = getAdminToken();
      const res = await request(app)
        .get('/api/feedback/operational-metrics?messId=mess-uuid-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.todayMenusCount).toBe(1);
      expect(res.body.data.metrics.totalBookings).toBe(20);
      expect(res.body.data.metrics.checkedInCount).toBe(1);
      expect(res.body.data.metrics.servingCount).toBe(1);
      expect(res.body.data.metrics.servedCount).toBe(1);
      expect(res.body.data.metrics.walkInCount).toBe(1);
      expect(res.body.data.metrics.totalWaitingCount).toBe(1);
      expect(res.body.data.metrics.foodPreparedKg).toBe(100);
      expect(res.body.data.metrics.foodServedKg).toBe(85);
      expect(res.body.data.metrics.foodWastedKg).toBe(10);
      expect(res.body.data.metrics.wastePercentage).toBe(10);
      expect(res.body.data.metrics.averageFeedbackRating).toBe(4.5);
      expect(res.body.data.metrics.feedbackCount).toBe(2);

      // Verify batch query: findByMenuIds called with array of menu IDs
      expect(mockedQueueRepo.findByMenuIds).toHaveBeenCalledWith(['menu-uuid-1']);
      expect(mockedBookingRepo.count).toHaveBeenCalledWith({
        menuId: { in: ['menu-uuid-1'] },
      });
    });

    it('should reject operational metrics with non-existent messId (404)', async () => {
      mockedMessRepo.findById.mockResolvedValue(null);

      const adminToken = getAdminToken();
      const res = await request(app)
        .get('/api/feedback/operational-metrics?messId=nonexistent-mess')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MESS_NOT_FOUND');
    });

    it('should reject student access to operational metrics with 403', async () => {
      const studentToken = getStudentToken();
      const res = await request(app)
        .get('/api/feedback/operational-metrics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
