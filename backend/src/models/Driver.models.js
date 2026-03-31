const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên tài xế là bắt buộc'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    unique: true, // Chỉ unique, không index riêng
    trim: true,
    match: [/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ']
  },
  license_number: {
    type: String,
    required: [true, 'Số giấy phép lái xe là bắt buộc'],
    unique: true, // Chỉ unique, không index riêng
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Tên đăng nhập là bắt buộc'],
    unique: true, // Chỉ unique, không index riêng
    trim: true,
    minlength: [4, 'Tên đăng nhập phải có ít nhất 4 ký tự']
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    select: false,
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'busy'],
    default: 'active'
  },
  /** Xe đang gắn với tài xế (cập nhật khi NV phân công hoặc tự chọn) */
  current_vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null,
    index: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual: Lấy tất cả trip assignments của tài xế
driverSchema.virtual('assignments', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'driver_id',
  options: { sort: { assigned_at: -1 } }
});

// Virtual: Lấy assignment hiện tại (chưa hoàn thành)
driverSchema.virtual('current_assignment', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'driver_id',
  match: { end_time: null },
  justOne: true
});

// Virtual: Lấy các assignment đã hoàn thành
driverSchema.virtual('completed_assignments', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'driver_id',
  match: { end_time: { $ne: null } },
  options: { sort: { assigned_at: -1 } }
});

// Virtual: Text trạng thái
driverSchema.virtual('status_text').get(function() {
  const statusMap = {
    'active': 'Đang hoạt động',
    'inactive': 'Không hoạt động',
    'busy': 'Đang bận'
  };
  return statusMap[this.status] || this.status;
});

// Chỉ index cho trường status
driverSchema.index({ status: 1 });

driverSchema.set('toJSON', { virtuals: true });
driverSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Driver', driverSchema);