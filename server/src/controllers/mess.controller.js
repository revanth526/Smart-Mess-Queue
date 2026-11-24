const { messService } = require('../services/mess.service');
const { sendSuccess } = require('../utils/apiResponse');

class MessController {
  async getMess(req, res, next) {
    try {
      const messId = req.query.messId;
      const mess = await messService.getMess(messId);
      sendSuccess({ res, data: { mess } });
    } catch (error) {
      next(error);
    }
  }

  async updateMess(req, res, next) {
    try {
      const messId = req.params.id || req.query.messId;
      const updated = await messService.updateMess(messId, req.body);
      sendSuccess({ res, data: { mess: updated } });
    } catch (error) {
      next(error);
    }
  }

  async getMessConfig(req, res, next) {
    try {
      const messId = req.query.messId;
      const config = await messService.getMessConfig(messId);
      sendSuccess({ res, data: config });
    } catch (error) {
      next(error);
    }
  }
}

const messController = new MessController();

module.exports = {
  MessController,
  messController,
};
