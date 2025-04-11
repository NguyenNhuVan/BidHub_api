const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  dob: { type: Date, default: null },
  bid_history: { type: Array, default: [] },
  current_bid_items: { type: Array, default: [] },
  watchlist: { type: Array, default: [] },
  verified: { type: Boolean, default: false },
  id_proof: { type: String, default: '' },
  payment_methods: { type: Array, default: [] },
  balance: { type: Number, default: 0 },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpires: { type: String, default: '' },
  social_links: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
  },
  expertise: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // Danh sách chuyên môn
  workload: { type: Number, default: 0 },  // Khối lượng công việc hiện tại
  location: {
    latitude: { type: Number, default: null },  // Vĩ độ
    longitude: { type: Number, default: null }  // Kinh độ
  }
});

module.exports = mongoose.model('User', userSchema);