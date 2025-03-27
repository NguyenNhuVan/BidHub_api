const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/generationToken');
const User = require('../models/userModel');
const { isEmail, checkPassword } = require('../utils/validation');
const { sendResetPasswordEmail,generateResetToken } = require('../utils/emailService');
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
      // Đảm bảo rằng người dùng đang đăng nhập bằng token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
          return res.status(401).json({ message: 'Bạn chưa đăng nhập!' });
      }

      // Hủy token trên server bằng cách đưa token vào danh sách "blacklist" (tùy chọn)
      // Hoặc đơn giản để token hết hạn mà không cần thao tác gì trên server

      // Gửi phản hồi thành công
      res.status(200).json({ message: 'Đăng xuất thành công!' });
  } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng xuất!' });
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
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: 'Email không tồn tại!' });
      }

      const resetToken = generateResetToken();
      console.log('Generated reset token:', resetToken);
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();
      console.log('User after saving token:', user);


      const resetLink = `http://localhost:3001/accounts/activate-password?token=${resetToken}`;


      await sendResetPasswordEmail(email, resetLink);

      res.status(200).json({ message: 'Email đặt lại mật khẩu đã được gửi!' });
  } catch (error) {
      console.error('Error sending reset password email:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi email!' });
  }
};
exports.activateNewPassword = async (req, res) => {
  const { token, newPassword } = req.query;
  console.log('Token nhận được:', req.query);

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Mật khẩu của bạn đã được đặt lại thành công!' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi đặt lại mật khẩu!' });
    }
};
exports.validateUserProfile = (req, res, next) => {
  const user = req.user; // Lấy thông tin người dùng từ middleware xác thực
  
  if (!user) {
    return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
  }

  // Kiểm tra các trường bắt buộc
  const { name, email, address, phone, dob } = user;

  if (!name || !email || !address || !phone || !dob) {
    return res.status(400).json({
      message: "Vui lòng cập nhật đầy đủ thông tin cá nhân trước khi tiếp tục",
      missingFields: {
        name: !name ? "Tên" : null,
        email: !email ? "Email" : null,
        address: !address ? "Địa chỉ" : null,
        phone: !phone ? "Số điện thoại" : null,
        dob: !dob ? "Ngày sinh" : null,
      },
    });
  }

  // Nếu đầy đủ thông tin
  next();
};
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      dob,
      avatar,
      social_links,
      id_proof,
    } = req.body; // Các trường cần cập nhật
    const userId = req.user._id; // Lấy ID người dùng từ middleware xác thực

    // Kiểm tra xem email có thay đổi không
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({
          message: "Email đã được sử dụng bởi người dùng khác",
        });
      }
    }

    // Xây dựng đối tượng cập nhật
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (dob) updateFields.dob = dob;
    if (avatar) updateFields.avatar = avatar;
    if (social_links) updateFields.social_links = social_links;
    if (id_proof) updateFields.id_proof = id_proof;

    // Cập nhật thông tin người dùng
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    // Trả về thông tin cập nhật
    res.status(200).json({
      message: "Cập nhật hồ sơ thành công",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        dob: updatedUser.dob,
        avatar: updatedUser.avatar,
        social_links: updatedUser.social_links,
        id_proof: updatedUser.id_proof,
        updated_at: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi cập nhật hồ sơ",
      error: error.message,
    });
  }
};

