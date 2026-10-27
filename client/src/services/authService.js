import api from './api';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.patch('/auth/profile', data);
    return res.data;
  },

  async updatePassword(currentPassword, newPassword) {
    const res = await api.patch('/auth/password', { currentPassword, newPassword });
    return res.data;
  }
};
