const express = require("express");
const router = express.Router();
const CategoryController = require('../controllers/categoryController');


router.post("/createCategory", CategoryController.createCategory);

// Lấy tất cả danh mục
router.get("/getAllCategory", CategoryController.getCategories);

// Lấy danh mục theo ID
router.get("/getIdCategory/:id", CategoryController.getCategoryById);

// Cập nhật danh mục
router.put("/updateCategory/:id", CategoryController.updateCategory);

// Xóa danh mục
router.delete("/deleteCategory/:id", CategoryController.deleteCategory);

router.get("/search", CategoryController.searchCategories);

module.exports = router;