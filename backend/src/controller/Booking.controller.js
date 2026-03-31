const Booking = require('../models/Booking.models');
const VehicleType = require('../models/VehicleType.models');
const Customer = require('../models/Customer.models');
const ApiResponse = require('../models/ApiResponse.models');
const Trip = require('../models/Trip.models'); 
const Payment = require('../models/Payment.models');
const { calculatePriceBySeats, calculatePriceBreakdown } = require('../utils/tripPricing');

class BookingController {
  constructor() {
    this.createBooking = this.createBooking.bind(this);
    this.calculatePriceBySeats = this.calculatePriceBySeats.bind(this);
    this.calculatePrice = this.calculatePrice.bind(this);
    this.getBookingById = this.getBookingById.bind(this);
    this.getBookingsByPhone = this.getBookingsByPhone.bind(this);
    this.cancelBooking = this.cancelBooking.bind(this);
    this.checkBookingStatus = this.checkBookingStatus.bind(this);
    this.findSuitableTrips = this.findSuitableTrips.bind(this);
  }

  async createBooking(req, res) {
    try {
      const { customer, booking } = req.body;
      if (!customer.name || !customer.phone) {
        return res.status(400).json(
          ApiResponse.error('Vui lòng nhập đầy đủ thông tin liên hệ')
        );
      }

      const phone = String(customer.phone).replace(/\s/g, '');
      if (!/^0[35789]\d{8}$/.test(phone)) {
        return res.status(400).json(
          ApiResponse.error('Số điện thoại không hợp lệ (10 số, bắt đầu 03/05/07/08/09)')
        );
      }

      if (!booking.pickup || !booking.dropoff || !booking.date || !booking.seats) {
        return res.status(400).json(
          ApiResponse.error('Vui lòng nhập đầy đủ thông tin chuyến đi')
        );
      }

      const tripDate = new Date(booking.date);
      if (Number.isNaN(tripDate.getTime())) {
        return res.status(400).json(
          ApiResponse.error('Ngày giờ chuyến đi không hợp lệ')
        );
      }

      const seats = Number(booking.seats);
      const passengers = Number(booking.passengers);
      if (!Number.isFinite(seats) || !Number.isFinite(passengers) || passengers < 1) {
        return res.status(400).json(
          ApiResponse.error('Số ghế hoặc số hành khách không hợp lệ')
        );
      }

      // Validate seats
      const validSeats = [4, 7, 9, 16, 29, 45];
      if (!validSeats.includes(seats)) {
        return res.status(400).json(
          ApiResponse.error('Loại xe không hợp lệ. Vui lòng chọn xe 4, 7, 9, 16, 29 hoặc 45 chỗ')
        );
      }

      // Get or create vehicle type
      let vehicleType = await VehicleType.findOne({ seats });
      if (!vehicleType) {
        const typeMap = {
          4: { type_name: 'Xe 4 chỗ', base_price: 1500000, price_per_km: 10000 },
          7: { type_name: 'Xe 7 chỗ', base_price: 1800000, price_per_km: 11000 },
          9: { type_name: 'Xe 9 chỗ', base_price: 2600000, price_per_km: 12000 },
          16: { type_name: 'Xe 16 chỗ', base_price: 2000000, price_per_km: 9000 },
          29: { type_name: 'Xe 29 chỗ', base_price: 3000000, price_per_km: 11000 },
          45: { type_name: 'Xe 45 chỗ', base_price: 5700000, price_per_km: 20000 }
        };
        vehicleType = await VehicleType.create({
          type_name: typeMap[seats].type_name,
          seats,
          base_price: typeMap[seats].base_price,
          price_per_km: typeMap[seats].price_per_km,
          is_active: true
        });
      }

      if (passengers > seats) {
        return res.status(400).json(
          ApiResponse.error(`Số hành khách không được vượt quá ${seats} chỗ`)
        );
      }

      let customerDoc = await Customer.findOne({ phone });
      const customerEmail = customer.email && customer.email.trim() !== '' ? customer.email.trim() : undefined;
      
      if (!customerDoc) {
        customerDoc = await Customer.create({
          name: customer.name.trim(),
          phone,
          email: customerEmail
        });
      } else {
        let needUpdate = false;
        if (customerDoc.name !== customer.name.trim()) {
          customerDoc.name = customer.name.trim();
          needUpdate = true;
        }
        if (customerEmail && customerDoc.email !== customerEmail) {
          customerDoc.email = customerEmail;
          needUpdate = true;
        }
        if (needUpdate) {
          await customerDoc.save();
        }
      }

      let price = booking.price;
      if (!price && booking.distance) {
        price = this.calculatePriceBySeats(seats, booking.distance, passengers);
      }

      const newBooking = await Booking.create({
        customer_name: customer.name.trim(),
        customer_phone: phone,
        customer_email: customerEmail,
        customer_id: customerDoc._id,
        pickup_location: booking.pickup,
        dropoff_location: booking.dropoff,
        pickup_coords: booking.pickupCoords || null,
        dropoff_coords: booking.dropoffCoords || null,
        distance: booking.distance || null,
        trip_date: tripDate,
        passengers,
        seats,
        vehicle_type_id: vehicleType._id,
        price: price || 0,
        payment_method: booking.paymentMethod || 'cash',
        status: 'pending',
        notes: booking.notes || null
      });

      await Payment.findOneAndUpdate(
        { booking_id: newBooking._id },
        {
          payment_method: newBooking.payment_method || 'cash',
          amount: Number(newBooking.price || 0),
          payment_status: 'pending'
        },
        { upsert: true }
      );

      const populatedBooking = await Booking.findById(newBooking._id)
        .populate('vehicleType');

      return res.status(201).json(
        ApiResponse.success(
          {
            bookingId: newBooking._id,
            booking: populatedBooking
          },
          'Đặt xe thành công! Vui lòng chờ xác nhận.'
        )
      );

    } catch (error) {
      console.error('❌ Lỗi tạo booking:', error);
      if (error.name === 'CastError') {
        return res.status(400).json(
          ApiResponse.error('Dữ liệu không đúng định dạng', error.message)
        );
      }
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors || {}).map((e) => e.message);
        return res.status(400).json(
          ApiResponse.error('Dữ liệu không hợp lệ', messages.join('; ') || error.message)
        );
      }
      if (error.code === 11000) {
        return res.status(400).json(
          ApiResponse.error('Dữ liệu trùng (email/SĐT đã tồn tại)', error.message)
        );
      }
      return res.status(500).json(
        ApiResponse.error('Không thể tạo đơn đặt xe', error.message)
      );
    }
  }

  calculatePriceBySeats(seats, distance, passengers = 1) {
    return calculatePriceBySeats(seats, distance, passengers);
  }

  async calculatePrice(req, res) {
    try {
      console.log('📊 Calculate price request:', {
        method: req.method,
        body: req.body,
        query: req.query
      });
      
      let seats, distance, passengers;
      
      if (req.method === 'GET') {
        seats = parseInt(req.query.seats);
        distance = parseFloat(req.query.distance);
        passengers = parseInt(req.query.passengers || '1', 10);
      } else {
        seats = req.body.seats;
        distance = req.body.distance;
        passengers = req.body.passengers;
      }

      if (!seats || !distance) {
        return res.status(400).json(
          ApiResponse.error('Vui lòng cung cấp số ghế và khoảng cách')
        );
      }

      const safePassengers = Math.max(1, parseInt(String(passengers || 1), 10));

      const validSeats = [4, 7, 9, 16, 29, 45];
      if (!validSeats.includes(seats)) {
        return res.status(400).json(
          ApiResponse.error('Loại xe không hợp lệ. Vui lòng chọn xe 4, 7, 9, 16, 29 hoặc 45 chỗ')
        );
      }

      const breakdown = calculatePriceBreakdown(seats, distance, safePassengers);

      const typeNames = {
        4: 'Xe 4 chỗ',
        7: 'Xe 7 chỗ',
        9: 'Xe 9 chỗ',
        16: 'Xe 16 chỗ',
        29: 'Xe 29 chỗ',
        45: 'Xe 45 chỗ'
      };

      console.log('💰 Price calculated:', {
        seats,
        distance,
        passengers: safePassengers,
        price: breakdown.price,
        vehicle_type: typeNames[seats]
      });

      return res.status(200).json(
        ApiResponse.success({
          price: breakdown.price,
          seats: seats,
          vehicle_type: typeNames[seats],
          distance: distance,
          passengers: safePassengers,
          base_fare: breakdown.base_fare,
          per_km_per_person: breakdown.per_km_per_person,
          variable_fare: breakdown.variable_fare,
          min_fare: breakdown.min_fare
        }, 'Tính giá thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi tính giá:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể tính giá', error.message)
      );
    }
  }

  async getBookingById(req, res) {
    try {
      const { id } = req.params;

      const booking = await Booking.findById(id)
        .populate('vehicleType')
        .populate('tripAssignment')
        .populate({
          path: 'tripAssignment',
          populate: {
            path: 'driver',
            select: 'name phone'
          }
        })
        .populate({
          path: 'tripAssignment',
          populate: {
            path: 'vehicle',
            select: 'vehicle_name license_plate'
          }
        });

      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe')
        );
      }

      return res.status(200).json(
        ApiResponse.success(booking, 'Lấy thông tin đơn đặt xe thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi lấy booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy thông tin đơn đặt xe', error.message)
      );
    }
  }

  async getBookingsByPhone(req, res) {
    try {
      const { phone } = req.params;

      const bookings = await Booking.find({ customer_phone: phone })
        .populate('vehicleType')
        .populate({
          path: 'tripAssignment',
          populate: [
            { path: 'driver', select: 'name phone' },
            { path: 'vehicle', select: 'vehicle_name license_plate' }
          ]
        })
        .sort({ created_at: -1 });

      return res.status(200).json(
        ApiResponse.success(bookings, 'Lấy danh sách đơn đặt xe thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi lấy danh sách booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy danh sách đơn đặt xe', error.message)
      );
    }
  }

  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe')
        );
      }

      // Only allow cancellation when status is pending
      if (booking.status !== 'pending') {
        return res.status(400).json(
          ApiResponse.error(`Không thể hủy đơn đặt xe ở trạng thái ${booking.status_text}`)
        );
      }

      booking.status = 'cancelled';
      booking.low_occupancy_reason = reason || 'Khách hàng hủy';
      await booking.save();

      return res.status(200).json(
        ApiResponse.success({ bookingId: id }, 'Hủy đơn đặt xe thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi hủy booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể hủy đơn đặt xe', error.message)
      );
    }
  }

  async checkBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { phone } = req.query;

      const booking = await Booking.findById(id)
        .populate('vehicleType')
        .populate({
          path: 'tripAssignment',
          populate: [
            { path: 'driver', select: 'name phone' },
            { path: 'vehicle', select: 'vehicle_name license_plate' }
          ]
        });

      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe')
        );
      }

      // Verify phone number if provided
      if (phone && booking.customer_phone !== phone) {
        return res.status(403).json(
          ApiResponse.error('Số điện thoại không khớp với đơn đặt xe')
        );
      }

      // Prepare response data
      const responseData = {
        id: booking._id,
        status: booking.status,
        status_text: booking.status_text,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        trip_date: booking.trip_date,
        formatted_date: booking.formatted_date,
        passengers: booking.passengers,
        seats: booking.seats,
        vehicle_type: booking.vehicleType?.type_name,
        price: booking.price,
        payment_method: booking.payment_method_text,
        driver: booking.tripAssignment?.driver ? {
          name: booking.tripAssignment.driver.name,
          phone: booking.tripAssignment.driver.phone
        } : null,
        vehicle: booking.tripAssignment?.vehicle ? {
          name: booking.tripAssignment.vehicle.vehicle_name,
          license_plate: booking.tripAssignment.vehicle.license_plate
        } : null
      };

      return res.status(200).json(
        ApiResponse.success(responseData, 'Lấy trạng thái đơn đặt xe thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi kiểm tra trạng thái:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể kiểm tra trạng thái đơn đặt xe', error.message)
      );
    }
  }

  async findSuitableTrips(req, res) {
    try {
        const { bookingId } = req.params;
        
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          return res.status(404).json(
            ApiResponse.error('Không tìm thấy booking')
          );
        }
        
        const seats = booking.seats;
        const passengers = booking.passengers;
        const tripDate = booking.trip_date;
        
        const suitableTrips = await Trip.find({
          max_passengers: seats,
          status: { $in: ['scheduled', 'assigned'] },
          total_passengers: { $lt: seats },
          departure_time: {
            $gte: new Date(tripDate.getTime() - 2 * 60 * 60 * 1000),
            $lte: new Date(tripDate.getTime() + 2 * 60 * 60 * 1000)
          }
        })
        .populate('vehicle_id', 'vehicle_name license_plate seats')
        .populate('driver_id', 'name phone license_number')
        .populate('bookings.booking_id', 'customer_name customer_phone passengers')
        .sort({ total_passengers: -1 });
        
        // Lọc các trip còn đủ chỗ
        const availableTrips = suitableTrips.filter(trip => 
          trip.available_seats >= passengers
        );
        
        return res.status(200).json(
          ApiResponse.success({
            booking: {
              id: booking._id,
              seats: booking.seats,
              passengers: booking.passengers,
              trip_date: booking.trip_date
            },
            availableTrips: availableTrips.map(trip => ({
              id: trip._id,
              trip_code: trip.trip_code,
              vehicle: trip.vehicle_id,
              driver: trip.driver_id,
              departure_time: trip.departure_time,
              current_passengers: trip.total_passengers,
              available_seats: trip.available_seats,
              bookings_count: trip.bookings.length,
              bookings: trip.bookings
            }))
          }, 'Tìm thấy trip phù hợp')
        );
        
    } catch (error) {
        console.error('❌ Lỗi tìm trip phù hợp:', error);
        return res.status(500).json(
          ApiResponse.error('Không thể tìm trip phù hợp', error.message)
        );
    }
  }
}

module.exports = new BookingController();