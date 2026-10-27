import api from './api';

export const bookingService = {
  async holdSeats(showId, seatNumbers) {
    const res = await api.post(`/shows/${showId}/holds`, { seatNumbers });
    return res.data;
  },

  async releaseHold(showId, holdToken) {
    const res = await api.delete(`/shows/${showId}/holds/${holdToken}`);
    return res.data;
  },

  async initiateBooking(bookingData) {
    const res = await api.post('/bookings', bookingData);
    return res.data;
  },

  async getMyBookings(params = {}) {
    const res = await api.get('/bookings/my', { params });
    return res.data;
  },

  async getBookingById(id) {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },

  async cancelBooking(bookingId, reason = '') {
    const res = await api.post(`/bookings/${bookingId}/cancel`, { reason });
    return res.data;
  }
};
