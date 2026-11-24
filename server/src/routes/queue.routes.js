const { Router } = require('express');
const { queueController } = require('../controllers/queue.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { requireAdmin, requireStudent } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  checkInSchema,
  walkInSchema,
  getLiveQueueSchema,
  getMyQueueSchema,
} = require('../validators/queue.validators');

const router = Router();

// Student check-in (supporting body bookingId or URL param :id, and hyphenated/non-hyphenated paths)
router.post(
  '/check-in',
  authenticate,
  requireStudent,
  validate(checkInSchema),
  queueController.checkIn,
);
router.post(
  '/check-in/:id',
  authenticate,
  requireStudent,
  validate(checkInSchema),
  queueController.checkIn,
);
router.post(
  '/checkin',
  authenticate,
  requireStudent,
  validate(checkInSchema),
  queueController.checkIn,
);
router.post(
  '/checkin/:id',
  authenticate,
  requireStudent,
  validate(checkInSchema),
  queueController.checkIn,
);

// Admin walk-in creation
router.post(
  '/walk-in',
  authenticate,
  requireAdmin,
  validate(walkInSchema),
  queueController.createWalkIn,
);

// Live queue status (both students and admins can view)
router.get('/current', authenticate, validate(getLiveQueueSchema), queueController.getLiveQueue);

// Student's personal queue status & position
router.get(
  '/my',
  authenticate,
  requireStudent,
  validate(getMyQueueSchema),
  queueController.getMyQueue,
);

// Advance from CHECKED_IN to WAITING (student for own entry, or admin)
router.post('/:id/mark-waiting', authenticate, queueController.markWaiting);

// Admin queue operations
router.post(
  '/:id/start-serving',
  authenticate,
  requireAdmin,
  queueController.startServing,
);

router.post(
  '/:id/complete',
  authenticate,
  requireAdmin,
  queueController.completeServing,
);

router.post('/:id/no-show', authenticate, requireAdmin, queueController.markNoShow);

module.exports = router;
module.exports.default = router;
