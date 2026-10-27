const express = require('express');
const router = express.Router();
const {
  getTheatres,
  getTheatreById,
  getCities,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  getScreens,
  createScreen,
  updateScreen
} = require('../controllers/theatreController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', getTheatres);
router.get('/meta/cities', getCities);
router.get('/:id', getTheatreById);
router.get('/:id/screens', getScreens);

// Admin-only endpoints
router.post('/', protect, authorize('admin'), createTheatre);
router.patch('/:id', protect, authorize('admin'), updateTheatre);
router.delete('/:id', protect, authorize('admin'), deleteTheatre);
router.post('/:id/screens', protect, authorize('admin'), createScreen);
router.patch('/screens/:screenId', protect, authorize('admin'), updateScreen);

module.exports = router;
