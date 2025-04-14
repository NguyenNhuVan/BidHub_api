const Notification = require('../models/NotificationModel');

// Lấy tất cả thông báo của người dùng (đã đọc và chưa đọc)
const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy từ middleware auth
    const notifications = await Notification.find({ user_id: userId })
      .sort({ created_at: -1 }) // Sắp xếp theo thời gian mới nhất
      .limit(50); // Giới hạn 50 thông báo
    
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

// Lấy thông báo chưa đọc
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy từ middleware auth
    const notifications = await Notification.find({ user_id: userId, is_read: false })
      .sort({ created_at: -1 }); // Sắp xếp theo thời gian mới nhất
    
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Error fetching unread notifications:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch unread notifications' });
  }
};

// Đánh dấu thông báo là đã đọc
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { is_read: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
};

// Đánh dấu tất cả thông báo là đã đọc
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy từ middleware auth
    await Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ success: false, error: 'Failed to mark all notifications as read' });
  }
};

// Xóa thông báo
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndDelete(notificationId);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
};

// Lấy số lượng thông báo chưa đọc
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy từ middleware auth
    const count = await Notification.countDocuments({ user_id: userId, is_read: false });
    res.json({ success: true, count });
  } catch (err) {
    console.error('Error getting unread notification count:', err);
    res.status(500).json({ success: false, error: 'Failed to get unread notification count' });
  }
};

module.exports = { 
  getAllNotifications, 
  getUnreadNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getUnreadCount
};
