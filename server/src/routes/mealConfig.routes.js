const { Router } = require('express');
const { mealConfigController } = require('../controllers/mealConfig.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateMealConfigSchema } = require('../validators/mealConfig.validators');
const { Role } = require('@prisma/client');

const router = Router();

// GET /api/meal-configs — List meal configs
router.get('/meal-configs', authenticate, mealConfigController.getMealConfigs);

// GET /api/meal-configs/:id — Get meal config by ID
router.get('/meal-configs/:id', authenticate, mealConfigController.getMealConfigById);

// PATCH /api/meal-configs/:id — Update meal config (MESS_ADMIN only)
router.patch(
  '/meal-configs/:id',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(updateMealConfigSchema),
  mealConfigController.updateMealConfig,
);

// PUT /api/meal-configs/:id — Update meal config (MESS_ADMIN only)
router.put(
  '/meal-configs/:id',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(updateMealConfigSchema),
  mealConfigController.updateMealConfig,
);

// PUT /api/mess/config/meals/:mealConfigId — Update meal config alias per architecture spec
router.put(
  '/mess/config/meals/:mealConfigId',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(updateMealConfigSchema),
  mealConfigController.updateMealConfig,
);

module.exports = router;
module.exports.default = router;
