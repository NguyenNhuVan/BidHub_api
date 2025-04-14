const express = require('express');
require('dotenv').config();
const http = require("http");
const socketIo = require('socket.io');
const Routes = require("./routes/index.js");
const connectDB = require("./config/database.js");
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
Routes(app);
connectDB();

// WebSocket Logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Người dùng tham gia phiên đấu giá
    socket.on('join_auction', (auctionSessionId) => {
        console.log(`User joined auction session: ${auctionSessionId}`);
        socket.join(auctionSessionId);
    });

    // Thông báo khi có giá mới
    socket.on('new_bid', (auctionSessionId, bidAmount, userId) => {
        // Lưu bid vào database (ví dụ sử dụng Mongoose)
        const newBid = new Bid({
            auction_session_id: auctionSessionId,
            bidder_id: userId,
            bid_amount: bidAmount,
        });

        newBid.save().then(() => {
            // Phát thông báo giá mới đến tất cả người tham gia
            io.to(auctionSessionId).emit('bid_update', {
                message: `Người dùng ${userId} đã đặt giá mới: ${bidAmount}`,
                auctionSessionId: auctionSessionId,
                newBidAmount: bidAmount
            });
        }).catch((err) => {
            console.error('Error saving bid:', err);
        });
    });

    // Thông báo kết thúc phiên đấu giá
    socket.on('end_auction', (auctionSessionId) => {
        io.to(auctionSessionId).emit('auction_ended', {
            message: `Phiên đấu giá với ID ${auctionSessionId} đã kết thúc!`
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Cron job or event check for auction end notifications
const { checkAuctionEnd } = require('./utils/auctionScheduler');
setInterval(() => {
    checkAuctionEnd(io);
}, 60000); // Check every minute

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
