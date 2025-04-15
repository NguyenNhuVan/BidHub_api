const express = require('express');
const NotificationController = require('../controllers/notificationController');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();

// Lấy thông báo chưa đọc
router.get('/unread', authenticate, NotificationController.getUnreadNotifications);

// Lấy tất cả thông báo
router.get('/all', authenticate, NotificationController.getAllNotifications);

// Đánh dấu đã đọc
router.patch('/:notificationId/read', authenticate, NotificationController.markAsRead);

module.exports = router;
