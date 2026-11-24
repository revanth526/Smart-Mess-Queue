const request = require('supertest');
const app = require('../app');
const { signAccessToken } = require('../config/jwt');
const { menuItemRepository } = require('../repositories/menuItem.repository');
const { foodLogRepository } = require('../repositories/foodLog.repository');
const { messRepository } = require('../repositories/mess.repository');
const { queueRepository } = require('../repositories/queue.repository');
const { menuRepository } = require('../repositories/menu.repository');
const { timeSlotRepository } = require('../repositories/timeSlot.repository');
const { mealConfigRepository } = require('../repositories/mealConfig.repository');
const socketModule = require('../sockets');
const { Role, QueueStatus, EntryType, MealType } = require('@prisma/client');

jest.mock('../repositories/menuItem.repository');
jest.mock('../repositories/foodLog.repository');
jest.mock('../repositories/mess.repository');
jest.mock('../repositories/user.repository');
jest.mock('../repositories/queue.repository');
jest.mock('../repositories/menu.repository');
jest.mock('../repositories/timeSlot.repository');
jest.mock('../repositories/mealConfig.repository');

describe('Project-Wide Authentication, Authorization & Stability Regression Suite', () => {
  const adminId = 'admin-uuid-100';
  const studentId = 'student-uuid-200';

  const messAdminToken = signAccessToken({ userId: adminId, role: Role.MESS_ADMIN });
  const adminAliasToken = signAccessToken({ userId: adminId, role: 'ADMIN' });
  const lowercaseAdminToken = signAccessToken({ userId: adminId, role: 'mess_admin' });
  const studentToken = signAccessToken({ userId: studentId, role: Role.STUDENT });

  const mockMess = {
    id: 'mess-1',
    name: 'Main Dining Hall',
    location: 'North Campus',
    totalCapacity: 500,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    messRepository.findFirst.mockResolvedValue(mockMess);
    messRepository.findById.mockResolvedValue(mockMess);
  });

  describe('1. Role-Based Authorization & Case/Alias Normalization', () => {
    it('allows access to admin routes when token has MESS_ADMIN', async () => {
      foodLogRepository.findAll.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/food-logs/analytics')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
    });

    it('allows access to admin routes when token has ADMIN role alias', async () => {
      foodLogRepository.findAll.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/food-logs/analytics')
        .set('Authorization', `Bearer ${adminAliasToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows access to admin routes when token role is lowercase mess_admin', async () => {
      foodLogRepository.findAll.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/food-logs/analytics')
        .set('Authorization', `Bearer ${lowercaseAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 Unauthorized when Authorization header is missing', async () => {
      const res = await request(app).get('/api/food-logs/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Missing or invalid authorization header/i);
    });

    it('returns 403 Forbidden when Student attempts to access admin-only endpoint', async () => {
      const res = await request(app)
        .get('/api/food-logs/analytics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You do not have permission to access this resource');
    });

    it('returns 403 Forbidden when Admin attempts to access student-only booking endpoint', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${messAdminToken}`)
        .send({ menuId: 'menu-1', slotId: 'slot-1' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('2. Menu Item Deletion Safety & Foreign Key Constraints', () => {
    it('returns 400 when attempting to delete a menu item referenced in active menus', async () => {
      menuItemRepository.findById.mockResolvedValue({
        id: 'item-paneer',
        name: 'Paneer Butter Masala',
        messId: 'mess-1',
      });
      menuItemRepository.countMenuDishes.mockResolvedValue(2);

      const res = await request(app)
        .delete('/api/menu-items/item-paneer')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cannot delete menu item that is referenced in menus/i);
    });

    it('successfully deletes an unused or historically referenced menu item', async () => {
      menuItemRepository.findById.mockResolvedValue({
        id: 'item-paneer-old',
        name: 'Paneer Butter Masala',
        messId: 'mess-1',
      });
      menuItemRepository.countMenuDishes.mockResolvedValue(0);
      menuItemRepository.detachMenuDishes.mockResolvedValue({ count: 1 });
      menuItemRepository.delete.mockResolvedValue({ id: 'item-paneer-old' });

      const res = await request(app)
        .delete('/api/menu-items/item-paneer-old')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Menu item deleted successfully');
    });

    it('returns 403 when student attempts to delete a menu item', async () => {
      const res = await request(app)
        .delete('/api/menu-items/item-paneer')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Multi-Path Route Mounting & Aliases (/api/food-waste, /api/analytics)', () => {
    it('supports GET /api/food-waste/analytics for Admins', async () => {
      foodLogRepository.findAll.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/food-waste/analytics')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalWastedKg).toBe(0);
    });

    it('supports GET /api/analytics directly for Admins', async () => {
      foodLogRepository.findAll.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${adminAliasToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('supports POST /api/food-waste to log food records', async () => {
      foodLogRepository.findByMessDateMealType.mockResolvedValue(null);
      foodLogRepository.create.mockResolvedValue({
        id: 'log-1',
        messId: 'mess-1',
        date: new Date('2026-11-15'),
        mealType: 'LUNCH',
        preparedKg: 50,
        servedKg: 40,
        wastedKg: 5,
        notes: 'Test note',
        createdById: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/food-waste')
        .set('Authorization', `Bearer ${messAdminToken}`)
        .send({
          messId: 'mess-1',
          date: '2026-11-15',
          mealType: 'LUNCH',
          preparedKg: 50,
          servedKg: 40,
          wastedKg: 5,
          notes: 'Test note',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.foodLog.preparedKg).toBe(50);
    });
  });

  describe('4. Live Service & Queue Admin Operations Flow', () => {
    const mockWaitingEntry = {
      id: 'queue-entry-1',
      menuId: 'menu-1',
      slotId: null,
      bookingId: null,
      studentId: null,
      entryType: EntryType.WALK_IN,
      status: QueueStatus.WAITING,
      sequenceNumber: 1,
      studentIdentifier: 'WalkIn-1',
      checkedInAt: new Date(),
      servingStartedAt: null,
      servedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockServingEntry = {
      ...mockWaitingEntry,
      id: 'queue-entry-2',
      status: QueueStatus.SERVING,
      servingStartedAt: new Date(),
    };

    beforeEach(() => {
      jest.spyOn(socketModule, 'emitQueueUpdated').mockImplementation(() => {});
      queueRepository.executeTransaction.mockImplementation(async (cb) => {
        return cb({});
      });
      menuRepository.findById.mockResolvedValue({
        id: 'menu-1',
        messId: 'mess-1',
        mealType: MealType.LUNCH,
      });
    });

    it('allows MESS_ADMIN to start serving an entry', async () => {
      queueRepository.findById.mockResolvedValue(mockWaitingEntry);
      queueRepository.updateStatus.mockResolvedValue({
        ...mockWaitingEntry,
        status: QueueStatus.SERVING,
      });

      const res = await request(app)
        .post('/api/queue/queue-entry-1/start-serving')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entry.status).toBe(QueueStatus.SERVING);
    });

    it('allows ADMIN alias to start serving an entry', async () => {
      queueRepository.findById.mockResolvedValue(mockWaitingEntry);
      queueRepository.updateStatus.mockResolvedValue({
        ...mockWaitingEntry,
        status: QueueStatus.SERVING,
      });

      const res = await request(app)
        .post('/api/queue/queue-entry-1/start-serving')
        .set('Authorization', `Bearer ${adminAliasToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects student from start-serving with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/queue/queue-entry-1/start-serving')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows MESS_ADMIN to complete serving an entry', async () => {
      queueRepository.findById.mockResolvedValue(mockServingEntry);
      queueRepository.updateStatus.mockResolvedValue({
        ...mockServingEntry,
        status: QueueStatus.SERVED,
      });

      const res = await request(app)
        .post('/api/queue/queue-entry-2/complete')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entry.status).toBe(QueueStatus.SERVED);
    });

    it('rejects student from complete-serving with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/queue/queue-entry-2/complete')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows MESS_ADMIN to mark entry as no-show', async () => {
      queueRepository.findById.mockResolvedValue(mockWaitingEntry);
      queueRepository.updateStatus.mockResolvedValue({
        ...mockWaitingEntry,
        status: QueueStatus.NO_SHOW,
      });

      const res = await request(app)
        .post('/api/queue/queue-entry-1/no-show')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entry.status).toBe(QueueStatus.NO_SHOW);
    });

    it('rejects student from mark-no-show with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/queue/queue-entry-1/no-show')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows MESS_ADMIN to insert a walk-in entry', async () => {
      queueRepository.getNextSequenceNumber.mockResolvedValue(5);
      queueRepository.create.mockResolvedValue({
        id: 'walk-in-5',
        menuId: 'menu-1',
        entryType: EntryType.WALK_IN,
        status: QueueStatus.WAITING,
        sequenceNumber: 5,
        studentIdentifier: 'Guest-5',
      });

      const res = await request(app)
        .post('/api/queue/walk-in')
        .set('Authorization', `Bearer ${messAdminToken}`)
        .send({
          menuId: 'menu-1',
          studentIdentifier: 'Guest-5',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entry.sequenceNumber).toBe(5);
    });

    it('rejects student from creating walk-in entry with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/queue/walk-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ menuId: 'menu-1' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Daily Menus & Time Slots Admin Operations', () => {
    const mockMenu = {
      id: 'menu-del-1',
      messId: 'mess-1',
      date: new Date('2026-11-20'),
      mealType: MealType.DINNER,
      dishes: [],
      slots: [],
    };

    beforeEach(() => {
      menuRepository.findById.mockResolvedValue(mockMenu);
    });

    it('allows MESS_ADMIN to delete an eligible menu with 0 bookings', async () => {
      menuRepository.countBookings.mockResolvedValue(0);
      menuRepository.delete.mockResolvedValue(mockMenu);

      const res = await request(app)
        .delete('/api/menus/menu-del-1')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Menu deleted successfully');
    });

    it('allows ADMIN alias to delete an eligible menu', async () => {
      menuRepository.countBookings.mockResolvedValue(0);
      menuRepository.delete.mockResolvedValue(mockMenu);

      const res = await request(app)
        .delete('/api/menus/menu-del-1')
        .set('Authorization', `Bearer ${adminAliasToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when attempting to delete a menu with active bookings', async () => {
      menuRepository.countBookings.mockResolvedValue(3);

      const res = await request(app)
        .delete('/api/menus/menu-del-1')
        .set('Authorization', `Bearer ${messAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cannot delete menu because active bookings exist/i);
    });

    it('rejects student from deleting menu with 403 Forbidden', async () => {
      const res = await request(app)
        .delete('/api/menus/menu-del-1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows MESS_ADMIN to add dish to menu', async () => {
      menuRepository.addDish.mockResolvedValue({
        id: 'dish-1',
        menuId: 'menu-del-1',
        dishName: 'Dal Tadka',
      });

      const res = await request(app)
        .post('/api/menus/menu-del-1/dishes')
        .set('Authorization', `Bearer ${messAdminToken}`)
        .send({
          dishName: 'Dal Tadka',
          dishCategory: 'Main Course',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dish.dishName).toBe('Dal Tadka');
    });

    it('rejects student from adding dish to menu with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/menus/menu-del-1/dishes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ dishName: 'Dal Tadka' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows MESS_ADMIN to generate time slots', async () => {
      timeSlotRepository.findByMenuId.mockResolvedValue([]);
      mealConfigRepository.findByMessAndMealType.mockResolvedValue({
        id: 'cfg-1',
        mealType: MealType.DINNER,
        startTime: '19:00',
        endTime: '21:00',
        slotDurationMinutes: 30,
        defaultSlotCapacity: 50,
        isActive: true,
      });
      timeSlotRepository.createMany.mockResolvedValue(4);

      const res = await request(app)
        .post('/api/time-slots/generate')
        .set('Authorization', `Bearer ${messAdminToken}`)
        .send({ menuId: 'menu-del-1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects student from generating time slots with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/time-slots/generate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ menuId: 'menu-del-1' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('6. Role Separation & Boundary Enforcement', () => {
    it('returns 403 Forbidden when Admin attempts to check in a meal', async () => {
      const res = await request(app)
        .post('/api/queue/check-in')
        .set('Authorization', `Bearer ${messAdminToken}`)
        .send({ bookingId: 'booking-1' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You do not have permission to access this resource');
    });

    it('returns 401 Unauthorized when unauthenticated request calls queue endpoints', async () => {
      const res = await request(app).post('/api/queue/queue-entry-1/start-serving');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 Unauthorized when unauthenticated request calls menu delete', async () => {
      const res = await request(app).delete('/api/menus/menu-del-1');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
