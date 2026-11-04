import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { env } from '../config/env';
import { messRepository } from '../repositories/mess.repository';
import { mealConfigRepository } from '../repositories/mealConfig.repository';
import { menuItemRepository } from '../repositories/menuItem.repository';
import { menuRepository } from '../repositories/menu.repository';
import { timeSlotRepository } from '../repositories/timeSlot.repository';
import prisma from '../lib/prisma';
import { MealType, Role } from '@prisma/client';

// Mock dependencies
jest.mock('../repositories/mess.repository');
jest.mock('../repositories/mealConfig.repository');
jest.mock('../repositories/menuItem.repository');
jest.mock('../repositories/menu.repository');
jest.mock('../repositories/timeSlot.repository');
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    menu: { findMany: jest.fn() },
    foodLog: { count: jest.fn() },
    booking: { count: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

const mockedMessRepo = jest.mocked(messRepository);
const mockedMealConfigRepo = jest.mocked(mealConfigRepository);
const mockedMenuItemRepo = jest.mocked(menuItemRepository);
const mockedMenuRepo = jest.mocked(menuRepository);
const mockedTimeSlotRepo = jest.mocked(timeSlotRepository);
const mockedPrisma = jest.mocked(prisma);

// Helpers to generate tokens
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

// Sample test data
const mockMess = {
  id: 'mess-uuid-1',
  name: 'Central Dining Hall',
  location: 'North Campus',
  totalCapacity: 500,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockBreakfastConfig = {
  id: 'cfg-breakfast-1',
  messId: mockMess.id,
  mealType: MealType.BREAKFAST,
  startTime: '07:30',
  endTime: '09:30',
  slotDurationMinutes: 30,
  bookingCutoffMinutes: 30,
  cancellationCutoffMinutes: 30,
  defaultSlotCapacity: 50,
  averageServingTimeSeconds: 30,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockLunchConfig = {
  id: 'cfg-lunch-1',
  messId: mockMess.id,
  mealType: MealType.LUNCH,
  startTime: '11:30',
  endTime: '15:00',
  slotDurationMinutes: 30,
  bookingCutoffMinutes: 30,
  cancellationCutoffMinutes: 30,
  defaultSlotCapacity: 60,
  averageServingTimeSeconds: 30,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockMenuItem = {
  id: 'item-uuid-1',
  messId: mockMess.id,
  name: 'Paneer Butter Masala',
  category: 'Main Course',
  defaultServingGrams: 150,
  isAvailable: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowDateStr = tomorrow.toISOString().slice(0, 10);

const mockMenu = {
  id: 'menu-uuid-1',
  messId: mockMess.id,
  date: new Date(`${tomorrowDateStr}T00:00:00.000Z`),
  mealType: MealType.BREAKFAST,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  dishes: [
    {
      id: 'dish-uuid-1',
      menuId: 'menu-uuid-1',
      menuItemId: mockMenuItem.id,
      dishName: 'Paneer Butter Masala',
      dishCategory: 'Main Course',
      servingGrams: 150,
      sortOrder: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ],
  slots: [
    {
      id: 'slot-uuid-1',
      menuId: 'menu-uuid-1',
      startTime: new Date(`${tomorrowDateStr}T07:30:00.000Z`),
      endTime: new Date(`${tomorrowDateStr}T08:00:00.000Z`),
      capacity: 50,
      currentBookings: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ],
};

describe('Phase 2 — Mess & Menu Management Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMessRepo.findFirst.mockResolvedValue(mockMess);
    mockedMessRepo.findById.mockResolvedValue(mockMess);
    (mockedPrisma.menu.findMany as jest.Mock).mockResolvedValue([]);
    (mockedPrisma.foodLog.count as jest.Mock).mockResolvedValue(0);
    (mockedPrisma.booking.count as jest.Mock).mockResolvedValue(0);
  });

  // ════════════════════════════════════════════════════════════
  // 1. MESS MANAGEMENT
  // ════════════════════════════════════════════════════════════
  describe('Mess Management', () => {
    it('should reject unauthenticated request to GET /api/mess', async () => {
      const res = await request(app).get('/api/mess');
      expect(res.status).toBe(401);
    });

    it('should allow student or admin to view mess details', async () => {
      const studentToken = getStudentToken();
      const res = await request(app)
        .get('/api/mess')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mess.id).toBe(mockMess.id);
      expect(res.body.data.mess.name).toBe('Central Dining Hall');
    });

    it('should allow MESS_ADMIN to update mess details', async () => {
      const adminToken = getAdminToken();
      mockedMessRepo.update.mockResolvedValue({
        ...mockMess,
        name: 'Updated Dining Hall',
        totalCapacity: 600,
      });

      const res = await request(app)
        .patch('/api/mess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Dining Hall', totalCapacity: 600 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mess.name).toBe('Updated Dining Hall');
      expect(mockedMessRepo.update).toHaveBeenCalledWith(
        mockMess.id,
        expect.objectContaining({ name: 'Updated Dining Hall', totalCapacity: 600 }),
      );
    });

    it('should reject student attempt to update mess details with 403', async () => {
      const studentToken = getStudentToken();
      const res = await request(app)
        .patch('/api/mess')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Hacked Dining Hall' });

      expect(res.status).toBe(403);
      expect(mockedMessRepo.update).not.toHaveBeenCalled();
    });

    it('should return mess and meal configurations from GET /api/mess/config', async () => {
      const token = getStudentToken();
      mockedMealConfigRepo.findByMessId.mockResolvedValue([mockBreakfastConfig, mockLunchConfig]);

      const res = await request(app)
        .get('/api/mess/config')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.mess.id).toBe(mockMess.id);
      expect(res.body.data.mealConfigs).toHaveLength(2);
    });
  });

  // ════════════════════════════════════════════════════════════
  // 2. MEAL CONFIGURATION
  // ════════════════════════════════════════════════════════════
  describe('Meal Configuration', () => {
    it('should list meal configurations for authenticated user', async () => {
      const token = getStudentToken();
      mockedMealConfigRepo.findByMessId.mockResolvedValue([mockBreakfastConfig]);

      const res = await request(app)
        .get('/api/meal-configs')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.mealConfigs).toHaveLength(1);
    });

    it('should allow MESS_ADMIN to update valid meal configuration', async () => {
      const adminToken = getAdminToken();
      mockedMealConfigRepo.findById.mockResolvedValue(mockBreakfastConfig);
      mockedMealConfigRepo.findByMessId.mockResolvedValue([mockBreakfastConfig, mockLunchConfig]);
      mockedMealConfigRepo.update.mockResolvedValue({
        ...mockBreakfastConfig,
        slotDurationMinutes: 20,
        defaultSlotCapacity: 55,
      });

      const res = await request(app)
        .patch(`/api/meal-configs/${mockBreakfastConfig.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slotDurationMinutes: 20, defaultSlotCapacity: 55 });

      expect(res.status).toBe(200);
      expect(res.body.data.mealConfig.slotDurationMinutes).toBe(20);
    });

    it('should reject student attempt to update meal configuration with 403', async () => {
      const studentToken = getStudentToken();
      const res = await request(app)
        .patch(`/api/meal-configs/${mockBreakfastConfig.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ slotDurationMinutes: 20 });

      expect(res.status).toBe(403);
    });

    it('should reject invalid start/end time where start >= end', async () => {
      const adminToken = getAdminToken();
      mockedMealConfigRepo.findById.mockResolvedValue(mockBreakfastConfig);

      const res = await request(app)
        .patch(`/api/meal-configs/${mockBreakfastConfig.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTime: '10:00', endTime: '09:00' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TIME_RANGE');
    });

    it('should reject slot duration longer than meal window', async () => {
      const adminToken = getAdminToken();
      mockedMealConfigRepo.findById.mockResolvedValue(mockBreakfastConfig);

      const res = await request(app)
        .patch(`/api/meal-configs/${mockBreakfastConfig.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTime: '07:30', endTime: '08:00', slotDurationMinutes: 45 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SLOT_DURATION');
    });

    it('should reject slot capacity <= 0', async () => {
      const adminToken = getAdminToken();
      mockedMealConfigRepo.findById.mockResolvedValue(mockBreakfastConfig);

      const res = await request(app)
        .patch(`/api/meal-configs/${mockBreakfastConfig.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ defaultSlotCapacity: 0 });

      expect(res.status).toBe(422); // Rejected by Zod validation
    });

    it('should reject overlapping configuration with another active meal', async () => {
      const adminToken = getAdminToken();
      mockedMealConfigRepo.findById.mockResolvedValue(mockBreakfastConfig);
      // Lunch is 11:30 to 15:00
      mockedMealConfigRepo.findByMessId.mockResolvedValue([mockBreakfastConfig, mockLunchConfig]);

      // Breakfast extended into lunch: 07:30 to 12:00
      const res = await request(app)
        .patch(`/api/meal-configs/${mockBreakfastConfig.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ endTime: '12:00' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OVERLAPPING_CONFIG');
    });

    it('should reject timing update if upcoming menus have active bookings', async () => {
      const adminToken = getAdminToken();
      mockedMealConfigRepo.findById.mockResolvedValue(mockBreakfastConfig);
      mockedMealConfigRepo.findByMessId.mockResolvedValue([mockBreakfastConfig]);

      // Simulate existing upcoming menu with bookings
      (mockedPrisma.menu.findMany as jest.Mock).mockResolvedValue([
        { id: 'menu-1', date: new Date() },
      ]);

      const res = await request(app)
        .patch(`/api/meal-configs/${mockBreakfastConfig.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTime: '08:00' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SLOT_GENERATION_CONFLICT');
    });
  });

  // ════════════════════════════════════════════════════════════
  // 3. TIME SLOT GENERATION
  // ════════════════════════════════════════════════════════════
  describe('Time Slot Generation', () => {
    it('should deterministically generate slots matching start and end windows', async () => {
      const adminToken = getAdminToken();
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      // Config: 07:30 to 09:30 with 30m slots -> 4 slots (07:30-08:00, 08:00-08:30, 08:30-09:00, 09:00-09:30)
      mockedMealConfigRepo.findByMessAndMealType.mockResolvedValue(mockBreakfastConfig);
      mockedTimeSlotRepo.findByMenuId.mockResolvedValue([]);
      mockedTimeSlotRepo.createMany.mockResolvedValue(4);

      // When called after creation, returns the generated slots
      const generatedSlots = [
        {
          id: 's1',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T07:30:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T08:00:00.000Z`),
          capacity: 50,
          currentBookings: 0,
          createdAt: new Date(),
        },
        {
          id: 's2',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T08:00:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T08:30:00.000Z`),
          capacity: 50,
          currentBookings: 0,
          createdAt: new Date(),
        },
        {
          id: 's3',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T08:30:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T09:00:00.000Z`),
          capacity: 50,
          currentBookings: 0,
          createdAt: new Date(),
        },
        {
          id: 's4',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T09:00:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T09:30:00.000Z`),
          capacity: 50,
          currentBookings: 0,
          createdAt: new Date(),
        },
      ];
      mockedTimeSlotRepo.findByMenuId
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(generatedSlots);

      const res = await request(app)
        .post('/api/time-slots/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ menuId: mockMenu.id });

      expect(res.status).toBe(200);
      expect(res.body.data.timeSlots).toHaveLength(4);
      expect(mockedTimeSlotRepo.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            startTime: new Date(`${tomorrowDateStr}T07:30:00.000Z`),
            endTime: new Date(`${tomorrowDateStr}T08:00:00.000Z`),
          }),
          expect.objectContaining({
            startTime: new Date(`${tomorrowDateStr}T09:00:00.000Z`),
            endTime: new Date(`${tomorrowDateStr}T09:30:00.000Z`),
          }),
        ]),
      );
    });

    it('should be idempotent and not create duplicate slots if run twice with identical configuration', async () => {
      const adminToken = getAdminToken();
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      mockedMealConfigRepo.findByMessAndMealType.mockResolvedValue(mockBreakfastConfig);

      const existingSlots = [
        {
          id: 'slot-1',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T07:30:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T08:00:00.000Z`),
          capacity: 50,
          currentBookings: 0,
          createdAt: new Date(),
        },
        {
          id: 'slot-2',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T08:00:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T08:30:00.000Z`),
          capacity: 50,
          currentBookings: 0,
          createdAt: new Date(),
        },
        {
          id: 'slot-3',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T08:30:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T09:00:00.000Z`),
          capacity: 50,
          currentBookings: 0,
          createdAt: new Date(),
        },
        {
          id: 'slot-4',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T09:00:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T09:30:00.000Z`),
          capacity: 50,
          currentBookings: 0,
          createdAt: new Date(),
        },
      ];
      mockedTimeSlotRepo.findByMenuId.mockResolvedValue(existingSlots);

      const res = await request(app)
        .post('/api/time-slots/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ menuId: mockMenu.id });

      expect(res.status).toBe(200);
      expect(mockedTimeSlotRepo.createMany).not.toHaveBeenCalled();
      expect(mockedTimeSlotRepo.deleteByMenuId).not.toHaveBeenCalled();
    });

    it('should protect existing slots with active bookings from regeneration conflict', async () => {
      const adminToken = getAdminToken();
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      // Config is 20m slots, but existing has different slot count and has bookings
      mockedMealConfigRepo.findByMessAndMealType.mockResolvedValue({
        ...mockBreakfastConfig,
        slotDurationMinutes: 20,
      });

      mockedTimeSlotRepo.findByMenuId.mockResolvedValue([
        {
          id: 's1',
          menuId: mockMenu.id,
          startTime: new Date(`${tomorrowDateStr}T07:30:00.000Z`),
          endTime: new Date(`${tomorrowDateStr}T08:00:00.000Z`),
          capacity: 50,
          currentBookings: 2, // Active bookings!
          createdAt: new Date(),
        },
      ]);
      mockedTimeSlotRepo.countBookingsInSlots.mockResolvedValue(2);

      const res = await request(app)
        .post('/api/time-slots/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ menuId: mockMenu.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SLOT_GENERATION_CONFLICT');
      expect(mockedTimeSlotRepo.deleteByMenuId).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════
  // 4. MENU ITEM MASTER CATALOG
  // ════════════════════════════════════════════════════════════
  describe('MenuItem Catalog', () => {
    it('should list menu items for authenticated user', async () => {
      const token = getStudentToken();
      mockedMenuItemRepo.findByMessId.mockResolvedValue([mockMenuItem]);

      const res = await request(app).get('/api/menu-items').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.menuItems).toHaveLength(1);
      expect(res.body.data.menuItems[0].name).toBe('Paneer Butter Masala');
    });

    it('should allow MESS_ADMIN to create new menu item', async () => {
      const adminToken = getAdminToken();
      mockedMenuItemRepo.findByNameAndMess.mockResolvedValue(null);
      mockedMenuItemRepo.create.mockResolvedValue(mockMenuItem);

      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Paneer Butter Masala',
          category: 'Main Course',
          defaultServingGrams: 150,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.menuItem.name).toBe('Paneer Butter Masala');
    });

    it('should reject duplicate menu item name with 409 DUPLICATE_MENU_ITEM', async () => {
      const adminToken = getAdminToken();
      mockedMenuItemRepo.findByNameAndMess.mockResolvedValue(mockMenuItem);

      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Paneer Butter Masala',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_MENU_ITEM');
    });

    it('should reject student attempt to create menu item with 403', async () => {
      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Roti' });

      expect(res.status).toBe(403);
    });

    it('should allow MESS_ADMIN to deactivate menu item', async () => {
      const adminToken = getAdminToken();
      mockedMenuItemRepo.findById.mockResolvedValue(mockMenuItem);
      mockedMenuItemRepo.update.mockResolvedValue({ ...mockMenuItem, isAvailable: false });

      const res = await request(app)
        .patch(`/api/menu-items/${mockMenuItem.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAvailable: false });

      expect(res.status).toBe(200);
      expect(res.body.data.menuItem.isAvailable).toBe(false);
      expect(mockedMenuItemRepo.update).toHaveBeenCalledWith(mockMenuItem.id, {
        isAvailable: false,
      });
    });

    it('should protect historical menus by refusing hard delete if item is used in menus', async () => {
      const adminToken = getAdminToken();
      mockedMenuItemRepo.findById.mockResolvedValue(mockMenuItem);
      mockedMenuItemRepo.countMenuDishes.mockResolvedValue(5); // Used in 5 past menus

      const res = await request(app)
        .delete(`/api/menu-items/${mockMenuItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DELETE_ITEM');
      expect(mockedMenuItemRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════
  // 5. DAILY MENU
  // ════════════════════════════════════════════════════════════
  describe('Daily Menu', () => {
    it('should list daily menus for authenticated user', async () => {
      const token = getStudentToken();
      mockedMenuRepo.findAll.mockResolvedValue([mockMenu]);

      const res = await request(app).get('/api/menus').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.menus).toHaveLength(1);
    });

    it('should retrieve a specific menu with dishes and slots', async () => {
      const token = getStudentToken();
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);

      const res = await request(app)
        .get(`/api/menus/${mockMenu.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.menu.id).toBe(mockMenu.id);
      expect(res.body.data.menu.dishes).toHaveLength(1);
      expect(res.body.data.menu.slots).toHaveLength(1);
    });

    it('should allow MESS_ADMIN to create daily menu with auto-generated slots', async () => {
      const adminToken = getAdminToken();
      mockedMenuRepo.findByMessDateMealType.mockResolvedValue(null);
      mockedMenuRepo.create.mockResolvedValue(mockMenu);
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      mockedMealConfigRepo.findByMessAndMealType.mockResolvedValue(mockBreakfastConfig);
      mockedTimeSlotRepo.findByMenuId.mockResolvedValue([]);
      mockedTimeSlotRepo.createMany.mockResolvedValue(4);

      const res = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: tomorrowDateStr,
          mealType: 'BREAKFAST',
          dishes: [
            {
              dishName: 'Idli Sambhar',
              dishCategory: 'South Indian',
              servingGrams: 200,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.menu).toBeDefined();
      expect(mockedMenuRepo.create).toHaveBeenCalled();
    });

    it('should reject duplicate menu for the same mess, date, and mealType with 409', async () => {
      const adminToken = getAdminToken();
      mockedMenuRepo.findByMessDateMealType.mockResolvedValue(mockMenu);

      const res = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: tomorrowDateStr,
          mealType: 'BREAKFAST',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_MENU');
    });

    it('should reject student attempt to create a menu with 403', async () => {
      const studentToken = getStudentToken();
      const res = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          date: tomorrowDateStr,
          mealType: 'BREAKFAST',
        });

      expect(res.status).toBe(403);
    });

    it('should allow adding dishes to an upcoming menu', async () => {
      const adminToken = getAdminToken();
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      mockedMenuRepo.addDish.mockResolvedValue({
        id: 'new-dish-1',
        menuId: mockMenu.id,
        menuItemId: null,
        dishName: 'Vada',
        dishCategory: 'Snacks',
        servingGrams: 50,
        sortOrder: 1,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post(`/api/menus/${mockMenu.id}/dishes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dishName: 'Vada',
          dishCategory: 'Snacks',
          servingGrams: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dish.dishName).toBe('Vada');
    });

    it('should protect historical menus from dish modification', async () => {
      const adminToken = getAdminToken();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);

      const historicalMenu = {
        ...mockMenu,
        date: yesterday,
      };
      mockedMenuRepo.findById.mockResolvedValue(historicalMenu);

      const res = await request(app)
        .post(`/api/menus/${historicalMenu.id}/dishes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dishName: 'Retro Dish',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_MODIFY_HISTORICAL_MENU');
      expect(mockedMenuRepo.addDish).not.toHaveBeenCalled();
    });

    it('should prevent deleting menu when active bookings exist', async () => {
      const adminToken = getAdminToken();
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      mockedMenuRepo.countBookings.mockResolvedValue(10); // 10 students booked

      const res = await request(app)
        .delete(`/api/menus/${mockMenu.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MENU_HAS_BOOKINGS');
      expect(mockedMenuRepo.delete).not.toHaveBeenCalled();
    });

    it('should allow deleting menu when no bookings exist', async () => {
      const adminToken = getAdminToken();
      mockedMenuRepo.findById.mockResolvedValue(mockMenu);
      mockedMenuRepo.countBookings.mockResolvedValue(0);
      mockedMenuRepo.delete.mockResolvedValue(mockMenu as never);

      const res = await request(app)
        .delete(`/api/menus/${mockMenu.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('deleted');
      expect(mockedMenuRepo.delete).toHaveBeenCalledWith(mockMenu.id);
    });
  });
});
