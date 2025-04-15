const AuctionSessionModel = require('../models/auctionSessionModel');
const { sendNotification } = require('./sendNotification');

const checkAuctionEnd = async (io) => {
    try {
        if (!io) {
            console.error('Không có đối tượng Socket.io');
            return;
        }

        const now = new Date();
        const endingAuctions = await AuctionSessionModel.find({
            auction_end_time: { $lt: now },
            status: 'active'
        }).populate('product_id').populate('created_by');

        console.log(`Tìm thấy ${endingAuctions.length} phiên đấu giá đã kết thúc`);

        for (const auction of endingAuctions) {
            try {
                // Cập nhật trạng thái phiên đấu giá
                auction.status = 'ended';
                await auction.save();
                console.log(`Đã cập nhật trạng thái phiên đấu giá ${auction._id} thành 'kết thúc'`);

                // Gửi thông báo cho người tạo phiên đấu giá
                if (auction.created_by && auction.created_by._id) {
                    await sendNotification(
                        auction.created_by._id,
                        `Phiên đấu giá "${auction.product_id ? auction.product_id.title : 'Không xác định'}" đã kết thúc`,
                        'auction_ended',
                        auction._id,
                        io
                    );
                    console.log(`Đã gửi thông báo cho người tạo phiên đấu giá: ${auction.created_by._id}`);
                }

                // Gửi thông báo cho tất cả người đã đặt giá
                const bids = await require('../models/bidModel').find({ auction_session_id: auction._id });
                const uniqueBidders = [...new Set(bids.map(bid => bid.bidder_id.toString()))];
                
                for (const bidderId of uniqueBidders) {
                    await sendNotification(
                        bidderId,
                        `Phiên đấu giá "${auction.product_id ? auction.product_id.title : 'Không xác định'}" đã kết thúc`,
                        'auction_ended',
                        auction._id,
                        io
                    );
                    console.log(`Đã gửi thông báo cho người đặt giá: ${bidderId}`);
                }

                // Gửi thông báo qua Socket.IO
                io.to(auction._id.toString()).emit('auction_ended', {
                    message: `Phiên đấu giá "${auction.product_id ? auction.product_id.title : 'Không xác định'}" đã kết thúc!`,
                    auctionSessionId: auction._id,
                });
                console.log(`Đã phát sự kiện auction_ended cho phiên đấu giá: ${auction._id}`);
            } catch (auctionError) {
                console.error(`Lỗi khi xử lý phiên đấu giá ${auction._id}:`, auctionError);
            }
        }
    } catch (err) {
        console.error('Lỗi khi kiểm tra các phiên đấu giá:', err);
    }
};


module.exports = { checkAuctionEnd };
