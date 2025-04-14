const Notification = require('../models/NotificationModel');

const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware auth
    const notifications = await Notification.find({ user_id: userId, is_read: false });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { is_read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

module.exports = { getUnreadNotifications, markAsRead };
