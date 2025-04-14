const multer = require('multer');

// Cấu hình multer để lưu file vào memory (sẽ gửi trực tiếp lên S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn file 5MB
  },
});

module.exports = upload;