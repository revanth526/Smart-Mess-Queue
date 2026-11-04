import { MealType } from '../types';

export const DEFAULT_MEAL_TIMINGS: Record<MealType, { start: string; end: string }> = {
  [MealType.BREAKFAST]: { start: '07:30', end: '09:30' },
  [MealType.LUNCH]: { start: '11:30', end: '15:00' },
  [MealType.DINNER]: { start: '19:30', end: '21:30' },
};

export const DEFAULT_SLOT_DURATION_MINUTES = 20;
export const DEFAULT_SLOT_CAPACITY = 50;
export const DEFAULT_BOOKING_CUTOFF_MINUTES = 30;
export const DEFAULT_CANCELLATION_CUTOFF_MINUTES = 30;
export const DEFAULT_AVG_SERVING_TIME_SECONDS = 30;
