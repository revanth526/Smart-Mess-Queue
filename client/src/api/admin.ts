import api from './axios';
import type {
  Mess,
  MealConfig,
  MessConfigResponse,
  MenuItem,
  Menu,
  MenuDish,
  TimeSlot,
  ApiResponse,
  MealType,
} from '@shared/types';

export interface UpdateMessPayload {
  name?: string;
  location?: string | null;
  totalCapacity?: number;
  isActive?: boolean;
}

export interface UpdateMealConfigPayload {
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  bookingCutoffMinutes?: number;
  cancellationCutoffMinutes?: number;
  defaultSlotCapacity?: number;
  averageServingTimeSeconds?: number;
  isActive?: boolean;
}

export interface CreateMenuItemPayload {
  name: string;
  category?: string | null;
  defaultServingGrams?: number | null;
  isAvailable?: boolean;
}

export interface UpdateMenuItemPayload {
  name?: string;
  category?: string | null;
  defaultServingGrams?: number | null;
  isAvailable?: boolean;
}

export interface CreateMenuPayload {
  date: string;
  mealType: MealType;
  dishes?: Array<{
    menuItemId?: string | null;
    dishName: string;
    dishCategory?: string | null;
    servingGrams?: number | null;
    sortOrder?: number;
  }>;
}

export interface AddDishPayload {
  menuItemId?: string | null;
  dishName: string;
  dishCategory?: string | null;
  servingGrams?: number | null;
  sortOrder?: number;
}

export const adminApi = {
  // Mess & Meal Config
  async getMess(): Promise<Mess> {
    const res = await api.get<ApiResponse<{ mess: Mess }>>('/mess');
    return res.data.data!.mess;
  },

  async updateMess(payload: UpdateMessPayload): Promise<Mess> {
    const res = await api.patch<ApiResponse<{ mess: Mess }>>('/mess', payload);
    return res.data.data!.mess;
  },

  async getMessConfig(): Promise<MessConfigResponse> {
    const res = await api.get<ApiResponse<MessConfigResponse>>('/mess/config');
    return res.data.data!;
  },

  async updateMealConfig(id: string, payload: UpdateMealConfigPayload): Promise<MealConfig> {
    const res = await api.patch<ApiResponse<{ mealConfig: MealConfig }>>(
      `/meal-configs/${id}`,
      payload,
    );
    return res.data.data!.mealConfig;
  },

  // Menu Items Catalog
  async listMenuItems(params?: {
    isAvailable?: boolean;
    category?: string;
    search?: string;
  }): Promise<MenuItem[]> {
    const res = await api.get<ApiResponse<{ menuItems: MenuItem[] }>>('/menu-items', { params });
    return res.data.data!.menuItems;
  },

  async createMenuItem(payload: CreateMenuItemPayload): Promise<MenuItem> {
    const res = await api.post<ApiResponse<{ menuItem: MenuItem }>>('/menu-items', payload);
    return res.data.data!.menuItem;
  },

  async updateMenuItem(id: string, payload: UpdateMenuItemPayload): Promise<MenuItem> {
    const res = await api.patch<ApiResponse<{ menuItem: MenuItem }>>(`/menu-items/${id}`, payload);
    return res.data.data!.menuItem;
  },

  async updateMenuItemStatus(id: string, isAvailable: boolean): Promise<MenuItem> {
    const res = await api.patch<ApiResponse<{ menuItem: MenuItem }>>(`/menu-items/${id}/status`, {
      isAvailable,
    });
    return res.data.data!.menuItem;
  },

  async deleteMenuItem(id: string): Promise<void> {
    await api.delete<ApiResponse<{ message: string }>>(`/menu-items/${id}`);
  },

  // Daily Menus
  async listMenus(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    mealType?: MealType;
  }): Promise<Menu[]> {
    const res = await api.get<ApiResponse<{ menus: Menu[] }>>('/menus', { params });
    return res.data.data!.menus;
  },

  async getMenu(id: string): Promise<Menu> {
    const res = await api.get<ApiResponse<{ menu: Menu }>>(`/menus/${id}`);
    return res.data.data!.menu;
  },

  async createMenu(payload: CreateMenuPayload): Promise<Menu> {
    const res = await api.post<ApiResponse<{ menu: Menu }>>('/menus', payload);
    return res.data.data!.menu;
  },

  async deleteMenu(id: string): Promise<void> {
    await api.delete<ApiResponse<{ message: string }>>(`/menus/${id}`);
  },

  async addDish(menuId: string, payload: AddDishPayload): Promise<MenuDish> {
    const res = await api.post<ApiResponse<{ dish: MenuDish }>>(`/menus/${menuId}/dishes`, payload);
    return res.data.data!.dish;
  },

  async removeDish(menuId: string, dishId: string): Promise<void> {
    await api.delete<ApiResponse<{ message: string }>>(`/menus/${menuId}/dishes/${dishId}`);
  },

  // Time Slots
  async getTimeSlots(menuId: string): Promise<TimeSlot[]> {
    const res = await api.get<ApiResponse<{ timeSlots: TimeSlot[] }>>('/time-slots', {
      params: { menuId },
    });
    return res.data.data!.timeSlots;
  },

  async generateTimeSlots(menuId: string): Promise<TimeSlot[]> {
    const res = await api.post<ApiResponse<{ timeSlots: TimeSlot[] }>>('/time-slots/generate', {
      menuId,
    });
    return res.data.data!.timeSlots;
  },
};
