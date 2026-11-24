const { Router } = require('express');
const { foodLogController } = require('../controllers/foodLog.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createFoodLogSchema,
  updateFoodLogSchema,
  getFoodLogByIdSchema,
  listFoodLogsSchema,
  foodLogAnalyticsSchema,
} = require('../validators/foodLog.validators');
const { Role } = require('@prisma/client');

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

// PATCH & PUT /api/food-logs/:id — Update food log quantities or notes
router.patch('/:id', validate(updateFoodLogSchema), foodLogController.updateFoodLog);
router.put('/:id', validate(updateFoodLogSchema), foodLogController.updateFoodLog);

// DELETE /api/food-logs/:id — Delete a food log record
router.delete('/:id', validate(getFoodLogByIdSchema), foodLogController.deleteFoodLog);

module.exports = router;
module.exports.default = router;
