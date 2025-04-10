const checkLocation = async (req, res, next) => {
    try {
        // Kiểm tra xem user đã có location chưa
        const user = await User.findById(req.user.id);
        
        if (!user.location.latitude || !user.location.longitude) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cho phép truy cập vị trí để đăng bài",
                requireLocation: true
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi kiểm tra vị trí",
            error: error.message
        });
    }
};

module.exports = { checkLocation, getCurrentLocation };
