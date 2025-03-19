const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/generationToken');
const User = require('../models/userModel');
const { isEmail, checkPassword } = require('../utils/validation');
const saltRounds = 10;






exports.registerUser = async (req, res) => {
  try {
    const {
      name: namePayload,
      email: emailPayload,
      password: passwordPayload,
      role_id: rolePayload,
    } = req.body;

    // Kiểm tra email có hợp lệ không
    if (!isEmail(emailPayload)) {
      return res.status(403).json({
        title: "Lỗi cú pháp",
        message: "Email không hợp lệ",
      });
    }

    // Kiểm tra mật khẩu có hợp lệ không
    if (!checkPassword(passwordPayload)) {
      return res.status(403).json({
        title: "Lỗi cú pháp",
        message: "Mật khẩu không hợp lệ",
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const hasExistEmail = await User.exists({ email: emailPayload });

    if (hasExistEmail) {
      return res.status(403).json({
        title: "Lỗi cú pháp",
        message: "Email đã tồn tại",
      });
    }

    // Mã hóa mật khẩu
    const hashPassword = await bcrypt.hash(passwordPayload, saltRounds);

    // Tạo người dùng mới
    let newUser = await User.create({
      name: namePayload,
      email: emailPayload,
      password: hashPassword,
      role_id: rolePayload,
    });

    let refreshToken;
    try {
      // Tạo refresh token
      refreshToken = generateRefreshToken(newUser._id);
    } catch (error) {
      // Xóa người dùng nếu lỗi xảy ra
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ message: "Không thể tạo refresh token" });
    }

    // Tạo access token
    const accessToken = generateAccessToken(newUser._id);

    // Lưu refresh token vào cơ sở dữ liệu
    newUser = await User.findByIdAndUpdate(
      newUser._id,
      { $push: { token: refreshToken } },
      { new: true } // Trả về đối tượng mới nhất
    );

    // Thiết lập cookie cho refresh token
    res.cookie("refresh-token", refreshToken, {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "strict",
      expires: new Date(Date.now() + 30 * 24 * 3600000), // 30 ngày
    });

    // Lấy thông tin người dùng cần trả về
    const { name, email, role_id, _id } = newUser;

    return res.status(200).json({
      user: { _id, name, email, role_id },
      token: accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Kiểm tra email và mật khẩu
  if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
  }

  try {
      // Tìm người dùng theo email
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      // Kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).json({ message: "Invalid credentials" });
      }

      // Tạo token
      const refreshToken = generateRefreshToken(user._id);
      const accessToken = generateAccessToken(user._id);

      // Lưu refresh token vào cơ sở dữ liệu
      await User.findByIdAndUpdate(user._id, {
          $push: { token: refreshToken }, // Thêm token vào mảng token
      });

      // Thiết lập cookie cho refresh token
      res.cookie("refresh-token", refreshToken, {
          httpOnly: true,
          secure: true,
          path: "/",
          sameSite: "strict",
          expires: new Date(Date.now() + 30 * 24 * 3600000), // 30 ngày
      });

      // Trả về thông tin người dùng và token
      const { name, role_id, _id } = user;
      return res.status(200).json({
          message: "Đăng Nhập Thành Công",
          user: {
              _id,
              name,
              email,
              role: role_id,
              created_at: user.created_at,
              updated_at: user.updated_at,
          },
          tokenAccess: accessToken,
          tokenRefresh: refreshToken,
      });
  } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
  }
};

