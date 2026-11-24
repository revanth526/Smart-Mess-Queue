const { timeSlotService } = require('../services/timeSlot.service');
const { sendSuccess } = require('../utils/apiResponse');
const { BadRequestError } = require('../errors');

class TimeSlotController {
  async getTimeSlots(req, res, next) {
    try {
      const menuId = req.query.menuId;
      if (!menuId) {
        throw new BadRequestError('VALIDATION_ERROR', 'menuId query parameter is required');
      }

      const slots = await timeSlotService.getSlotsByMenuId(menuId);
      sendSuccess({ res, data: { timeSlots: slots } });
    } catch (error) {
      next(error);
    }
  }

  async generateTimeSlots(req, res, next) {
    try {
      const { menuId } = req.body;
      const slots = await timeSlotService.generateSlotsForMenu(menuId);
      sendSuccess({ res, data: { timeSlots: slots } });
    } catch (error) {
      next(error);
    }
  }
}

const timeSlotController = new TimeSlotController();

module.exports = {
  TimeSlotController,
  timeSlotController,
};
