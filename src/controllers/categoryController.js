const Category = require("../models/categoryModel");

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
    }

    const newCategory = new Category({ name, description });
    await newCategory.save();

    res.status(201).json({ message: "Tạo danh mục thành công", data: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo danh mục", error: error.message });
  }
};

