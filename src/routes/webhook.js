const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// @route   POST /api/webhook
// @desc    Process payment webhook
// @access  Public (called by payment gateway)
router.post('/', webhookController.processWebhook);

module.exports = router;
