const express = require('express');
const router = express.Router();
const {
  getShows,
  getShowById,
  getShowSeatLayout,
  createShow,
  updateShow,
  deleteShow
} = require('../controllers/showController');
const { holdSeats, releaseHold } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Optional auth helper to check if user has held seats
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const config = require('../config/config');
      const User = require('../models/User');
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      // Ignore token failure for optional endpoints
    }
  }
  next();
};

router.get('/', getShows);
router.get('/:id', getShowById);
router.get('/:id/seats', optionalAuth, getShowSeatLayout);

// Seat Holds under /shows/:id/holds
router.post('/:id/holds', protect, holdSeats);
router.delete('/:id/holds/:token', protect, releaseHold);

// Admin-only endpoints
router.post('/', protect, authorize('admin'), createShow);
router.patch('/:id', protect, authorize('admin'), updateShow);
router.delete('/:id', protect, authorize('admin'), deleteShow);

module.exports = router;
