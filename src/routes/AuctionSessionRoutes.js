const express = require("express");
const authenticate = require("../middlewares/authenticate");
const AuctionSessionController = require("../controllers/auctionSessionController");
// const { checkExpertRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// 1. Tạo sản phẩm và phiên đấu giá
router.post("/create", authenticate, AuctionSessionController.createAuction);

// 2. Phê duyệt phiên đấu giá
router.patch("/approve/:id", authenticate,AuctionSessionController.approveAuction);

// 3. Từ chối phiên đấu giá
router.patch("/reject/:id", AuctionSessionController.rejectAuction);

router.get('/search', AuctionSessionController.searchByTitleOrDescription);

router.get('/category/:idCategory', AuctionSessionController.getAuctionsByCategoryId);

router.get('/getAll', AuctionSessionController.getAllAuctionSessions); // Lấy tất cả phiên đấu giá

router.get('/verified/:verifierId', AuctionSessionController.getAuctionSessionsByVerifier); // Lấy phiên đấu giá theo verifierId

router.get('/:id', AuctionSessionController.getAuctionSessionById); // Lấy phiên đấu giá theo auctionId

module.exports = router;    