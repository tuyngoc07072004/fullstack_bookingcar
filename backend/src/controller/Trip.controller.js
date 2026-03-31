const Trip = require('../models/Trip.models');
const Booking = require('../models/Booking.models');
const Vehicle = require('../models/Vehicle.models');
const Driver = require('../models/Driver.models');
const ApiResponse = require('../models/ApiResponse.models');
class TripController {
  constructor() {
    this.getAllTrips = this.getAllTrips.bind(this);
    this.getTripById = this.getTripById.bind(this);
    this.updateTripStatus = this.updateTripStatus.bind(this);
    this.assignBooking = this.assignBooking.bind(this);
    this.findSuitableTrips = this.findSuitableTrips.bind(this);
    this.getTripBookings = this.getTripBookings.bind(this);
    this.removeBookingFromTrip = this.removeBookingFromTrip.bind(this);
    this.getTripStats = this.getTripStats.bind(this);
  }
  async findSuitableTripsForBooking(booking) {
    try {
      const seats = booking.seats;
      const passengers = booking.passengers;
      const tripDate = booking.trip_date;
      
      // Tìm các trip phù hợp
      const suitableTrips = await Trip.find({
        max_passengers: seats,
        status: { $in: ['scheduled', 'assigned'] },
        total_passengers: { $lt: seats },
        departure_time: {
          $gte: new Date(tripDate.getTime() - 2 * 60 * 60 * 1000),
          $lte: new Date(tripDate.getTime() + 2 * 60 * 60 * 1000)
        }
      })
      .populate('vehicle_id', 'vehicle_name license_plate seats status')
      .populate('driver_id', 'name phone license_number status')
      .populate('staff_id', 'name username')
      .sort({ total_passengers: -1 });
      
      const availableTrips = suitableTrips.filter(trip => 
        trip.available_seats >= passengers
      );
      
      return availableTrips;
      
    } catch (error) {
      console.error('❌ Lỗi tìm trip phù hợp:', error);
      return [];
    }
  }
  
  /**
   * Kiểm tra cùng tuyến đường (tùy chọn)
   */
  async checkSameRoute(trip, pickup, dropoff) {
    // Có thể kiểm tra điểm đón và trả có gần không
    const pickupMatch = trip.pickup_points.some(p => 
      p.location.toLowerCase().includes(pickup.toLowerCase()) ||
      pickup.toLowerCase().includes(p.location.toLowerCase())
    );
    
    const dropoffMatch = trip.dropoff_points.some(d => 
      d.location.toLowerCase().includes(dropoff.toLowerCase()) ||
      dropoff.toLowerCase().includes(d.location.toLowerCase())
    );
    
    return pickupMatch && dropoffMatch;
  }
  
  /**
   * Ghép booking vào trip hiện có
   */
  async assignToExistingTrip(booking, trip, staffId) {
    try {
      await trip.addBooking(booking);
      return trip;
    } catch (error) {
      console.error('❌ Lỗi ghép booking:', error);
      throw error;
    }
  }
  
