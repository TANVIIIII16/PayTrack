const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const config = require('../config');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { HTTP_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const createPayment = async (req, res) => {
  try {
    const { school_id, trustee_id, student_info, gateway_name, order_amount } = req.body;

    // Generate custom order ID
    const customOrderId = `ORDER_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Create order
    const order = new Order({
      school_id,
      trustee_id,
      student_info,
      gateway_name,
      custom_order_id: customOrderId
    });

    const savedOrder = await order.save();

    // Create order status
    const orderStatus = new OrderStatus({
      collect_id: savedOrder._id,
      order_amount,
      transaction_amount: order_amount,
      payment_mode: 'pending',
      payment_details: 'Payment initiated',
      bank_reference: 'N/A',
      payment_message: 'Payment initiated',
      status: PAYMENT_STATUS.PENDING,
      error_message: 'NA'
    });

    await orderStatus.save();

    // Prepare payment gateway payload
    const paymentPayload = {
      pg_key: config.pgKey,
      school_id: config.schoolId,
      order_id: customOrderId,
      order_amount,
      student_info,
      gateway_name
    };

    // Generate JWT token for payment API
    const jwtToken = jwt.sign(paymentPayload, config.apiKey, { expiresIn: '1h' });

    logger.info('Payment created successfully', { 
      orderId: customOrderId, 
      schoolId: school_id,
      amount: order_amount 
    });

    // For demo purposes, return a mock payment URL
    return successResponse(res, HTTP_STATUS.CREATED, 'Payment initiated successfully', {
      order_id: customOrderId,
      payment_url: `https://payment-gateway.com/pay/${customOrderId}`,
      jwt_token: jwtToken
    });

  } catch (error) {
    logger.error('Payment creation failed', { 
      error: error.message, 
      schoolId: req.body.school_id,
      studentEmail: req.body.student_info?.email 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Payment creation failed', error.message);
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { customOrderId } = req.params;
    const order = await Order.findOne({ custom_order_id: customOrderId });
    
    if (!order) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Order not found');
    }

    const orderStatus = await OrderStatus.findOne({ collect_id: order._id });
    
    return successResponse(res, HTTP_STATUS.OK, 'Payment status retrieved successfully', {
      order_id: customOrderId,
      status: orderStatus?.status || PAYMENT_STATUS.PENDING,
      payment_details: orderStatus?.payment_details || 'N/A',
      payment_time: orderStatus?.payment_time || null,
      order_amount: orderStatus?.order_amount || null,
      transaction_amount: orderStatus?.transaction_amount || null
    });
  } catch (error) {
    logger.error('Failed to get payment status', { 
      error: error.message, 
      orderId: req.params.customOrderId 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get payment status', error.message);
  }
};

module.exports = {
  createPayment,
  getPaymentStatus
};
