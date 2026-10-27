const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a movie title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a movie description'],
      trim: true
    },
    posterUrl: {
      type: String,
      required: [true, 'Please provide a poster URL'],
      trim: true
    },
    backdropUrl: {
      type: String,
      trim: true,
      default: ''
    },
    trailerUrl: {
      type: String,
      trim: true,
      default: ''
    },
    genre: {
      type: [String],
      required: [true, 'Please specify at least one genre'],
      index: true
    },
    language: {
      type: [String],
      required: [true, 'Please specify at least one language'],
      index: true
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Please provide movie duration in minutes'],
      min: [1, 'Duration must be at least 1 minute']
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please provide release date'],
      index: true
    },
    certification: {
      type: String,
      enum: ['U', 'UA', 'A', 'S'],
      default: 'UA'
    },
    status: {
      type: String,
      enum: ['now_showing', 'upcoming', 'ended'],
      default: 'now_showing',
      index: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 8.0
    },
    voteCount: {
      type: Number,
      default: 120
    },
    formats: {
      type: [String],
      enum: ['2D', '3D', 'IMAX', '4DX'],
      default: ['2D', '3D']
    },
    cast: [
      {
        name: { type: String, required: true },
        character: { type: String, default: '' },
        photoUrl: { type: String, default: '' }
      }
    ],
    director: {
      type: String,
      trim: true,
      default: ''
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Text index for search with language_override set so it doesn't conflict with our language array field
movieSchema.index(
  { title: 'text', description: 'text', director: 'text' },
  { language_override: 'textSearchLanguage' }
);

module.exports = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
