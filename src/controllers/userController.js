const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/generationToken');
const User = require('../models/userModel');
const { isEmail, checkPassword } = require('../utils/validation');
const { sendResetPasswordEmail } = require('../utils/emailService');
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
      user: { _id, name, email, role_id }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.loginUser = async (req, res) => {
  console.log(req.body);
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

exports.logout = async (req, res) => {
  try {
      const refreshToken = req.cookies["refresh-token"]; 
      if (!refreshToken) {
          return res.status(401).json({
              title: "Lỗi",
              message: "Không tìm thấy refresh token",
          });
      }

      // Tìm người dùng dựa trên refresh token
      const user = await User.findOne({ token: refreshToken });
      if (!user) {
          return res.status(401).json({
              title: "Lỗi",
              message: "Token không hợp lệ hoặc người dùng không tồn tại",
          });
      }

      // Xóa refresh token khỏi danh sách token
      const updatedTokens = user.token.filter((item) => item !== refreshToken);
      await User.findByIdAndUpdate(user._id, { token: updatedTokens });

      // Xóa cookie trên trình duyệt
      res.clearCookie("refresh-token", {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
      });

      return res.status(200).json({
          message: "Đăng xuất thành công",
      });
  } catch (error) {
      res.status(500).json({
          message: "Lỗi máy chủ",
          error: error.message,
      });
  }
};

exports.changePassword = async (req, res) => {
  try {

      if (!req.body.password || !req.body.newPassword || !req.body.confirmPassword) {
      return res.status(400).json({
          title: "Lỗi",
          message: "Vui lòng cung cấp mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu.",
      });
  }
      const { password, newPassword, confirmPassword } = req.body;
      const { _id } = req.user;

      if (newPassword !== confirmPassword) {
          return res.status(400).json({
              title: "Lỗi",
              message: "Mật khẩu mới và xác nhận mật khẩu không khớp",
          });
      }

      const user = await User.findById(_id);
      if (!user) {
          return res.status(404).json({
              title: "Lỗi",
              message: "Người dùng không tồn tại",
          });
      }

      const isMatchPW = await bcrypt.compare(password, user.password);
      if (!isMatchPW) {
          return res.status(401).json({
              title: "Lỗi",
              message: "Mật khẩu cũ không đúng",
          });
      }
      const newHashPass = await bcrypt.hash(newPassword, saltRounds);
      await User.findByIdAndUpdate(_id, { password: newHashPass });
      res.status(200).json({
          title: "Thành công",
          message: "Đổi mật khẩu thành công",
      });
  } catch (error) {
      res.status(500).json({
          title: "Lỗi",
          message: "Lỗi máy chủ",
          error: error.message,
      });
  }
};
exports.resetPasswordController = async (req, res) => {
  console.log(req.body);
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if(user == null){
      res.status(404).json({ message: 'Email không tồn tại!' });
    }
      // Tạo link reset password (ở đây dùng link giả)
      const resetLink = `http://yourwebsite.com/reset-password?email=${email}`;

      // Gửi email
      await sendResetPasswordEmail(email, resetLink);

      res.status(200).json({ message: 'Email đặt lại mật khẩu đã được gửi!' });
  } catch (error) {
      res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi email!' });
  }
};
