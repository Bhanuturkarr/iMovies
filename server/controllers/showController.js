const Show = require('../models/Show');
const Screen = require('../models/Screen');
const Theatre = require('../models/Theatre');
const Booking = require('../models/Booking');
const { getSeatAvailability } = require('../services/seatHoldService');

// @desc    Get shows with filters (movie, theatre, city, date, format)
// @route   GET /api/v1/shows
// @access  Public
const getShows = async (req, res, next) => {
  try {
    const { movie, theatre, city, date, format, status = 'open' } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (movie) {
      query.movie = movie;
    }

    if (theatre) {
      query.theatre = theatre;
    }

    if (format && format !== 'all') {
      query.format = format;
    }

    // Filter by specific date or default to shows from now onwards
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Future shows
      query.startTime = { $gte: new Date() };
    }

    let shows = await Show.find(query)
      .populate('movie', 'title posterUrl durationMinutes certification genre language')
      .populate('theatre', 'name city address facilities')
      .populate('screen', 'name formats totalSeats')
      .sort({ startTime: 1 });

    // Filter by city if theatre isn't directly queried
    if (city && city !== 'all') {
      shows = shows.filter(
        s => s.theatre && s.theatre.city && s.theatre.city.toLowerCase() === city.trim().toLowerCase()
      );
    }

    res.status(200).json({
      success: true,
      count: shows.length,
      data: shows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single show by ID
// @route   GET /api/v1/shows/:id
// @access  Public
const getShowById = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie')
      .populate('theatre')
      .populate('screen');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    res.status(200).json({
      success: true,
      data: show
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seat layout and real-time seat availability for a show
// @route   GET /api/v1/shows/:id/seats
// @access  Public / User
const getShowSeatLayout = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title durationMinutes certification posterUrl')
      .populate('theatre', 'name city address')
      .populate('screen');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    const screen = show.screen;
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen layout not found for this show'
      });
    }

    // Fetch booked and held seats
    const currentUserId = req.user ? req.user.id.toString() : null;
    const { bookedSeats, heldSeatsMap } = await getSeatAvailability(show._id);

    // Map screen rows and calculate state for every seat
    const layout = (screen.rows || []).map(row => {
      const category = row.category || 'Gold';
      const categoryPricePaise = show.pricing?.[category] || row.basePricePaise || 20000;

      const seats = (row.seats || []).map(seat => {
        let status = 'available';

        if (!seat.isActive || seat.type === 'space') {
          status = 'blocked';
        } else if (bookedSeats.includes(seat.seatNumber)) {
          status = 'booked';
        } else if (heldSeatsMap[seat.seatNumber]) {
          const holdInfo = heldSeatsMap[seat.seatNumber];
          // If held by the current user, it's 'selected' for them, but 'held' for everyone else!
          if (currentUserId && holdInfo.userId === currentUserId) {
            status = 'selected_by_me';
          } else {
            status = 'held';
          }
        }

        return {
          seatNumber: seat.seatNumber,
          col: seat.col,
          type: seat.type,
          category,
          pricePaise: categoryPricePaise,
          status
        };
      });

      return {
        rowLabel: row.rowLabel,
        category,
        pricePaise: categoryPricePaise,
        seats
      };
    });

    res.status(200).json({
      success: true,
      data: {
        showId: show._id,
        movie: show.movie,
        theatre: show.theatre,
        screenName: screen.name,
        format: show.format,
        language: show.language,
        startTime: show.startTime,
        endTime: show.endTime,
        pricing: show.pricing,
        totalSeats: screen.totalSeats,
        availableSeatsCount: screen.totalSeats - bookedSeats.length,
        layout
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new show with conflict check
// @route   POST /api/v1/shows
// @access  Private (Admin)
const createShow = async (req, res, next) => {
  try {
    const { movie, theatre, screen, startTime, endTime, language, format, pricing } = req.body;

    if (!movie || !theatre || !screen || !startTime || !endTime || !language) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required show details.'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.'
      });
    }

    if (start <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule a show in the past.'
      });
    }

    // Schedule conflict detection on the same screen (including 15 mins buffer)
    const bufferMs = 15 * 60 * 1000;
    const conflictStart = new Date(start.getTime() - bufferMs);
    const conflictEnd = new Date(end.getTime() + bufferMs);

    const conflictingShow = await Show.findOne({
      screen,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: conflictEnd, $gte: conflictStart } },
        { endTime: { $gt: conflictStart, $lte: conflictEnd } },
        { startTime: { $lte: conflictStart }, endTime: { $gte: conflictEnd } }
      ]
    });

    if (conflictingShow) {
      return res.status(409).json({
        success: false,
        message: 'Schedule conflict: This screen already has a scheduled show during this time window (including 15 min buffer).'
      });
    }

    const screenDoc = await Screen.findById(screen);
    const totalSeats = screenDoc ? screenDoc.totalSeats : 0;

    const show = await Show.create({
      movie,
      theatre,
      screen,
      startTime: start,
      endTime: end,
      language,
      format: format || '2D',
      pricing: pricing || undefined,
      totalSeats
    });

    res.status(201).json({
      success: true,
      data: show,
      message: 'Show scheduled successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update show
// @route   PATCH /api/v1/shows/:id
// @access  Private (Admin)
const updateShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    res.status(200).json({
      success: true,
      data: show,
      message: 'Show updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete show (with safety check)
// @route   DELETE /api/v1/shows/:id
// @access  Private (Admin)
const deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    const bookingsCount = await Booking.countDocuments({
      show: show._id,
      bookingStatus: 'confirmed'
    });

    if (bookingsCount > 0) {
      show.status = 'cancelled';
      await show.save();
      return res.status(200).json({
        success: true,
        message: 'Show has active bookings. Status set to cancelled instead of deleting record.'
      });
    }

    await Show.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Show deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShows,
  getShowById,
  getShowSeatLayout,
  createShow,
  updateShow,
  deleteShow
};
