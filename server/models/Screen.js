const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      trim: true // e.g. "A1", "C12"
    },
    col: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['standard', 'wheelchair', 'space'],
      default: 'standard'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const rowSchema = new mongoose.Schema(
  {
    rowLabel: {
      type: String,
      required: true,
      trim: true // e.g. "A", "B", "C"
    },
    category: {
      type: String,
      enum: ['Silver', 'Gold', 'Platinum', 'VIP'],
      default: 'Gold'
    },
    basePricePaise: {
      type: Number,
      required: true,
      min: 0 // e.g. 20000 = Rs 200.00
    },
    seats: [seatSchema]
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide screen name'],
      trim: true
    },
    screenNumber: {
      type: Number,
      default: 1
    },
    formats: {
      type: [String],
      enum: ['2D', '3D', 'IMAX', '4DX'],
      default: ['2D', '3D']
    },
    soundSystem: {
      type: String,
      default: 'Dolby Atmos 7.1'
    },
    rows: [rowSchema],
    totalSeats: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'maintenance'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save to compute total active seats
screenSchema.pre('save', function (next) {
  let count = 0;
  if (this.rows && Array.isArray(this.rows)) {
    for (const row of this.rows) {
      if (row.seats && Array.isArray(row.seats)) {
        for (const seat of row.seats) {
          if (seat.type !== 'space' && seat.isActive) {
            count++;
          }
        }
      }
    }
  }
  this.totalSeats = count;
  next();
});

module.exports = mongoose.models.Screen || mongoose.model('Screen', screenSchema);
