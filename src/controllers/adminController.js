const User = require('../models/userModel');
const Category = require("../models/categoryModel");

exports.approveExpert = async (req, res) => {
    try {
      const { userId, expertiseIds } = req.body;
  
      // Kiểm tra xem userId và expertiseIds đã được gửi hay chưa
      if (!userId || !expertiseIds || !Array.isArray(expertiseIds)) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu userId hoặc danh sách expertiseIds',
        });
      }
  
      // Tìm user theo ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }
  
      // Kiểm tra role hiện tại (chỉ duyệt user)
      if (user.role === 'expert') {
        return res.status(400).json({
          success: false,
          message: 'Người dùng này đã là chuyên gia',
        });
      }
  
      // Kiểm tra các chuyên môn hợp lệ
      const validCategories = await Category.find({
        _id: { $in: expertiseIds },
      });
  
      if (validCategories.length !== expertiseIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Một số chuyên môn không hợp lệ',
        });
      }
  
      // Cập nhật role và chuyên môn
      user.role = 'expert';
      user.expertise = expertiseIds;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'Duyệt chuyên gia thành công',
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi duyệt chuyên gia',
        error: error.message,
      });
    }
  };

  
  