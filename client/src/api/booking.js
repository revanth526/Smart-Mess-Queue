import api from './axios';

export const bookingApi = {
  async createBooking(payload) {
    const res = await api.post('/bookings', payload);
    return res.data.data.booking;
  },

  async listMyBookings(params) {
    const res = await api.get('/bookings', { params });
    return res.data.data.bookings;
  },

  async getBooking(id) {
    const res = await api.get(`/bookings/${id}`);
    return res.data.data.booking;
  },

  async cancelBooking(id) {
    const res = await api.patch(`/bookings/${id}/cancel`);
    return res.data.data.booking;
  },

  async listAvailableMenus(params) {
    const res = await api.get('/menus', { params });
    return res.data.data.menus;
  },
};
