const Booking = require('../models/Booking');
const { createPaymentOrder, verifyPaymentSignature } = require('../services/paymentService');
const { finalizeBooking } = require('../services/bookingService');
const { broadcastSeatsBooked } = require('../sockets/seatSocket');
const config = require('../config/config');
const crypto = require('crypto');

// @desc    Create a payment order for a pending booking
// @route   POST /api/v1/payments/order
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this booking'
      });
    }

    if (booking.bookingStatus === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already paid and confirmed.'
      });
    }

    const orderData = await createPaymentOrder({
      bookingId: booking._id,
      userId,
      amountPaise: booking.pricing.totalAmountPaise,
      currency: 'INR',
      receipt: `imv_${booking.bookingReference}`
    });

    res.status(200).json({
      success: true,
      data: orderData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment and finalize booking
// @route   POST /api/v1/payments/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, orderId, paymentId, signature } = req.body;
    const userId = req.user.id;

    if (!bookingId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId and orderId.'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this booking'
      });
    }

    // Server-side verification
    const verification = await verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
      bookingId,
      userId
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: verification.error || 'Payment verification failed'
      });
    }

    // Finalize booking atomically
    const confirmedBooking = await finalizeBooking({
      bookingId,
      paymentResult: verification
    });

    // Broadcast seats permanently booked via Socket.IO
    broadcastSeatsBooked(confirmedBooking.show._id || confirmedBooking.show, confirmedBooking.seatNumbers);

    res.status(200).json({
      success: true,
      data: confirmedBooking,
      message: 'Payment verified and ticket confirmed successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Razorpay Webhook listener (idempotent reconciliation)
// @route   POST /api/v1/payments/webhook
// @access  Public
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = config.razorpay.webhookSecret;

    if (secret && signature) {
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        return res.status(400).json({ status: 'invalid_signature' });
      }
    }

    const event = req.body.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const Payment = require('../models/Payment');
      const paymentRecord = await Payment.findOne({ orderId });
      if (paymentRecord && paymentRecord.booking) {
        await finalizeBooking({
          bookingId: paymentRecord.booking,
          paymentResult: {
            provider: 'razorpay',
            orderId,
            paymentId
          }
        });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ status: 'error' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook
};
