const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String }, // URL của ảnh hoặc icon
});

module.exports = mongoose.model("Category", categorySchema);
