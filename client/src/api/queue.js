import api from './axios';

export const queueApi = {
  checkIn: async (bookingId) => {
    const res = await api.post('/queue/check-in', {
      bookingId,
    });
    return res.data.data.entry;
  },

  createWalkIn: async (input) => {
    const res = await api.post('/queue/walk-in', input);
    return res.data.data.entry;
  },

  markWaiting: async (id) => {
    const res = await api.post(`/queue/${id}/mark-waiting`);
    return res.data.data.entry;
  },

  startServing: async (id) => {
    const res = await api.post(`/queue/${id}/start-serving`);
    return res.data.data.entry;
  },

  completeServing: async (id) => {
    const res = await api.post(`/queue/${id}/complete`);
    return res.data.data.entry;
  },

  markNoShow: async (id) => {
    const res = await api.post(`/queue/${id}/no-show`);
    return res.data.data.entry;
  },

  getLiveQueue: async (menuId, slotId) => {
    const res = await api.get('/queue/current', {
      params: { menuId, slotId },
    });
    return res.data.data;
  },

  getMyQueue: async (menuId) => {
    const res = await api.get('/queue/my', {
      params: { menuId },
    });
    return res.data.data;
  },
};
