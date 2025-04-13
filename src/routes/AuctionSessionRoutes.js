const express = require("express");
const authenticate = require("../middlewares/authenticate");
const AuctionSesstionController = require("../controllers/auctionSessionController");
// const { checkExpertRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// 1. Tạo sản phẩm và phiên đấu giá
router.post("/create", authenticate,AuctionSesstionController.createAuction);

// 2. Phê duyệt phiên đấu giá
router.patch("/approve/:id", AuctionSesstionController.approveAuction);

// 3. Từ chối phiên đấu giá
router.patch("/reject/:id", AuctionSesstionController.rejectAuction);

router.get('/search', AuctionSesstionController.searchByTitleOrDescription);


router.get('/getAll', AuctionSesstionController.getAllAuctionSessions); // Lấy tất cả phiên đấu giá

router.get('/verified/:verifierId', AuctionSesstionController.getAuctionSessionsByVerifier); // Lấy phiên đấu giá theo verifierId

router.get('/:Id', AuctionSesstionController.getAuctionSessionById); // Lấy phiên đấu giá theo auctionId

module.exports = router;    