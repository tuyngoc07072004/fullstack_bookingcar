const express = require('express');
const router = express.Router();
const driverReviewController = require('../controller/driverReview.controller');

// POST /api/reviews – tạo đánh giá (không cần auth)
router.post('/', driverReviewController.createReview);

// GET /api/reviews/booking/:bookingId – kiểm tra đã đánh giá chưa
router.get('/booking/:bookingId', driverReviewController.getReviewByBooking);

// GET /api/reviews/driver/:driverId – lấy tất cả đánh giá của tài xế
router.get('/driver/:driverId', driverReviewController.getDriverReviews);

module.exports = router;
