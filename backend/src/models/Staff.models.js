const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true, // Chỉ unique, không index riêng
    trim: true,
    match: [/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ']
  },
  email: {
    type: String,
    required: true,
    unique: true, // Chỉ unique, không index riêng
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  username: {
    type: String,
    required: true,
    unique: true, // Chỉ unique, không index riêng
    trim: true,
    lowercase: true,
    minlength: [4, 'Tên đăng nhập phải có ít nhất 4 ký tự']
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  role: {
    type: String,
    enum: ['staff', 'admin'],
    default: 'staff'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual: Lấy tất cả trip assignments do staff phân công
staffSchema.virtual('assignments', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'staff_id',
  options: { sort: { assigned_at: -1 } }
});

// Virtual: Lấy các assignment đã được tài xế xác nhận
staffSchema.virtual('confirmed_assignments', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'staff_id',
  match: { driver_confirm: 1 },
  options: { sort: { assigned_at: -1 } }
});

// Virtual: Lấy các assignment chờ xác nhận
staffSchema.virtual('pending_assignments', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'staff_id',
  match: { driver_confirm: 0 },
  options: { sort: { assigned_at: -1 } }
});

// Chỉ index cho các trường không có unique: true
staffSchema.index({ status: 1 });
staffSchema.index({ role: 1 });

staffSchema.set('toJSON', { virtuals: true });
staffSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Staff', staffSchema);