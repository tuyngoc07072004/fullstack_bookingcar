const mongoose = require('mongoose');

const driverReviewSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true, 
    index: true
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  customer_name: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'Số sao là bắt buộc'],
    min: [1, 'Tối thiểu 1 sao'],
    max: [5, 'Tối đa 5 sao'],
    index: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Nhận xét không quá 500 ký tự'],
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Populate shortcuts
driverReviewSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'booking_id',
  foreignField: '_id',
  justOne: true
});

driverReviewSchema.virtual('driver', {
  ref: 'Driver',
  localField: 'driver_id',
  foreignField: '_id',
  justOne: true
});

driverReviewSchema.index({ driver_id: 1, created_at: -1 });
driverReviewSchema.index({ created_at: -1 });

driverReviewSchema.set('toJSON', { virtuals: true });
driverReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DriverReview', driverReviewSchema);
