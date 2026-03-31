const mongoose = require('mongoose');

const tripAssignmentSchema = new mongoose.Schema({
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
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    default: null,
    index: true
  },

  assignment_source: {
    type: String,
    enum: ['staff', 'driver'],
    default: 'staff',
    index: true
  },
  
  driver_confirm: {
    type: Number,
    enum: [0, 1],
    default: 0,
    index: true
  },
  
  low_occupancy_reason: {
    type: String,
    trim: true,
    default: null
  },
  
  start_time: {
    type: Date,
    default: null,
    index: true
  },
  
  end_time: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: { createdAt: 'assigned_at', updatedAt: false }
});

// ==================== VIRTUALS ====================

tripAssignmentSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'booking_id',
  foreignField: '_id',
  justOne: true
});

tripAssignmentSchema.virtual('driver', {
  ref: 'Driver',
  localField: 'driver_id',
  foreignField: '_id',
  justOne: true
});

tripAssignmentSchema.virtual('vehicle', {
  ref: 'Vehicle',
  localField: 'vehicle_id',
  foreignField: '_id',
  justOne: true
});

tripAssignmentSchema.virtual('staff', {
  ref: 'Staff',
  localField: 'staff_id',
  foreignField: '_id',
  justOne: true
});

tripAssignmentSchema.virtual('confirm_status').get(function() {
  return this.driver_confirm === 1 ? 'Đã xác nhận' : 'Chờ xác nhận';
});

tripAssignmentSchema.virtual('full_status').get(function() {
  if (this.end_time) return 'Đã hoàn thành';
  if (this.start_time) return 'Đang thực hiện';
  if (this.driver_confirm === 1) return 'Đã xác nhận';
  return 'Chờ xác nhận';
});

tripAssignmentSchema.virtual('duration_hours').get(function() {
  if (this.start_time && this.end_time) {
    const duration = this.end_time - this.start_time;
    return Math.round(duration / (1000 * 60 * 60));
  }
  return null;
});

tripAssignmentSchema.virtual('duration_minutes').get(function() {
  if (this.start_time && this.end_time) {
    const duration = this.end_time - this.start_time;
    return Math.round(duration / (1000 * 60));
  }
  return null;
});

tripAssignmentSchema.virtual('is_completed').get(function() {
  return this.end_time !== null;
});

tripAssignmentSchema.virtual('is_in_progress').get(function() {
  return this.start_time !== null && !this.end_time;
});

tripAssignmentSchema.virtual('is_confirmed').get(function() {
  return this.driver_confirm === 1;
});

tripAssignmentSchema.virtual('is_pending_confirm').get(function() {
  return this.driver_confirm === 0 && !this.start_time;
});

tripAssignmentSchema.virtual('formatted_assigned_at').get(function() {
  if (!this.assigned_at) return '';
  return new Date(this.assigned_at).toLocaleString('vi-VN');
});

tripAssignmentSchema.virtual('formatted_start_time').get(function() {
  if (!this.start_time) return 'Chưa bắt đầu';
  return new Date(this.start_time).toLocaleString('vi-VN');
});

tripAssignmentSchema.virtual('formatted_end_time').get(function() {
  if (!this.end_time) return 'Chưa kết thúc';
  return new Date(this.end_time).toLocaleString('vi-VN');
});

// ==================== METHODS ====================

tripAssignmentSchema.methods.startTrip = async function() {
  if (this.start_time) {
    throw new Error('Chuyến đã được bắt đầu');
  }
  
  this.start_time = new Date();
  await this.save();
  
  const Booking = mongoose.model('Booking');
  const booking = await Booking.findById(this.booking_id);
  if (booking && booking.status === 'assigned') {
    booking.status = 'in-progress';
    await booking.save();
  }
  
  const Driver = mongoose.model('Driver');
  await Driver.findByIdAndUpdate(this.driver_id, { status: 'busy' });
  
  const Vehicle = mongoose.model('Vehicle');
  await Vehicle.findByIdAndUpdate(this.vehicle_id, { status: 'in-progress' });
  
  return this;
};

tripAssignmentSchema.methods.endTrip = async function() {
  if (this.end_time) {
    throw new Error('Chuyến đã kết thúc');
  }
  
  if (!this.start_time) {
    throw new Error('Chưa bắt đầu chuyến');
  }
  
  this.end_time = new Date();
  await this.save();
  
  const Booking = mongoose.model('Booking');
  const booking = await Booking.findById(this.booking_id);
  if (booking && booking.status === 'in-progress') {
    booking.status = 'completed';
    await booking.save();
    
    if (booking.customer_id) {
      const Customer = mongoose.model('Customer');
      const customer = await Customer.findById(booking.customer_id);
      if (customer) {
        await customer.updateStats();
      }
    }
  }
  
  const Driver = mongoose.model('Driver');
  await Driver.findByIdAndUpdate(this.driver_id, { status: 'active' });
  
  const Vehicle = mongoose.model('Vehicle');
  await Vehicle.findByIdAndUpdate(this.vehicle_id, { status: 'completed' });
  
  return this;
};

tripAssignmentSchema.methods.confirmByDriver = async function() {
  if (this.driver_confirm === 1) {
    throw new Error('Đã xác nhận trước đó');
  }
  
  this.driver_confirm = 1;
  await this.save();
  
  const Booking = mongoose.model('Booking');
  const booking = await Booking.findById(this.booking_id);
  if (booking && booking.status === 'assigned') {
    booking.status = 'confirmed';
    await booking.save();
  }
  
  return this;
};

