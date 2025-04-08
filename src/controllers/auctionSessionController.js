const ProductModel = require("../models/productModel");
const AuctionSessionModel = require("../models/auctionSessionModel");



exports.createAuction = async (req, res) => {
    try {
      const { title, description, images, category_id, reserve_price, buy_now_price, min_bid_step, auction_end_time, deposit_percentage } = req.body;
  
      // 1. Tạo sản phẩm
      const product = await ProductModel.create({ title, description, images, category_id });
  
      // 2. Tạo phiên đấu giá
      const auction = await AuctionSessionModel.create({
        product_id: product._id,
        reserve_price,
        buy_now_price,
        min_bid_step,
        auction_end_time,
        deposit_percentage,
        created_by: req.user.id,
        status: 'pending',
      });
  
      res.status(201).json({ message: "Auction created and pending approval", auction });
    } catch (error) {
      res.status(500).json({ message: "Error creating auction", error });
    }
  };
exports.approveAuction = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Tìm phiên đấu giá theo ID
      const auction = await AuctionSessionModel.findById(id);
      if (!auction) return res.status(404).json({ message: "Auction not found" });
  
      // Cập nhật trạng thái và người phê duyệt
      auction.status = "approved";
      auction.verified_by = req.user.id; // ID của chuyên gia thực hiện phê duyệt
      await auction.save();
  
      res.status(200).json({ message: "Auction approved successfully", auction });
    } catch (error) {
      res.status(500).json({ message: "Error approving auction", error });
    }
  };
exports.rejectAuction = async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body; // Lý do không phê duyệt (nếu cần)
  
      // Tìm phiên đấu giá theo ID
      const auction = await AuctionSessionModel.findById(id);
      if (!auction) return res.status(404).json({ message: "Auction not found" });
  
      // Cập nhật trạng thái và người phê duyệt
      auction.status = "rejected";
      auction.verified_by = req.user.id; // ID của chuyên gia thực hiện từ chối
      auction.rejection_reason = reason || "No reason provided"; // Lưu lý do từ chối (tuỳ chọn)
      await auction.save();
  
      res.status(200).json({ message: "Auction rejected successfully", auction });
    } catch (error) {
      res.status(500).json({ message: "Error rejecting auction", error });
    }
  };
  
  