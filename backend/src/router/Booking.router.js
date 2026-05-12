const express = require('express');
const router = express.Router();
const bookingController = require('../controller/Booking.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireStaff } = require('../middleware/roleMiddleware');
const Booking = require('../models/Booking.models');
const ApiResponse = require('../models/ApiResponse.models');

router.post('/', bookingController.createBooking);
router.post('/calculate-price', bookingController.calculatePrice);
router.get('/status/:id', bookingController.checkBookingStatus);
router.get('/phone/:phone', bookingController.getBookingsByPhone);
router.get('/:id', bookingController.getBookingById);
router.post('/:id/cancel', bookingController.cancelBooking);

router.put('/:id/confirm', authMiddleware, requireStaff, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json(ApiResponse.error('Không tìm thấy đơn đặt xe'));
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json(ApiResponse.error(`Không thể xác nhận đơn ở trạng thái ${booking.status_text}`));
    }
    
    booking.status = 'confirmed';
    await booking.save();
    res.json(ApiResponse.success(booking, 'Xác nhận đơn đặt xe thành công'));
  } catch (error) {
    console.error('❌ Lỗi xác nhận booking:', error);
    res.status(500).json(ApiResponse.error('Không thể xác nhận đơn đặt xe', error.message));
  }
});

router.put('/:id/complete', authMiddleware, requireStaff, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json(ApiResponse.error('Không tìm thấy đơn đặt xe'));
    }
    
    if (booking.status !== 'in-progress') {
      return res.status(400).json(ApiResponse.error(`Không thể hoàn thành đơn ở trạng thái ${booking.status_text}`));
    }
    
    booking.status = 'completed';
    await booking.save();
    res.json(ApiResponse.success(booking, 'Hoàn thành chuyến đi'));
  } catch (error) {
    console.error('❌ Lỗi hoàn thành booking:', error);
    res.status(500).json(ApiResponse.error('Không thể hoàn thành chuyến đi', error.message));
  }
});

module.exports = router;