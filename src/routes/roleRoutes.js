const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const checkrole = require("../middlewares/checkRole");

// Route để kiểm tra vai trò của người dùng hiện tại
// router.get("/checkRole",authenticate,checkrole.checkRole );

router.post("/checkRole",authenticate,checkrole.showRoleDetail);
module.exports = router;