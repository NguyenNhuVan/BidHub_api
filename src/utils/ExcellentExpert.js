const UserModel = require("../models/userModel");
const { sendNotification } = require('./sendNotification');

const handleAuctionAssignment = async (auction, categoryId) => {
    try {
        console.log('Starting auction assignment for auction:', auction._id, 'category:', categoryId);
        
        // Tìm chuyên gia theo chuyên môn và sắp xếp theo workload
        const experts = await UserModel.find({
            role: 'expert',
            expertise: { $in: [categoryId] }, 
        }).sort('workload');

        console.log('Found experts:', experts.map(e => ({
            id: e._id, 
            name: e.name, 
            workload: e.workload,
            expertise: e.expertise
        })));

        if (experts.length === 0) {
            console.error("No experts found for category:", categoryId);
            return {
                success: false,
                message: 'Không có chuyên gia phù hợp để xét duyệt',
                details: {
                    categoryId,
                    reason: 'Không tìm thấy chuyên gia nào cho danh mục này'
                }
            };
        }

        // Gán chuyên gia có workload thấp nhất
        const assignedExpert = experts[0];
        console.log('Selected expert:', {
            id: assignedExpert._id, 
            name: assignedExpert.name,
            workload: assignedExpert.workload,
            expertise: assignedExpert.expertise
        });

        // Cập nhật workload cho chuyên gia
        assignedExpert.workload += 1;
        await assignedExpert.save();
        console.log('Updated expert workload:', assignedExpert.workload);

        // Cập nhật phiên đấu giá với chuyên gia được gán
        auction.verified_by = assignedExpert._id;
        await auction.save();
        console.log('Updated auction with expert:', auction.verified_by);

        // Gửi thông báo cho chuyên gia
        if (global.io) {
            await sendNotification(
                assignedExpert._id,
                `Bạn được gán phê duyệt phiên đấu giá mới`,
                'auction_assignment',
                auction._id,
                global.io
            );
        }

        return {
            success: true,
            expert: assignedExpert,
            message: 'Đã gán chuyên gia thành công'
        };
    } catch (error) {
        console.error("Error in handleAuctionAssignment:", error);
        return {
            success: false,
            message: `Lỗi khi gán chuyên gia: ${error.message}`,
            details: {
                categoryId,
                error: error.message
            }
        };
    }
};

module.exports = { 
    handleAuctionAssignment
};