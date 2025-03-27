const express = require("express");
const router = express.Router();
const roleController = require('../controllers/roleController');



router.post("/creatRole",roleController.addRole);

// Route xóa role bằng query
router.delete("/deleteRole", roleController.deleteRole);

module.exports = router;