const mongoose = require('mongoose');

const vehicleTypeSchema = new mongoose.Schema({
  type_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  seats: {
    type: Number,
    required: true,
    enum: [4, 7, 9, 16, 29, 45],
    unique: true
  },
  base_price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  price_per_km: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    default: null
  },
  image_url: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual: Lấy tất cả xe thuộc loại này
vehicleTypeSchema.virtual('vehicles', {
  ref: 'Vehicle',
  localField: '_id',
  foreignField: 'vehicle_type_id'
});

// Virtual: Lấy tất cả booking thuộc loại xe này
vehicleTypeSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'vehicle_type_id',
  options: { sort: { created_at: -1 } }
});

// Virtual: Text hiển thị
vehicleTypeSchema.virtual('display_name').get(function() {
  return `${this.type_name} (${this.seats} chỗ)`;
});

// Indexes
// vehicleTypeSchema.index({ seats: 1 });
vehicleTypeSchema.index({ is_active: 1 });

vehicleTypeSchema.set('toJSON', { virtuals: true });
vehicleTypeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VehicleType', vehicleTypeSchema);