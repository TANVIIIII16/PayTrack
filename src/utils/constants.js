const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

const USER_ROLES = {
  ADMIN: 'admin',
  SCHOOL_ADMIN: 'school_admin',
  TRUSTEE: 'trustee'
};

const PAYMENT_GATEWAYS = {
  PHONEPE: 'PhonePe',
  RAZORPAY: 'Razorpay',
  PAYU: 'PayU',
  PAYTM: 'Paytm',
  STRIPE: 'Stripe'
};

const PAYMENT_MODES = {
  UPI: 'upi',
  CARD: 'card',
  NETBANKING: 'netbanking',
  WALLET: 'wallet',
  PENDING: 'pending'
};

const WEBHOOK_STATUS = {
  RECEIVED: 'received',
  PROCESSED: 'processed',
  FAILED: 'failed'
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

module.exports = {
  PAYMENT_STATUS,
  USER_ROLES,
  PAYMENT_GATEWAYS,
  PAYMENT_MODES,
  WEBHOOK_STATUS,
  HTTP_STATUS
};
