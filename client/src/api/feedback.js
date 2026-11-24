import api from './axios';

export const feedbackApi = {
  async submitFeedback(payload) {
    const res = await api.post('/feedback', payload);
    return res.data.data.feedback;
  },

  async updateFeedback(id, payload) {
    const res = await api.patch(`/feedback/${id}`, payload);
    return res.data.data.feedback;
  },

  async getMyFeedback() {
    const res = await api.get('/feedback/my');
    return res.data.data.feedbacks;
  },

  async getFeedbackById(id) {
    const res = await api.get(`/feedback/${id}`);
    return res.data.data.feedback;
  },

  async getAdminFeedback(params) {
    const res = await api.get('/feedback', { params });
    return res.data.data.feedbacks;
  },

  async getAnalytics(params) {
    const res = await api.get('/feedback/analytics', { params });
    return res.data.data;
  },

  async getOperationalMetrics(messId) {
    const res = await api.get('/feedback/operational-metrics', {
      params: messId ? { messId } : undefined,
    });
    return res.data.data.metrics;
  },
};
