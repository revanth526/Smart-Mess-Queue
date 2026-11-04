import { Request, Response, NextFunction } from 'express';
import { queueService, QueueService } from '../services/queue.service';
import { sendSuccess } from '../utils/apiResponse';

export class QueueController {
  constructor(private readonly service: QueueService = queueService) {}

  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const { bookingId } = req.body;
      const entry = await this.service.checkIn(studentId, bookingId);
      sendSuccess({ res, data: { entry }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  createWalkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user!.userId;
      const entry = await this.service.createWalkIn(adminUserId, req.body);
      sendSuccess({ res, data: { entry }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  markWaiting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const id = String(req.params.id);
      const entry = await this.service.markWaiting(userId, userRole, id);
      sendSuccess({ res, data: { entry } });
    } catch (error) {
      next(error);
    }
  };

  startServing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user!.userId;
      const id = String(req.params.id);
      const entry = await this.service.startServing(adminUserId, id);
      sendSuccess({ res, data: { entry } });
    } catch (error) {
      next(error);
    }
  };

  completeServing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user!.userId;
      const id = String(req.params.id);
      const entry = await this.service.completeServing(adminUserId, id);
      sendSuccess({ res, data: { entry } });
    } catch (error) {
      next(error);
    }
  };

  markNoShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user!.userId;
      const id = String(req.params.id);
      const entry = await this.service.markNoShow(adminUserId, id);
      sendSuccess({ res, data: { entry } });
    } catch (error) {
      next(error);
    }
  };

  getLiveQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuId = String(req.query.menuId);
      const slotId = req.query.slotId ? String(req.query.slotId) : undefined;
      const liveQueue = await this.service.getLiveQueue(menuId, slotId);
      sendSuccess({ res, data: liveQueue });
    } catch (error) {
      next(error);
    }
  };

  getMyQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const menuId = req.query.menuId ? String(req.query.menuId) : undefined;
      const myQueue = await this.service.getMyQueueStatus(studentId, menuId);
      sendSuccess({ res, data: myQueue });
    } catch (error) {
      next(error);
    }
  };
}

export const queueController = new QueueController();
