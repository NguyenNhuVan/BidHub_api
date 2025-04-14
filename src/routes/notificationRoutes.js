const express = require('express');
const NotificationController = require('../controllers/notificationController');
const router = express.Router();

router.get('/getNotifications', NotificationController.getUnreadNotifications); // Lấy thông báo chưa đọc
router.patch('/notifications/:notificationId/read', NotificationController.markAsRead); // Đánh dấu đã đọc

module.exports = router;
