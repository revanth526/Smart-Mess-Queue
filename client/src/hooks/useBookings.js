import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/booking.js';

export function useAvailableMenus(params) {
  return useQuery({
    queryKey: ['availableMenus', params],
    queryFn: () => bookingApi.listAvailableMenus(params),
  });
}

export function useMyBookings(params) {
  return useQuery({
    queryKey: ['myBookings', params],
    queryFn: () => bookingApi.listMyBookings(params),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => bookingApi.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availableMenus'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => bookingApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availableMenus'] });
    },
  });
}

