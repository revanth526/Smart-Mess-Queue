import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connection failed',
      },
    });
  }
});

export default router;