tripAssignmentSchema.methods.removeAssignment = async function() {
  if (!this.start_time) {
    const Driver = mongoose.model('Driver');
    await Driver.findByIdAndUpdate(this.driver_id, { status: 'active' });
  }
  
  if (!this.start_time) {
    const Vehicle = mongoose.model('Vehicle');
    await Vehicle.findByIdAndUpdate(this.vehicle_id, { status: 'ready' });
  }
  
  const Booking = mongoose.model('Booking');
  const booking = await Booking.findById(this.booking_id);
  if (booking && ['assigned', 'confirmed'].includes(booking.status)) {
    booking.status = 'confirmed';
    booking.trip_id = null;
    await booking.save();
  }
  
  await this.deleteOne();
  
  return true;
};

tripAssignmentSchema.methods.getFullInfo = async function() {
  await this.populate([
    { path: 'booking', populate: { path: 'vehicleType' } },
    { path: 'driver', select: 'name phone license_number' },
    { path: 'vehicle', select: 'vehicle_name license_plate seats' },
    { path: 'staff', select: 'name username' }
  ]);
  
  return {
    id: this._id,
    booking: this.booking,
    driver: this.driver,
    vehicle: this.vehicle,
    staff: this.staff,
    driver_confirm: this.driver_confirm,
    confirm_status: this.confirm_status,
    full_status: this.full_status,
    low_occupancy_reason: this.low_occupancy_reason,
    start_time: this.start_time,
    end_time: this.end_time,
    assigned_at: this.assigned_at,
    duration_hours: this.duration_hours,
    is_completed: this.is_completed,
    is_in_progress: this.is_in_progress,
    is_confirmed: this.is_confirmed
  };
};

// ==================== STATIC METHODS ====================

tripAssignmentSchema.statics.findByDriver = function(driverId, includeCompleted = false) {
  const query = { driver_id: driverId };
  
  if (!includeCompleted) {
    query.end_time = null;
  }
  
  return this.find(query)
    .populate({
      path: 'booking',
      populate: { path: 'vehicleType' }
    })
    .populate('vehicle')
    .sort({ assigned_at: -1 });
};

tripAssignmentSchema.statics.findByVehicle = function(vehicleId, includeCompleted = false) {
  const query = { vehicle_id: vehicleId };
  
  if (!includeCompleted) {
    query.end_time = null;
  }
  
  return this.find(query)
    .populate('booking')
    .populate('driver')
    .sort({ assigned_at: -1 });
};

tripAssignmentSchema.statics.findActive = function() {
  return this.find({
    start_time: { $ne: null },
    end_time: null
  }).populate('booking driver vehicle');
};

tripAssignmentSchema.statics.getStatsByDate = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        assigned_at: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        confirmed: {
          $sum: { $cond: [{ $eq: ['$driver_confirm', 1] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $ne: ['$end_time', null] }, 1, 0] }
        }
      }
    }
  ]);
};

// ==================== MIDDLEWARE ====================

tripAssignmentSchema.pre('save', async function () {
  // Chỉ validate tham chiếu khi tạo mới hoặc khi thay đổi
  if (this.isNew || this.isModified('booking_id') || this.isModified('driver_id') || this.isModified('vehicle_id')) {
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(this.booking_id);
    if (!booking) {
      throw new Error('Booking không tồn tại');
    }

    const Driver = mongoose.model('Driver');
    const driver = await Driver.findById(this.driver_id);
    if (!driver) {
      throw new Error('Tài xế không tồn tại');
    }

    const Vehicle = mongoose.model('Vehicle');
    const vehicle = await Vehicle.findById(this.vehicle_id);
    if (!vehicle) {
      throw new Error('Xe không tồn tại');
    }

    if (this.isModified('vehicle_id') || this.isModified('booking_id')) {
      if (vehicle.seats !== booking.seats) {
        throw new Error(`Xe ${vehicle.seats} chỗ không phù hợp với booking ${booking.seats} chỗ`);
      }
    }
  }
});

// Sau mỗi lần tạo/sửa phân công: booking assigned, tài xế busy + gắn xe; chỉ đổi xe từ ready → not_started (giữ in-progress khi ghép thêm khách)
tripAssignmentSchema.post('save', async function (doc) {
  const a = doc || this;
  
  // NẾU PHÂN CÔNG ĐÃ KẾT THÚC, KHÔNG GÁN LẠI TÀI XẾ/XE NỮA!
  if (a.end_time) return;

  const Booking = mongoose.model('Booking');
  await Booking.findByIdAndUpdate(a.booking_id, { status: 'assigned' });

  const Driver = mongoose.model('Driver');
  await Driver.findByIdAndUpdate(a.driver_id, {
    status: 'busy',
    current_vehicle_id: a.vehicle_id
  });

  const Vehicle = mongoose.model('Vehicle');
  const vehicle = await Vehicle.findById(a.vehicle_id);
  if (vehicle && vehicle.status === 'ready') {
    vehicle.status = 'not_started';
    await vehicle.save();
  }
});

// ==================== INDEXES ====================
// ✅ Đã xóa index duplicate của driver_confirm (đã có index: true trong schema)
tripAssignmentSchema.index({ assigned_at: -1 });
tripAssignmentSchema.index({ driver_id: 1, end_time: 1 });
tripAssignmentSchema.index({ vehicle_id: 1, end_time: 1 });
tripAssignmentSchema.index({ start_time: 1, end_time: 1 });

tripAssignmentSchema.set('toJSON', { virtuals: true });
tripAssignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TripAssignment', tripAssignmentSchema);