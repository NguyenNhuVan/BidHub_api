const jwt = require("jsonwebtoken");
const User = require('../models/userModel');
exports.checkRole = async (req, res) => {
  try {
    // Lấy token từ header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access token is required" });
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    const { _id, role } = decoded;
    console.log("role",role);
    // Tìm người dùng để xác nhận
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Trả về id và vai trò của người dùng
    return res.status(200).json({
      role: role
    });
  } catch (error) {
    console.error("Error checking role:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
