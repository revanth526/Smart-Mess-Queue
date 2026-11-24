import api from './axios';

export const foodLogApi = {
  async listFoodLogs(params) {
    const res = await api.get('/food-logs', { params });
    return res.data.data.foodLogs;
  },

  async getFoodLog(id) {
    const res = await api.get(`/food-logs/${id}`);
    return res.data.data.foodLog;
  },

  async createFoodLog(payload) {
    const res = await api.post('/food-logs', payload);
    return res.data.data.foodLog;
  },

  async updateFoodLog(id, payload) {
    const res = await api.patch(`/food-logs/${id}`, payload);
    return res.data.data.foodLog;
  },

  async getAnalytics(params) {
    const res = await api.get('/food-logs/analytics', { params });
    return res.data.data;
  },
};
