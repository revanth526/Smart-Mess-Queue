import { Request, Response, NextFunction } from 'express';
import { timeSlotService } from '../services/timeSlot.service';
import { sendSuccess } from '../utils/apiResponse';
import { BadRequestError } from '../errors';

export class TimeSlotController {
  async getTimeSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menuId = req.query.menuId as string;
      if (!menuId) {
        throw new BadRequestError('VALIDATION_ERROR', 'menuId query parameter is required');
      }

      const slots = await timeSlotService.getSlotsByMenuId(menuId);
      sendSuccess({ res, data: { timeSlots: slots } });
    } catch (error) {
      next(error);
    }
  }

  async generateTimeSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { menuId } = req.body;
      const slots = await timeSlotService.generateSlotsForMenu(menuId);
      sendSuccess({ res, data: { timeSlots: slots } });
    } catch (error) {
      next(error);
    }
  }
}

export const timeSlotController = new TimeSlotController();
