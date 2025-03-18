const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/bidhub"); 
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("Database connection failed: ", error.message);
    }
}
module.exports = connectDB;
