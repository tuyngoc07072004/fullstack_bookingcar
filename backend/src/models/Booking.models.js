const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer_name: {
    type: String,
    required: [true, 'Tên khách hàng là bắt buộc'],
    trim: true
  },
  customer_phone: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    trim: true,
    index: true
  },
  customer_email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
    sparse: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  
  // Thông tin chuyến đi
  pickup_location: {
    type: String,
    required: [true, 'Điểm đón là bắt buộc'],
    trim: true
  },
  dropoff_location: {
    type: String,
    required: [true, 'Điểm đến là bắt buộc'],
    trim: true
  },
  pickup_coords: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  dropoff_coords: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  distance: {
    type: Number,
    min: 0,
    default: null
  },
  
  // Thời gian
  trip_date: {
    type: Date,
    required: [true, 'Ngày giờ đi là bắt buộc'],
    index: true
  },
  
  // Số lượng
  passengers: {
    type: Number,
    required: [true, 'Số hành khách là bắt buộc'],
    min: 1,
    default: 1
  },
  
  seats: {
    type: Number,
    required: true,
    enum: [4, 7, 9, 16, 29, 45],
    index: true
  },
  
  vehicle_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleType',
    required: true,
    index: true
  },
  
  // Giá cả
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  payment_method: {
    type: String,
    enum: ['cash', 'transfer'],
    default: 'cash'
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Ghi chú
  low_occupancy_reason: {
    type: String,
    trim: true,
    default: null
  },
  
  notes: {
    type: String,
    trim: true,
    default: null
  },

  // Liên kết với Trip
  trip_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null,
    index: true
  },

  /** public: khách đặt qua web; driver: tài xế tự tạo */
  booking_source: {
    type: String,
    enum: ['public', 'driver'],
    default: 'public',
    index: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// ==================== VIRTUALS ====================

// Thông tin khách hàng
bookingSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: '_id',
  justOne: true
});

// Thông tin loại xe - FIXED: Added ref
bookingSchema.virtual('vehicleType', {
  ref: 'VehicleType',
  localField: 'vehicle_type_id',
  foreignField: '_id',
  justOne: true
});

// Thông tin phân công chuyến đi
bookingSchema.virtual('tripAssignment', {
  ref: 'TripAssignment',
  localField: '_id',
  foreignField: 'booking_id',
  justOne: true
});

// Thông tin Trip
bookingSchema.virtual('trip', {
  ref: 'Trip',
  localField: 'trip_id',
  foreignField: '_id',
  justOne: true
});

// Text trạng thái
bookingSchema.virtual('status_text').get(function() {
  const statusMap = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'assigned': 'Đã phân công',
    'in-progress': 'Đang thực hiện',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  };
  return statusMap[this.status] || this.status;
});

// Text phương thức thanh toán
bookingSchema.virtual('payment_method_text').get(function() {
  return this.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';
});

// Ngày giờ định dạng
bookingSchema.virtual('formatted_date').get(function() {
  if (!this.trip_date) return '';
  return new Date(this.trip_date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Ngày giờ định dạng ngắn
bookingSchema.virtual('formatted_date_short').get(function() {
  if (!this.trip_date) return '';
  return new Date(this.trip_date).toLocaleDateString('vi-VN');
});

// Kiểm tra có thể hủy không
bookingSchema.virtual('can_cancel').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Kiểm tra có thể chỉnh sửa không
bookingSchema.virtual('can_edit').get(function() {
  return this.status === 'pending';
});

// Kiểm tra có thể xác nhận không
bookingSchema.virtual('can_confirm').get(function() {
  return this.status === 'pending';
});

// Kiểm tra có thể phân công không
bookingSchema.virtual('can_assign').get(function() {
  return this.status === 'confirmed' || this.status === 'pending';
});

// Kiểm tra có thể hoàn thành không
bookingSchema.virtual('can_complete').get(function() {
  return this.status === 'in-progress';
});

// ==================== METHODS ====================

/**
 * Cập nhật thống kê khách hàng
 */
bookingSchema.methods.updateCustomerStats = async function() {
  if (this.customer_id) {
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findById(this.customer_id);
    if (customer) {
      await customer.updateStats();
    }
  }
};

/**
 * Cập nhật trạng thái booking
 */
bookingSchema.methods.updateStatus = async function(newStatus, reason = null) {
  const validStatuses = ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Trạng thái không hợp lệ');
  }
  
  const oldStatus = this.status;
  this.status = newStatus;
  
  if (newStatus === 'cancelled' && reason) {
    this.low_occupancy_reason = reason;
  }
  
  await this.save();
  
  // Cập nhật thống kê khách hàng nếu hoàn thành
  if (newStatus === 'completed' && this.customer_id) {
    await this.updateCustomerStats();
  }
  
  return { oldStatus, newStatus };
};

/**
 * Hủy booking
 */
bookingSchema.methods.cancel = async function(reason = 'Khách hàng hủy') {
  if (!this.can_cancel) {
    throw new Error(`Không thể hủy đơn ở trạng thái ${this.status_text}`);
  }
  
  this.status = 'cancelled';
  this.low_occupancy_reason = reason;
  await this.save();
  
  // Nếu có phân công, giải phóng tài xế và xe
  const assignment = await mongoose.model('TripAssignment').findOne({ booking_id: this._id });
  if (assignment) {
    await assignment.removeAssignment();
  }
  
  return this;
};

bookingSchema.statics.findByPhone = function(phone) {
  return this.find({ customer_phone: phone })
    .populate('vehicleType')
    .sort({ created_at: -1 });
};

/**
 * Tìm booking theo khách hàng
 */
bookingSchema.statics.findByCustomer = function(customerId) {
  return this.find({ customer_id: customerId })
    .populate('vehicleType')
    .sort({ created_at: -1 });
};

/**
 * Lấy thống kê booking theo ngày
 */
bookingSchema.statics.getStatsByDate = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        created_at: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_price: { $sum: '$price' }
      }
    }
  ]);
};

bookingSchema.statics.getRevenueByDate = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        status: 'completed',
        trip_date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$price' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { total: 0, count: 0 };
};

// Pre-save middleware (promise style for current Mongoose versions)
bookingSchema.pre('save', function() {
  if (this.passengers > this.seats) {
    throw new Error(`Số hành khách không được vượt quá ${this.seats} chỗ`);
  }
});

// Post-save: Mongoose 8+ — document truyền vào tham số; fallback `this` nếu cần
bookingSchema.post('save', async function (doc) {
  try {
    const bookingDoc = doc || this;
    if (bookingDoc && typeof bookingDoc.updateCustomerStats === 'function') {
      await bookingDoc.updateCustomerStats();
    }
  } catch (err) {
    console.error('❌ Booking post-save updateCustomerStats:', err);
  }
});

// deleteOne (document middleware) thay cho hook `remove` cũ
bookingSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  try {
    const bookingDoc = doc || this;
    if (bookingDoc && typeof bookingDoc.updateCustomerStats === 'function') {
      await bookingDoc.updateCustomerStats();
    }
  } catch (err) {
    console.error('❌ Booking post-deleteOne updateCustomerStats:', err);
  }
});

bookingSchema.index({ created_at: -1 });
bookingSchema.index({ status: 1, created_at: -1 });
bookingSchema.index({ customer_phone: 1, created_at: -1 });
bookingSchema.index({ trip_date: 1, status: 1 });
bookingSchema.index({ customer_id: 1, created_at: -1 });

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);