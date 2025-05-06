const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // chỉ required nếu là nạp tiền
  },
  auction_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionSessions',
    required: false, // chỉ required nếu là giao dịch đấu giá
  },
  buyer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: false,
  },
  seller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: false,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Completed', 'Failed'], // Add valid statuses as needed
  },
  payment_method: {
    type: String,
    required: true,
    enum: ['CreditCard', 'BankTransfer', 'Wallet', 'Other'], // Adjust methods as needed
  },
  payment_date: {
    type: Date,
    default: Date.now,
  },
  momo_pay_url: { type: String },
  momo_order_id: { type: String },
  momo_request_id: { type: String },
  vnpay_order_id: { type: String },
}, {
  timestamps: true, // Automatically adds `createdAt` and `updatedAt`
});

module.exports = mongoose.model('Payment', paymentSchema);