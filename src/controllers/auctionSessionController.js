const ProductModel = require("../models/productModel");
const AuctionSessionModel = require("../models/auctionSessionModel");
const Product = require('../models/productModel');
const mongoose = require('mongoose');
const { handleAuctionAssignment } = require('../utils/ExcellentExpert');
const User = require('../models/userModel');
const { sendNotification } = require('../utils/sendNotification');
const Category = require('../models/categoryModel');

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
          auction_duration, 
          deposit_percentage 
      } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!title || !description || !images || !category_id || 
          !reserve_price || !min_bid_step || !auction_duration || 
          deposit_percentage === undefined) {
          return res.status(400).json({
              success: false,
              message: "Thiếu thông tin bắt buộc",
              requiredFields: [
                  'title', 'description', 'images', 'category_id', 
                  'reserve_price', 'min_bid_step', 'auction_duration', 
                  'deposit_percentage'
              ]
          });
      }

      // Kiểm tra user
      if (!req.user || !req.user._id) {
          return res.status(401).json({
              success: false,
              message: "Người dùng chưa đăng nhập"
          });
      }

      // Kiểm tra category_id có tồn tại không
      const category = await Category.findById(category_id);
      if (!category) {
          return res.status(404).json({
              success: false,
              message: "Danh mục không tồn tại",
              category_id
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
          created_by: req.user._id,
          auction_duration,
          deposit_percentage,
          deposit_amount,
          status: 'pending'
      });

      // 3. Gán chuyên gia cho phiên đấu giá
      try {
          const assignmentResult = await handleAuctionAssignment(auction, category_id);
          console.log('Assigned expert:', assignmentResult);
          
          // Gán chuyên gia cho phiên đấu giá nếu tìm thấy
          if (assignmentResult.success && assignmentResult.expert) {
              auction.verified_by = assignmentResult.expert._id;
              await auction.save();

              // Gửi thông báo cho chuyên gia
              await sendNotification(
                  assignmentResult.expert._id,
                  `Bạn có một phiên đấu giá mới cần phê duyệt: ${product.title}`,
                  'auction_created',
                  auction._id,
                  req.app.get('io')
              );
          }

          res.status(201).json({ 
              success: true,
              message: assignmentResult.success 
                  ? "Auction created and sent to an expert for approval" 
                  : "Auction created but no expert assigned yet", 
              auction,
              assignedExpert: assignmentResult.success ? {
                  id: assignmentResult.expert._id,
                  name: assignmentResult.expert.name,
                  email: assignmentResult.expert.email
              } : null,
              error: !assignmentResult.success ? assignmentResult.message : null
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


exports.getAllAuctionSessions = async (req, res) => {
  try {
    // Sử dụng populate để lấy thông tin từ bảng Product
    const auctionSessions = await AuctionSessionModel.find()
      .populate({
        path: 'product_id', // Tên trường trong schema
        model: 'Product', // Model liên kết
        select: 'title description images category_id status', // Các trường cần lấy
      })
      .populate('created_by', 'name email') // Nếu cần thông tin người tạo
      .populate('verified_by', 'name email'); // Nếu cần thông tin người xác thực

  
    res.status(200).json({
      success: true,
      data: auctionSessions
    });
  } catch (error) {
    // Xử lý lỗi
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách các phiên đấu giá.',
      error: error.message
    });
  }
};

exports.getAuctionSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem ID có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phiên đấu giá không hợp lệ.',
      });
    }

    // Tìm phiên đấu giá và populate các trường liên quan
    const auctionSession = await AuctionSessionModel.findById(id)
      .populate({
        path: 'product_id', // Lấy thông tin từ product_id
        model: 'Product', // Model liên kết
        select: 'title description images category_id status', // Các trường cần lấy
        populate: { path: 'category_id', model: 'Category', select: 'name' } 
      })
      .populate('created_by', 'name email') // Nếu cần thông tin người tạo
      .populate('verified_by', 'name email'); // Nếu cần thông tin người xác thực

    // Kiểm tra nếu không tìm thấy
    if (!auctionSession) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên đấu giá với ID được cung cấp.',
      });
    }

    // Trả về dữ liệu
    res.status(200).json({
      success: true,
      data: auctionSession,
    });
  } catch (error) {
    // Xử lý lỗi
    console.error('Error fetching auction session:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy phiên đấu giá.',
      error: error.message,
    });
  }
};

