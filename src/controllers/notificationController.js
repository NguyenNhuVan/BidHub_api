const Notification = require('../models/NotificationModel');

const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy từ middleware auth
    console.log('Getting unread notifications for user:', userId);
    
    const notifications = await Notification.find({ 
      user_id: userId, 
      is_read: false 
    }).sort({ created_at: -1 });
    
    console.log(`Found ${notifications.length} unread notifications`);
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user_id: userId },
      { is_read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found or not owned by user' 
      });
    }
    
    console.log('Notification marked as read:', notification);
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting all notifications for user:', userId);
    
    const notifications = await Notification.find({ 
      user_id: userId 
    }).sort({ created_at: -1 });
    
    console.log(`Found ${notifications.length} notifications`);
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Error fetching all notifications:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};


const getAllNotificationsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Tìm tất cả các thông báo của user dựa trên user_id
    const notifications = await Notification.find({ user_id })
      .sort({ created_at: -1 }) // Sắp xếp theo thời gian tạo (mới nhất trước)
      .populate('user_id', 'name email') // Tùy chọn populate thêm thông tin user nếu cần
      .exec();

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
    });
  }
};

module.exports = { 
  getUnreadNotifications, 
  markAsRead,
  getAllNotifications,
  getAllNotificationsByUserId 
};
