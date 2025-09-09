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
      order_id: webhookData?.order_info?.order_id || webhookData?.order_id,
      webhook_payload: webhookData,
      status: WEBHOOK_STATUS.RECEIVED
    });

    await webhookLog.save();

    // Find the order
    const orderId = webhookData?.order_info?.order_id || webhookData?.order_id;
    const order = await Order.findOne({ 
      custom_order_id: orderId 
    });

    if (!order) {
      webhookLog.status = WEBHOOK_STATUS.FAILED;
      webhookLog.error_message = 'Order not found';
      await webhookLog.save();
      
      logger.error('Webhook processing failed - Order not found', { 
        orderId 
      });
      
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Order not found');
    }

    // Normalize incoming fields (handle typos/variants from provider)
    const info = webhookData.order_info || webhookData || {};
    const toNumber = (v) => {
      if (v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
      };
    const normalized = {
      order_amount: toNumber(info.order_amount ?? info.amount),
      transaction_amount: toNumber(info.transaction_amount ?? info.amount),
      payment_mode: (info.payment_mode ?? info.payment_method ?? 'pending').toString(),
      payment_details: (info.payment_details ?? info.payemnt_details ?? info.details ?? '').toString(),
      bank_reference: (info.bank_reference ?? info.transaction_id ?? info.txn_id ?? info.reference ?? 'N/A').toString(),
      payment_message: (info.payment_message ?? info.Payment_message ?? info.message ?? '').toString(),
      status: (info.status || 'pending').toLowerCase(),
      error_message: (info.error_message ?? 'NA').toString(),
      payment_time: info.payment_time ? new Date(info.payment_time) : new Date()
    };

    // Fetch current status for downgrade protection
    let orderStatus = await OrderStatus.findOne({ collect_id: order._id });

    // Prevent downgrades: once success, do not allow pending/failed/cancelled to overwrite
    if (orderStatus && orderStatus.status === 'success' && normalized.status !== 'success') {
      logger.warn('Ignoring webhook status downgrade after success', { orderId, incoming: normalized.status });
      webhookLog.status = WEBHOOK_STATUS.PROCESSED;
      await webhookLog.save();
      return successResponse(res, HTTP_STATUS.OK, 'Webhook received (ignored downgrade)', { order_id: orderId, status: orderStatus.status });
    }

    // Build update object atomically
    const update = {
      order_amount: normalized.order_amount ?? orderStatus?.order_amount ?? 0,
      transaction_amount: normalized.transaction_amount ?? orderStatus?.transaction_amount ?? 0,
      payment_mode: normalized.payment_mode,
      payment_details: normalized.payment_details || orderStatus?.payment_details || 'N/A',
      bank_reference: normalized.bank_reference || orderStatus?.bank_reference || 'N/A',
      payment_message: normalized.payment_message || orderStatus?.payment_message || 'N/A',
      status: normalized.status,
      error_message: normalized.error_message || orderStatus?.error_message || 'NA',
      payment_time: normalized.payment_time || orderStatus?.payment_time || new Date()
    };

    if (orderStatus) {
      Object.assign(orderStatus, update);
      await orderStatus.save();
    } else {
      orderStatus = new OrderStatus({ collect_id: order._id, ...update });
      await orderStatus.save();
    }

    // Update webhook log status
    webhookLog.status = WEBHOOK_STATUS.PROCESSED;
    await webhookLog.save();

    logger.info('Webhook processed successfully', { 
      orderId,
      status: update.status 
    });

    return successResponse(res, HTTP_STATUS.OK, 'Webhook processed successfully', {
      order_id: orderId,
      status: update.status
    });

  } catch (error) {
    logger.error('Webhook processing failed', { 
      error: error.message,
      orderId: req.body?.order_info?.order_id || req.body?.order_id 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Webhook processing failed', error.message);
  }
};

module.exports = {
  processWebhook
};
