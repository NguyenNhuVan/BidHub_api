const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  auction_session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionSession', required: true },
  bidder_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bid_amount: { type: Number, required: true },
  bid_time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bid', BidSchema);
