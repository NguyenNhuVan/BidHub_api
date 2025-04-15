const express = require("express");
const router = express.Router();
const adminController = require('../controllers/adminController');

router.put("/levelupExpert", adminController.approveExpert);

module.exports = router;
