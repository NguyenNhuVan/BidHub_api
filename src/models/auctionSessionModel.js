const mongoose = require('mongoose');

const AuctionSessionSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  current_bid: { type: Number, default: 0 },
  reserve_price: { type: Number, required: true },
  buy_now_price: { type: Number, required: true },  // Giá mua ngay
  min_bid_step: { type: Number, required: true },  // Bước giá tối thiểu
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' },
  auction_duration: { type: Number, required: true }, // Số ngày đấu giá
  start_time: { type: Date, default: Date.now }, // Thời điểm bắt đầu (khi được phê duyệt)
  end_time: { type: Date, default: Date.now },   // Thời điểm kết thúc
  deposit_percentage: { type: Number, required: true },
  deposit_amount: { type: Number, required: true },
  shipping_method: { 
    type: String, 
    required: true,
    enum: ['Giao tận nơi', 'Gặp trực tiếp'] 
  },
  payment_method: { 
    type: String, 
    required: true,
    enum: ['Chuyển khoản ngân hàng', 'Tiền mặt'] 
  }
});

// Middleware để tự động cập nhật thời gian kết thúc khi phiên đấu giá được phê duyệt
AuctionSessionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.start_time) {
    this.start_time = new Date();
    this.end_time = new Date(this.start_time.getTime() + (this.auction_duration * 24 * 60 * 60 * 1000));
  }
  next();
});

module.exports = mongoose.model('AuctionSession', AuctionSessionSchema);

