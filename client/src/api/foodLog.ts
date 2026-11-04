import api from './axios';
import type { FoodLog, FoodWasteAnalytics, ApiResponse, MealType } from '@shared/types';

export interface CreateFoodLogPayload {
  messId: string;
  date: string;
  mealType: MealType;
  menuId?: string | null;
  preparedKg: number;
  servedKg: number;
  wastedKg: number;
  notes?: string | null;
}

export interface UpdateFoodLogPayload {
  preparedKg?: number;
  servedKg?: number;
  wastedKg?: number;
  notes?: string | null;
}

export interface FoodLogFilters {
  messId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  mealType?: MealType;
}

export const foodLogApi = {
  async listFoodLogs(params?: FoodLogFilters): Promise<FoodLog[]> {
    const res = await api.get<ApiResponse<{ foodLogs: FoodLog[] }>>('/food-logs', { params });
    return res.data.data!.foodLogs;
  },

  async getFoodLog(id: string): Promise<FoodLog> {
    const res = await api.get<ApiResponse<{ foodLog: FoodLog }>>(`/food-logs/${id}`);
    return res.data.data!.foodLog;
  },

  async createFoodLog(payload: CreateFoodLogPayload): Promise<FoodLog> {
    const res = await api.post<ApiResponse<{ foodLog: FoodLog }>>('/food-logs', payload);
    return res.data.data!.foodLog;
  },

  async updateFoodLog(id: string, payload: UpdateFoodLogPayload): Promise<FoodLog> {
    const res = await api.patch<ApiResponse<{ foodLog: FoodLog }>>(`/food-logs/${id}`, payload);
    return res.data.data!.foodLog;
  },

  async getAnalytics(params?: FoodLogFilters): Promise<FoodWasteAnalytics> {
    const res = await api.get<ApiResponse<FoodWasteAnalytics>>('/food-logs/analytics', { params });
    return res.data.data!;
  },
};
