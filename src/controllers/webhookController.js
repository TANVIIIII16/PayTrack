const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const WebhookLogs = require('../models/WebhookLogs');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { HTTP_STATUS, WEBHOOK_STATUS } = require('../utils/constants');

const processWebhook = async (req, res) => {
  try {
    const webhookData = req.body;

    // Log webhook payload
    const webhookLog = new WebhookLogs({
      order_id: webhookData.order_info.order_id,
      webhook_payload: webhookData,
      status: WEBHOOK_STATUS.RECEIVED
    });

    await webhookLog.save();

    // Find the order
    const order = await Order.findOne({ 
      custom_order_id: webhookData.order_info.order_id 
    });

    if (!order) {
      webhookLog.status = WEBHOOK_STATUS.FAILED;
      webhookLog.error_message = 'Order not found';
      await webhookLog.save();
      
      logger.error('Webhook processing failed - Order not found', { 
        orderId: webhookData.order_info.order_id 
      });
      
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Order not found');
    }

    // Update order status
    const orderStatus = await OrderStatus.findOne({ 
      collect_id: order._id 
    });

    if (orderStatus) {
      orderStatus.order_amount = webhookData.order_info.order_amount;
      orderStatus.transaction_amount = webhookData.order_info.transaction_amount;
      orderStatus.payment_mode = webhookData.order_info.payment_mode;
      orderStatus.payment_details = webhookData.order_info.payemnt_details;
      orderStatus.bank_reference = webhookData.order_info.bank_reference;
      orderStatus.payment_message = webhookData.order_info.Payment_message;
      orderStatus.status = webhookData.order_info.status;
      orderStatus.error_message = webhookData.order_info.error_message;
      orderStatus.payment_time = new Date(webhookData.order_info.payment_time);

      await orderStatus.save();
    } else {
      // Create new order status
      const newOrderStatus = new OrderStatus({
        collect_id: order._id,
        order_amount: webhookData.order_info.order_amount,
        transaction_amount: webhookData.order_info.transaction_amount,
        payment_mode: webhookData.order_info.payment_mode,
        payment_details: webhookData.order_info.payemnt_details,
        bank_reference: webhookData.order_info.bank_reference,
        payment_message: webhookData.order_info.Payment_message,
        status: webhookData.order_info.status,
        error_message: webhookData.order_info.error_message,
        payment_time: new Date(webhookData.order_info.payment_time)
      });

      await newOrderStatus.save();
    }

    // Update webhook log status
    webhookLog.status = WEBHOOK_STATUS.PROCESSED;
    await webhookLog.save();

    logger.info('Webhook processed successfully', { 
      orderId: webhookData.order_info.order_id,
      status: webhookData.order_info.status 
    });

    return successResponse(res, HTTP_STATUS.OK, 'Webhook processed successfully', {
      order_id: webhookData.order_info.order_id,
      status: webhookData.order_info.status
    });

  } catch (error) {
    logger.error('Webhook processing failed', { 
      error: error.message,
      orderId: req.body?.order_info?.order_id 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Webhook processing failed', error.message);
  }
};

module.exports = {
  processWebhook
};
