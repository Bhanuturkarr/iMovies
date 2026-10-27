const crypto = require('crypto');
const config = require('../config/config');
const Payment = require('../models/Payment');

let razorpayInstance = null;
if (
  config.paymentMode === 'razorpay' &&
  config.razorpay.keyId &&
  config.razorpay.keySecret
) {
  try {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret
    });
  } catch (err) {
    console.warn('⚠️ Razorpay package initialization error, defaulting to mock payment mode:', err.message);
  }
}

// Create payment order
const createPaymentOrder = async ({ bookingId, userId, amountPaise, currency = 'INR', receipt }) => {
  const isMock = config.paymentMode === 'mock' || !razorpayInstance;

  if (isMock) {
    // Deterministic, secure mock order for development
    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const payment = await Payment.create({
      booking: bookingId,
      user: userId,
      provider: 'mock',
      orderId: mockOrderId,
      amountPaise,
      currency,
      status: 'created'
    });

    return {
      provider: 'mock',
      orderId: mockOrderId,
      amountPaise,
      currency,
      isMock: true,
      notes: 'Local Development Simulation Mode'
    };
  }

  // Real Razorpay order creation
  try {
    const options = {
      amount: amountPaise, // in paise
      currency,
      receipt: receipt || `rcpt_${bookingId}`,
      payment_capture: 1
    };

    const order = await razorpayInstance.orders.create(options);

    await Payment.create({
      booking: bookingId,
      user: userId,
      provider: 'razorpay',
      orderId: order.id,
      amountPaise,
      currency,
      status: 'created'
    });

    return {
      provider: 'razorpay',
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      isMock: false
    };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw new Error(`Payment gateway order creation failed: ${error.message}`);
  }
};

// Verify payment signature
const verifyPaymentSignature = async ({ orderId, paymentId, signature, bookingId, userId }) => {
  const isMock = orderId.startsWith('order_mock_') || config.paymentMode === 'mock';

  if (isMock) {
    // For mock mode, simulate verification
    // Allow simulated success if paymentId is provided and does not equal 'FAIL'
    if (paymentId === 'FAIL' || signature === 'INVALID_SIGNATURE') {
      await Payment.findOneAndUpdate(
        { orderId },
        {
          status: 'failed',
          paymentId: paymentId || 'mock_failed',
          errorDetails: { code: 'PAYMENT_REJECTED', description: 'Simulated payment failure' }
        }
      );
      return { verified: false, error: 'Simulated payment declined' };
    }

    const mockPaymentId = paymentId || `pay_mock_${Date.now()}`;
    const mockSignature = signature || `mock_sig_${Date.now()}`;

    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: 'captured',
        paymentId: mockPaymentId,
        signature: mockSignature
      },
      { upsert: true }
    );

    return {
      verified: true,
      provider: 'mock',
      paymentId: mockPaymentId,
      orderId
    };
  }

  // Real Razorpay verification
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      await Payment.findOneAndUpdate(
        { orderId },
        {
          status: 'failed',
          paymentId,
          signature,
          errorDetails: { code: 'SIGNATURE_MISMATCH', description: 'Invalid cryptographic signature' }
        }
      );
      return { verified: false, error: 'Payment signature verification failed' };
    }

    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: 'captured',
        paymentId,
        signature
      }
    );

    return {
      verified: true,
      provider: 'razorpay',
      paymentId,
      orderId
    };
  } catch (error) {
    console.error('Payment signature check exception:', error);
    return { verified: false, error: error.message };
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature
};
