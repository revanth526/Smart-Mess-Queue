const { timeSlotRepository } = require('../repositories/timeSlot.repository');
const { menuRepository } = require('../repositories/menu.repository');
const { mealConfigRepository } = require('../repositories/mealConfig.repository');
const { NotFoundError, BadRequestError } = require('../errors');

function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

class TimeSlotService {
  async getSlotsByMenuId(menuId) {
    const menu = await menuRepository.findById(menuId);
    if (!menu) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Menu not found');
    }
    return timeSlotRepository.findByMenuId(menuId);
  }

  async generateSlotsForMenu(menuId) {
    const menu = await menuRepository.findById(menuId);
    if (!menu) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Menu not found');
    }

    const mealConfig = await mealConfigRepository.findByMessAndMealType(menu.messId, menu.mealType);

    if (!mealConfig || !mealConfig.isActive) {
      throw new BadRequestError(
        'CONFIG_NOT_FOUND',
        `No active meal configuration found for meal type ${menu.mealType}`,
      );
    }

    const startMin = parseTimeToMinutes(mealConfig.startTime);
    const endMin = parseTimeToMinutes(mealConfig.endTime);
    const duration = mealConfig.slotDurationMinutes;
    const capacity = mealConfig.defaultSlotCapacity;

    if (duration <= 0 || duration > endMin - startMin) {
      throw new BadRequestError(
        'INVALID_SLOT_DURATION',
        'Slot duration is invalid or exceeds meal window',
      );
    }

    const dateStr =
      menu.date instanceof Date
        ? menu.date.toISOString().slice(0, 10)
        : String(menu.date).slice(0, 10);

    const generatedSlots = [];

    let currentMin = startMin;
    while (currentMin + duration <= endMin) {
      const nextMin = currentMin + duration;
      const startH = Math.floor(currentMin / 60);
      const startM = currentMin % 60;
      const endH = Math.floor(nextMin / 60);
      const endM = nextMin % 60;

      const startTime = new Date(
        `${dateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00.000Z`,
      );
      const endTime = new Date(
        `${dateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00.000Z`,
      );

      generatedSlots.push({
        menuId: menu.id,
        startTime,
        endTime,
        capacity,
        currentBookings: 0,
      });

      currentMin = nextMin;
    }

    if (generatedSlots.length === 0) {
      throw new BadRequestError(
        'INVALID_SLOT_DURATION',
        'No slots could be generated within the configured meal window',
      );
    }

    // Check existing slots
    const existingSlots = await timeSlotRepository.findByMenuId(menuId);

    if (existingSlots.length > 0) {
      // Check if existing slots already match generated slots
      const isIdentical =
        existingSlots.length === generatedSlots.length &&
        existingSlots.every(
          (s, i) =>
            s.startTime.getTime() === generatedSlots[i].startTime.getTime() &&
            s.endTime.getTime() === generatedSlots[i].endTime.getTime() &&
            s.capacity === generatedSlots[i].capacity,
        );

      if (isIdentical) {
        return existingSlots;
      }

      // Check for existing bookings before overwriting
      const existingBookings = await timeSlotRepository.countBookingsInSlots(menuId);
      if (existingBookings > 0) {
        throw new BadRequestError(
          'SLOT_GENERATION_CONFLICT',
          'Cannot regenerate time slots because active bookings already exist for this menu',
        );
      }

      // No bookings exist — safe to delete previous slots and create new ones
      await timeSlotRepository.deleteByMenuId(menuId);
    }

    await timeSlotRepository.createMany(generatedSlots);
    return timeSlotRepository.findByMenuId(menuId);
  }
}

const timeSlotService = new TimeSlotService();

module.exports = {
  TimeSlotService,
  timeSlotService,
};
