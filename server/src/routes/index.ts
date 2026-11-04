import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import messRoutes from './mess.routes';
import mealConfigRoutes from './mealConfig.routes';
import menuItemRoutes from './menuItem.routes';
import menuRoutes from './menu.routes';
import timeSlotRoutes from './timeSlot.routes';
import bookingRoutes from './booking.routes';
import queueRoutes from './queue.routes';
import foodLogRoutes from './foodLog.routes';
import feedbackRoutes from './feedback.routes';

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
router.use('/food-logs', foodLogRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/admin/feedback', feedbackRoutes);

// Future feature routes:
// router.use('/attendance', attendanceRoutes);
// router.use('/waste-logs', wasteRoutes);
// router.use('/dashboard', dashboardRoutes);
// router.use('/analytics', analyticsRoutes);

export default router;
