const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Screen = require('../models/Screen');
const SeatHold = require('../models/SeatHold');
const Payment = require('../models/Payment');
const config = require('../config/config');
const { generateBookingReference, calculateBookingPricing } = require('../utils/helpers');
const { createNotification } = require('./notificationService');

// Verify seat selection, fetch accurate server prices from Screen layout & Show pricing,
// and calculate exact itemized total
const validateAndPriceSeats = async (showId, seatNumbers) => {
  const show = await Show.findById(showId).populate('screen');
  if (!show) {
    throw new Error('Showtime not found');
  }

  const screen = show.screen;
  if (!screen || !screen.rows) {
    throw new Error('Screen configuration not found');
  }

  // Build a lookup map of seat -> { row, category, price }
  const seatPriceMap = {};
  screen.rows.forEach(row => {
    const category = row.category || 'Gold';
    // Show pricing override or row default
    const pricePaise = show.pricing?.[category] || row.basePricePaise || 20000;
    
    (row.seats || []).forEach(seat => {
      seatPriceMap[seat.seatNumber] = {
        seatNumber: seat.seatNumber,
        row: row.rowLabel,
        category,
        pricePaise
      };
    });
  });

  const verifiedSeats = [];
  let baseAmountPaise = 0;

  for (const seatNum of seatNumbers) {
    const seatInfo = seatPriceMap[seatNum];
    if (!seatInfo) {
      throw new Error(`Invalid seat ${seatNum} for this screen layout`);
    }
    verifiedSeats.push(seatInfo);
    baseAmountPaise += seatInfo.pricePaise;
  }

  const pricing = calculateBookingPricing(
    baseAmountPaise,
    verifiedSeats.length,
    config.convenienceFeePerTicketPaise,
    config.gstRatePercent
  );

  return {
    show,
    screen,
    verifiedSeats,
    pricing
  };
};

// Create a pending booking from an active hold
const initiateBooking = async ({ showId, userId, seatNumbers, holdToken, idempotencyKey }) => {
  // Check idempotency if key provided
  if (idempotencyKey) {
    const existing = await Booking.findOne({ idempotencyKey, user: userId });
    if (existing) {
      return existing;
    }
  }

  // Validate the hold
  const now = new Date();
  const hold = await SeatHold.findOne({
    show: showId,
    user: userId,
    holdToken,
    status: 'active',
    expiresAt: { $gt: now }
  });

  if (!hold) {
    throw new Error('Seat hold has expired or is invalid. Please select seats again.');
  }

  // Verify that all requested seats match the hold
  const holdSeatsSet = new Set(hold.seats);
  const allMatch = seatNumbers.every(s => holdSeatsSet.has(s)) && seatNumbers.length === hold.seats.length;
  if (!allMatch) {
    throw new Error('Selected seats do not match active hold session.');
  }

  // Server-side seat pricing
  const { show, verifiedSeats, pricing } = await validateAndPriceSeats(showId, seatNumbers);

  const bookingReference = generateBookingReference();

  const booking = await Booking.create({
    bookingReference,
    user: userId,
    show: showId,
    seats: verifiedSeats,
    seatNumbers,
    pricing,
    bookingStatus: 'pending',
    paymentStatus: 'pending',
    paymentMethod: config.paymentMode,
    idempotencyKey: idempotencyKey || undefined
  });

  return booking;
};

