const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, required: true },
  related_id: { type: mongoose.Schema.Types.ObjectId, required: false },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Thêm index để tối ưu truy vấn
NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.index({ user_id: 1, is_read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
