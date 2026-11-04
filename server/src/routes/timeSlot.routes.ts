import { Router } from 'express';
import { timeSlotController } from '../controllers/timeSlot.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { generateSlotsSchema } from '../validators/timeSlot.validators';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/time-slots — Get slots for a menu
router.get('/time-slots', authenticate, timeSlotController.getTimeSlots);

// POST /api/time-slots/generate — Deterministically generate slots for a menu (MESS_ADMIN only)
router.post(
  '/time-slots/generate',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(generateSlotsSchema),
  timeSlotController.generateTimeSlots,
);

export default router;
