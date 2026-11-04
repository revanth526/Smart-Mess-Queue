import api from './axios';
import type {
  Feedback,
  FeedbackAnalytics,
  OperationalDashboardMetrics,
  ApiResponse,
  MealType,
} from '@shared/types';

export interface CreateFeedbackPayload {
  bookingId: string;
  rating: number;
  comment?: string | null;
}

export interface UpdateFeedbackPayload {
  rating?: number;
  comment?: string | null;
}

export interface FeedbackFilters {
  messId?: string;
  mealType?: MealType;
  rating?: number;
  startDate?: string;
  endDate?: string;
}

export const feedbackApi = {
  async submitFeedback(payload: CreateFeedbackPayload): Promise<Feedback> {
    const res = await api.post<ApiResponse<{ feedback: Feedback }>>('/feedback', payload);
    return res.data.data!.feedback;
  },

  async updateFeedback(id: string, payload: UpdateFeedbackPayload): Promise<Feedback> {
    const res = await api.patch<ApiResponse<{ feedback: Feedback }>>(`/feedback/${id}`, payload);
    return res.data.data!.feedback;
  },

  async getMyFeedback(): Promise<Feedback[]> {
    const res = await api.get<ApiResponse<{ feedbacks: Feedback[] }>>('/feedback/my');
    return res.data.data!.feedbacks;
  },

  async getFeedbackById(id: string): Promise<Feedback> {
    const res = await api.get<ApiResponse<{ feedback: Feedback }>>(`/feedback/${id}`);
    return res.data.data!.feedback;
  },

  async getAdminFeedback(params?: FeedbackFilters): Promise<Feedback[]> {
    const res = await api.get<ApiResponse<{ feedbacks: Feedback[] }>>('/feedback', { params });
    return res.data.data!.feedbacks;
  },

  async getAnalytics(params?: FeedbackFilters): Promise<FeedbackAnalytics> {
    const res = await api.get<ApiResponse<FeedbackAnalytics>>('/feedback/analytics', { params });
    return res.data.data!;
  },

  async getOperationalMetrics(messId?: string): Promise<OperationalDashboardMetrics> {
    const res = await api.get<ApiResponse<{ metrics: OperationalDashboardMetrics }>>(
      '/feedback/operational-metrics',
      { params: messId ? { messId } : undefined },
    );
    return res.data.data!.metrics;
  },
};
