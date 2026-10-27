const mongoose = require('mongoose');
const SeatHold = require('../models/SeatHold');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const config = require('../config/config');
const { generateHoldToken } = require('../utils/helpers');

// Clean up expired holds for a show
const cleanupExpiredHolds = async (showId) => {
  const now = new Date();
  const filter = {
    show: showId,
    status: 'active',
    expiresAt: { $lte: now }
  };
  
  const expiredHolds = await SeatHold.find(filter);
  if (expiredHolds.length > 0) {
    await SeatHold.updateMany(filter, { $set: { status: 'expired' } });
    return expiredHolds.flatMap(h => h.seats);
  }
  return [];
};

// Get current status of all seats for a given show
const getSeatAvailability = async (showId) => {
  // 1. Release expired holds first
  const newlyExpiredSeats = await cleanupExpiredHolds(showId);

  // 2. Fetch all confirmed bookings for this show
  const confirmedBookings = await Booking.find({
    show: showId,
    bookingStatus: 'confirmed'
  }).select('seatNumbers');

  const bookedSeats = new Set();
  confirmedBookings.forEach(b => {
    (b.seatNumbers || []).forEach(s => bookedSeats.add(s));
  });

  // 3. Fetch all active holds
  const now = new Date();
  const activeHolds = await SeatHold.find({
    show: showId,
    status: 'active',
    expiresAt: { $gt: now }
  }).select('seats user holdToken expiresAt');

  const heldSeatsMap = {};
  activeHolds.forEach(hold => {
    hold.seats.forEach(seat => {
      heldSeatsMap[seat] = {
        userId: hold.user.toString(),
        holdToken: hold.holdToken,
        expiresAt: hold.expiresAt
      };
    });
  });

  return {
    bookedSeats: Array.from(bookedSeats),
    heldSeatsMap,
    newlyExpiredSeats
  };
};

// Create a time-limited hold on seats atomically
const createSeatHold = async (showId, userId, seatNumbers) => {
  if (!seatNumbers || seatNumbers.length === 0) {
    throw new Error('Please select at least one seat');
  }

  // Check show status
  const show = await Show.findById(showId);
  if (!show) {
    throw new Error('Showtime not found');
  }
  if (show.status !== 'open') {
    throw new Error(`Show is currently ${show.status} for bookings`);
  }
  if (new Date(show.startTime) <= new Date()) {
    throw new Error('Showtime has already started or ended');
  }

  // Release expired holds first
  await cleanupExpiredHolds(showId);

  // Check if any requested seat is already confirmed
  const existingBooking = await Booking.findOne({
    show: showId,
    bookingStatus: 'confirmed',
    seatNumbers: { $in: seatNumbers }
  });

  if (existingBooking) {
    const conflicted = seatNumbers.filter(s => existingBooking.seatNumbers.includes(s));
    throw new Error(`Seat(s) ${conflicted.join(', ')} have already been booked by another customer.`);
  }

  // Check if any requested seat is currently held by someone else
  const now = new Date();
  const existingHold = await SeatHold.findOne({
    show: showId,
    status: 'active',
    expiresAt: { $gt: now },
    seats: { $in: seatNumbers }
  });

  if (existingHold) {
    // If held by the same user, we can allow updating their hold or renewing
    if (existingHold.user.toString() !== userId.toString()) {
      const conflicted = seatNumbers.filter(s => existingHold.seats.includes(s));
      throw new Error(`Seat(s) ${conflicted.join(', ')} are currently held by another customer. Please select different seats.`);
    } else {
      // Release previous hold to create fresh one with all new seats
      await SeatHold.findByIdAndUpdate(existingHold._id, { status: 'released' });
    }
  }

  // Release any other active holds by this user on this show to prevent hoarding
  await SeatHold.updateMany(
    { show: showId, user: userId, status: 'active' },
    { $set: { status: 'released' } }
  );

  const expiresAt = new Date(Date.now() + config.seatHoldDurationMinutes * 60 * 1000);
  const holdToken = generateHoldToken();

  const seatHold = await SeatHold.create({
    show: showId,
    user: userId,
    seats: seatNumbers,
    holdToken,
    expiresAt,
    status: 'active'
  });

  return {
    seatHold,
    holdToken,
    expiresAt,
    durationMinutes: config.seatHoldDurationMinutes
  };
};

// Release hold manually
const releaseSeatHold = async (showId, holdToken, userId) => {
  const query = { show: showId, holdToken, status: 'active' };
  if (userId) {
    query.user = userId;
  }
  const hold = await SeatHold.findOneAndUpdate(
    query,
    { status: 'released' },
    { new: true }
  );
  return hold;
};

module.exports = {
  cleanupExpiredHolds,
  getSeatAvailability,
  createSeatHold,
  releaseSeatHold
};
