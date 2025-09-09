const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'payment_time', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    const pipeline = [
      {
        $lookup: {
          from: 'orderstatuses',
          let: { orderId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$collect_id', '$$orderId'] } } },
            { $sort: { updatedAt: -1, payment_time: -1, createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'orderStatus'
        }
      },
      { $unwind: { path: '$orderStatus', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          collect_id: '$_id',
          school_id: '$school_id',
          gateway: '$gateway_name',
          order_amount: '$orderStatus.order_amount',
          transaction_amount: '$orderStatus.transaction_amount',
          status: '$orderStatus.status',
          custom_order_id: '$custom_order_id',
          payment_time: '$orderStatus.payment_time',
          payment_mode: '$orderStatus.payment_mode',
          bank_reference: '$orderStatus.bank_reference',
          payment_message: '$orderStatus.payment_message',
          payment_details: '$orderStatus.payment_details',
          student_info: '$student_info',
          createdAt: '$createdAt',
          updatedAt: '$updatedAt'
        }
      },
      { $sort: { [sortBy]: sortDirection } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    const transactions = result[0].data;
    const totalCount = result[0].totalCount[0]?.count || 0;

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };

    logger.info('Transactions retrieved successfully', { 
      count: transactions.length, 
      page: parseInt(page),
      totalCount 
    });

    return paginatedResponse(res, transactions, pagination, 'Transactions retrieved successfully');
  } catch (error) {
    logger.error('Failed to fetch transactions', { error: error.message });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to fetch transactions', error.message);
  }
};

const getSchoolTransactions = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { page = 1, limit = 10, sortBy = 'payment_time', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    const pipeline = [
      { $match: { school_id: schoolId } },
      {
        $lookup: {
          from: 'orderstatuses',
          let: { orderId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$collect_id', '$$orderId'] } } },
            { $sort: { updatedAt: -1, payment_time: -1, createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'orderStatus'
        }
      },
      { $unwind: { path: '$orderStatus', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          collect_id: '$_id',
          school_id: '$school_id',
          gateway: '$gateway_name',
          order_amount: '$orderStatus.order_amount',
          transaction_amount: '$orderStatus.transaction_amount',
          status: '$orderStatus.status',
          custom_order_id: '$custom_order_id',
          payment_time: '$orderStatus.payment_time',
          payment_mode: '$orderStatus.payment_mode',
          bank_reference: '$orderStatus.bank_reference',
          payment_message: '$orderStatus.payment_message',
          payment_details: '$orderStatus.payment_details',
          student_info: '$student_info',
          createdAt: '$createdAt',
          updatedAt: '$updatedAt'
        }
      },
      { $sort: { [sortBy]: sortDirection } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    const transactions = result[0].data;
    const totalCount = result[0].totalCount[0]?.count || 0;

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };

    logger.info('School transactions retrieved successfully', { 
      schoolId, 
      count: transactions.length, 
      page: parseInt(page),
      totalCount 
    });

    return paginatedResponse(res, transactions, pagination, 'School transactions retrieved successfully');
  } catch (error) {
    logger.error('Failed to fetch school transactions', { 
      error: error.message, 
      schoolId: req.params.schoolId 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to fetch school transactions', error.message);
  }
};

const getTransactionStatus = async (req, res) => {
  try {
    const { customOrderId } = req.params;

    const pipeline = [
      { $match: { custom_order_id: customOrderId } },
      {
        $lookup: {
          from: 'orderstatuses',
          let: { orderId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$collect_id', '$$orderId'] } } },
            { $sort: { updatedAt: -1, payment_time: -1, createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'orderStatus'
        }
      },
      { $unwind: { path: '$orderStatus', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          collect_id: '$_id',
          school_id: '$school_id',
          gateway: '$gateway_name',
          order_amount: '$orderStatus.order_amount',
          transaction_amount: '$orderStatus.transaction_amount',
          status: '$orderStatus.status',
          custom_order_id: '$custom_order_id',
          payment_time: '$orderStatus.payment_time',
          payment_mode: '$orderStatus.payment_mode',
          bank_reference: '$orderStatus.bank_reference',
          payment_message: '$orderStatus.payment_message',
          payment_details: '$orderStatus.payment_details',
          student_info: '$student_info',
          createdAt: '$createdAt',
          updatedAt: '$updatedAt'
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    
    if (result.length === 0) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Transaction not found');
    }

    logger.info('Transaction status retrieved successfully', { orderId: customOrderId });

    return successResponse(res, HTTP_STATUS.OK, 'Transaction status retrieved successfully', result[0]);
  } catch (error) {
    logger.error('Failed to get transaction status', { 
      error: error.message, 
      orderId: req.params.customOrderId 
    });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get transaction status', error.message);
  }
};

const createDummyData = async (req, res) => {
  try {
    // Create dummy orders
    const dummyOrders = [
      {
        school_id: '65b0e6293e9f76a9694d84b4',
        trustee_id: '65b0e552dd31950a9b41c5ba',
        student_info: {
          name: 'John Doe',
          id: 'STU001',
          email: 'john.doe@school.com'
        },
        gateway_name: 'PhonePe',
        custom_order_id: 'ORDER_001'
      },
      {
        school_id: '65b0e6293e9f76a9694d84b4',
        trustee_id: '65b0e552dd31950a9b41c5ba',
        student_info: {
          name: 'Jane Smith',
          id: 'STU002',
          email: 'jane.smith@school.com'
        },
        gateway_name: 'Razorpay',
        custom_order_id: 'ORDER_002'
      }
    ];

    const createdOrders = await Order.insertMany(dummyOrders);

    // Create dummy order statuses
    const dummyOrderStatuses = [
      {
        collect_id: createdOrders[0]._id,
        order_amount: 2000,
        transaction_amount: 2200,
        payment_mode: 'upi',
        payment_details: 'success@ybl',
        bank_reference: 'YESBNK222',
        payment_message: 'payment success',
        status: 'success',
        error_message: 'NA',
        payment_time: new Date()
      },
      {
        collect_id: createdOrders[1]._id,
        order_amount: 1500,
        transaction_amount: 1500,
        payment_mode: 'card',
        payment_details: 'Card ending in 1234',
        bank_reference: 'HDFC123',
        payment_message: 'payment success',
        status: 'success',
        error_message: 'NA',
        payment_time: new Date()
      }
    ];

    await OrderStatus.insertMany(dummyOrderStatuses);

    logger.info('Dummy data created successfully', { orderCount: createdOrders.length });

    return successResponse(res, HTTP_STATUS.CREATED, 'Dummy data created successfully');
  } catch (error) {
    logger.error('Failed to create dummy data', { error: error.message });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to create dummy data', error.message);
  }
};

module.exports = {
  getTransactions,
  getSchoolTransactions,
  getTransactionStatus,
  createDummyData
};
