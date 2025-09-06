const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/transactions
// @desc    Get all transactions with pagination
// @access  Private (Admin, School Admin)
router.get('/', authenticateToken, authorizeRoles('admin', 'school_admin'), transactionController.getTransactions);

// @route   GET /api/transactions/school/:schoolId
// @desc    Get transactions for a specific school
// @access  Private (Admin, School Admin)
router.get('/school/:schoolId', authenticateToken, authorizeRoles('admin', 'school_admin'), transactionController.getSchoolTransactions);

// @route   GET /api/transactions/status/:customOrderId
// @desc    Get transaction status by order ID
// @access  Private
router.get('/status/:customOrderId', authenticateToken, transactionController.getTransactionStatus);

// @route   POST /api/transactions/dummy-data
// @desc    Create dummy transaction data for testing
// @access  Private (Admin only)
router.post('/dummy-data', authenticateToken, authorizeRoles('admin'), transactionController.createDummyData);

module.exports = router;
