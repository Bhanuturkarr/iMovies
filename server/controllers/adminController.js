const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// @desc    Get comprehensive admin overview metrics
// @route   GET /api/v1/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMovies = await Movie.countDocuments();
    const activeTheatres = await Theatre.countDocuments({ status: 'active' });
    const upcomingShows = await Show.countDocuments({
      status: 'open',
      startTime: { $gte: new Date() }
    });

    const confirmedBookingsCount = await Booking.countDocuments({ bookingStatus: 'confirmed' });
    const cancelledBookingsCount = await Booking.countDocuments({ bookingStatus: 'cancelled' });

    // Calculate gross revenue from confirmed bookings
    const revenueAgg = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      {
        $group: {
          _id: null,
          totalRevenuePaise: { $sum: '$pricing.totalAmountPaise' },
          totalTicketsSold: { $sum: { $size: '$seatNumbers' } }
        }
      }
    ]);

    const totalRevenuePaise = revenueAgg[0]?.totalRevenuePaise || 0;
    const totalTicketsSold = revenueAgg[0]?.totalTicketsSold || 0;

    // Refund stats
    const refundAgg = await Booking.aggregate([
      { $match: { bookingStatus: 'cancelled' } },
      {
        $group: {
          _id: null,
          totalRefundPaise: { $sum: '$cancellation.refundAmountPaise' }
        }
      }
    ]);
    const totalRefundPaise = refundAgg[0]?.totalRefundPaise || 0;

    // Calculate overall occupancy rate across shows
    const occupancyAgg = await Show.aggregate([
      { $match: { totalSeats: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$totalSeats' },
          totalBooked: { $sum: '$bookedSeatsCount' }
        }
      }
    ]);

    const totalCapacity = occupancyAgg[0]?.totalCapacity || 1;
    const totalBooked = occupancyAgg[0]?.totalBooked || 0;
    const occupancyRatePercent = Math.min(100, Math.round((totalBooked / totalCapacity) * 100));

    // Recent 7 days revenue timeline
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueTimeline = await Booking.aggregate([
      {
        $match: {
          bookingStatus: 'confirmed',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          dailyRevenuePaise: { $sum: '$pricing.totalAmountPaise' },
          bookingsCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent 5 confirmed bookings
    const recentBookings = await Booking.find({ bookingStatus: 'confirmed' })
      .populate('user', 'name email')
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title' },
          { path: 'theatre', select: 'name city' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalMovies,
        activeTheatres,
        upcomingShows,
        confirmedBookingsCount,
        cancelledBookingsCount,
        totalTicketsSold,
        totalRevenuePaise,
        totalRefundPaise,
        occupancyRatePercent,
        revenueTimeline,
        recentBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings with filters, search, and pagination
// @route   GET /api/v1/admin/bookings
// @access  Private (Admin)
const getAllBookings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.bookingStatus = status;
    }

    if (search && search.trim()) {
      query.bookingReference = { $regex: search.trim().toUpperCase() };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title posterUrl' },
          { path: 'theatre', select: 'name city' },
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

// @desc    Get all users with pagination and search
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user account status (active/suspended)
// @route   PATCH /api/v1/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active or suspended.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Protect against suspending own admin account
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend your own account.'
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      data: user.toPublicJSON(),
      message: `User status changed to ${status}.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllBookings,
  getAllUsers,
  updateUserStatus
};
