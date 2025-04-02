const jwt = require("jsonwebtoken");
const Product = require("../models/productModel");

exports.addProduct = async (req, res) => {
    try {
        const { title, description, images, starting_price, status } = req.body;

        // Kiểm tra dữ liệu đầu vào
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
