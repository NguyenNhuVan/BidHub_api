const Notification = require('../models/NotificationModel');

const connectedUsers = {}; // Lưu trữ người dùng đang kết nối (tạm thời)

const sendNotification = async (userId, content, type, relatedId, io) => {
  try {
    console.log('sendNotification called with:', { userId, content, type, relatedId });
    
    // Tạo và lưu thông báo vào database
    const notification = new Notification({
      user_id: userId,
      content,
      type,
      related_id: relatedId
    });
    
    // Lưu vào database
    const savedNotification = await notification.save();
    console.log('Notification saved to database:', savedNotification);

    // Gửi thông báo qua Socket.IO nếu có io
    if (io) {
      io.to(userId.toString()).emit('notification', {
        content,
        type,
        relatedId,
        link: `/auction/${relatedId}`, // FE sẽ dùng đường dẫn này để chuyển trang
        timestamp: new Date()
      });
      console.log('Notification sent via Socket.IO to user:', userId);
    } else {
      console.log('Socket.IO not available, notification only saved to database');
    }
    
    return savedNotification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error; // Ném lỗi để controller có thể xử lý
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
