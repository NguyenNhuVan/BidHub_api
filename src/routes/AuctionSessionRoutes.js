const express = require("express");
const AuctionSesstionController = require("../controllers/auctionSessionController");
// const { checkExpertRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// 1. Tạo sản phẩm và phiên đấu giá
router.post("/create", AuctionSesstionController.createAuction);

// 2. Phê duyệt phiên đấu giá
router.patch("/approve/:id", AuctionSesstionController.approveAuction);

// 3. Từ chối phiên đấu giá
router.patch("/reject/:id", AuctionSesstionController.rejectAuction);

module.exports = router;