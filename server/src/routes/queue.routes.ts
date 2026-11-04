import { Router } from 'express';
import { queueController } from '../controllers/queue.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  checkInSchema,
  walkInSchema,
  getLiveQueueSchema,
  getMyQueueSchema,
} from '../validators/queue.validators';
import { Role } from '@prisma/client';

const router = Router();

// Student check-in
router.post(
  '/check-in',
  authenticate,
  authorize(Role.STUDENT),
  validate(checkInSchema),
  queueController.checkIn,
);

// Admin walk-in creation
router.post(
  '/walk-in',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(walkInSchema),
  queueController.createWalkIn,
);

// Live queue status (both students and admins can view)
router.get('/current', authenticate, validate(getLiveQueueSchema), queueController.getLiveQueue);

// Student's personal queue status & position
router.get(
  '/my',
  authenticate,
  authorize(Role.STUDENT),
  validate(getMyQueueSchema),
  queueController.getMyQueue,
);

// Advance from CHECKED_IN to WAITING (student for own entry, or admin)
router.post('/:id/mark-waiting', authenticate, queueController.markWaiting);

// Admin queue operations
router.post(
  '/:id/start-serving',
  authenticate,
  authorize(Role.MESS_ADMIN),
  queueController.startServing,
);

router.post(
  '/:id/complete',
  authenticate,
  authorize(Role.MESS_ADMIN),
  queueController.completeServing,
);

router.post('/:id/no-show', authenticate, authorize(Role.MESS_ADMIN), queueController.markNoShow);

export default router;
