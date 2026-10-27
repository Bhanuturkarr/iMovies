const mongoose = require('mongoose');

const seatHoldSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true
    },
    seats: {
      type: [String], // Array of seat numbers e.g. ["A1", "A2"]
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    holdToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'converted', 'expired', 'released'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly find holds by show and status
seatHoldSchema.index({ show: 1, status: 1, expiresAt: 1 });

module.exports = mongoose.models.SeatHold || mongoose.model('SeatHold', seatHoldSchema);
