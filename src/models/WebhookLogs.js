const mongoose = require('mongoose');

const webhookLogsSchema = new mongoose.Schema({
  order_id: { 
    type: String, 
    required: true,
    trim: true
  },
  webhook_payload: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['received', 'processed', 'failed'], 
    default: 'received' 
  },
  processed_at: { 
    type: Date, 
    default: Date.now 
  },
  error_message: { 
    type: String, 
    default: null,
    trim: true
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
webhookLogsSchema.index({ order_id: 1 });
webhookLogsSchema.index({ status: 1 });
webhookLogsSchema.index({ processed_at: -1 });
webhookLogsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WebhookLogs', webhookLogsSchema);