  /**
   * Tạo trip mới cho booking
   */
  async createNewTrip(booking, driverId, vehicleId, staffId) {
    try {
      // Tạo mã trip
      const tripCode = `TRIP${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Tạo trip mới
      const newTrip = new Trip({
        trip_code: tripCode,
        vehicle_id: vehicleId,
        driver_id: driverId,
        staff_id: staffId,
        route: `${booking.pickup_location} → ${booking.dropoff_location}`,
        pickup_points: [{
          location: booking.pickup_location,
          coords: booking.pickup_coords,
          time: booking.trip_date,
          booking_id: booking._id
        }],
        dropoff_points: [{
          location: booking.dropoff_location,
          coords: booking.dropoff_coords,
          time: null,
          booking_id: booking._id
        }],
        departure_time: booking.trip_date,
        max_passengers: booking.seats,
        total_passengers: booking.passengers,
        status: 'scheduled',
        bookings: [{
          booking_id: booking._id,
          passengers: booking.passengers,
          pickup_point: booking.pickup_location,
          dropoff_point: booking.dropoff_location,
          price: booking.price,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone
        }]
      });
      
      await newTrip.save();
      
      // Cập nhật booking
      booking.trip_id = newTrip._id;
      booking.status = 'assigned';
      await booking.save();
      
      // Cập nhật trạng thái xe và tài xế
      await Vehicle.findByIdAndUpdate(vehicleId, { status: 'not_started' });
      await Driver.findByIdAndUpdate(driverId, { status: 'busy' });
      
      return newTrip;
      
    } catch (error) {
      console.error('❌ Lỗi tạo trip mới:', error);
      throw error;
    }
  }
  
  /**
   * API: Phân công booking
   */
  async assignBooking(req, res) {
    try {
      const { id } = req.params; // booking id
      const { driverId, vehicleId, forceNewTrip = false, preferExistingTrip = true } = req.body;
      const staffId = req.staffId;
      
      // Lấy thông tin booking
      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy booking')
        );
      }
      
      // Kiểm tra trạng thái booking
      if (booking.status !== 'confirmed') {
        return res.status(400).json(
          ApiResponse.error(`Booking ở trạng thái ${booking.status_text}, không thể phân công`)
        );
      }
      
      // Nếu đã có trip, không phân công lại
      if (booking.trip_id) {
        return res.status(400).json(
          ApiResponse.error('Booking đã được phân công vào chuyến')
        );
      }
      
      let result;
      
      // Ưu tiên 1: Tìm và ghép vào trip hiện có
      if (preferExistingTrip && !forceNewTrip) {
        const suitableTrips = await this.findSuitableTripsForBooking(booking);
        
        // Có thể thêm kiểm tra cùng tuyến đường
        for (const trip of suitableTrips) {
          const isSameRoute = await this.checkSameRoute(
            trip, 
            booking.pickup_location, 
            booking.dropoff_location
          );
          
          // Nếu cùng tuyến hoặc trip chưa có điểm đón nào
          if (isSameRoute || trip.pickup_points.length === 0) {
            result = await this.assignToExistingTrip(booking, trip, staffId);
            return res.status(200).json(
              ApiResponse.success({
                trip: result,
                booking: {
                  id: booking._id,
                  status: booking.status,
                  status_text: booking.status_text
                },
                isNewTrip: false,
                message: 'Đã ghép booking vào chuyến hiện có'
              }, 'Ghép booking thành công')
            );
          }
        }
      }
      
      // Ưu tiên 2: Tạo trip mới
      if (!driverId || !vehicleId) {
        return res.status(400).json(
          ApiResponse.error('Không tìm thấy trip phù hợp. Vui lòng chọn tài xế và xe để tạo chuyến mới')
        );
      }
      
      // Kiểm tra xe và tài xế
      const vehicle = await Vehicle.findById(vehicleId);
      const driver = await Driver.findById(driverId);
      
      if (!vehicle) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy xe')
        );
      }
      
      if (vehicle.status !== 'ready') {
        return res.status(400).json(
          ApiResponse.error(`Xe đang ở trạng thái ${vehicle.status_text}, không thể sử dụng`)
        );
      }
      
      if (!driver) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy tài xế')
        );
      }
      
      if (driver.status !== 'active') {
        return res.status(400).json(
          ApiResponse.error('Tài xế không hoạt động')
        );
      }
      
      if (vehicle.seats !== booking.seats) {
        return res.status(400).json(
          ApiResponse.error(`Xe ${vehicle.seats} chỗ không phù hợp với booking ${booking.seats} chỗ`)
        );
      }
      
      result = await this.createNewTrip(booking, driverId, vehicleId, staffId);
      
      return res.status(200).json(
        ApiResponse.success({
          trip: result,
          booking: {
            id: booking._id,
            status: booking.status,
            status_text: booking.status_text
          },
          isNewTrip: true,
          message: 'Đã tạo chuyến mới và phân công'
        }, 'Tạo chuyến mới thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi phân công booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể phân công booking', error.message)
      );
    }
  }
  
  /**
   * API: Tìm trip phù hợp cho booking
   */
  async findSuitableTrips(req, res) {
    try {
      const { bookingId } = req.params;
      
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy booking')
        );
      }
      
      const suitableTrips = await this.findSuitableTripsForBooking(booking);
      
      return res.status(200).json(
        ApiResponse.success({
          booking: {
            id: booking._id,
            seats: booking.seats,
            passengers: booking.passengers,
            trip_date: booking.trip_date,
            pickup: booking.pickup_location,
            dropoff: booking.dropoff_location
          },
          trips: suitableTrips.map(trip => ({
            id: trip._id,
            trip_code: trip.trip_code,
            vehicle: trip.vehicle_id,
            driver: trip.driver_id,
            departure_time: trip.departure_time,
            current_passengers: trip.total_passengers,
            available_seats: trip.available_seats,
            bookings_count: trip.bookings.length,
            route: trip.route,
            pickup_points: trip.pickup_points,
            dropoff_points: trip.dropoff_points
          })),
          total: suitableTrips.length
        }, 'Tìm thấy trip phù hợp')
      );
      
    } catch (error) {
      console.error('❌ Lỗi tìm trip phù hợp:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể tìm trip phù hợp', error.message)
      );
    }
  }
  
  /**
   * API: Lấy danh sách trips
   */
  async getAllTrips(req, res) {
    try {
      const {
        status,
        date,
        page = 1,
        limit = 20,
        search
      } = req.query;
      
      const query = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        query.departure_time = { $gte: startDate, $lte: endDate };
      }
      
      if (search) {
        query.$or = [
          { trip_code: { $regex: search, $options: 'i' } },
          { route: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [trips, total] = await Promise.all([
        Trip.find(query)
          .populate('vehicle_id', 'vehicle_name license_plate seats status')
          .populate('driver_id', 'name phone license_number status')
          .populate('staff_id', 'name username')
          .sort({ departure_time: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Trip.countDocuments(query)
      ]);
      
      return res.status(200).json(
        ApiResponse.success({
          trips,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }, 'Lấy danh sách chuyến thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy danh sách trips:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy danh sách chuyến', error.message)
      );
    }
  }
  
  /**
   * API: Lấy chi tiết trip
   */
  async getTripById(req, res) {
    try {
      const { id } = req.params;
      
      const trip = await Trip.findById(id)
        .populate('vehicle_id', 'vehicle_name license_plate seats status')
        .populate('driver_id', 'name phone license_number status')
        .populate('staff_id', 'name username');
      
      if (!trip) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy chuyến')
        );
      }
      
      // Lấy thông tin chi tiết bookings
      const bookingsWithDetails = await Promise.all(
        trip.bookings.map(async (item) => {
          const booking = await Booking.findById(item.booking_id)
            .populate('vehicleType');
          return {
            ...item.toObject(),
            booking_details: booking
          };
        })
      );
      
      const tripData = trip.toObject();
      tripData.bookings = bookingsWithDetails;
      
      return res.status(200).json(
        ApiResponse.success(tripData, 'Lấy chi tiết chuyến thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy chi tiết trip:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy chi tiết chuyến', error.message)
      );
    }
  }
  
  /**
   * API: Lấy danh sách bookings trong trip
   */
  async getTripBookings(req, res) {
    try {
      const { id } = req.params;
      
      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy chuyến')
        );
      }
      
      const bookingIds = trip.bookings.map(b => b.booking_id);
      const bookings = await Booking.find({ _id: { $in: bookingIds } })
        .populate('vehicleType');
      
      return res.status(200).json(
        ApiResponse.success({
          trip_id: trip._id,
          trip_code: trip.trip_code,
          total_passengers: trip.total_passengers,
          max_passengers: trip.max_passengers,
          bookings
        }, 'Lấy danh sách booking thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy danh sách booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy danh sách booking', error.message)
      );
    }
  }
  
  /**
   * API: Xóa booking khỏi trip
   */
  async removeBookingFromTrip(req, res) {
    try {
      const { tripId, bookingId } = req.params;
      
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy chuyến')
        );
      }
      
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy booking')
        );
      }
      
      if (booking.trip_id?.toString() !== tripId) {
        return res.status(400).json(
          ApiResponse.error('Booking không thuộc chuyến này')
        );
      }
      
      // Xóa booking khỏi trip
      await trip.removeBooking(bookingId);
      
      // Cập nhật booking
      booking.trip_id = null;
      booking.status = 'confirmed';
      await booking.save();
      
      // Nếu trip không còn booking nào, hủy trip và giải phóng tài xế, xe
      if (trip.bookings.length === 0) {
        trip.status = 'cancelled';
        await trip.save();
        
        await Vehicle.findByIdAndUpdate(trip.vehicle_id, { status: 'ready' });
        await Driver.findByIdAndUpdate(trip.driver_id, { status: 'active' });
      }
      
      return res.status(200).json(
        ApiResponse.success({
          trip_id: trip._id,
          booking_id: booking._id,
          remaining_bookings: trip.bookings.length
        }, 'Xóa booking khỏi chuyến thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi xóa booking khỏi trip:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể xóa booking khỏi chuyến', error.message)
      );
    }
  }
  
  /**
   * API: Cập nhật trạng thái trip
   */
  async updateTripStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['scheduled', 'assigned', 'in-progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json(
          ApiResponse.error('Trạng thái không hợp lệ')
        );
      }
      
      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy chuyến')
        );
      }
      
      const oldStatus = trip.status;
      trip.status = status;
      
      // Cập nhật thời gian thực tế
      if (status === 'in-progress' && !trip.start_time) {
        trip.start_time = new Date();
      }
      
      if (status === 'completed') {
        trip.actual_arrival_time = new Date();
      }
      
      await trip.save();
      
      // Xử lý theo trạng thái
      if (status === 'in-progress') {
        // Cập nhật trạng thái các booking
        await Booking.updateMany(
          { trip_id: id },
          { $set: { status: 'in-progress' } }
        );
      }
      
      if (status === 'completed') {
        // Cập nhật trạng thái các booking
        await Booking.updateMany(
          { trip_id: id },
          { $set: { status: 'completed' } }
        );
        
        // Giải phóng tài xế và xe
        await Vehicle.findByIdAndUpdate(trip.vehicle_id, { status: 'completed' });
        await Driver.findByIdAndUpdate(trip.driver_id, { status: 'active' });
      }
      
      if (status === 'cancelled') {
        // Cập nhật trạng thái các booking
        await Booking.updateMany(
          { trip_id: id },
          { $set: { status: 'cancelled', trip_id: null } }
        );
        
        // Giải phóng tài xế và xe
        await Vehicle.findByIdAndUpdate(trip.vehicle_id, { status: 'ready' });
        await Driver.findByIdAndUpdate(trip.driver_id, { status: 'active' });
      }
      
      return res.status(200).json(
        ApiResponse.success({
          trip,
          old_status: oldStatus,
          new_status: status
        }, `Cập nhật trạng thái chuyến thành ${trip.status_text}`)
      );
      
    } catch (error) {
      console.error('❌ Lỗi cập nhật trạng thái trip:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể cập nhật trạng thái chuyến', error.message)
      );
    }
  }
  
  /**
   * API: Thống kê trips
   */
  async getTripStats(req, res) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7);
      
      const [
        totalTrips,
        scheduledTrips,
        assignedTrips,
        inProgressTrips,
        completedTrips,
        cancelledTrips,
        todayTrips,
        weekTrips,
        totalPassengers,
        avgPassengersPerTrip
      ] = await Promise.all([
        Trip.countDocuments(),
        Trip.countDocuments({ status: 'scheduled' }),
        Trip.countDocuments({ status: 'assigned' }),
        Trip.countDocuments({ status: 'in-progress' }),
        Trip.countDocuments({ status: 'completed' }),
        Trip.countDocuments({ status: 'cancelled' }),
        Trip.countDocuments({ departure_time: { $gte: startOfDay } }),
        Trip.countDocuments({ departure_time: { $gte: startOfWeek } }),
        Trip.aggregate([
          { $group: { _id: null, total: { $sum: '$total_passengers' } } }
        ]),
        Trip.aggregate([
          { $group: { _id: null, avg: { $avg: '$total_passengers' } } }
        ])
      ]);
      
      const stats = {
        total: totalTrips,
        scheduled: scheduledTrips,
        assigned: assignedTrips,
        in_progress: inProgressTrips,
        completed: completedTrips,
        cancelled: cancelledTrips,
        today: todayTrips,
        week: weekTrips,
        total_passengers: totalPassengers[0]?.total || 0,
        avg_passengers_per_trip: Math.round(avgPassengersPerTrip[0]?.avg || 0)
      };
      
      return res.status(200).json(
        ApiResponse.success(stats, 'Lấy thống kê chuyến thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy thống kê chuyến', error.message)
      );
    }
  }
}

module.exports = new TripController();