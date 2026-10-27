const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  getFilterMeta,
  createMovie,
  updateMovie,
  deleteMovie
} = require('../controllers/movieController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', getMovies);
router.get('/meta/filters', getFilterMeta);
router.get('/:id', getMovieById);

// Admin-only endpoints
router.post('/', protect, authorize('admin'), createMovie);
router.patch('/:id', protect, authorize('admin'), updateMovie);
router.delete('/:id', protect, authorize('admin'), deleteMovie);

module.exports = router;
