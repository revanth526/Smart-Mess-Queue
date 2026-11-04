import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/authenticate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validators';

const router = Router();

// Public routes
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

// Protected routes
router.get('/auth/me', authenticate, authController.me);

export default router;
