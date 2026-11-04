import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

router.use(healthRoutes);

// Feature routes will be mounted here as they are implemented:
// router.use('/auth', authRoutes);
// router.use('/menus', menuRoutes);
// router.use('/bookings', bookingRoutes);
// router.use('/attendance', attendanceRoutes);
// router.use('/queue', queueRoutes);
// router.use('/waste-logs', wasteRoutes);
// router.use('/dashboard', dashboardRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/mess/config', messConfigRoutes);

export default router;
