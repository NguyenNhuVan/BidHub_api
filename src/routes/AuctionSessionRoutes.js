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
router.patch("/reject/:id", authenticate, AuctionSessionController.rejectAuction);

router.get('/search', AuctionSessionController.searchByTitleOrDescription);

router.get('/category/:idCategory', AuctionSessionController.getAuctionsByCategoryId);

router.get('/getAll', AuctionSessionController.getAllAuctionSessions); 
router.post('/toggle-watchlist', authenticate, AuctionSessionController.toggleWatchlist);
router.get('/watchlist', authenticate, AuctionSessionController.getWatchlistAuctionSessions)
router.get('/verified/:verifierId', AuctionSessionController.getAuctionSessionsByVerifier); 
router.get('/:id', AuctionSessionController.getAuctionSessionById); 
router.get('/filter', authenticate, AuctionSessionController.filterAuctionSessions);

module.exports = router;    