// server/src/routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require("../middlewares/authenticate");

router.post('/momo-deposit',authenticate, paymentController.createMomoDeposit);
router.post('/momo-ipn', paymentController.momoIpn);
// router.post('/vnpay-deposit', paymentController.createVnpayDeposit);
module.exports = router;