const { feedbackService } = require('../services/feedback.service');
const { sendSuccess } = require('../utils/apiResponse');

class FeedbackController {
  constructor(service = feedbackService) {
    this.service = service;
  }

  createFeedback = async (req, res, next) => {
    try {
      const studentId = req.user.userId;
      const feedback = await this.service.createFeedback(studentId, req.body);
      sendSuccess({ res, data: { feedback }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  updateFeedback = async (req, res, next) => {
    try {
      const studentId = req.user.userId;
      const id = String(req.params.id);
      const feedback = await this.service.updateFeedback(studentId, id, req.body);
      sendSuccess({ res, data: { feedback } });
    } catch (error) {
      next(error);
    }
  };

  getFeedbackById = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const id = String(req.params.id);
      const messId = req.query.messId ? String(req.query.messId) : undefined;
      const feedback = await this.service.getFeedbackById(userId, role, id, messId);
      sendSuccess({ res, data: { feedback } });
    } catch (error) {
      next(error);
    }
  };

  getMyFeedback = async (req, res, next) => {
    try {
      const studentId = req.user.userId;
      const feedbacks = await this.service.getMyFeedback(studentId);
      sendSuccess({ res, data: { feedbacks } });
    } catch (error) {
      next(error);
    }
  };

  listAdminFeedback = async (req, res, next) => {
    try {
      const query = req.query;
      const feedbacks = await this.service.listAdminFeedback(query);
      sendSuccess({ res, data: { feedbacks } });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req, res, next) => {
    try {
      const query = req.query;
      const analytics = await this.service.getAnalytics(query);
      sendSuccess({ res, data: analytics });
    } catch (error) {
      next(error);
    }
  };

  getOperationalMetrics = async (req, res, next) => {
    try {
      const messId = req.query.messId ? String(req.query.messId) : undefined;
      const metrics = await this.service.getOperationalMetrics(messId);
      sendSuccess({ res, data: { metrics } });
    } catch (error) {
      next(error);
    }
  };

  deleteFeedback = async (req, res, next) => {
    try {
      await this.service.deleteFeedback(req.user.userId, req.user.role, String(req.params.id));
      sendSuccess({ res, data: { message: 'Feedback deleted successfully' } });
    } catch (error) {
      next(error);
    }
  };
}

const feedbackController = new FeedbackController();

module.exports = {
  FeedbackController,
  feedbackController,
};
