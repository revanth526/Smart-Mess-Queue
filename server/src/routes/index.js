const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const messRoutes = require('./mess.routes');
const mealConfigRoutes = require('./mealConfig.routes');
const menuItemRoutes = require('./menuItem.routes');
const menuRoutes = require('./menu.routes');
const timeSlotRoutes = require('./timeSlot.routes');
const bookingRoutes = require('./booking.routes');
const queueRoutes = require('./queue.routes');
const foodLogRoutes = require('./foodLog.routes');
const feedbackRoutes = require('./feedback.routes');
const { foodLogController } = require('../controllers/foodLog.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { Role } = require('@prisma/client');

const router = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(messRoutes);
router.use(mealConfigRoutes);
router.use(menuItemRoutes);
router.use(menuRoutes);
router.use(timeSlotRoutes);
router.use(bookingRoutes);
router.use('/queue', queueRoutes);

// Food Logs, Waste Tracking, and Analytics Endpoints
router.use('/food-logs', foodLogRoutes);
router.use('/food-waste', foodLogRoutes);
router.get('/analytics', authenticate, authorize(Role.MESS_ADMIN), foodLogController.getAnalytics);
router.get('/analytics/waste', authenticate, authorize(Role.MESS_ADMIN), foodLogController.getAnalytics);
router.get('/analytics/food-waste', authenticate, authorize(Role.MESS_ADMIN), foodLogController.getAnalytics);
router.use('/analytics', foodLogRoutes);

// Feedback & Ratings
router.use('/feedback', feedbackRoutes);
router.use('/admin/feedback', feedbackRoutes);
router.use('/ratings', feedbackRoutes);
router.use('/reviews', feedbackRoutes);
router.use('/admin/reviews', feedbackRoutes);
router.use('/admin/ratings', feedbackRoutes);

module.exports = router;
module.exports.default = router;
