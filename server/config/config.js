const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file if it exists
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_development_2026_xyz!@#',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'imovies_cookie_signing_secret_987654321',
  
  // Payment
  paymentMode: (process.env.PAYMENT_MODE || 'mock').toLowerCase(),
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
  },
  
  // Business Rules
  seatHoldDurationMinutes: parseInt(process.env.SEAT_HOLD_DURATION_MINUTES, 10) || 5,
  cancellationCutoffHours: parseInt(process.env.CANCELLATION_CUTOFF_HOURS, 10) || 2,
  cancellationRefundPercent: parseInt(process.env.CANCELLATION_REFUND_PERCENT, 10) || 85,
  convenienceFeePerTicketPaise: parseInt(process.env.CONVENIENCE_FEE_PER_TICKET, 10) || 2500, // Rs 25.00 in paise
  gstRatePercent: parseInt(process.env.GST_RATE_PERCENT, 10) || 18
};

module.exports = config;
