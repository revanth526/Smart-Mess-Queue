import { Request, Response, NextFunction } from 'express';
import { messService } from '../services/mess.service';
import { sendSuccess } from '../utils/apiResponse';

export class MessController {
  async getMess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messId = req.query.messId as string | undefined;
      const mess = await messService.getMess(messId);
      sendSuccess({ res, data: { mess } });
    } catch (error) {
      next(error);
    }
  }

  async updateMess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messId = (req.params.id as string) || (req.query.messId as string);
      const updated = await messService.updateMess(messId, req.body);
      sendSuccess({ res, data: { mess: updated } });
    } catch (error) {
      next(error);
    }
  }

  async getMessConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messId = req.query.messId as string | undefined;
      const config = await messService.getMessConfig(messId);
      sendSuccess({ res, data: config });
    } catch (error) {
      next(error);
    }
  }
}

export const messController = new MessController();
