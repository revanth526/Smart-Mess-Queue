import prisma from '../lib/prisma';
import { MealConfig, MealType } from '@prisma/client';

export class MealConfigRepository {
  async findByMessId(messId: string): Promise<MealConfig[]> {
    return prisma.mealConfig.findMany({
      where: { messId },
      orderBy: { mealType: 'asc' },
    });
  }

  async findById(id: string): Promise<MealConfig | null> {
    return prisma.mealConfig.findUnique({
      where: { id },
    });
  }

  async findByMessAndMealType(messId: string, mealType: MealType): Promise<MealConfig | null> {
    return prisma.mealConfig.findUnique({
      where: {
        messId_mealType: { messId, mealType },
      },
    });
  }

  async create(data: {
    messId: string;
    mealType: MealType;
    startTime: string;
    endTime: string;
    slotDurationMinutes?: number;
    bookingCutoffMinutes?: number;
    cancellationCutoffMinutes?: number;
    defaultSlotCapacity?: number;
    averageServingTimeSeconds?: number;
    isActive?: boolean;
  }): Promise<MealConfig> {
    return prisma.mealConfig.create({
      data,
    });
  }

  async update(
    id: string,
    data: Partial<{
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
      bookingCutoffMinutes: number;
      cancellationCutoffMinutes: number;
      defaultSlotCapacity: number;
      averageServingTimeSeconds: number;
      isActive: boolean;
    }>,
  ): Promise<MealConfig> {
    return prisma.mealConfig.update({
      where: { id },
      data,
    });
  }
}

export const mealConfigRepository = new MealConfigRepository();
