const User = require('../models/userModel');
const Category = require("../models/categoryModel");
const { sendNotification } = require('../utils/sendNotification');

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

        // Kiểm tra role hiện tại (chỉ duyệt pending_expert)
        if (user.role !== 'pending_expert') {
            return res.status(400).json({
                success: false,
                message: 'Người dùng này không phải là ứng viên chuyên gia',
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

        // Gửi thông báo cho người dùng
        await sendNotification({
            userId: user._id,
            title: 'Đăng ký chuyên gia thành công',
            message: 'Chúc mừng! Đơn đăng ký làm chuyên gia của bạn đã được phê duyệt.',
            type: 'expert_approval',
            data: {
                status: 'approved',
                expertise: expertiseIds
            }
        });

        res.status(200).json({
            success: true,
            message: 'Duyệt chuyên gia thành công',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                expertise: user.expertise
            }
        });
    } catch (error) {
        console.error('Error in approveExpert:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi duyệt chuyên gia',
            error: error.message,
        });
    }
};

exports.rejectExpert = async (req, res) => {
    try {
        const { userId, reason } = req.body;

        // Kiểm tra userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu userId',
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        // Kiểm tra role hiện tại (chỉ từ chối pending_expert)
        if (user.role !== 'pending_expert') {
            return res.status(400).json({
                success: false,
                message: 'Người dùng này không phải là ứng viên chuyên gia',
            });
        }

        // Cập nhật thông tin người dùng về mặc định
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    role: 'user',
                    expertise: [],
                    qualifications: [],
                    experience_years: 0,
                    workload: 0,
                    'expert_application.status': 'rejected',
                    'expert_application.rejected_at': new Date(),
                    'expert_application.rejection_reason': reason || 'Không đủ điều kiện'
                }
            },
            { new: true }
        );

        // Gửi thông báo cho người dùng
        await sendNotification({
            userId: user._id,
            title: 'Đăng ký chuyên gia không thành công',
            message: `Rất tiếc! Đơn đăng ký làm chuyên gia của bạn đã bị từ chối. Lý do: ${reason || 'Không đủ điều kiện'}`,
            type: 'expert_rejection',
            data: {
                status: 'rejected',
                reason: reason || 'Không đủ điều kiện'
            }
        });

        res.status(200).json({
            success: true,
            message: 'Từ chối đăng ký chuyên gia thành công',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                expert_application: updatedUser.expert_application
            }
        });
    } catch (error) {
        console.error('Error in rejectExpert:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối đăng ký chuyên gia',
            error: error.message,
        });
    }
};

  
  