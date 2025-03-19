const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const checkPassword = (password) => {
    return (
        password.length >= 8 && // Độ dài tối thiểu 8 ký tự
        /[A-Z]/.test(password) && // Ít nhất một chữ cái viết hoa
        /[a-z]/.test(password) && // Ít nhất một chữ cái thường
        /\d/.test(password) && // Ít nhất một chữ số
        /[!@#$%^&*]/.test(password) // Ít nhất một ký tự đặc biệt
    );
};

module.exports = { isEmail, checkPassword };
