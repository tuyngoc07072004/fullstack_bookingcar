const DriverReview = require('../models/DriverReview.models');
const Booking = require('../models/Booking.models');
const TripAssignment = require('../models/TripAssignment.models');
const ApiResponse = require('../models/ApiResponse.models');

class DriverReviewController {
  constructor() {
    this.createReview = this.createReview.bind(this);
    this.getReviewByBooking = this.getReviewByBooking.bind(this);
    this.getDriverReviews = this.getDriverReviews.bind(this);
  }

  /**
   * Tạo đánh giá mới
   * POST /api/reviews
   * Body: { bookingId, rating, comment }
   * Không cần auth – khách tra cứu bằng SĐT
   */
  async createReview(req, res) {
    try {
      const { bookingId, rating, comment } = req.body;

      if (!bookingId || !rating) {
        return res.status(400).json(
          ApiResponse.error('Vui lòng cung cấp bookingId và số sao đánh giá')
        );
      }

      const ratingNum = Number(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json(
          ApiResponse.error('Số sao phải từ 1 đến 5')
        );
      }

      // Kiểm tra booking tồn tại và đã completed
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy chuyến đi')
        );
      }

      if (booking.status !== 'completed') {
        return res.status(400).json(
          ApiResponse.error('Chỉ có thể đánh giá các chuyến đã hoàn thành')
        );
      }

      // Kiểm tra đã đánh giá chưa
      const existing = await DriverReview.findOne({ booking_id: bookingId });
      if (existing) {
        return res.status(409).json(
          ApiResponse.error('Chuyến đi này đã được đánh giá')
        );
      }

      // Lấy thông tin tài xế từ TripAssignment
      const assignment = await TripAssignment.findOne({ booking_id: bookingId })
        .populate('driver_id', 'name');

      if (!assignment || !assignment.driver_id) {
        return res.status(400).json(
          ApiResponse.error('Không tìm thấy thông tin tài xế cho chuyến này')
        );
      }

      const review = await DriverReview.create({
        booking_id: bookingId,
        driver_id: assignment.driver_id._id,
        customer_id: booking.customer_id || null,
        customer_name: booking.customer_name,
        rating: ratingNum,
        comment: comment?.trim() || null
      });

      return res.status(201).json(
        ApiResponse.success(review, 'Đánh giá tài xế thành công')
      );
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json(
          ApiResponse.error('Chuyến đi này đã được đánh giá')
        );
      }
      console.error('❌ Lỗi tạo đánh giá:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server khi tạo đánh giá', error.message)
      );
    }
  }

  /**
   * Lấy đánh giá theo booking
   * GET /api/reviews/booking/:bookingId
   */
  async getReviewByBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const review = await DriverReview.findOne({ booking_id: bookingId }).lean();

      return res.status(200).json(
        ApiResponse.success(review, 'Lấy đánh giá thành công')
      );
    } catch (error) {
      console.error('❌ Lỗi lấy đánh giá:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server', error.message)
      );
    }
  }

  /**
   * Lấy tất cả đánh giá của một tài xế
   * GET /api/reviews/driver/:driverId
   */
  async getDriverReviews(req, res) {
    try {
      const { driverId } = req.params;
      const reviews = await DriverReview.find({ driver_id: driverId })
        .sort({ created_at: -1 })
        .lean();

      const total = reviews.length;
      const avgRating = total > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
        : 0;

      return res.status(200).json(
        ApiResponse.success({ reviews, total, avgRating }, 'Lấy đánh giá tài xế thành công')
      );
    } catch (error) {
      console.error('❌ Lỗi lấy đánh giá tài xế:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server', error.message)
      );
    }
  }
}

module.exports = new DriverReviewController();
