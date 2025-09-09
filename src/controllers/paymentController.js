const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const config = require('../config');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { HTTP_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const createPayment = async (req, res) => {
  try {
    const { school_id, trustee_id, student_info, gateway_name, order_amount, callback_url } = req.body;

    // Generate custom order ID
    const customOrderId = `ORDER_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Create order
    const order = new Order({
      school_id,
      trustee_id,
      student_info,
      gateway_name,
      custom_order_id: customOrderId,
      order_amount,
      callback_url
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

    // Generate JWT for external API call
    const jwtPayload = {
      school_id,
      amount: order_amount.toString(),
      callback_url: callback_url || `${req.protocol}://${req.get('host')}/api/payment/callback`
    };
    const jwtToken = jwt.sign(jwtPayload, config.pgSecretKey || 'fallback-secret', { expiresIn: '1h' });

    // Check if external API credentials are available
    if (!config.pgSecretKey || !config.apiKey) {
      logger.warn('External API credentials not configured, using fallback mode', { 
        orderId: customOrderId,
        hasPgSecretKey: !!config.pgSecretKey,
        hasApiKey: !!config.apiKey
      });
      
      // Fallback to internal payment URL if external API credentials are not configured
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        order_id: customOrderId,
        payment_url: `${req.protocol}://${req.get('host')}/api/payment/process/${customOrderId}`,
        message: 'Payment initiated successfully (fallback mode)'
      });
    }

    // Call external payment API
    try {
      const externalApiResponse = await axios.post('https://dev-vanilla.edviron.com/erp/create-collect-request', {
        school_id,
        amount: order_amount.toString(),
        callback_url: callback_url || `${req.protocol}://${req.get('host')}/api/payment/callback`,
        sign: jwtToken
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      // Update order with external API response
      if (externalApiResponse.data && externalApiResponse.data.collect_request_id) {
        order.external_collect_id = externalApiResponse.data.collect_request_id;
        order.external_payment_url = externalApiResponse.data.Collect_request_url;
        await order.save();

        logger.info('Payment created successfully with external API', { 
          orderId: customOrderId, 
          collectRequestId: externalApiResponse.data.collect_request_id,
          schoolId: school_id,
          amount: order_amount,
          externalResponse: externalApiResponse.data
        });

        // Extract payment URL from external response
        let paymentUrl = externalApiResponse.data.Collect_request_url || 
                        externalApiResponse.data.collect_request_url ||
                        externalApiResponse.data.payment_url ||
                        externalApiResponse.data.url;

        // If payment URL is not in the response, try to extract it from the JWT token
        if (!paymentUrl && externalApiResponse.data.sign) {
          try {
            const decodedToken = jwt.decode(externalApiResponse.data.sign);
            if (decodedToken && decodedToken.collect_request_url) {
              paymentUrl = decodedToken.collect_request_url;
            }
          } catch (jwtError) {
            logger.warn('Failed to decode JWT token for payment URL', { error: jwtError.message });
          }
        }

        return res.status(HTTP_STATUS.CREATED).json({
          success: true,
          order_id: customOrderId,
          collect_request_id: externalApiResponse.data.collect_request_id,
          payment_url: paymentUrl,
          message: 'Payment initiated successfully'
        });
      } else {
        throw new Error('Invalid response from external API');
      }
    } catch (externalError) {
      logger.error('External payment API call failed', { 
        error: externalError.message,
        response: externalError.response?.data,
        orderId: customOrderId 
      });
      
      // Fallback to internal payment URL if external API fails
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        order_id: customOrderId,
        payment_url: `${req.protocol}://${req.get('host')}/api/payment/process/${customOrderId}`,
        message: 'Payment initiated successfully (fallback mode)'
      });
    }

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
    
    // If order has external collect ID, check external API for latest status
    if (order.external_collect_id) {
      try {
        const statusJWT = jwt.sign({
          school_id: order.school_id,
          collect_request_id: order.external_collect_id
        }, config.pgSecretKey, { expiresIn: '1h' });

        const externalStatusResponse = await axios.get(
          `https://dev-vanilla.edviron.com/erp/collect-request/${order.external_collect_id}`,
          {
            params: {
              school_id: order.school_id,
              sign: statusJWT
            },
            headers: {
              'Authorization': `Bearer ${config.apiKey}`
            }
          }
        );

        if (externalStatusResponse.data) {
          // Normalize external response and persist more fields
          const ex = externalStatusResponse.data;
          const normalized = {
            status: (ex.status || '').toLowerCase(),
            amount: ex.amount ?? orderStatus?.order_amount ?? null,
            payment_methods: ex.details?.payment_methods || ex.payment_method || orderStatus?.payment_mode || null,
            transaction_id: ex.transaction_id || ex.bank_reference || null,
            message: ex.message || ex.payment_message || null
          };

          if (orderStatus) {
            if (normalized.status) orderStatus.status = normalized.status;
            if (normalized.payment_methods != null) orderStatus.payment_mode = normalized.payment_methods;
            if (normalized.transaction_id != null) orderStatus.bank_reference = normalized.transaction_id;
            if (normalized.message != null) orderStatus.payment_message = normalized.message;
            if (normalized.amount != null) {
              orderStatus.order_amount = normalized.amount;
              if (normalized.status === 'success') {
                orderStatus.transaction_amount = normalized.amount;
              }
            }
            await orderStatus.save();
          }

          logger.info('External payment status retrieved', { 
            orderId: customOrderId,
            externalStatus: normalized.status,
            collectRequestId: order.external_collect_id
          });

          return successResponse(res, HTTP_STATUS.OK, 'Payment status retrieved successfully', {
            order_id: customOrderId,
            collect_request_id: order.external_collect_id,
            status: normalized.status || orderStatus?.status || PAYMENT_STATUS.PENDING,
            amount: normalized.amount ?? orderStatus?.order_amount ?? null,
            payment_details: normalized.payment_methods || 'N/A',
            payment_time: orderStatus?.payment_time || null,
            order_amount: orderStatus?.order_amount || null,
            transaction_amount: orderStatus?.transaction_amount || null,
            external_jwt: ex.jwt
          });
        }
      } catch (externalError) {
        logger.error('Failed to get external payment status', { 
          error: externalError.message,
          orderId: customOrderId,
          collectRequestId: order.external_collect_id
        });
        // Fall through to return local status
      }
    }
    
    // Return local status if external API is unavailable or not applicable
    return successResponse(res, HTTP_STATUS.OK, 'Payment status retrieved successfully', {
      order_id: customOrderId,
      status: orderStatus?.status || PAYMENT_STATUS.PENDING,
      payment_details: orderStatus?.payment_details || 'N/A',
      payment_time: orderStatus?.payment_time || null,
      order_amount: orderStatus?.order_amount || null,
      transaction_amount: orderStatus?.transaction_amount || null,
      bank_reference: orderStatus?.bank_reference || null,
      payment_message: orderStatus?.payment_message || null,
      payment_mode: orderStatus?.payment_mode || null
    });
  } catch (error) {
    logger.error('Failed to get payment status', { 
      error: error.message, 
      orderId: req.params.customOrderId 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get payment status', error.message);
  }
};

// Create collect request - External API integration
const createCollectRequest = async (req, res) => {
  try {
    const { school_id, amount, callback_url, sign } = req.body;

    // Verify the JWT signature
    try {
      const decoded = jwt.verify(sign, config.pgSecretKey);
      if (decoded.school_id !== school_id || 
          decoded.amount !== amount || 
          decoded.callback_url !== callback_url) {
        return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid JWT payload');
      }
    } catch (jwtError) {
      logger.error('JWT verification failed', { error: jwtError.message });
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid JWT signature');
    }

    // Generate unique collect request ID
    const collectRequestId = uuidv4().replace(/-/g, '');

    // Create order in database
    const order = new Order({
      school_id,
      custom_order_id: collectRequestId,
      order_amount: amount,
      callback_url
    });

    await order.save();

    // Create order status
    const orderStatus = new OrderStatus({
      collect_id: order._id,
      order_amount: amount,
      transaction_amount: amount,
      payment_mode: 'pending',
      payment_details: 'Payment initiated',
      bank_reference: 'N/A',
      payment_message: 'Payment initiated',
      status: PAYMENT_STATUS.PENDING,
      error_message: 'NA'
    });

    await orderStatus.save();

    // Generate payment URL (mock for now - replace with actual payment gateway URL)
    const collectRequestUrl = `https://dev-vanilla.edviron.com/payment/${collectRequestId}`;

    // Generate response JWT
    const responsePayload = {
      collect_request_id: collectRequestId,
      school_id,
      amount,
      status: 'initiated'
    };
    const responseSign = jwt.sign(responsePayload, config.pgSecretKey, { expiresIn: '1h' });

    logger.info('Collect request created successfully', { 
      collectRequestId, 
      schoolId: school_id,
      amount 
    });

    return res.status(HTTP_STATUS.CREATED).json({
      collect_request_id: collectRequestId,
      Collect_request_url: collectRequestUrl,
      sign: responseSign
    });

  } catch (error) {
    logger.error('Collect request creation failed', { 
      error: error.message, 
      schoolId: req.body.school_id 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Collect request creation failed', error.message);
  }
};

// Check collect request status - External API integration
const getCollectRequestStatus = async (req, res) => {
  try {
    const { collect_request_id } = req.params;
    const { school_id, sign } = req.query;

    // Verify the JWT signature
    try {
      const decoded = jwt.verify(sign, config.pgSecretKey);
      if (decoded.school_id !== school_id || 
          decoded.collect_request_id !== collect_request_id) {
        return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid JWT payload');
      }
    } catch (jwtError) {
      logger.error('JWT verification failed', { error: jwtError.message });
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid JWT signature');
    }

    // Find order by collect request ID
    const order = await Order.findOne({ custom_order_id: collect_request_id });
    
    if (!order) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Collect request not found');
    }

    const orderStatus = await OrderStatus.findOne({ collect_id: order._id });
    
    if (!orderStatus) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Order status not found');
    }

    // Generate response JWT
    const responsePayload = {
      collect_request_id,
      school_id,
      status: orderStatus.status,
      amount: orderStatus.order_amount
    };
    const responseJwt = jwt.sign(responsePayload, config.pgSecretKey, { expiresIn: '1h' });

    return res.status(HTTP_STATUS.OK).json({
      status: orderStatus.status.toUpperCase(),
      amount: orderStatus.order_amount,
      details: {
        payment_methods: orderStatus.payment_mode !== 'pending' ? orderStatus.payment_mode : null
      },
      jwt: responseJwt
    });

  } catch (error) {
    logger.error('Failed to get collect request status', { 
      error: error.message, 
      collectRequestId: req.params.collect_request_id 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get collect request status', error.message);
  }
};

// Handle payment completion callback
const handlePaymentCallback = async (req, res) => {
  try {
    const { collect_request_id, status, amount, payment_method, transaction_id } = req.body;

    logger.info('Payment callback received', { 
      collectRequestId: collect_request_id,
      status,
      amount,
      paymentMethod: payment_method
    });

    // Find order by external collect ID
    const order = await Order.findOne({ external_collect_id: collect_request_id });
    
    if (!order) {
      logger.error('Order not found for callback', { collectRequestId: collect_request_id });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    const orderStatus = await OrderStatus.findOne({ collect_id: order._id });
    
    if (orderStatus) {
      orderStatus.status = status.toLowerCase();
      orderStatus.payment_mode = payment_method || 'unknown';
      orderStatus.payment_details = `Payment completed via ${payment_method || 'unknown'}`;
      orderStatus.bank_reference = transaction_id || 'N/A';
      orderStatus.payment_message = `Payment ${status.toLowerCase()}`;
      orderStatus.payment_time = new Date();
      
      if (status.toLowerCase() === 'success') {
        orderStatus.transaction_amount = amount;
      }
      
      await orderStatus.save();
    }

    logger.info('Payment callback processed successfully', { 
      orderId: order.custom_order_id,
      collectRequestId: collect_request_id,
      status
    });

    // Redirect to callback URL if provided
    if (order.callback_url) {
      return res.redirect(`${order.callback_url}?status=${status}&order_id=${order.custom_order_id}`);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Callback processed successfully',
      order_id: order.custom_order_id,
      status: status.toLowerCase()
    });

  } catch (error) {
    logger.error('Payment callback processing failed', { 
      error: error.message,
      body: req.body
    });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Callback processing failed'
    });
  }
};

module.exports = {
  createPayment,
  getPaymentStatus,
  createCollectRequest,
  getCollectRequestStatus,
  handlePaymentCallback
};
