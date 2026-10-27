const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['mock', 'razorpay'],
      required: true
    },
    orderId: {
      type: String,
      required: true,
      index: true
    },
    paymentId: {
      type: String,
      default: ''
    },
    signature: {
      type: String,
      default: ''
    },
    amountPaise: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true
    },
    errorDetails: {
      code: { type: String, default: '' },
      description: { type: String, default: '' }
    },
    refundDetails: {
      refundId: { type: String, default: '' },
      amountPaise: { type: Number, default: 0 },
      processedAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
