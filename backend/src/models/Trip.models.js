const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  trip_code: {
    type: String,
    unique: true,
    required: true
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  route: {
    type: String,
    required: true
  },
  pickup_points: [{
    location: {
      type: String,
      required: true
    },
    coords: {
      lat: Number,
      lng: Number
    },
    time: Date,
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }],
  dropoff_points: [{
    location: {
      type: String,
      required: true
    },
    coords: {
      lat: Number,
      lng: Number
    },
    time: Date,
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }],
  
 
  departure_time: {
    type: Date,
    required: true
  },
  estimated_arrival_time: Date,
  actual_arrival_time: Date,
  
 
  total_passengers: {
    type: Number,
    default: 0
  },
  max_passengers: {
    type: Number,
    required: true
  },
  
 
  status: {
    type: String,
    enum: ['scheduled', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  
 
  bookings: [{
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    passengers: {
      type: Number,
      required: true
    },
    pickup_point: String,
    dropoff_point: String,
    price: Number,
    customer_name: String,
    customer_phone: String
  }],
  
  notes: String
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual: Trạng thái text
tripSchema.virtual('status_text').get(function() {
  const statusMap = {
    'scheduled': 'Đã lên lịch',
    'assigned': 'Đã phân công',
    'in-progress': 'Đang thực hiện',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  };
  return statusMap[this.status] || this.status;
});

// Virtual: Số ghế trống
tripSchema.virtual('available_seats').get(function() {
  return this.max_passengers - this.total_passengers;
});

// Virtual: Còn chỗ không
tripSchema.virtual('has_available_seats').get(function() {
  return this.available_seats > 0;
});

// Method: Thêm booking vào trip
tripSchema.methods.addBooking = async function(booking, staffId) {
 
  this.bookings.push({
    booking_id: booking._id,
    passengers: booking.passengers,
    pickup_point: booking.pickup_location,
    dropoff_point: booking.dropoff_location,
    price: booking.price,
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone
  });
  
 
  this.total_passengers += booking.passengers;
  
 
  const pickupExists = this.pickup_points.some(p => 
    p.location === booking.pickup_location
  );
  if (!pickupExists) {
    this.pickup_points.push({
      location: booking.pickup_location,
      coords: booking.pickup_coords,
      time: booking.trip_date,
      booking_id: booking._id
    });
   
    this.pickup_points.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time - b.time;
    });
  }
  
 
  const dropoffExists = this.dropoff_points.some(d => 
    d.location === booking.dropoff_location
  );
  if (!dropoffExists) {
    this.dropoff_points.push({
      location: booking.dropoff_location,
      coords: booking.dropoff_coords,
      time: null,
      booking_id: booking._id
    });
  }
  
  await this.save();
  
 
  booking.trip_id = this._id;
  booking.status = 'assigned';
  await booking.save();
  
  return this;
};

// Method: Xóa booking khỏi trip
tripSchema.methods.removeBooking = async function(bookingId) {
  const booking = this.bookings.find(b => b.booking_id.toString() === bookingId);
  if (!booking) return this;
  
 
  this.bookings = this.bookings.filter(b => b.booking_id.toString() !== bookingId);
  
 
  this.total_passengers -= booking.passengers;
  
 
  const pickupPoint = this.pickup_points.find(p => 
    p.booking_id && p.booking_id.toString() === bookingId
  );
  if (pickupPoint) {
    const otherBookingUsingPickup = this.bookings.some(b => 
      b.pickup_point === pickupPoint.location
    );
    if (!otherBookingUsingPickup) {
      this.pickup_points = this.pickup_points.filter(p => 
        p.booking_id && p.booking_id.toString() !== bookingId
      );
    }
  }
  
 
  const dropoffPoint = this.dropoff_points.find(d => 
    d.booking_id && d.booking_id.toString() === bookingId
  );
  if (dropoffPoint) {
    const otherBookingUsingDropoff = this.bookings.some(b => 
      b.dropoff_point === dropoffPoint.location
    );
    if (!otherBookingUsingDropoff) {
      this.dropoff_points = this.dropoff_points.filter(d => 
        d.booking_id && d.booking_id.toString() !== bookingId
      );
    }
  }
  
  await this.save();
  return this;
};

tripSchema.index({ status: 1 });
tripSchema.index({ departure_time: 1 });
tripSchema.index({ vehicle_id: 1 });
tripSchema.index({ driver_id: 1 });

tripSchema.set('toJSON', { virtuals: true });
tripSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);