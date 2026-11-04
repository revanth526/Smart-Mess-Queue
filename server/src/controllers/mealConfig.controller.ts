import { Request, Response, NextFunction } from 'express';
import { mealConfigService } from '../services/mealConfig.service';
import { sendSuccess } from '../utils/apiResponse';

export class MealConfigController {
  async getMealConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messId = req.query.messId as string | undefined;
      const configs = await mealConfigService.getConfigsByMess(messId);
      sendSuccess({ res, data: { mealConfigs: configs } });
    } catch (error) {
      next(error);
    }
  }

  async getMealConfigById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id || req.params.mealConfigId);
      const config = await mealConfigService.getConfigById(id);
      sendSuccess({ res, data: { mealConfig: config } });
    } catch (error) {
      next(error);
    }
  }

  async updateMealConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id || req.params.mealConfigId);
      const updated = await mealConfigService.updateConfig(id, req.body);
      sendSuccess({ res, data: { mealConfig: updated } });
    } catch (error) {
      next(error);
    }
  }
}

export const mealConfigController = new MealConfigController();
