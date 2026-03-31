const express = require('express');
const router = express.Router();

const paymentController = require('../controller/Payment.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/booking/:bookingId/create', paymentController.createPaymentForBooking);
router.post('/booking/:bookingId/create-transfer', paymentController.createTransferPaymentForBooking);
router.get('/booking/:bookingId/status', paymentController.getPaymentStatus);

// Staff/Driver xác nhận tiền mặt
router.patch(
  '/booking/:bookingId/confirm-cash',
  authMiddleware,
  async (req, res, next) => {
    if (req.userRole !== 'staff' && req.userRole !== 'driver') {
      return res.status(403).json({ success: false, message: 'Chỉ staff/driver xác nhận được' });
    }
    next();
  },
  paymentController.confirmCashPayment
);

// MoMo IPN callback
router.post('/momo/ipn', paymentController.handleMomoIpn);

// MoMo redirect/return URL (fallback khi IPN không gọi được)
router.get('/momo/return', paymentController.handleMomoReturn);

module.exports = router;

