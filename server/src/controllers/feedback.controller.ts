import { Request, Response, NextFunction } from 'express';
import { feedbackService, FeedbackService } from '../services/feedback.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  FeedbackQueryParams,
  FeedbackAnalyticsQueryParams,
} from '../validators/feedback.validators';

export class FeedbackController {
  constructor(private readonly service: FeedbackService = feedbackService) {}

  createFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const feedback = await this.service.createFeedback(studentId, req.body);
      sendSuccess({ res, data: { feedback }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  updateFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const id = String(req.params.id);
      const feedback = await this.service.updateFeedback(studentId, id, req.body);
      sendSuccess({ res, data: { feedback } });
    } catch (error) {
      next(error);
    }
  };

  getFeedbackById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const id = String(req.params.id);
      const messId = req.query.messId ? String(req.query.messId) : undefined;
      const feedback = await this.service.getFeedbackById(userId, role, id, messId);
      sendSuccess({ res, data: { feedback } });
    } catch (error) {
      next(error);
    }
  };

  getMyFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const feedbacks = await this.service.getMyFeedback(studentId);
      sendSuccess({ res, data: { feedbacks } });
    } catch (error) {
      next(error);
    }
  };

  listAdminFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as FeedbackQueryParams;
      const feedbacks = await this.service.listAdminFeedback(query);
      sendSuccess({ res, data: { feedbacks } });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as FeedbackAnalyticsQueryParams;
      const analytics = await this.service.getAnalytics(query);
      sendSuccess({ res, data: analytics });
    } catch (error) {
      next(error);
    }
  };

  getOperationalMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const messId = req.query.messId ? String(req.query.messId) : undefined;
      const metrics = await this.service.getOperationalMetrics(messId);
      sendSuccess({ res, data: { metrics } });
    } catch (error) {
      next(error);
    }
  };
}

export const feedbackController = new FeedbackController();
