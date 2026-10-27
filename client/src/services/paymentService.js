import api from './api';

export const paymentService = {
  async createPaymentOrder(bookingId) {
    const res = await api.post('/payments/order', { bookingId });
    return res.data;
  },

  async verifyPayment(verificationData) {
    const res = await api.post('/payments/verify', verificationData);
    return res.data;
  }
};
