const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

function authenticate(req, res, next) {
    try {
        // Lấy token từ header Authorization
        const token = req.headers["authorization"];
        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).json({ 
                title: "Lỗi", 
                message: "Token không hợp lệ hoặc không được cung cấp" 
            });
        }

        // Lấy phần token sau "Bearer "
        const jwtToken = token.split(" ")[1];

        // Kiểm tra xem secret key có tồn tại hay không
        if (!process.env.ACCESS_TOKEN) {
            return res.status(500).json({ 
                title: "Lỗi", 
                message: "Không tìm thấy secret key để xác thực" 
            });
        }

        jwt.verify(jwtToken, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) {
                console.error("JWT Verify Error:", err);
                if (err.name === "TokenExpiredError") {
                    return res.status(401).json({ 
                        title: "Lỗi", 
                        message: "Token đã hết hạn" 
                    });
                }
                return res.status(401).json({ 
                    title: "Lỗi", 
                    message: "Token không hợp lệ" 
                });
            }

            // Gắn thông tin user vào req và chuyển tiếp
            req.user = user;
            next();
        });
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ 
            title: "Lỗi", 
            message: "Lỗi máy chủ", 
            error: error.message 
        });
    }
}

module.exports = authenticate;
