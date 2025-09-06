const mongoose = require('mongoose');

const orderStatusSchema = new mongoose.Schema({
  collect_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  order_amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  transaction_amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  payment_mode: { 
    type: String, 
    required: true,
    trim: true,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'pending']
  },
  payment_details: { 
    type: String, 
    required: true,
    trim: true
  },
  bank_reference: { 
    type: String, 
    required: true,
    trim: true
  },
  payment_message: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  error_message: { 
    type: String, 
    default: 'NA',
    trim: true
  },
  payment_time: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
orderStatusSchema.index({ collect_id: 1 });
orderStatusSchema.index({ status: 1 });
orderStatusSchema.index({ payment_time: -1 });
orderStatusSchema.index({ createdAt: -1 });

module.exports = mongoose.model('OrderStatus', orderStatusSchema);
