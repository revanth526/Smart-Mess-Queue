const { foodLogService } = require('../services/foodLog.service');
const { sendSuccess } = require('../utils/apiResponse');

class FoodLogController {
  constructor(service = foodLogService) {
    this.service = service;
  }

  createFoodLog = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const foodLog = await this.service.createFoodLog(userId, req.body);
      sendSuccess({ res, data: { foodLog }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  updateFoodLog = async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const foodLog = await this.service.updateFoodLog(id, req.body);
      sendSuccess({ res, data: { foodLog } });
    } catch (error) {
      next(error);
    }
  };

  deleteFoodLog = async (req, res, next) => {
    try {
      const id = String(req.params.id);
      await this.service.deleteFoodLog(id);
      sendSuccess({ res, data: { message: 'Food log record deleted successfully' } });
    } catch (error) {
      next(error);
    }
  };

  getFoodLogById = async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const foodLog = await this.service.getFoodLogById(id);
      sendSuccess({ res, data: { foodLog } });
    } catch (error) {
      next(error);
    }
  };

  listFoodLogs = async (req, res, next) => {
    try {
      const query = req.query;
      const foodLogs = await this.service.listFoodLogs(query);
      sendSuccess({ res, data: { foodLogs } });
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
}

const foodLogController = new FoodLogController();

module.exports = {
  FoodLogController,
  foodLogController,
};
