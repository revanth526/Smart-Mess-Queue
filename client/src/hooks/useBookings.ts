import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi, CreateBookingPayload } from '../api/booking';
import { MealType, BookingStatus } from '@shared/types';

export function useAvailableMenus(params?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  mealType?: MealType;
}) {
  return useQuery({
    queryKey: ['availableMenus', params],
    queryFn: () => bookingApi.listAvailableMenus(params),
  });
}

export function useMyBookings(params?: {
  date?: string;
  mealType?: MealType;
  status?: BookingStatus;
}) {
  return useQuery({
    queryKey: ['myBookings', params],
    queryFn: () => bookingApi.listMyBookings(params),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingApi.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availableMenus'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availableMenus'] });
    },
  });
}
