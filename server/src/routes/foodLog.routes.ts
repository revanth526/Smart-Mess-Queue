import { Router } from 'express';
import { foodLogController } from '../controllers/foodLog.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createFoodLogSchema,
  updateFoodLogSchema,
  getFoodLogByIdSchema,
  listFoodLogsSchema,
  foodLogAnalyticsSchema,
} from '../validators/foodLog.validators';
import { Role } from '@prisma/client';

const router = Router();

// All food log & waste endpoints require authenticated MESS_ADMIN
router.use(authenticate);
router.use(authorize(Role.MESS_ADMIN));

// POST /api/food-logs — Record food preparation, served, and waste
router.post('/', validate(createFoodLogSchema), foodLogController.createFoodLog);

// GET /api/food-logs — List food logs with query filters
router.get('/', validate(listFoodLogsSchema), foodLogController.listFoodLogs);

// GET /api/food-logs/analytics — Deterministic waste analytics and breakdown
// NOTE: Must precede `/:id` route
router.get('/analytics', validate(foodLogAnalyticsSchema), foodLogController.getAnalytics);

// GET /api/food-logs/:id — Get details of a single food log
router.get('/:id', validate(getFoodLogByIdSchema), foodLogController.getFoodLogById);

// PATCH /api/food-logs/:id — Update food log quantities or notes
router.patch('/:id', validate(updateFoodLogSchema), foodLogController.updateFoodLog);

export default router;
