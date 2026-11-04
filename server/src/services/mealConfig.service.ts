import { mealConfigRepository } from '../repositories/mealConfig.repository';
import { messService } from './mess.service';
import { NotFoundError, BadRequestError } from '../errors';
import { UpdateMealConfigInput } from '../validators/mealConfig.validators';
import { MealConfig, MealType } from '@prisma/client';
import prisma from '../lib/prisma';

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export class MealConfigService {
  async getConfigsByMess(messId?: string): Promise<MealConfig[]> {
    const mess = await messService.getMess(messId);
    let configs = await mealConfigRepository.findByMessId(mess.id);

    if (configs.length === 0) {
      await messService.getOrCreateDefaultMess();
      configs = await mealConfigRepository.findByMessId(mess.id);
    }

    return configs;
  }

  async getConfigById(id: string): Promise<MealConfig> {
    const config = await mealConfigRepository.findById(id);
    if (!config) {
      throw new NotFoundError('CONFIG_NOT_FOUND', 'Meal configuration not found');
    }
    return config;
  }

  async getConfigByMessAndMealType(messId: string, mealType: MealType): Promise<MealConfig> {
    let config = await mealConfigRepository.findByMessAndMealType(messId, mealType);
    if (!config) {
      await messService.getOrCreateDefaultMess();
      config = await mealConfigRepository.findByMessAndMealType(messId, mealType);
    }
    if (!config) {
      throw new NotFoundError(
        'CONFIG_NOT_FOUND',
        `Configuration not found for meal type ${mealType}`,
      );
    }
    return config;
  }

  async updateConfig(id: string, data: UpdateMealConfigInput): Promise<MealConfig> {
    const existing = await this.getConfigById(id);

    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;
    const slotDuration = data.slotDurationMinutes ?? existing.slotDurationMinutes;
    const capacity = data.defaultSlotCapacity ?? existing.defaultSlotCapacity;

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);

    // 1. Validate start time < end time
    if (startMinutes >= endMinutes) {
      throw new BadRequestError('INVALID_TIME_RANGE', 'Meal start time must be before end time');
    }

    // 2. Validate slot duration fits in meal window
    if (slotDuration <= 0) {
      throw new BadRequestError('INVALID_SLOT_DURATION', 'Slot duration must be greater than 0');
    }

    const windowMinutes = endMinutes - startMinutes;
    if (slotDuration > windowMinutes) {
      throw new BadRequestError(
        'INVALID_SLOT_DURATION',
        'Slot duration cannot be longer than the total meal window',
      );
    }

    // 3. Validate capacity
    if (capacity <= 0) {
      throw new BadRequestError('INVALID_CAPACITY', 'Slot capacity must be greater than 0');
    }

    // 4. Overlap check across other active meal configs for the same mess
    const willBeActive = data.isActive !== undefined ? data.isActive : existing.isActive;
    if (willBeActive) {
      const allConfigs = await mealConfigRepository.findByMessId(existing.messId);
      for (const other of allConfigs) {
        if (other.id === existing.id || !other.isActive) continue;

        const otherStart = toMinutes(other.startTime);
        const otherEnd = toMinutes(other.endTime);

        // Check if [startMinutes, endMinutes] overlaps with [otherStart, otherEnd]
        if (Math.max(startMinutes, otherStart) < Math.min(endMinutes, otherEnd)) {
          throw new BadRequestError(
            'OVERLAPPING_CONFIG',
            `Meal timing ${startTime}-${endTime} overlaps with ${other.mealType} (${other.startTime}-${other.endTime})`,
          );
        }
      }
    }

    // 5. Check if timing/slot duration changes conflict with existing future bookings
    const isTimingOrSlotChanged =
      startTime !== existing.startTime ||
      endTime !== existing.endTime ||
      slotDuration !== existing.slotDurationMinutes;

    if (isTimingOrSlotChanged) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const menusWithBookings = await prisma.menu.findMany({
        where: {
          messId: existing.messId,
          mealType: existing.mealType,
          date: { gte: today },
          bookings: { some: {} },
        },
        select: { id: true, date: true },
      });

      if (menusWithBookings.length > 0) {
        throw new BadRequestError(
          'SLOT_GENERATION_CONFLICT',
          'Cannot modify meal timing configuration because upcoming menus have active bookings',
        );
      }
    }

    return mealConfigRepository.update(id, data);
  }
}

export const mealConfigService = new MealConfigService();
