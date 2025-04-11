const ProductModel = require("../models/productModel");
const AuctionSessionModel = require("../models/auctionSessionModel");
const UserModel = require("../models/userModel");


const handleAuctionAssignment = async (auction, categoryId) => {
  try {
    // Tìm chuyên gia theo chuyên môn và sắp xếp theo workload
    const experts = await UserModel.find({
      role: 'expert',
      expertise: categoryId,
    }).sort('workload');

    if (experts.length === 0) {
      console.error("No experts found for category:", categoryId);
      throw new Error('Không có chuyên gia phù hợp để xét duyệt');
    }

    // Gán chuyên gia có workload thấp nhất
    const assignedExpert = experts[0];
    assignedExpert.workload += 1;
    await assignedExpert.save().catch(err => {
      console.error("Error updating expert workload:", err);
      throw new Error('Không thể cập nhật workload chuyên gia');
    });

    // Cập nhật bài đấu giá với chuyên gia được gán
    auction.verified_by = assignedExpert._id;
    await auction.save().catch(err => {
      console.error("Error updating auction with assigned expert:", err);
      throw new Error('Không thể cập nhật phiên đấu giá với chuyên gia được gán');
    });

    return assignedExpert;
  } catch (error) {
    console.error("Error in handleAuctionAssignment:", error.message);
    throw error;
  }
};

exports.createAuction = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            images, 
            category_id, 
            reserve_price, 
            buy_now_price, 
            min_bid_step, 
            auction_end_time, 
            deposit_percentage 
        } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!title || !description || !images || !category_id || 
            !reserve_price || !min_bid_step || !auction_end_time || 
            deposit_percentage === undefined) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc",
                requiredFields: ['title', 'description', 'images', 'category_id', 
                                'reserve_price', 'min_bid_step', 'auction_end_time', 
                                'deposit_percentage']
            });
        }
        
        // Kiểm tra user
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Người dùng chưa đăng nhập"
            });
        }
        
        // Tính toán deposit_amount
        const deposit_amount = (reserve_price * deposit_percentage) / 100;
        
        // 1. Tạo sản phẩm
        const product = await ProductModel.create({ 
            title, 
            description, 
            images, 
            category_id 
        });
        
        // 2. Tạo phiên đấu giá
        const auction = await AuctionSessionModel.create({
            product_id: product._id,
            current_bid: 0,
            reserve_price,
            buy_now_price,
            min_bid_step,
            auction_end_time,
            deposit_percentage,
            deposit_amount,
            created_by: req.user._id,
            status: 'pending'
        });
        
        // 3. Gán chuyên gia cho auction
        try {
            const assignedExpert = await handleAuctionAssignment(auction, category_id);
            
            res.status(201).json({ 
                success: true,
                message: "Auction created and sent to an expert for approval", 
                auction,
                assignedExpert: {
                    id: assignedExpert._id,
                    name: assignedExpert.name,
                    email: assignedExpert.email
                }
            });
        } catch (assignmentError) {
            // Nếu không gán được chuyên gia, vẫn trả về auction nhưng với thông báo khác
            res.status(201).json({ 
                success: true,
                message: "Auction created but no expert assigned yet", 
                auction,
                error: assignmentError.message
            });
        }
    } catch (error) {
        console.error("Error in createAuction:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Error creating auction", 
            error: error.message 
        });
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
  
  