// server/src/controllers/paymentController.js
const axios = require('axios');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const momoConfig = require('../config/momo');

exports.createMomoPayment = async (req, res) => {
  try {
    const { auction_item_id, buyer_id, seller_id, amount } = req.body;

    // Tạo orderId và requestId duy nhất
    const orderId = `${Date.now()}_${buyer_id}`;
    const requestId = `${Date.now()}_${buyer_id}`;

    // Thông tin cấu hình MoMo
    const {
      partnerCode,
      accessKey,
      secretKey,
      endpoint,
      redirectUrl,
      ipnUrl
    } = momoConfig;

    // Tạo signature (tham khảo tài liệu MoMo)
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=Thanh toán phiên đấu giá&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
    const signature = crypto.createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // Gửi request tới MoMo
    const response = await axios.post(endpoint, {
      partnerCode,
      accessKey,
      requestId,
      amount: `${amount}`,
      orderId,
      orderInfo: "Thanh toán phiên đấu giá",
      redirectUrl,
      ipnUrl,
      extraData: "",
      requestType: "payWithMethod",
      signature,
      lang: "vi"
    });

    // Lưu thông tin giao dịch vào DB
    const payment = new Payment({
      auction_item_id,
      buyer_id,
      seller_id,
      amount,
      status: 'Pending',
      payment_method: 'Wallet',
      momo_pay_url: response.data.payUrl,
      momo_order_id: orderId,
      momo_request_id: requestId
    });
    await payment.save();

    res.json({ payUrl: response.data.payUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// server/src/controllers/paymentController.js
exports.momoIpn = async (req, res) => {
    console.log("==> Đã vào controller momoIpn");
    try {
      const { orderId, resultCode } = req.body;
      console.log("==> Đã vào controller momoIpn, orderId:", orderId, "resultCode:", resultCode);
      const payment = await Payment.findOne({ momo_order_id: orderId });
      if (!payment) return res.status(404).json({ message: 'Payment not found' });
  
      if (resultCode === 0) {
        payment.status = 'Completed';
        // Nếu là nạp tiền (có user_id), cộng số dư cho user
        if (payment.user_id) {
          const user = await User.findById(payment.user_id);
          if (user) {
            user.balance += payment.amount;
            console.log("==> Đã cộng số dư cho user, user:", user);
            await user.save();
          }
        }
        // Nếu là giao dịch đấu giá, có thể xử lý logic khác ở đây
      } else {
        payment.status = 'Failed';
      }
      await payment.save();
  
      res.status(200).json({ message: 'IPN received' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// exports.createMomoDeposit = async (req, res) => {
//   try {
//     let { amount } = req.body;
//     let userId = req.user?._id; // lấy từ token

//     console.log("==> Đã vào controller createMomoDeposit, userId:", userId, "amount:", amount);

//     if (!userId) {
//       return res.status(401).json({ message: "Không xác định được userId" });
//     }
//     if (!amount) {
//       return res.status(400).json({ message: "Thiếu amount" });
//     }

//     const orderId = `${Date.now()}_${userId}`;
//     const requestId = `${Date.now()}_${userId}`;

//     const {
//       partnerCode,
//       accessKey,
//       secretKey,
//       endpoint,
//       redirectUrl,
//       ipnUrl
//     } = momoConfig;

//     const requestType = "payWithMethod";
//     const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=Nạp tiền vào tài khoản&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
//     const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

//     const response = await axios.post(endpoint, {
//       partnerCode,
//       accessKey,
//       requestId,
//       amount: `${amount}`,
//       orderId,
//       orderInfo: "Nạp tiền vào tài khoản",
//       redirectUrl,
//       ipnUrl,
//       extraData: "",
//       requestType,
//       signature,
//       lang: "vi"
//     });

//     if (!response.data.payUrl) {
//       return res.status(400).json({ message: response.data.message || "Không thể tạo giao dịch MoMo", momoResponse: response.data });
//     }

//     const payment = new Payment({
//       user_id: userId,
//       amount,
//       status: 'Pending',
//       payment_method: 'Wallet',
//       momo_pay_url: response.data.payUrl,
//       momo_order_id: orderId,
//       momo_request_id: requestId
//     });
//     await payment.save();

//     res.json({ payUrl: response.data.payUrl });
//   } catch (error) {
//     if (error.response) {
//       return res.status(500).json({ message: error.response.data.message || error.message, momoError: error.response.data });
//     }
//     res.status(500).json({ message: error.message });
//   }
// };
exports.createMomoDeposit = async (req, res) => {
  try {
    let { amount } = req.body;
    let userId = req.user?._id; // lấy từ token

    console.log("==> Đã vào controller createMomoDeposit, userId:", userId, "amount:", amount);

    if (!userId) {
      return res.status(401).json({ message: "Không xác định được userId" });
    }
    if (!amount) {
      return res.status(400).json({ message: "Thiếu amount" });
    }

    const orderId = `${Date.now()}_${userId}`;
    const requestId = `${Date.now()}_${userId}`;

    const {
      partnerCode,
      accessKey,
      secretKey,
      endpoint,
      redirectUrl,
      ipnUrl
    } = momoConfig;

    const requestType = "payWithMethod";
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=Nạp tiền vào tài khoản&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const response = await axios.post(endpoint, {
      partnerCode,
      accessKey,
      requestId,
      amount: `${amount}`,
      orderId,
      orderInfo: "Nạp tiền vào tài khoản",
      redirectUrl,
      ipnUrl,
      extraData: "",
      requestType,
      signature,
      lang: "vi"
    });

    if (!response.data.payUrl) {
      return res.status(400).json({ message: response.data.message || "Không thể tạo giao dịch MoMo", momoResponse: response.data });
    }

    // Lưu thông tin giao dịch vào DB
    const payment = new Payment({
      user_id: userId,
      amount,
      status: 'Pending',
      payment_method: 'Wallet',
      momo_pay_url: response.data.payUrl,
      momo_order_id: orderId,
      momo_request_id: requestId
    });
    await payment.save();

    // CỘNG TIỀN TRỰC TIẾP CHO USER (KHÔNG CHỜ IPN)
    const user = await User.findById(userId);
    if (user) {
      user.balance += Number(amount);
      await user.save();
      console.log("==> Đã cộng tiền trực tiếp cho user:", user.email, "Số dư mới:", user.balance);
    }

    res.json({ payUrl: response.data.payUrl });
  } catch (error) {
    if (error.response) {
      return res.status(500).json({ message: error.response.data.message || error.message, momoError: error.response.data });
    }
    res.status(500).json({ message: error.message });
  }
};