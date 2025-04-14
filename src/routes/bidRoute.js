const express = require('express');
const router = express.Router();
const { placeBid } = require('../controllers/BidController'); // Đảm bảo nhập đúng controller

// Route để đặt giá mới
router.post('/placeBid', placeBid);

module.exports = router;