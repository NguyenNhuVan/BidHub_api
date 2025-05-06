// server/src/config/momoConfig.js
module.exports = {
    partnerCode: 'MOMO',
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: 'http://localhost:3000/he-thong/vi-tien',
    ipnUrl: 'http://localhost:3001/payment/momo-ipn',
      // ipnUrl: 'https://xxxxxx.ngrok.io/payment/momo-ipn'
  };