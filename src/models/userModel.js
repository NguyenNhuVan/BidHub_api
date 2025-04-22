const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Thông tin cơ bản của người dùng
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  dob: { type: Date, default: null },
  introduce: {type: String, default: '' },
  watchlist: { type: Array, default: [] },
  payment_methods: { type: Array, default: [] },
    cccd: { 
    number: { type: String, default: ''}, // Số CCCD
    photo: { type: String, default: '' }, // Ảnh CCCD
  },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpires: { type: String, default: '' },
  social_links: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
  },

  expertise: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], 
  qualifications: [{ 
    degree: { type: String, default: '' }, // Tên bằng cấp
    photo: { type: String, default: '' }, // Ảnh bằng cấp
  }],
  experience_years: { type: Number, default: 0 }, 
  workload: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
