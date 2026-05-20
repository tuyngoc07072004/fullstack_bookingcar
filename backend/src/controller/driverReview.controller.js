const DriverReview = require('../models/DriverReview.models');
const Booking = require('../models/Booking.models');
const TripAssignment = require('../models/TripAssignment.models');
const Trip = require('../models/Trip.models');
const ApiResponse = require('../models/ApiResponse.models');

class DriverReviewController {
  constructor() {
    this.createReview = this.createReview.bind(this);
    this.getReviewByBooking = this.getReviewByBooking.bind(this);
    this.getDriverReviews = this.getDriverReviews.bind(this);
    this.canReview = this.canReview.bind(this);
    this._hasDriverAssignment = this._hasDriverAssignment.bind(this);
  }

  /**
   * Helper: Kiểm tra booking có driver assignment không
   */
  async _hasDriverAssignment(bookingId) {
    // Try TripAssignment first
    const assignment = await TripAssignment.findOne({ booking_id: bookingId })
      .populate('driver_id', 'name');
    
    if (assignment && assignment.driver_id) {
      return { hasDriver: true, driverId: assignment.driver_id._id, driver: assignment.driver_id };
    }
    
    // Fallback: Try Trip
    const booking = await Booking.findById(bookingId).populate({
      path: 'trip_id',
      populate: { path: 'driver_id', select: 'name phone' }
    });
    
    if (booking && booking.trip_id && booking.trip_id.driver_id) {
      return { 
        hasDriver: true, 
        driverId: booking.trip_id.driver_id._id, 
        driver: booking.trip_id.driver_id,
        source: 'trip'
      };
    }
    
    return { hasDriver: false, driverId: null, driver: null };
  }

  /**
   * Kiểm tra xem booking có thể đánh giá được không
   * GET /api/reviews/can-review/:bookingId
   */
  async canReview(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy chuyến đi')
        );
      }

      const isCompleted = booking.status === 'completed';
      const existingReview = await DriverReview.findOne({ booking_id: bookingId });
      const { hasDriver } = await this._hasDriverAssignment(bookingId);

      return res.status(200).json(
        ApiResponse.success({
          canReview: isCompleted && !existingReview && hasDriver,
          isCompleted,
          hasReviewed: !!existingReview,
          hasDriver,
          bookingStatus: booking.status,
          bookingStatusText: booking.status_text
        }, 'Kiểm tra khả năng đánh giá thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi kiểm tra đánh giá:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server khi kiểm tra đánh giá', error.message)
      );
    }
  }

  /**
   * Tạo đánh giá mới
   * POST /api/reviews
   * Body: { bookingId, rating, comment }
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
          ApiResponse.error(`Chỉ có thể đánh giá các chuyến đã hoàn thành. Trạng thái hiện tại: ${booking.status_text}`)
        );
      }

      // Kiểm tra đã đánh giá chưa
      const existing = await DriverReview.findOne({ booking_id: bookingId });
      if (existing) {
        return res.status(409).json(
          ApiResponse.error('Chuyến đi này đã được đánh giá')
        );
      }

      // Lấy thông tin tài xế - với fallback
      const driverInfo = await this._hasDriverAssignment(bookingId);
      
      if (!driverInfo.hasDriver || !driverInfo.driverId) {
        return res.status(400).json(
          ApiResponse.error(
            'Không tìm thấy thông tin tài xế cho chuyến này. ' +
            'Vui lòng liên hệ bộ phận hỗ trợ để được giúp đỡ.'
          )
        );
      }

      console.log(`✅ Found driver for booking ${bookingId}:`, {
        driverId: driverInfo.driverId,
        source: driverInfo.source || 'trip_assignment',
        driverName: driverInfo.driver?.name
      });

      const review = await DriverReview.create({
        booking_id: bookingId,
        driver_id: driverInfo.driverId,
        customer_id: booking.customer_id || null,
        customer_name: booking.customer_name,
        rating: ratingNum,
        comment: comment?.trim() || null
      });

      console.log(`✅ Review created for booking ${bookingId}, driver ${driverInfo.driverId}, rating ${ratingNum}`);

      return res.status(201).json(
        ApiResponse.success(review, 'Đánh giá tài xế thành công! Cảm ơn bạn đã phản hồi.')
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