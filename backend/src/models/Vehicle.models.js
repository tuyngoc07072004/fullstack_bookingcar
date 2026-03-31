const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_name: {
    type: String,
    required: [true, 'Tên xe là bắt buộc'],
    trim: true
  },
  license_plate: {
    type: String,
    required: [true, 'Biển số xe là bắt buộc'],
    unique: true,
    trim: true,
    uppercase: true
  },
  seats: {
    type: Number,
    required: [true, 'Số chỗ ngồi là bắt buộc'],
    enum: [4, 7, 9, 16, 29, 45]
  },
  vehicle_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleType',
    required: true
  },
  status: {
    type: String,
    enum: ['ready', 'not_started', 'completed'],
    default: 'ready'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual: Lấy thông tin loại xe
vehicleSchema.virtual('vehicle_type_info', {
  ref: 'VehicleType',
  localField: 'vehicle_type_id',
  foreignField: '_id',
  justOne: true
});

// Virtual: Lấy tất cả trip assignments của xe
vehicleSchema.virtual('assignments', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'vehicle_id',
  options: { sort: { assigned_at: -1 } }
});

// Virtual: Lấy assignment hiện tại (chưa hoàn thành)
vehicleSchema.virtual('current_assignment', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'vehicle_id',
  match: { end_time: null },
  justOne: true
});

// Virtual: Text trạng thái
vehicleSchema.virtual('status_text').get(function() {
  const statusMap = {
    'ready': 'Chuẩn bị khởi hành',
    'not_started': 'Chưa khởi hành',
    'completed': 'Đã hoàn thành chuyến đi'
  };
  return statusMap[this.status] || this.status;
});

// Virtual: Text loại xe
vehicleSchema.virtual('vehicle_type_text').get(function() {
  const typeMap = {
    4: 'Xe 4 chỗ',
    7: 'Xe 7 chỗ',
    9: 'Xe 9 chỗ',
    16: 'Xe 16 chỗ',
    29: 'Xe 29 chỗ',
    45: 'Xe 45 chỗ'
  };
  return typeMap[this.seats] || 'Xe không xác định';
});

// ✅ FIXED: Middleware - Sửa lỗi "next is not a function"
// Khi dùng async function, không cần gọi next()
vehicleSchema.pre('save', async function() {
  try {
    // Chỉ chạy nếu seats thay đổi và chưa có vehicle_type_id
    if (this.isModified('seats') && !this.vehicle_type_id) {
      const VehicleType = mongoose.model('VehicleType');
      const vehicleType = await VehicleType.findOne({ seats: this.seats });
      if (vehicleType) {
        this.vehicle_type_id = vehicleType._id;
        console.log(`✅ Auto-set vehicle_type_id to ${vehicleType._id} for ${this.seats} seats`);
      } else {
        console.warn(`⚠️ No VehicleType found for ${this.seats} seats`);
      }
    }
  } catch (error) {
    console.error('❌ Error in pre-save middleware:', error);
    throw error; // Throw error để mongoose biết có lỗi
  }
});

// Chỉ index cho các trường không có unique
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ seats: 1 });
vehicleSchema.index({ vehicle_type_id: 1 });

vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);