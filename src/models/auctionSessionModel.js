const mongoose = require('mongoose');

const AuctionSessionSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionItem', required: true },
  current_bid: { type: Number, default: 0 },
  reserve_price: { type: Number, required: true },
  buy_now_price: { type: Number, required: true },  // Giá mua ngay
  min_bid_step: { type: Number, required: true },  // Bước giá tối thiểu
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' },
  auction_end_time: { type: Date, required: true },
  deposit_percentage: { type: Number, required: true, min: 10, max: 30 },
  deposit_amount: { type: Number, required: true }
});

module.exports = mongoose.model('AuctionSession', AuctionSessionSchema);
