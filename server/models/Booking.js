const mongoose = require('mongoose');

const bookedSeatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true
    },
    row: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Silver', 'Gold', 'Platinum', 'VIP'],
      required: true
    },
    pricePaise: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true
    },
    seats: [bookedSeatSchema],
    seatNumbers: {
      type: [String],
      required: true,
      index: true // For fast seat uniqueness and query
    },
    pricing: {
      baseAmountPaise: { type: Number, required: true },
      convenienceFeePaise: { type: Number, required: true },
      gstPaise: { type: Number, required: true },
      discountPaise: { type: Number, default: 0 },
      totalAmountPaise: { type: Number, required: true }
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired'],
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['mock', 'razorpay'],
      default: 'mock'
    },
    paymentOrderReference: {
      type: String,
      default: ''
    },
    paymentTransactionReference: {
      type: String,
      default: ''
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    cancellation: {
      cancelledAt: { type: Date },
      reason: { type: String, default: 'User requested cancellation' },
      refundAmountPaise: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['none', 'initiated', 'processed', 'failed'],
        default: 'none'
      },
      refundReference: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ show: 1, bookingStatus: 1 });

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
