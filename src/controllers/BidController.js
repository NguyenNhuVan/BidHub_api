const AuctionSession = require('../models/auctionSessionModel');
const Bid = require('../models/bidModel');
const { sendNotification } = require('../utils/sendNotification');

// Đặt giá mới
exports.placeBid = async (req, res) => {
    try {
        const { auction_session_id, bidder_id, bid_amount } = req.body;

        // Tìm phiên đấu giá
        const auction = await AuctionSession.findById(auction_session_id);
        if (!auction) return res.status(404).json({ success: false, message: 'Phiên đấu giá không được tìm thấy' });

        // Kiểm tra người đặt giá có phải là người tạo phiên đấu giá không
        if (auction.created_by.toString() === bidder_id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Người tạo phiên đấu giá không thể tham gia đấu giá cho chính sản phẩm của mình',
            });
        }

        // Kiểm tra giá đấu hợp lệ
        if (bid_amount < auction.current_bid + auction.min_bid_step) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền đặt giá phải ít nhất bằng giá thầu hiện tại cộng với bước tối thiểu',
            });
        }

        // Cập nhật phiên đấu giá
        auction.current_bid = bid_amount;
        await auction.save();

        // Lưu thông tin đặt giá
        const newBid = await Bid.create({ auction_session_id, bidder_id, bid_amount });

        // Gửi thông báo tới tất cả người dùng trong phiên đấu giá
        const io = req.app.get('io');
        if (io) {
            console.log('Calling sendNotification for creator...');
            io.to(auction_session_id.toString()).emit('new_bid', {
                message: 'Một giá thầu mới đã được đưa ra',
                bid: newBid,
            });
            
            // Gửi thông báo cho người tạo phiên đấu giá
            await sendNotification(
                auction.created_by,
                `Có người đã đặt giá ${bid_amount} cho sản phẩm của bạn`,
                'new_bid',
                auction_session_id,
                io
            );
            
            // Lấy danh sách tất cả người đã đặt giá trong phiên đấu giá
            const allBids = await Bid.find({ auction_session_id });
            const uniqueBidders = [...new Set(allBids.map(bid => bid.bidder_id.toString()))];
            
            // Gửi thông báo cho tất cả người đã đặt giá trước đó, trừ người vừa đặt giá mới
            for (const bidderId of uniqueBidders) {
                if (bidderId !== bidder_id.toString()) {
                    await sendNotification(
                        bidderId,
                        `Có người đã đặt giá ${bid_amount} cho phiên đấu giá mà bạn đang tham gia`,
                        'new_bid',
                        auction_session_id,
                        io
                    );
                }
            }
        }

        res.status(201).json({ success: true, data: newBid });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


