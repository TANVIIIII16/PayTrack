const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'school_admin', 'trustee'])
    .withMessage('Invalid role specified'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validatePaymentCreation = [
  body('school_id')
    .notEmpty()
    .withMessage('School ID is required'),
  
  body('trustee_id')
    .notEmpty()
    .withMessage('Trustee ID is required'),
  
  body('student_info.name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Student name must be between 2 and 100 characters'),
  
  body('student_info.id')
    .isLength({ min: 1, max: 50 })
    .withMessage('Student ID must be between 1 and 50 characters'),
  
  body('student_info.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid student email address'),
  
  body('gateway_name')
    .isIn(['PhonePe', 'Razorpay', 'PayU', 'Paytm', 'Stripe'])
    .withMessage('Invalid payment gateway specified'),
  
  body('order_amount')
    .isNumeric()
    .isFloat({ min: 0.01 })
    .withMessage('Order amount must be a positive number'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validatePaymentCreation
};
