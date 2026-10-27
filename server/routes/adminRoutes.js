const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllBookings,
  getAllUsers,
  updateUserStatus
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All routes here require Admin role
router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/bookings', getAllBookings);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

module.exports = router;
