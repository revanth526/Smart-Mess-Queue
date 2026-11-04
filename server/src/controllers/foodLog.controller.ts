import { Request, Response, NextFunction } from 'express';
import { foodLogService, FoodLogService } from '../services/foodLog.service';
import { sendSuccess } from '../utils/apiResponse';
import { FoodLogQueryParams, FoodLogAnalyticsQueryParams } from '../validators/foodLog.validators';

export class FoodLogController {
  constructor(private readonly service: FoodLogService = foodLogService) {}

  createFoodLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const foodLog = await this.service.createFoodLog(userId, req.body);
      sendSuccess({ res, data: { foodLog }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  updateFoodLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const foodLog = await this.service.updateFoodLog(id, req.body);
      sendSuccess({ res, data: { foodLog } });
    } catch (error) {
      next(error);
    }
  };

  getFoodLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const foodLog = await this.service.getFoodLogById(id);
      sendSuccess({ res, data: { foodLog } });
    } catch (error) {
      next(error);
    }
  };

  listFoodLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as FoodLogQueryParams;
      const foodLogs = await this.service.listFoodLogs(query);
      sendSuccess({ res, data: { foodLogs } });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as FoodLogAnalyticsQueryParams;
      const analytics = await this.service.getAnalytics(query);
      sendSuccess({ res, data: analytics });
    } catch (error) {
      next(error);
    }
  };
}

export const foodLogController = new FoodLogController();
