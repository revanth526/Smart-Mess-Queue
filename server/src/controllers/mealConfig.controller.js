const { mealConfigService } = require('../services/mealConfig.service');
const { sendSuccess } = require('../utils/apiResponse');

class MealConfigController {
  async getMealConfigs(req, res, next) {
    try {
      const messId = req.query.messId;
      const configs = await mealConfigService.getConfigsByMess(messId);
      sendSuccess({ res, data: { mealConfigs: configs } });
    } catch (error) {
      next(error);
    }
  }

  async getMealConfigById(req, res, next) {
    try {
      const id = String(req.params.id || req.params.mealConfigId);
      const config = await mealConfigService.getConfigById(id);
      sendSuccess({ res, data: { mealConfig: config } });
    } catch (error) {
      next(error);
    }
  }

  async updateMealConfig(req, res, next) {
    try {
      const id = String(req.params.id || req.params.mealConfigId);
      const updated = await mealConfigService.updateConfig(id, req.body);
      sendSuccess({ res, data: { mealConfig: updated } });
    } catch (error) {
      next(error);
    }
  }
}

const mealConfigController = new MealConfigController();

module.exports = {
  MealConfigController,
  mealConfigController,
};
