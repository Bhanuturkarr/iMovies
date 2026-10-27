const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Show = require('../models/Show');

// @desc    Get all theatres with optional city filter
// @route   GET /api/v1/theatres
// @access  Public
const getTheatres = async (req, res, next) => {
  try {
    const { city, search, status = 'active' } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (city && city !== 'all') {
      query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const theatres = await Theatre.find(query).sort({ city: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: theatres.length,
      data: theatres
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single theatre by ID
// @route   GET /api/v1/theatres/:id
// @access  Public
const getTheatreById = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    const screens = await Screen.find({ theatre: theatre._id, status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        ...theatre.toObject(),
        screens
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get distinct cities
// @route   GET /api/v1/theatres/meta/cities
// @access  Public
const getCities = async (req, res, next) => {
  try {
    const cities = await Theatre.distinct('city');
    res.status(200).json({
      success: true,
      data: cities.sort()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create theatre
// @route   POST /api/v1/theatres
// @access  Private (Admin)
const createTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.create(req.body);
    res.status(201).json({
      success: true,
      data: theatre,
      message: 'Theatre created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update theatre
// @route   PATCH /api/v1/theatres/:id
// @access  Private (Admin)
const updateTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    res.status(200).json({
      success: true,
      data: theatre,
      message: 'Theatre updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete theatre
// @route   DELETE /api/v1/theatres/:id
// @access  Private (Admin)
const deleteTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    // Check shows
    const shows = await Show.countDocuments({ theatre: theatre._id });
    if (shows > 0) {
      theatre.status = 'inactive';
      await theatre.save();
      return res.status(200).json({
        success: true,
        message: 'Theatre has scheduled shows. Status set to inactive.'
      });
    }

    await Screen.deleteMany({ theatre: theatre._id });
    await Theatre.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Theatre and screens deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get screens for a theatre
// @route   GET /api/v1/theatres/:id/screens
// @access  Public
const getScreens = async (req, res, next) => {
  try {
    const screens = await Screen.find({ theatre: req.params.id });
    res.status(200).json({
      success: true,
      data: screens
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create screen for theatre
// @route   POST /api/v1/theatres/:id/screens
// @access  Private (Admin)
const createScreen = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    const screenData = {
      ...req.body,
      theatre: theatre._id
    };

    const screen = await Screen.create(screenData);

    res.status(201).json({
      success: true,
      data: screen,
      message: 'Screen created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update screen
// @route   PATCH /api/v1/theatres/screens/:screenId
// @access  Private (Admin)
const updateScreen = async (req, res, next) => {
  try {
    const screen = await Screen.findByIdAndUpdate(req.params.screenId, req.body, {
      new: true,
      runValidators: true
    });

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found'
      });
    }

    res.status(200).json({
      success: true,
      data: screen,
      message: 'Screen updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTheatres,
  getTheatreById,
  getCities,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  getScreens,
  createScreen,
  updateScreen
};
