const express = require('express');
const router = express.Router();

const paymentController = require('../controller/Payment.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/booking/:bookingId/create', paymentController.createPaymentForBooking);
router.post('/booking/:bookingId/create-transfer', paymentController.createTransferPaymentForBooking);
router.get('/booking/:bookingId/status', paymentController.getPaymentStatus);

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

router.post('/momo/ipn', paymentController.handleMomoIpn);

router.get('/momo/return', paymentController.handleMomoReturn);

module.exports = router;

