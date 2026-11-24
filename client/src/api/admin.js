import api from './axios';

export const adminApi = {
  // Mess & Meal Config
  async getMess() {
    const res = await api.get('/mess');
    return res.data.data.mess;
  },

  async updateMess(payload) {
    const res = await api.patch('/mess', payload);
    return res.data.data.mess;
  },

  async getMessConfig() {
    const res = await api.get('/mess/config');
    return res.data.data;
  },

  async updateMealConfig(id, payload) {
    const res = await api.patch(`/meal-configs/${id}`, payload);
    return res.data.data.mealConfig;
  },

  // Menu Items Catalog
  async listMenuItems(params) {
    const res = await api.get('/menu-items', { params });
    return res.data.data.menuItems;
  },

  async createMenuItem(payload) {
    const res = await api.post('/menu-items', payload);
    return res.data.data.menuItem;
  },

  async updateMenuItem(id, payload) {
    const res = await api.patch(`/menu-items/${id}`, payload);
    return res.data.data.menuItem;
  },

  async updateMenuItemStatus(id, isAvailable) {
    const res = await api.patch(`/menu-items/${id}/status`, { isAvailable });
    return res.data.data.menuItem;
  },

  async deleteMenuItem(id) {
    await api.delete(`/menu-items/${id}`);
  },

  // Daily Menus
  async listMenus(params) {
    const res = await api.get('/menus', { params });
    return res.data.data.menus;
  },

  async getMenu(id) {
    const res = await api.get(`/menus/${id}`);
    return res.data.data.menu;
  },

  async createMenu(payload) {
    const res = await api.post('/menus', payload);
    return res.data.data.menu;
  },

  async deleteMenu(id) {
    await api.delete(`/menus/${id}`);
  },

  async addDish(menuId, payload) {
    const res = await api.post(`/menus/${menuId}/dishes`, payload);
    return res.data.data.dish;
  },

  async removeDish(menuId, dishId) {
    await api.delete(`/menus/${menuId}/dishes/${dishId}`);
  },

  // Time Slots
  async getTimeSlots(menuId) {
    const res = await api.get('/time-slots', { params: { menuId } });
    return res.data.data.timeSlots;
  },

  async generateTimeSlots(menuId) {
    const res = await api.post('/time-slots/generate', { menuId });
    return res.data.data.timeSlots;
  },
};
