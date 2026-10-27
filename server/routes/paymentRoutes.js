const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  handleWebhook
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
