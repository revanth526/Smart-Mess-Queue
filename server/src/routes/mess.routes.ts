import { Router } from 'express';
import { messController } from '../controllers/mess.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateMessSchema } from '../validators/mess.validators';
import { Role } from '@prisma/client';

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

export default router;
