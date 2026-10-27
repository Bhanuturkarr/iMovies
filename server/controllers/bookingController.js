const { createSeatHold, releaseSeatHold } = require('../services/seatHoldService');
const { initiateBooking, cancelBooking } = require('../services/bookingService');
const { broadcastSeatsHeld, broadcastSeatsReleased } = require('../sockets/seatSocket');
const Booking = require('../models/Booking');

// @desc    Hold seats temporarily (5 mins)
// @route   POST /api/v1/shows/:id/holds
// @access  Private
const holdSeats = async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatNumbers } = req.body;
    const userId = req.user.id;

    if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of seat numbers to hold.'
      });
    }

    if (seatNumbers.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'You can select a maximum of 10 seats per transaction.'
      });
    }

    const holdResult = await createSeatHold(showId, userId, seatNumbers);

    // Broadcast real-time hold to everyone viewing this show
    broadcastSeatsHeld(showId, seatNumbers, userId, holdResult.expiresAt);

    res.status(200).json({
      success: true,
      data: {
        holdToken: holdResult.holdToken,
        seats: seatNumbers,
        expiresAt: holdResult.expiresAt,
        durationMinutes: holdResult.durationMinutes
      },
      message: 'Seats held successfully for checkout.'
    });
  } catch (error) {
    res.status(409).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Release seat hold
// @route   DELETE /api/v1/shows/:id/holds/:token
// @access  Private
const releaseHold = async (req, res, next) => {
  try {
    const showId = req.params.id;
    const holdToken = req.params.token;
    const userId = req.user.id;

    const hold = await releaseSeatHold(showId, holdToken, userId);

    if (hold && hold.seats) {
      broadcastSeatsReleased(showId, hold.seats);
    }

    res.status(200).json({
      success: true,
      message: 'Seat hold released successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a pending booking (review / checkout stage)
// @route   POST /api/v1/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  try {
    const { showId, seatNumbers, holdToken, idempotencyKey } = req.body;
    const userId = req.user.id;

    if (!showId || !seatNumbers || !holdToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide showId, seatNumbers, and holdToken.'
      });
    }

    const booking = await initiateBooking({
      showId,
      userId,
      seatNumbers,
      holdToken,
      idempotencyKey
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking initiated successfully. Please proceed to payment.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user's booking history
// @route   GET /api/v1/bookings/my
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user.id };

    if (status && status !== 'all') {
      query.bookingStatus = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title posterUrl durationMinutes certification genre language' },
          { path: 'theatre', select: 'name city address' },
          { path: 'screen', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking details by ID or Reference
// @route   GET /api/v1/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    let booking;
    // Check if ID is a MongoDB ObjectId or a Booking Reference string
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(req.params.id)
        .populate({
          path: 'show',
          populate: [
            { path: 'movie' },
            { path: 'theatre' },
            { path: 'screen' }
          ]
        })
        .populate('user', 'name email phone');
    } else {
      booking = await Booking.findOne({ bookingReference: req.params.id.toUpperCase() })
        .populate({
          path: 'show',
          populate: [
            { path: 'movie' },
            { path: 'theatre' },
            { path: 'screen' }
          ]
        })
        .populate('user', 'name email phone');
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Ownership or admin check
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking.'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an eligible booking
// @route   POST /api/v1/bookings/:id/cancel
// @access  Private
const cancelMyBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;

    const result = await cancelBooking({
      bookingId,
      userId: req.user.id,
      userRole: req.user.role,
      reason
    });

    // Broadcast released seats so others can book them immediately!
    broadcastSeatsReleased(result.booking.show._id, result.releasedSeats);

    res.status(200).json({
      success: true,
      data: result.booking,
      refundAmountPaise: result.refundAmountPaise,
      message: 'Booking cancelled successfully. Refund has been initiated.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  holdSeats,
  releaseHold,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelMyBooking
};
