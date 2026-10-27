const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Booking = require('../models/Booking');

// @desc    Get all movies with filters, search, and pagination
// @route   GET /api/v1/movies
// @access  Public
const getMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      format,
      certification,
      status,
      featured,
      sortBy = 'popularity',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Search query by title
    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // Genre filter
    if (genre && genre !== 'all') {
      query.genre = { $in: [new RegExp(`^${genre.trim()}$`, 'i')] };
    }

    // Language filter
    if (language && language !== 'all') {
      query.language = { $in: [new RegExp(`^${language.trim()}$`, 'i')] };
    }

    // Format filter
    if (format && format !== 'all') {
      query.formats = format;
    }

    // Certification filter
    if (certification && certification !== 'all') {
      query.certification = certification;
    }

    // Status filter (now_showing, upcoming, ended)
    if (status && status !== 'all') {
      query.status = status;
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
    }

    // Sort order
    let sort = {};
    if (sortBy === 'rating') {
      sort = { rating: -1, voteCount: -1 };
    } else if (sortBy === 'releaseDate') {
      sort = { releaseDate: -1 };
    } else if (sortBy === 'title') {
      sort = { title: 1 };
    } else {
      // default popularity / featured
      sort = { featured: -1, rating: -1, releaseDate: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const total = await Movie.countDocuments(query);
    const movies = await Movie.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: movies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie by ID
// @route   GET /api/v1/movies/:id
// @access  Public
const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Find all upcoming shows for this movie to retrieve available cities
    const upcomingShows = await Show.find({
      movie: movie._id,
      status: 'open',
      startTime: { $gte: new Date() }
    }).populate('theatre', 'city');

    const availableCities = Array.from(
      new Set(upcomingShows.map(s => s.theatre?.city).filter(Boolean))
    );

    res.status(200).json({
      success: true,
      data: {
        ...movie.toObject(),
        availableCities
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all distinct genres and languages for filters
// @route   GET /api/v1/movies/meta/filters
// @access  Public
const getFilterMeta = async (req, res, next) => {
  try {
    const genres = await Movie.distinct('genre');
    const languages = await Movie.distinct('language');
    const formats = ['2D', '3D', 'IMAX', '4DX'];
    const certifications = ['U', 'UA', 'A', 'S'];

    res.status(200).json({
      success: true,
      data: {
        genres: genres.sort(),
        languages: languages.sort(),
        formats,
        certifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new movie
// @route   POST /api/v1/movies
// @access  Private (Admin)
const createMovie = async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);

    res.status(201).json({
      success: true,
      data: movie,
      message: 'Movie created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a movie
// @route   PATCH /api/v1/movies/:id
// @access  Private (Admin)
const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.status(200).json({
      success: true,
      data: movie,
      message: 'Movie updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a movie (safely check for existing confirmed bookings)
// @route   DELETE /api/v1/movies/:id
// @access  Private (Admin)
const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Check if there are active shows with confirmed bookings
    const shows = await Show.find({ movie: movie._id });
    const showIds = shows.map(s => s._id);

    const activeBookings = await Booking.countDocuments({
      show: { $in: showIds },
      bookingStatus: 'confirmed'
    });

    if (activeBookings > 0) {
      // Instead of hard deleting, archive by setting status to 'ended'
      movie.status = 'ended';
      await movie.save();
      return res.status(200).json({
        success: true,
        message: 'Movie has existing customer bookings. Status updated to "ended" instead of deleting record for audit integrity.'
      });
    }

    // Safe to delete shows and movie
    await Show.deleteMany({ movie: movie._id });
    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movie and its scheduled shows removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  getFilterMeta,
  createMovie,
  updateMovie,
  deleteMovie
};
