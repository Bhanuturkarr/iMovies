import api from './api';

export const adminService = {
  async getStats() {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  async getAllBookings(params = {}) {
    const res = await api.get('/admin/bookings', { params });
    return res.data;
  },

  async getAllUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  async updateUserStatus(userId, status) {
    const res = await api.patch(`/admin/users/${userId}/status`, { status });
    return res.data;
  }
};