// Confirm booking after successful payment verification
const finalizeBooking = async ({ bookingId, paymentResult }) => {
  const booking = await Booking.findById(bookingId).populate('show user');
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.bookingStatus === 'confirmed') {
    // Already confirmed (idempotent call)
    return booking;
  }

  // Concurrency check: Ensure none of the seats are already booked by another confirmed booking
  const conflict = await Booking.findOne({
    _id: { $ne: booking._id },
    show: booking.show._id,
    bookingStatus: 'confirmed',
    seatNumbers: { $in: booking.seatNumbers }
  });

  if (conflict) {
    booking.bookingStatus = 'expired';
    booking.paymentStatus = 'failed';
    await booking.save();
    throw new Error('One or more of the selected seats were acquired by another user during checkout.');
  }

  // Mark booking confirmed
  booking.bookingStatus = 'confirmed';
  booking.paymentStatus = 'paid';
  booking.paymentTransactionReference = paymentResult.paymentId || 'N/A';
  booking.paymentOrderReference = paymentResult.orderId || 'N/A';
  booking.paymentMethod = paymentResult.provider || config.paymentMode;
  await booking.save();

  // Mark the corresponding hold as converted
  await SeatHold.updateMany(
    { show: booking.show._id, user: booking.user._id, seats: { $in: booking.seatNumbers } },
    { $set: { status: 'converted' } }
  );

  // Update show booked count
  await Show.findByIdAndUpdate(booking.show._id, {
    $inc: { bookedSeatsCount: booking.seatNumbers.length }
  });

  // Create in-app confirmation notification
  await createNotification({
    userId: booking.user._id,
    type: 'booking_confirmed',
    title: 'Tickets Confirmed! 🎟️',
    message: `Your booking (${booking.bookingReference}) for seats ${booking.seatNumbers.join(', ')} is confirmed! Enjoy the show.`,
    relatedBookingId: booking._id
  });

  return booking;
};

// Process booking cancellation
const cancelBooking = async ({ bookingId, userId, userRole, reason }) => {
  const booking = await Booking.findById(bookingId).populate('show user');
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Ownership or Admin check
  if (userRole !== 'admin' && booking.user._id.toString() !== userId.toString()) {
    throw new Error('You are not authorized to cancel this booking.');
  }

  if (booking.bookingStatus === 'cancelled') {
    throw new Error('This booking has already been cancelled.');
  }

  if (booking.bookingStatus !== 'confirmed') {
    throw new Error(`Cannot cancel a booking in '${booking.bookingStatus}' status.`);
  }

  // Check show time and cancellation cutoff
  const showTime = new Date(booking.show.startTime);
  const now = new Date();
  const cutoffMs = config.cancellationCutoffHours * 60 * 60 * 1000;

  if (showTime.getTime() - now.getTime() < cutoffMs && userRole !== 'admin') {
    throw new Error(
      `Cancellations are only permitted up to ${config.cancellationCutoffHours} hours before showtime.`
    );
  }

  // Calculate refund amount
  const refundPercent = config.cancellationRefundPercent;
  // Usually base ticket fare is partially refunded; convenience fee is non-refundable
  const refundAmountPaise = Math.round(
    (booking.pricing.baseAmountPaise * refundPercent) / 100
  );

  booking.bookingStatus = 'cancelled';
  booking.paymentStatus = 'refunded';
  booking.cancellation = {
    cancelledAt: new Date(),
    reason: reason || 'Customer requested cancellation',
    refundAmountPaise,
    refundStatus: 'processed',
    refundReference: `REF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  };

  await booking.save();

  // Decrement show booked seats count
  await Show.findByIdAndUpdate(booking.show._id, {
    $inc: { bookedSeatsCount: -booking.seatNumbers.length }
  });

  // Record refund in Payment model
  await Payment.findOneAndUpdate(
    { booking: booking._id },
    {
      status: 'refunded',
      refundDetails: {
        refundId: booking.cancellation.refundReference,
        amountPaise: refundAmountPaise,
        processedAt: new Date()
      }
    }
  );

  // Send cancellation notification
  await createNotification({
    userId: booking.user._id,
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: `Booking ${booking.bookingReference} has been cancelled. Refund of ₹${(refundAmountPaise / 100).toFixed(2)} processed to source.`,
    relatedBookingId: booking._id
  });

  return {
    booking,
    releasedSeats: booking.seatNumbers,
    refundAmountPaise
  };
};

module.exports = {
  validateAndPriceSeats,
  initiateBooking,
  finalizeBooking,
  cancelBooking
};
