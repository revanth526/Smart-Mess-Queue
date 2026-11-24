const { Router } = require('express');
const { timeSlotController } = require('../controllers/timeSlot.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { requireAdmin } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const { generateSlotsSchema } = require('../validators/timeSlot.validators');

const router = Router();

// GET /api/time-slots — Get slots for a menu
router.get('/time-slots', authenticate, timeSlotController.getTimeSlots);

// POST /api/time-slots/generate — Deterministically generate slots for a menu (MESS_ADMIN only)
router.post(
  '/time-slots/generate',
  authenticate,
  requireAdmin,
  validate(generateSlotsSchema),
  timeSlotController.generateTimeSlots,
);

module.exports = router;
module.exports.default = router;
