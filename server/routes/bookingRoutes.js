const express = require('express');
const router = express.Router();
const {
  holdSeats,
  releaseHold,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelMyBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// Support both /bookings/shows/:id/holds and standalone /holds/:token
router.post('/shows/:id/holds', protect, holdSeats);
router.delete('/holds/:token', protect, releaseHold);
router.delete('/shows/:id/holds/:token', protect, releaseHold);

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.post('/:id/cancel', protect, cancelMyBooking);

module.exports = router;
