const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER, // Email của bạn
        pass: process.env.EMAIL_PASSWORD, // App Password
    },
});

// Hàm gửi email
const sendResetPasswordEmail = async (toEmail, resetLink) => {
    try {
        await transporter.sendMail({
            from: `"Support Team" <${process.env.EMAIL_USER}>`, // Tên và email gửi
            to: toEmail, // Email người nhận
            subject: 'Reset Password Request', // Tiêu đề
            html: `
                <p>Chào ${toEmail},</p>
                <p>Mật khẩu mới của bạn là: <strong>11453</strong></p>
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
