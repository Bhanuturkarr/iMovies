const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Please provide movie reference'],
      index: true
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Please provide theatre reference'],
      index: true
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Please provide screen reference'],
      index: true
    },
    startTime: {
      type: Date,
      required: [true, 'Please provide show start time'],
      index: true
    },
    endTime: {
      type: Date,
      required: [true, 'Please provide show end time']
    },
    language: {
      type: String,
      required: [true, 'Please provide audio language'],
      trim: true
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX', '4DX'],
      default: '2D'
    },
    pricing: {
      Silver: { type: Number, default: 18000 },    // Rs 180 in paise
      Gold: { type: Number, default: 24000 },      // Rs 240 in paise
      Platinum: { type: Number, default: 32000 },  // Rs 320 in paise
      VIP: { type: Number, default: 45000 }        // Rs 450 in paise
    },
    status: {
      type: String,
      enum: ['scheduled', 'open', 'closed', 'cancelled'],
      default: 'open',
      index: true
    },
    bookingCutoffMinutes: {
      type: Number,
      default: 15
    },
    totalSeats: {
      type: Number,
      default: 0
    },
    bookedSeatsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index for schedule conflict queries
showSchema.index({ screen: 1, startTime: 1, endTime: 1 });
showSchema.index({ theatre: 1, movie: 1, startTime: 1 });

module.exports = mongoose.models.Show || mongoose.model('Show', showSchema);
