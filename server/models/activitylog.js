const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivityLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  asset: {
    type: Schema.Types.ObjectId,
    ref: 'Asset'
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'scanned', 'assigned', 'unassigned', 'maintenance', 'available']
  },
  details: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries by timestamp
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ user: 1 });
ActivityLogSchema.index({ asset: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);