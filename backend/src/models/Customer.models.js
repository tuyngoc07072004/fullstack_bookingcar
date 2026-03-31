const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true, // unique tự động tạo index
    trim: true,
    match: [/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    unique: true, // unique tự động tạo index
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Email không hợp lệ'
    },
    default: undefined
  },
  total_bookings: {
    type: Number,
    default: 0
  },
  total_spent: {
    type: Number,
    default: 0
  },
  last_booking_date: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual: Lấy tất cả bookings của khách hàng
customerSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'customer_id',
  options: { sort: { created_at: -1 } }
});

// Virtual: Lấy các booking đã hoàn thành
customerSchema.virtual('completed_bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'customer_id',
  match: { status: 'completed' },
  options: { sort: { created_at: -1 } }
});

// Virtual: Lấy các booking đang chờ xử lý
customerSchema.virtual('pending_bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'customer_id',
  match: { status: { $in: ['pending', 'confirmed', 'assigned'] } },
  options: { sort: { created_at: -1 } }
});

// Method: Cập nhật thống kê khách hàng
customerSchema.methods.updateStats = async function() {
  const Booking = mongoose.model('Booking');
  const bookings = await Booking.find({ 
    customer_id: this._id, 
    status: 'completed' 
  });
  
  this.total_bookings = bookings.length;
  this.total_spent = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  
  const lastBooking = await Booking.findOne({ customer_id: this._id })
    .sort({ created_at: -1 });
  if (lastBooking) {
    this.last_booking_date = lastBooking.created_at;
  }
  
  await this.save();
};

customerSchema.index({ created_at: -1 });

customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);