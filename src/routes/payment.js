const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { validatePaymentCreation } = require('../middleware/validation');

// @route   POST /api/payment/create-payment
// @desc    Create a new payment
// @access  Private
router.post('/create-payment', authenticateToken, validatePaymentCreation, paymentController.createPayment);

// @route   GET /api/payment/status/:customOrderId
// @desc    Get payment status by order ID
// @access  Private
router.get('/status/:customOrderId', authenticateToken, paymentController.getPaymentStatus);

// @route   POST /api/payment/callback
// @desc    Handle payment completion callback
// @access  Public
router.post('/callback', paymentController.handlePaymentCallback);

module.exports = router;
