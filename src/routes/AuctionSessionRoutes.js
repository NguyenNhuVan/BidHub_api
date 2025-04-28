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

router.get('/getAll', AuctionSessionController.getAllAuctionSessions); 

router.get('/verified/:verifierId', AuctionSessionController.getAuctionSessionsByVerifier); 
router.get('/:id', AuctionSessionController.getAuctionSessionById); 


router.post('/toggle-watchlist', authenticate, AuctionSessionController.toggleWatchlist);
router.get('/filter', authenticate, AuctionSessionController.filterAuctionSessions);


exports.toggleWatchlist = async (req, res) => {
    try {
      const { userId, auctionId } = req.body;
      const user = await User.findById(userId);
      
      // Kiểm tra xem auction đã trong watchlist chưa
      const isInWatchlist = user.watchlist.includes(auctionId);
      
      if (isInWatchlist) {
        // Nếu đã có thì xóa đi
        await user.removeFromWatchlist(auctionId);
        res.json({ message: 'Đã xóa khỏi danh sách yêu thích', isInWatchlist: false });
      } else {
        // Nếu chưa có thì thêm vào
        await user.addToWatchlist(auctionId);
        res.json({ message: 'Đã thêm vào danh sách yêu thích', isInWatchlist: true });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  exports.filterAuctionSessions = async (req, res) => {
    try {
      const filters = req.body; // Giả sử các tiêu chí lọc được gửi qua body của request
      const query = {};
  
      // Thêm điều kiện vào truy vấn nếu được cung cấp
      if (filters.product_id) {
        query.product_id = filters.product_id;
      }
      if (filters.created_by) {
        query.created_by = filters.created_by;
      }
      if (filters.verified_by) {
        query.verified_by = filters.verified_by;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.min_current_bid) {
        query.current_bid = { ...query.current_bid, $gte: filters.min_current_bid };
      }
      if (filters.max_current_bid) {
        query.current_bid = { ...query.current_bid, $lte: filters.max_current_bid };
      }
      if (filters.start_time) {
        query.start_time = { $gte: new Date(filters.start_time) };
      }
      if (filters.end_time) {
        query.end_time = { $lte: new Date(filters.end_time) };
      }
      if (filters.shipping_method) {
        query.shipping_method = filters.shipping_method;
      }
      if (filters.payment_method) {
        query.payment_method = filters.payment_method;
      }
  
      // Truy vấn MongoDB
      const auctionSessions = await AuctionSession.find(query);
  
      res.status(200).json({
        success: true,
        message: 'Danh sách phiên đấu giá đã được lọc.',
        data: auctionSessions,
      });
    } catch (error) {
      console.error('Error filtering auction sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lọc phiên đấu giá.',
        error: error.message,
      });
    }
  };
  
module.exports = router;    