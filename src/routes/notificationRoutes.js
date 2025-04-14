const express = require('express');
const NotificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authenticate');
const router = express.Router();

// Tất cả các routes đều yêu cầu xác thực
router.use(authenticate);

// Lấy tất cả thông báo
router.get('/', NotificationController.getAllNotifications);

// Lấy thông báo chưa đọc
router.get('/unread', NotificationController.getUnreadNotifications);

// Lấy số lượng thông báo chưa đọc
router.get('/unread/count', NotificationController.getUnreadCount);

// Đánh dấu thông báo là đã đọc
router.patch('/:notificationId/read', NotificationController.markAsRead);

// Đánh dấu tất cả thông báo là đã đọc
router.patch('/read-all', NotificationController.markAllAsRead);

// Xóa thông báo
router.delete('/:notificationId', NotificationController.deleteNotification);

module.exports = router;
