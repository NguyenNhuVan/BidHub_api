const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role_id: { type: String, default: 'user' },
  avatar: { type: String },
  phone: { type: String },
  address: { type: String },
  dob: { type: Date },
  bid_history: { type: Array, default: [] },
  current_bid_items: { type: Array, default: [] },
  watchlist: { type: Array, default: [] },
  verified: { type: Boolean, default: false },
  id_proof: { type: String },
  payment_methods: { type: Array, default: [] },
  balance: { type: Number, default: 0 },
  resetPasswordToken :{type: String},
  resetPasswordExpires:{ type: String },
  social_links: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
  },
});
module.exports = mongoose.model('User', userSchema);