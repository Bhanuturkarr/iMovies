const Notification = require('../models/Notification');

const createNotification = async ({ userId, type, title, message, relatedBookingId = null }) => {
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedBooking: relatedBookingId
    });
  } catch (error) {
    console.error('Failed to create in-app notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
