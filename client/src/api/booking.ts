import api from './axios';
import type { Booking, Menu, ApiResponse, MealType, BookingStatus } from '@shared/types';

export interface CreateBookingPayload {
  menuId: string;
  slotId: string;
}

export const bookingApi = {
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const res = await api.post<ApiResponse<{ booking: Booking }>>('/bookings', payload);
    return res.data.data!.booking;
  },

  async listMyBookings(params?: {
    date?: string;
    mealType?: MealType;
    status?: BookingStatus;
  }): Promise<Booking[]> {
    const res = await api.get<ApiResponse<{ bookings: Booking[] }>>('/bookings', { params });
    return res.data.data!.bookings;
  },

  async getBooking(id: string): Promise<Booking> {
    const res = await api.get<ApiResponse<{ booking: Booking }>>(`/bookings/${id}`);
    return res.data.data!.booking;
  },

  async cancelBooking(id: string): Promise<Booking> {
    const res = await api.patch<ApiResponse<{ booking: Booking }>>(`/bookings/${id}/cancel`);
    return res.data.data!.booking;
  },

  async listAvailableMenus(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    mealType?: MealType;
  }): Promise<Menu[]> {
    const res = await api.get<ApiResponse<{ menus: Menu[] }>>('/menus', { params });
    return res.data.data!.menus;
  },
};
