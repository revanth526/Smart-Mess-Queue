const { queueService } = require('../services/queue.service');
const { sendSuccess } = require('../utils/apiResponse');
const { BadRequestError } = require('../errors');

class QueueController {
  constructor(service = queueService) {
    this.service = service;
  }

  checkIn = async (req, res, next) => {
    try {
      const studentId = req.user?.userId || req.body?.studentId || req.params?.studentId;
      const bookingId =
        req.params?.id ||
        req.params?.bookingId ||
        req.body?.bookingId ||
        req.body?.id;

      if (!bookingId) {
        throw new BadRequestError('INVALID_BOOKING_ID', 'Booking ID is required for check-in');
      }

      const entry = await this.service.checkIn(studentId, String(bookingId));
      sendSuccess({ res, data: { entry, message: 'Checked in successfully' }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  createWalkIn = async (req, res, next) => {
    try {
      const adminUserId = req.user.userId;
      const entry = await this.service.createWalkIn(adminUserId, req.body);
      sendSuccess({ res, data: { entry }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  markWaiting = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const id = String(req.params.id);
      const entry = await this.service.markWaiting(userId, userRole, id);
      sendSuccess({ res, data: { entry } });
    } catch (error) {
      next(error);
    }
  };

  startServing = async (req, res, next) => {
    try {
      const adminUserId = req.user.userId;
      const id = String(req.params.id);
      const entry = await this.service.startServing(adminUserId, id);
      sendSuccess({ res, data: { entry } });
    } catch (error) {
      next(error);
    }
  };

  completeServing = async (req, res, next) => {
    try {
      const adminUserId = req.user.userId;
      const id = String(req.params.id);
      const entry = await this.service.completeServing(adminUserId, id);
      sendSuccess({ res, data: { entry } });
    } catch (error) {
      next(error);
    }
  };

  markNoShow = async (req, res, next) => {
    try {
      const adminUserId = req.user.userId;
      const id = String(req.params.id);
      const entry = await this.service.markNoShow(adminUserId, id);
      sendSuccess({ res, data: { entry } });
    } catch (error) {
      next(error);
    }
  };

  getLiveQueue = async (req, res, next) => {
    try {
      const menuId = String(req.query.menuId);
      const slotId = req.query.slotId ? String(req.query.slotId) : undefined;
      const liveQueue = await this.service.getLiveQueue(menuId, slotId);
      sendSuccess({ res, data: liveQueue });
    } catch (error) {
      next(error);
    }
  };

  getMyQueue = async (req, res, next) => {
    try {
      const studentId = req.user.userId;
      const menuId = req.query.menuId ? String(req.query.menuId) : undefined;
      const myQueue = await this.service.getMyQueueStatus(studentId, menuId);
      sendSuccess({ res, data: myQueue });
    } catch (error) {
      next(error);
    }
  };
}

const queueController = new QueueController();

module.exports = {
  QueueController,
  queueController,
};
