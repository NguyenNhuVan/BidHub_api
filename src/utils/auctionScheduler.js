const AuctionSessionModel = require('../models/auctionSessionModel');  // Đảm bảo bạn có đúng model
const { sendNotification } = require('./sendNotification');
const Bid = require('../models/bidModel');

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

        endingAuctions.forEach(async (auction) => {
            // Phát thông báo kết thúc phiên đấu giá
            io.to(auction._id.toString()).emit('auction_ended', {
                message: `Phiên đấu giá ${auction._id} đã kết thúc!`,
                link: `/auctions/${auction._id}`, // FE sẽ dùng đường dẫn này để chuyển trang
                auctionSessionId: auction._id,
            });

            // Gửi thông báo cho người tạo phiên đấu giá
            await sendNotification(
                auction.created_by,
                `Phiên đấu giá của bạn đã kết thúc!`,
                'auction_ended',
                auction._id,
                io
            );

            // Lấy danh sách tất cả người đã đặt giá trong phiên đấu giá
            const allBids = await Bid.find({ auction_session_id: auction._id });
            const uniqueBidders = [...new Set(allBids.map(bid => bid.bidder_id.toString()))];
            
            // Gửi thông báo cho tất cả người đã đặt giá
            for (const bidderId of uniqueBidders) {
                await sendNotification(
                    bidderId,
                    `Phiên đấu giá mà bạn đã tham gia đã kết thúc!`,
                    'auction_ended',
                    auction._id,
                    io
                );
            }

            // Cập nhật trạng thái phiên đấu giá trong database nếu cần
            auction.status = 'ended';
            auction.save().catch((err) => console.error('Error saving auction status:', err));
        });
    } catch (err) {
        console.error('Error checking auctions:', err);
    }
};

module.exports = { checkAuctionEnd };
