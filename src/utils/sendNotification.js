const Notification = require('../models/NotificationModel');

const connectedUsers = {}; // Lưu trữ người dùng đang kết nối (tạm thời)

const sendNotification = async (userId, message, type, auctionSessionId, io) => {
  try {
    // Tạo thông báo trong database
    const notification = new Notification({
      user_id: userId,
      message,
      type,
      auction_session_id: auctionSessionId
    });
    await notification.save();

    // Gửi thông báo qua Socket.IO
    if (io) {
      io.to(userId.toString()).emit('notification', {
        message,
        type,
        auctionSessionId,
        link: `/auctions/${auctionSessionId}`, // FE sẽ dùng đường dẫn này để chuyển trang
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Hàm để cập nhật connectedUsers khi người dùng kết nối
const updateConnectedUser = (userId, socketId) => {
  connectedUsers[userId] = socketId;
};

// Hàm để xóa người dùng khỏi connectedUsers khi ngắt kết nối
const removeConnectedUser = (userId) => {
  delete connectedUsers[userId];
};

module.exports = { 
  sendNotification, 
  updateConnectedUser, 
  removeConnectedUser
};
