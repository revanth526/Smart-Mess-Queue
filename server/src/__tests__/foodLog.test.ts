import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { env } from '../config/env';
import { foodLogRepository } from '../repositories/foodLog.repository';
import { messRepository } from '../repositories/mess.repository';
import { menuRepository } from '../repositories/menu.repository';
import { MealType, Role } from '@prisma/client';

// Mock repositories
jest.mock('../repositories/foodLog.repository');
jest.mock('../repositories/mess.repository');
jest.mock('../repositories/menu.repository');

const mockedFoodLogRepo = jest.mocked(foodLogRepository);
const mockedMessRepo = jest.mocked(messRepository);
const mockedMenuRepo = jest.mocked(menuRepository);

// Token helpers
function getStudentToken(userId = 'student-uuid-1') {
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

const mockMess = {
  id: 'mess-uuid-1',
  name: 'Central Mess',
  location: 'Campus Center',
  totalCapacity: 500,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMenu = {
  id: 'menu-uuid-1',
  messId: 'mess-uuid-1',
  date: new Date('2026-10-03T00:00:00.000Z'),
  mealType: MealType.LUNCH,
  createdAt: new Date(),
  updatedAt: new Date(),
  dishes: [],
  slots: [],
};

const mockFoodLog = {
  id: 'foodlog-uuid-1',
  messId: 'mess-uuid-1',
  menuId: 'menu-uuid-1',
  date: new Date('2026-10-03T00:00:00.000Z'),
  mealType: MealType.LUNCH,
  preparedKg: 100,
  servedKg: 80,
  wastedKg: 10,
  notes: 'Regular lunch service',
  createdById: 'admin-uuid-1',
  createdAt: new Date('2026-10-03T12:00:00.000Z'),
  updatedAt: new Date('2026-10-03T12:00:00.000Z'),
  mess: {
    id: 'mess-uuid-1',
    name: 'Central Mess',
    location: 'Campus Center',
  },
  menu: {
    id: 'menu-uuid-1',
    date: new Date('2026-10-03T00:00:00.000Z'),
    mealType: MealType.LUNCH,
  },
  createdBy: {
    id: 'admin-uuid-1',
    name: 'Mess Manager',
    email: 'admin@mess.com',
    role: Role.MESS_ADMIN,
  },
};

describe('Phase 5 — Food Waste Tracking & Analytics Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMessRepo.findById.mockResolvedValue(mockMess as any);
    mockedMenuRepo.findByMessDateMealType.mockResolvedValue(mockMenu as any);
    mockedFoodLogRepo.findByMessDateMealType.mockResolvedValue(null);
    mockedFoodLogRepo.getMealContext.mockResolvedValue({
      totalBookings: 85,
      checkedInCount: 82,
      servedCount: 80,
      walkInCount: 5,
    });
  });

  // ════════════════════════════════════════════════════════════
  // 1. FOOD LOG CREATION & INVARIANTS
  // ════════════════════════════════════════════════════════════
  describe('Food Log Creation', () => {
    it('should allow admin to create a valid food log and calculate remainingKg & wastePercentage', async () => {
      mockedFoodLogRepo.create.mockResolvedValueOnce(mockFoodLog as any);

      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'LUNCH',
          preparedKg: 100,
          servedKg: 80,
          wastedKg: 10,
          notes: 'Regular lunch service',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.foodLog).toMatchObject({
        id: 'foodlog-uuid-1',
        messId: 'mess-uuid-1',
        preparedKg: 100,
        servedKg: 80,
        wastedKg: 10,
        remainingKg: 10,
        wastePercentage: 10,
        notes: 'Regular lunch service',
      });
      expect(res.body.data.foodLog.context).toBeDefined();
      expect(res.body.data.foodLog.context.servedCount).toBe(80);
    });

    it('should reject student attempt to create a food log (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getStudentToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'LUNCH',
          preparedKg: 100,
          servedKg: 80,
          wastedKg: 10,
        });

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated request to create food log (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/food-logs').send({
        messId: 'mess-uuid-1',
        date: '2026-10-03',
        mealType: 'LUNCH',
        preparedKg: 100,
        servedKg: 80,
        wastedKg: 10,
      });

      expect(res.status).toBe(401);
    });

    it('should reject negative preparedKg', async () => {
      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'LUNCH',
          preparedKg: -10,
          servedKg: 0,
          wastedKg: 0,
        });

      expect(res.status).toBe(422);
    });

    it('should reject negative servedKg', async () => {
      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'LUNCH',
          preparedKg: 50,
          servedKg: -5,
          wastedKg: 0,
        });

      expect(res.status).toBe(422);
    });

    it('should reject negative wastedKg', async () => {
      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'LUNCH',
          preparedKg: 50,
          servedKg: 30,
          wastedKg: -2,
        });

      expect(res.status).toBe(422);
    });

    it('should reject when servedKg + wastedKg > preparedKg', async () => {
      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'LUNCH',
          preparedKg: 100,
          servedKg: 80,
          wastedKg: 30, // 80 + 30 = 110 > 100
        });

      expect(res.status).toBe(422);
      expect(JSON.stringify(res.body)).toContain(
        'Sum of served kg and wasted kg cannot exceed prepared kg',
      );
    });

    it('should reject duplicate meal/day record (409 Conflict)', async () => {
      mockedFoodLogRepo.findByMessDateMealType.mockResolvedValueOnce(mockFoodLog as any);

      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'LUNCH',
          preparedKg: 100,
          servedKg: 80,
          wastedKg: 10,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_FOOD_LOG');
    });

    it('should handle valid zero quantities correctly (prepared=0, served=0, wasted=0)', async () => {
      const zeroLog = {
        ...mockFoodLog,
        id: 'foodlog-zero',
        preparedKg: 0,
        servedKg: 0,
        wastedKg: 0,
      };
      mockedFoodLogRepo.create.mockResolvedValueOnce(zeroLog as any);

      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'BREAKFAST',
          preparedKg: 0,
          servedKg: 0,
          wastedKg: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.foodLog.remainingKg).toBe(0);
      expect(res.body.data.foodLog.wastePercentage).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════
  // 2. MATHEMATICAL CALCULATION TESTS
  // ════════════════════════════════════════════════════════════
  describe('Mathematical Calculations', () => {
    it('should correctly calculate: prepared=100, served=80, wasted=10 -> remaining=10, wastePercentage=10%', async () => {
      const log100 = {
        ...mockFoodLog,
        preparedKg: 100,
        servedKg: 80,
        wastedKg: 10,
      };
      mockedFoodLogRepo.create.mockResolvedValueOnce(log100 as any);

      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'LUNCH',
          preparedKg: 100,
          servedKg: 80,
          wastedKg: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.foodLog.remainingKg).toBe(10);
      expect(res.body.data.foodLog.wastePercentage).toBe(10);
    });

    it('should correctly calculate: prepared=50, served=30, wasted=20 -> remaining=0, wastePercentage=40%', async () => {
      const log50 = {
        ...mockFoodLog,
        preparedKg: 50,
        servedKg: 30,
        wastedKg: 20,
      };
      mockedFoodLogRepo.create.mockResolvedValueOnce(log50 as any);

      const res = await request(app)
        .post('/api/food-logs')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          messId: 'mess-uuid-1',
          date: '2026-10-03',
          mealType: 'DINNER',
          preparedKg: 50,
          servedKg: 30,
          wastedKg: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.foodLog.remainingKg).toBe(0);
      expect(res.body.data.foodLog.wastePercentage).toBe(40);
    });

    it('should avoid division by zero when prepared=0 -> wastePercentage=0', async () => {
      const logZero = {
        ...mockFoodLog,
        preparedKg: 0,
        servedKg: 0,
        wastedKg: 0,
      };
      mockedFoodLogRepo.findById.mockResolvedValueOnce(logZero as any);

      const res = await request(app)
        .get('/api/food-logs/foodlog-uuid-1')
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.foodLog.wastePercentage).toBe(0);
      expect(res.body.data.foodLog.remainingKg).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════
  // 3. UPDATES & DATA INTEGRITY
  // ════════════════════════════════════════════════════════════
  describe('Food Log Updates', () => {
    it('should allow admin to update valid record and re-derive calculations', async () => {
      mockedFoodLogRepo.findById.mockResolvedValueOnce(mockFoodLog as any);
      const updatedLog = {
        ...mockFoodLog,
        servedKg: 85,
        wastedKg: 5,
      };
      mockedFoodLogRepo.update.mockResolvedValueOnce(updatedLog as any);

      const res = await request(app)
        .patch('/api/food-logs/foodlog-uuid-1')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          servedKg: 85,
          wastedKg: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.foodLog.remainingKg).toBe(10); // 100 - 85 - 5 = 10
      expect(res.body.data.foodLog.wastePercentage).toBe(5); // (5 / 100) * 100 = 5%
    });

    it('should reject update if new values cause served + wasted > prepared', async () => {
      mockedFoodLogRepo.findById.mockResolvedValueOnce(mockFoodLog as any); // prepared is 100

      const res = await request(app)
        .patch('/api/food-logs/foodlog-uuid-1')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          servedKg: 95,
          wastedKg: 20, // 95 + 20 = 115 > 100
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FOOD_TOTALS');
    });

    it('should return 404 when updating non-existent food log', async () => {
      mockedFoodLogRepo.findById.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/food-logs/non-existent')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          servedKg: 80,
        });

      expect(res.status).toBe(404);
    });

    it('should not expose a casual DELETE endpoint', async () => {
      const res = await request(app)
        .delete('/api/food-logs/foodlog-uuid-1')
        .set('Authorization', `Bearer ${getAdminToken()}`);

      // Route should not exist (404)
      expect(res.status).toBe(404);
    });
  });

  // ════════════════════════════════════════════════════════════
  // 4. HISTORICAL INTEGRITY & LISTING
  // ════════════════════════════════════════════════════════════
  describe('Historical Integrity & Listing', () => {
    it('should list historical records with correct date/meal associations', async () => {
      const records = [
        mockFoodLog,
        {
          ...mockFoodLog,
          id: 'foodlog-uuid-2',
          mealType: MealType.DINNER,
          preparedKg: 120,
          servedKg: 100,
          wastedKg: 15,
        },
      ];
      mockedFoodLogRepo.findAll.mockResolvedValueOnce(records as any);

      const res = await request(app)
        .get('/api/food-logs?messId=mess-uuid-1&date=2026-10-03')
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.foodLogs).toHaveLength(2);
      expect(res.body.data.foodLogs[0].mealType).toBe('LUNCH');
      expect(res.body.data.foodLogs[1].mealType).toBe('DINNER');
      expect(res.body.data.foodLogs[1].remainingKg).toBe(5); // 120 - 100 - 15 = 5
      expect(res.body.data.foodLogs[1].wastePercentage).toBe(12.5); // (15 / 120) * 100 = 12.5%
    });

    it('should filter by date range and mealType', async () => {
      mockedFoodLogRepo.findAll.mockResolvedValueOnce([mockFoodLog] as any);

      const res = await request(app)
        .get('/api/food-logs?startDate=2026-10-01&endDate=2026-10-05&mealType=LUNCH')
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(200);
      expect(mockedFoodLogRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mealType: 'LUNCH',
        }),
      );
    });
  });

  // ════════════════════════════════════════════════════════════
  // 5. DETERMINISTIC ANALYTICS
  // ════════════════════════════════════════════════════════════
  describe('Food Waste Analytics', () => {
    it('should calculate summary totals, remaining kg, and waste percentage accurately', async () => {
      const records = [
        {
          ...mockFoodLog,
          id: 'log-1',
          date: new Date('2026-10-01T00:00:00.000Z'),
          mealType: MealType.BREAKFAST,
          preparedKg: 60,
          servedKg: 50,
          wastedKg: 6, // rem 4, 10%
        },
        {
          ...mockFoodLog,
          id: 'log-2',
          date: new Date('2026-10-01T00:00:00.000Z'),
          mealType: MealType.LUNCH,
          preparedKg: 100,
          servedKg: 80,
          wastedKg: 10, // rem 10, 10%
        },
        {
          ...mockFoodLog,
          id: 'log-3',
          date: new Date('2026-10-02T00:00:00.000Z'),
          mealType: MealType.DINNER,
          preparedKg: 140,
          servedKg: 110,
          wastedKg: 14, // rem 16, 10%
        },
      ];
      // Total prepared = 300, served = 240, wasted = 30, remaining = 30, waste % = 10%
      mockedFoodLogRepo.findAll.mockResolvedValueOnce(records as any);

      const res = await request(app)
        .get('/api/food-logs/analytics?startDate=2026-10-01&endDate=2026-10-02')
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toEqual({
        totalPreparedKg: 300,
        totalServedKg: 240,
        totalWastedKg: 30,
        totalRemainingKg: 30,
        wastePercentage: 10,
        recordCount: 3,
      });

      // Breakdown by meal
      const breakfast = res.body.data.byMeal.find((m: any) => m.mealType === 'BREAKFAST');
      expect(breakfast).toEqual({
        mealType: 'BREAKFAST',
        totalPreparedKg: 60,
        totalServedKg: 50,
        totalWastedKg: 6,
        totalRemainingKg: 4,
        wastePercentage: 10,
        recordCount: 1,
      });

      // Breakdown by date
      expect(res.body.data.byDate).toHaveLength(2);
      expect(res.body.data.byDate[0].date).toBe('2026-10-01');
      expect(res.body.data.byDate[0].totalPreparedKg).toBe(160);
      expect(res.body.data.byDate[0].totalRemainingKg).toBe(14);
    });

    it('should handle empty date range gracefully (zeroed summary, empty breakdown)', async () => {
      mockedFoodLogRepo.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/food-logs/analytics?startDate=2026-11-01&endDate=2026-11-05')
        .set('Authorization', `Bearer ${getAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toEqual({
        totalPreparedKg: 0,
        totalServedKg: 0,
        totalWastedKg: 0,
        totalRemainingKg: 0,
        wastePercentage: 0,
        recordCount: 0,
      });
      expect(res.body.data.byDate).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════
  // 6. AUTHORIZATION & RBAC RESTRICTIONS
  // ════════════════════════════════════════════════════════════
  describe('RBAC & Authorization', () => {
    it('should deny student access to GET /api/food-logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/food-logs')
        .set('Authorization', `Bearer ${getStudentToken()}`);

      expect(res.status).toBe(403);
    });

    it('should deny student access to GET /api/food-logs/analytics (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/food-logs/analytics')
        .set('Authorization', `Bearer ${getStudentToken()}`);

      expect(res.status).toBe(403);
    });

    it('should deny student access to GET /api/food-logs/:id (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/food-logs/foodlog-uuid-1')
        .set('Authorization', `Bearer ${getStudentToken()}`);

      expect(res.status).toBe(403);
    });

    it('should deny student access to PATCH /api/food-logs/:id (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/food-logs/foodlog-uuid-1')
        .set('Authorization', `Bearer ${getStudentToken()}`)
        .send({ servedKg: 50 });

      expect(res.status).toBe(403);
    });
  });
});
