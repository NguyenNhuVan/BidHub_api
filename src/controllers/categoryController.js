const Category = require("../models/categoryModel");

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
    }

    const newCategory = new Category({ name, description, image });
    await newCategory.save();

    res.status(201).json({ message: "Tạo danh mục thành công", data: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo danh mục", error: error.message });
  }
};



exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ message: "Danh sách danh mục", data: categories });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh mục", error: error.message });
  }
};
// Lấy danh mục theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    res.status(200).json({ message: "Thông tin danh mục", data: category });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh mục", error: error.message });
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description, image },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    res.status(200).json({ message: "Cập nhật danh mục thành công", data: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật danh mục", error: error.message });
  }
};


// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    res.status(200).json({ message: "Xóa danh mục thành công", data: deletedCategory });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa danh mục", error: error.message });
  }
};
exports.searchCategories = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    const regex = new RegExp(keyword, "i"); // không phân biệt hoa thường

    const results = await Category.find({
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } }
      ]
    });

    res.status(200).json({ message: "Kết quả tìm kiếm", data: results });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tìm kiếm danh mục", error: error.message });
  }
};