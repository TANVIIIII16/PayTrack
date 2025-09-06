const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const paymentRoutes = require('./payment');
const transactionRoutes = require('./transaction');
const webhookRoutes = require('./webhook');

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'School Payment API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/payment', paymentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/webhook', webhookRoutes);

module.exports = router;
