import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  foodLogApi,
  CreateFoodLogPayload,
  UpdateFoodLogPayload,
  FoodLogFilters,
} from '../api/foodLog';

export function useFoodLogs(filters?: FoodLogFilters) {
  return useQuery({
    queryKey: ['foodLogs', filters],
    queryFn: () => foodLogApi.listFoodLogs(filters),
  });
}

export function useFoodLog(id?: string) {
  return useQuery({
    queryKey: ['foodLog', id],
    queryFn: () => (id ? foodLogApi.getFoodLog(id) : Promise.reject(new Error('ID required'))),
    enabled: Boolean(id),
  });
}

export function useFoodWasteAnalytics(filters?: FoodLogFilters) {
  return useQuery({
    queryKey: ['foodWasteAnalytics', filters],
    queryFn: () => foodLogApi.getAnalytics(filters),
  });
}

export function useCreateFoodLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFoodLogPayload) => foodLogApi.createFoodLog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['foodWasteAnalytics'] });
    },
  });
}

export function useUpdateFoodLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFoodLogPayload }) =>
      foodLogApi.updateFoodLog(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['foodWasteAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['foodLog'] });
    },
  });
}
