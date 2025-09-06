const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  school_id: { 
    type: String, 
    required: true,
    trim: true
  },
  trustee_id: { 
    type: String, 
    required: true,
    trim: true
  },
  student_info: {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    id: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 50
    },
    email: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  gateway_name: { 
    type: String, 
    required: true,
    trim: true,
    enum: ['PhonePe', 'Razorpay', 'PayU', 'Paytm', 'Stripe']
  },
  custom_order_id: { 
    type: String, 
    unique: true, 
    required: true,
    trim: true
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
orderSchema.index({ custom_order_id: 1 });
orderSchema.index({ school_id: 1 });
orderSchema.index({ trustee_id: 1 });
orderSchema.index({ 'student_info.email': 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