exports.getAuctionSessionsByVerifier = async (req, res) => {
  try {
    const { verifierId } = req.params;

 
    const auctionSessions = await AuctionSessionModel.find({ verified_by: verifierId })
      .populate({
        path: 'product_id', 
        model: 'Product', 
        select: 'title description images category_id status', 
        populate: { path: 'category_id', model: 'Category', select: 'name' } 
      })
      .populate('created_by', 'name email') 
      .populate('verified_by', 'name email'); 

    // Kiểm tra nếu không có phiên đấu giá nào
    if (!auctionSessions || auctionSessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên đấu giá nào được xác nhận bởi người này.',
      });
    }

    // Trả về dữ liệu
    res.status(200).json({
      success: true,
      data: auctionSessions,
    });
  } catch (error) {
    // Xử lý lỗi
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách các phiên đấu giá.',
      error: error.message,
    });
  }
};

exports.approveAuction = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Tìm phiên đấu giá theo ID
      const auction = await AuctionSessionModel.findById(id);
      if (!auction) return res.status(404).json({ message: "Auction not found" });
  
      if (auction.verified_by.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to approve this auction' });
      }
  
      // Cập nhật trạng thái và người phê duyệt
      auction.status = "active";
      await auction.save();
  
      // Gửi thông báo cho người tạo phiên đấu giá
      await sendNotification(
        auction.created_by,
        `Phiên đấu giá "${auction._id}" đã được phê duyệt`,
        'auction_approved',
        auction._id,
        req.app.get('io')
      );
  
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
  
      if (auction.verified_by.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to reject this auction' });
      }
  
      // Cập nhật trạng thái và người phê duyệt
      auction.status = "cancelled";
      auction.rejection_reason = reason || "No reason provided"; // Lưu lý do từ chối (tuỳ chọn)
      await auction.save();
  
      // Gửi thông báo cho người tạo phiên đấu giá
      await sendNotification(
        auction.created_by,
        `Phiên đấu giá "${auction._id}" đã bị từ chối`,
        'auction_rejected',
        auction._id,
        req.app.get('io')
      );
  
      res.status(200).json({ message: "Auction rejected successfully", auction });
    } catch (error) {
      res.status(500).json({ message: "Error rejecting auction", error });
    }
  };
  exports.searchByTitleOrDescription = async (req, res) => {
    try {
      const { keyword } = req.query;
  
      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: 'Keyword is required for search',
        });
      }
  
      const regex = new RegExp(keyword, 'i'); // Tìm kiếm không phân biệt chữ hoa/thường
  
      // Tìm kiếm trong Product
      const products = await Product.find({
        $or: [
          { title: regex },
          { description: regex },
        ],
      }).lean();
  
      // Tìm kiếm trong AuctionSession (liên kết đến Product)
      const auctions = await AuctionSessionModel.find()
        .populate({
          path: 'product_id',
          match: { $or: [{ title: regex }, { description: regex }] }, // Áp dụng điều kiện tìm kiếm
          select: 'title description', // Chỉ lấy trường cần thiết
        })
        .lean();
  
      // Lọc những AuctionSession có Product được tìm thấy
      const filteredAuctions = auctions.filter((auction) => auction.product_id);
  
      res.status(200).json({
        success: true,
        message: 'Search results fetched successfully',
        products,
        auctions: filteredAuctions,
      });
    } catch (error) {
      console.error('Error in searchByTitleOrDescription:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error fetching search results',
        error: error.message,
      });
    }
  };
  exports.getAuctionsByCategoryId = async (req, res) => {
    try {
      const { idCategory } = req.params;
  
      // Tìm tất cả sản phẩm thuộc category_id
      const products = await ProductModel.find({ category_id: idCategory }).select('_id');
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No products found in this category',
        });
      }
  
      const productIds = products.map(product => product._id);
  
      // Tìm tất cả phiên đấu giá liên quan đến các sản phẩm thuộc category_id
      const auctions = await AuctionSessionModel.find({ product_id: { $in: productIds } })
        .populate('product_id', 'title description images')
        .populate('created_by', 'name email')
        .populate('verified_by', 'name email')
        .sort({ start_time: -1 });
  
      res.status(200).json({
        success: true,
        data: auctions,
      });
    } catch (error) {
      console.error('Error fetching auctions by category ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
  