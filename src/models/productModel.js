const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], required: true },
    starting_price: { type: Number, required: true },
    status: { type: String, enum: ["available", "sold", "inactive"], default: "available" },
}
);

module.exports= mongoose.model("Product", productSchema);
