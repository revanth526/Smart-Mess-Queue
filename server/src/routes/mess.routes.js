const { Router } = require('express');
const { messController } = require('../controllers/mess.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateMessSchema } = require('../validators/mess.validators');
const { Role } = require('@prisma/client');

const router = Router();

// GET /api/mess — View current mess details (Any authenticated user)
router.get('/mess', authenticate, messController.getMess);

// GET /api/mess/config — View mess details & meal configurations
router.get('/mess/config', authenticate, messController.getMessConfig);

// PATCH /api/mess — Update current mess (MESS_ADMIN only)
router.patch(
  '/mess',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(updateMessSchema),
  messController.updateMess,
);

// PATCH /api/mess/:id — Update specific mess (MESS_ADMIN only)
router.patch(
  '/mess/:id',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(updateMessSchema),
  messController.updateMess,
);

module.exports = router;
module.exports.default = router;
