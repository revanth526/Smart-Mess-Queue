const { Router } = require('express');
const { authController } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/authenticate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validators');

const router = Router();

// Public routes
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

// Protected routes
router.get('/auth/me', authenticate, authController.me);

module.exports = router;
module.exports.default = router;
