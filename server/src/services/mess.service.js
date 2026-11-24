const { messRepository } = require('../repositories/mess.repository');
const { mealConfigRepository } = require('../repositories/mealConfig.repository');
const { NotFoundError, BadRequestError } = require('../errors');
const { MealType } = require('@prisma/client');

class MessService {
  async getOrCreateDefaultMess() {
    let mess = await messRepository.findFirst();
    if (!mess) {
      mess = await messRepository.create({
        name: 'Central Dining Hall',
        location: 'Campus Center',
        totalCapacity: 500,
        isActive: true,
      });

      // Initialize default meal configs
      const defaults = [
        {
          mealType: MealType.BREAKFAST,
          startTime: '07:30',
          endTime: '09:30',
          slotDurationMinutes: 20,
          bookingCutoffMinutes: 30,
          cancellationCutoffMinutes: 30,
          defaultSlotCapacity: 50,
          averageServingTimeSeconds: 30,
        },
        {
          mealType: MealType.LUNCH,
          startTime: '11:30',
          endTime: '15:00',
          slotDurationMinutes: 20,
          bookingCutoffMinutes: 30,
          cancellationCutoffMinutes: 30,
          defaultSlotCapacity: 50,
          averageServingTimeSeconds: 30,
        },
        {
          mealType: MealType.DINNER,
          startTime: '19:30',
          endTime: '21:30',
          slotDurationMinutes: 20,
          bookingCutoffMinutes: 30,
          cancellationCutoffMinutes: 30,
          defaultSlotCapacity: 50,
          averageServingTimeSeconds: 30,
        },
      ];

      for (const d of defaults) {
        await mealConfigRepository.create({
          messId: mess.id,
          ...d,
        });
      }
    }
    return mess;
  }

  async getMess(messId) {
    if (messId) {
      const mess = await messRepository.findById(messId);
      if (!mess) {
        throw new NotFoundError('MESS_NOT_FOUND', 'Mess not found');
      }
      return mess;
    }

    return this.getOrCreateDefaultMess();
  }

  async updateMess(messId, data) {
    const mess = await this.getMess(messId);

    if (data.totalCapacity !== undefined && data.totalCapacity <= 0) {
      throw new BadRequestError('INVALID_CAPACITY', 'Total capacity must be greater than 0');
    }

    return messRepository.update(mess.id, data);
  }

  async getMessConfig(messId) {
    const mess = await this.getMess(messId);
    let mealConfigs = await mealConfigRepository.findByMessId(mess.id);

    if (mealConfigs.length === 0) {
      await this.getOrCreateDefaultMess();
      mealConfigs = await mealConfigRepository.findByMessId(mess.id);
    }

    return {
      mess,
      mealConfigs,
    };
  }
}

const messService = new MessService();

module.exports = {
  MessService,
  messService,
};
