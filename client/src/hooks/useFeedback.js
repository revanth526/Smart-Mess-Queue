import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../api/feedback.js';

export function useMyFeedback() {
  return useQuery({
    queryKey: ['myFeedback'],
    queryFn: () => feedbackApi.getMyFeedback(),
  });
}

export function useAdminFeedback(filters) {
  return useQuery({
    queryKey: ['adminFeedback', filters],
    queryFn: () => feedbackApi.getAdminFeedback(filters),
  });
}

export function useFeedbackAnalytics(filters) {
  return useQuery({
    queryKey: ['feedbackAnalytics', filters],
    queryFn: () => feedbackApi.getAnalytics(filters),
  });
}

export function useOperationalMetrics(messId) {
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
    mutationFn: (payload) => feedbackApi.submitFeedback(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
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
    mutationFn: ({ id, payload }) => feedbackApi.updateFeedback(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['studentBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedbackAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['operationalMetrics'] });
    },
  });
}

