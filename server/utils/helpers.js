const crypto = require('crypto');

// Generate unique booking reference e.g., IMV-92384-KX89
const generateBookingReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestamp = Date.now().toString().slice(-4);
  return `IMV-${timestamp}-${rand}`;
};

// Generate secure hold token
const generateHoldToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

// Calculate pricing breakdown
// baseAmountPaise is sum of all selected seats
const calculateBookingPricing = (baseAmountPaise, ticketCount, convenienceFeePerTicketPaise = 2500, gstRatePercent = 18) => {
  const convenienceFeePaise = ticketCount * convenienceFeePerTicketPaise;
  // GST applies to convenience fee + tickets
  const gstPaise = Math.round((convenienceFeePaise * gstRatePercent) / 100);
  const totalAmountPaise = baseAmountPaise + convenienceFeePaise + gstPaise;

  return {
    baseAmountPaise,
    convenienceFeePaise,
    gstPaise,
    totalAmountPaise
  };
};

module.exports = {
  generateBookingReference,
  generateHoldToken,
  calculateBookingPricing
};
