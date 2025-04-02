const jwt = require("jsonwebtoken");
const Product = require("../models/productModel");

exports.addProduct = async (req, res) => {
    try {
        console.log(req.headers)
        // Lấy token từ header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Không có token, truy cập bị từ chối!" });
        }

        // Giải mã token
        const secretKey = process.env.ACCESS_TOKEN; // Thay bằng secret key thực tế của bạn
        const decoded = jwt.verify(token, secretKey);
        console.log(decoded);
        // Kiểm tra quyền admin
        if (decoded.roleId !== 1) {
            return res.status(403).json({ message: "Bạn không có quyền thêm sản phẩm!" });
        }

        // Lấy dữ liệu sản phẩm từ body
        const { title, description, images, starting_price, status } = req.body;

        if (!title || !description || !images || !starting_price) {
            return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin sản phẩm!" });
        }

        // Tạo sản phẩm mới
        const product = new Product({
            title,
            description,
            images,
            starting_price,
            status
        });

        await product.save();

        res.status(201).json({ message: "Thêm sản phẩm thành công!", product });
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", error);
        res.status(500).json({ message: "Đã xảy ra lỗi khi thêm sản phẩm!" });
    }
};
