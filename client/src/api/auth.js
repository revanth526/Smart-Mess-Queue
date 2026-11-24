import api from './axios';

export const authApi = {
  async register(payload) {
    const res = await api.post('/auth/register', payload);
    const { accessToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    return res.data.data;
  },

  async login(payload) {
    const res = await api.post('/auth/login', payload);
    const { accessToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    return res.data.data;
  },

  async refresh() {
    const res = await api.post('/auth/refresh', null, { skipAuth: true });
    const { accessToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    return res.data.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
};
