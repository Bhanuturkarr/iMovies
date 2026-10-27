const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide theatre name'],
      trim: true,
      maxlength: [150, 'Theatre name cannot exceed 150 characters']
    },
    address: {
      type: String,
      required: [true, 'Please provide theatre address'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      default: ''
    },
    facilities: {
      type: [String],
      default: ['Dolby Atmos', 'Parking', 'Recliner Seats', 'Cafeteria', 'Wheelchair Accessible']
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

theatreSchema.index({ name: 1, city: 1 });

module.exports = mongoose.models.Theatre || mongoose.model('Theatre', theatreSchema);
