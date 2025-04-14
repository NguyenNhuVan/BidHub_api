const AuctionSessionModel = require('../models/auctionSessionModel');  // Đảm bảo bạn có đúng model

const checkAuctionEnd = async (io) => {
    try {
        if (!io) {
            console.error('Socket.io instance is not available');
            return;
        }

        const now = new Date();
        const endingAuctions = await AuctionSessionModel.find({
            auction_end_time: { $lt: now },
            status: 'active'  // Hoặc trạng thái nào đó của phiên đấu giá
        });

        endingAuctions.forEach((auction) => {
            // Phát thông báo kết thúc phiên đấu giá
            io.to(auction._id.toString()).emit('auction_ended', {
                message: `Phiên đấu giá ${auction._id} đã kết thúc!`,
                auctionSessionId: auction._id,
            });

            // Cập nhật trạng thái phiên đấu giá trong database nếu cần
            auction.status = 'ended';
            auction.save().catch((err) => console.error('Error saving auction status:', err));
        });
    } catch (err) {
        console.error('Error checking auctions:', err);
    }
};

module.exports = { checkAuctionEnd };
