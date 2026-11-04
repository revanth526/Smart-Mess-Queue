import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  feedbackApi,
  CreateFeedbackPayload,
  UpdateFeedbackPayload,
  FeedbackFilters,
} from '../api/feedback';

export function useMyFeedback() {
  return useQuery({
    queryKey: ['myFeedback'],
    queryFn: () => feedbackApi.getMyFeedback(),
  });
}

export function useAdminFeedback(filters?: FeedbackFilters) {
  return useQuery({
    queryKey: ['adminFeedback', filters],
    queryFn: () => feedbackApi.getAdminFeedback(filters),
  });
}

export function useFeedbackAnalytics(filters?: FeedbackFilters) {
  return useQuery({
    queryKey: ['feedbackAnalytics', filters],
    queryFn: () => feedbackApi.getAnalytics(filters),
  });
}

export function useOperationalMetrics(messId?: string) {
  return useQuery({
    queryKey: ['operationalMetrics', messId],
    queryFn: () => feedbackApi.getOperationalMetrics(messId),
    refetchInterval: 30000, // Refresh every 30s for live overview
    retry: false,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => feedbackApi.submitFeedback(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['studentBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedbackAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['operationalMetrics'] });
    },
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFeedbackPayload }) =>
      feedbackApi.updateFeedback(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['studentBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedbackAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['operationalMetrics'] });
    },
  });
}
