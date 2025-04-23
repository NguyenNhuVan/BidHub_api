const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require('../utils/generationToken');
const User = require('../models/userModel');
const Category = require("../models/categoryModel");
const { isEmail, checkPassword } = require('../utils/validation');
const { sendResetPasswordEmail,generateResetToken } = require('../utils/emailService');
const saltRounds = 10;

exports.getProfile = async (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token không được cung cấp!" });
    }
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    const userId = decoded._id;
    
    const user = await User.findById(userId)
      .select("-password -token -resetPasswordToken -resetPasswordExpires")
      .populate('expertise', 'name'); // Populate expertise with category names
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }
    
    res.status(200).json({ 
      message: "Thông tin người dùng:", 
      data: user 
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy thông tin người dùng", 
      error: error.message 
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const {
      name: namePayload,
      email: emailPayload,
      password: passwordPayload,
      role: rolePayload,
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
      role: rolePayload,
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
    const { name, email, role, _id } = newUser;

    return res.status(200).json({
      user: { _id, name, email, role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      err: 1,
      msg: "Email and password are required" 
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        err: 1,
        msg: "User not found" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        err: 1,
        msg: "Invalid credentials" 
      });
    }

    const refreshToken = generateRefreshToken(user._id);
    const accessToken = generateAccessToken(user);

    await User.findByIdAndUpdate(user._id, {
      $push: { token: refreshToken },
    });

    res.cookie("refresh-token", refreshToken, {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "strict",
      expires: new Date(Date.now() + 30 * 24 * 3600000),
    });

    // Exclude sensitive fields from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      dob: user.dob,
      expertise: user.expertise,
      qualifications: user.qualifications,
      experience_years: user.experience_years,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };

    return res.status(200).json({
      err: 0,
      msg: "Đăng Nhập Thành Công",
      access_token: accessToken, 
      refresh_token: refreshToken,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ 
      err: 1,
      msg: "Server error", 
      error: error.message 
    });
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
  const user = req.user; 
  
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
      introduce,
      cccd
    } = req.body;
    
    const userId = req.user._id;

    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({
          message: "Email đã được sử dụng bởi người dùng khác",
        });
      }
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (dob) updateFields.dob = dob;
    if (avatar) updateFields.avatar = avatar;
    if (introduce) updateFields.introduce = introduce;
    if (social_links) {
      updateFields.social_links = {
        facebook: social_links.facebook || '',
        twitter: social_links.twitter || '',
        instagram: social_links.instagram || ''
      };
    }
    if (cccd) {
      updateFields.cccd = {
        number: cccd.number || '',
        photo: cccd.photo || ''
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -token -resetPasswordToken -resetPasswordExpires');

    if (!updatedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      message: "Cập nhật hồ sơ thành công",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi cập nhật hồ sơ",
      error: error.message,
    });
  }
};


exports.getInfoUser = async (userId) => {
    try {
        // Kiểm tra nếu userId không hợp lệ
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return {
                err: 1,
                msg: "Invalid user ID",
            };
        }

        // Truy vấn MongoDB để tìm user theo _id
        const user = await User.findById(userId).select("id name email");

        if (!user) {
            return {
                err: 1,
                msg: "User not found",
            };
        }

        return {
            err: 0,
            msg: "Get user info success",
            info_user: user,
        };
    } catch (err) {
        return {
            err: 1,
            msg: err.message, // Trả về thông báo lỗi cụ thể
        };
    }
};

exports.registerExpert = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      dob,
      cccd,
      expertiseIds,
      qualifications,
      experience_years,
      password,
      confirm_password,
      introduce
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !address || !dob || !cccd || !cccd.number || !cccd.photo ||
        !expertiseIds || !qualifications || !experience_years || !password || !confirm_password) {
      return res.status(400).json({
        err: 1,
        msg: "Vui lòng điền đầy đủ thông tin"
      });
    }

    // Validate expertiseIds
    if (!Array.isArray(expertiseIds)) {
      return res.status(400).json({
        err: 1,
        msg: "Chuyên môn phải là một mảng"
      });
    }

    // Validate qualifications
    if (!Array.isArray(qualifications) || qualifications.some(q => !q.degree || !q.photo)) {
      return res.status(400).json({
        err: 1,
        msg: "Bằng cấp phải có đầy đủ thông tin"
      });
    }

    // Validate password match
    if (password !== confirm_password) {
      return res.status(400).json({
        err: 1,
        msg: "Mật khẩu không khớp"
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        err: 1,
        msg: "Người dùng không tồn tại"
      });
    }

    // Check if user is already an expert or pending expert
    if (existingUser.role === 'expert' || existingUser.role === 'pending_expert') {
      return res.status(400).json({
        err: 1,
        msg: "Bạn đã đăng ký làm chuyên gia hoặc đã là chuyên gia"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user information
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
      {
        $set: {
          name,
          email,
          phone,
          address,
          dob,
          introduce,
          cccd: {
            number: cccd.number,
            photo: cccd.photo
          },
          expertise: expertiseIds,
          qualifications: qualifications.map(qual => ({
            degree: qual.degree,
            photo: qual.photo
          })),
          experience_years,
          password: hashedPassword,
          role: 'pending_expert',
          expert_application: {
            status: 'pending',
            submitted_at: new Date(),
            expertise: expertiseIds,
            qualifications: qualifications,
            experience_years: experience_years,
            personal_info: {
              name,
              email,
              phone,
              address,
              dob,
              cccd
            }
          }
        }
      },
      { new: true }
    ).select('-password -token -resetPasswordToken -resetPasswordExpires');

    // In a real application, you would send a notification to admin here

    return res.status(200).json({
      err: 0,
      msg: "Đăng ký chuyên gia thành công, đang chờ phê duyệt",
      data: updatedUser
    });

  } catch (error) {
    console.error('Error in registerExpert:', error);
    return res.status(500).json({
      err: 1,
      msg: "Lỗi server",
      error: error.message
    });
  }
};