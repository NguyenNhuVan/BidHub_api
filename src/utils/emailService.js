const nodemailer = require('nodemailer');
require('dotenv').config();
const crypto = require('crypto');


const generateNewPassword = () => {
    const length = 12; // Độ dài mật khẩu
    const charset = {
        upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", // Chữ hoa
        lower: "abcdefghijklmnopqrstuvwxyz", // Chữ thường
        digits: "0123456789",               // Chữ số
        special: "!@#$%^&*()_+~`|}{[]:;?><,./-=", // Ký tự đặc biệt
    };

    const getRandomChar = (characters) =>
        characters[Math.floor(Math.random() * characters.length)];

    // Bắt buộc ít nhất 1 ký tự từ mỗi loại
    const passwordArray = [
        getRandomChar(charset.upper),
        getRandomChar(charset.lower),
        getRandomChar(charset.digits),
        getRandomChar(charset.special),
    ];

    // Điền thêm các ký tự ngẫu nhiên để đủ độ dài
    const allChars = charset.upper + charset.lower + charset.digits + charset.special;
    while (passwordArray.length < length) {
        passwordArray.push(getRandomChar(allChars));
    }

    // Xáo trộn thứ tự các ký tự
    return passwordArray.sort(() => Math.random() - 0.5).join('');
};

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER, // Email của bạn
        pass: process.env.EMAIL_PASSWORD, // App Password
    },
});

// Hàm gửi email
const sendResetPasswordEmail = async (toEmail, resetLink, newPassword= generateNewPassword()) => {
    console.log('Sending email to:', toEmail);
    console.log('Reset link:', resetLink);
    console.log('New password:', newPassword);

    try {
        await transporter.sendMail({
            from: `"Support Team" <${process.env.EMAIL_USER}>`, // Tên và email gửi
            to: toEmail, // Email người nhận
            subject: 'Reset Password Request', // Tiêu đề
            html: `
                <p>Chào ${toEmail},</p>
                <p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
                <p>Vui lòng nhấn vào link dưới đây để kích hoạt mật khẩu mới:</p>
                <a href="${resetLink}">Kích hoạt mật khẩu</a>
                <p>Nếu bạn không yêu cầu lấy lại mật khẩu, vui lòng bỏ qua email này.</p>
            `,
        });
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Đã xảy ra lỗi khi gửi email!');
    }
};

module.exports = { sendResetPasswordEmail };
