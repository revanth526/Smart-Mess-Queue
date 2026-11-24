import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foodLogApi } from '../api/foodLog.js';

export function useFoodLogs(filters) {
  return useQuery({
    queryKey: ['foodLogs', filters],
    queryFn: () => foodLogApi.listFoodLogs(filters),
  });
}

export function useFoodLog(id) {
  return useQuery({
    queryKey: ['foodLog', id],
    queryFn: () => (id ? foodLogApi.getFoodLog(id) : Promise.reject(new Error('ID required'))),
    enabled: Boolean(id),
  });
}

export function useFoodWasteAnalytics(filters) {
  return useQuery({
    queryKey: ['foodWasteAnalytics', filters],
    queryFn: () => foodLogApi.getAnalytics(filters),
  });
}

export function useCreateFoodLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => foodLogApi.createFoodLog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['foodWasteAnalytics'] });
    },
  });
}

export function useUpdateFoodLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => foodLogApi.updateFoodLog(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['foodWasteAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['foodLog'] });
    },
  });
}

