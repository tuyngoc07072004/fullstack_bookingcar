const Booking = require('../models/Booking.models');
const TripAssignment = require('../models/TripAssignment.models');
const Driver = require('../models/Driver.models');
const Vehicle = require('../models/Vehicle.models');
const Customer = require('../models/Customer.models');
const Payment = require('../models/Payment.models');
const ApiResponse = require('../models/ApiResponse.models');
const { calculatePriceBySeats, haversineKm } = require('../utils/tripPricing');

class DriverTripController {
  constructor() {
    this.getDriverTrips = this.getDriverTrips.bind(this);
    this.getDriverStats = this.getDriverStats.bind(this);
    this.confirmTrip = this.confirmTrip.bind(this);
    this.completeTrip = this.completeTrip.bind(this);
    this.getDriverStatus = this.getDriverStatus.bind(this);
    this.getMyVehicle = this.getMyVehicle.bind(this);
    this.createDriverSelfBooking = this.createDriverSelfBooking.bind(this);
  }

  // ✅ FIX #1: Response format - Wrap trong ApiResponse.success
  async getDriverTrips(req, res) {
    try {
      const { driverId } = req.params;
      if (req.driverId !== driverId && req.userRole !== 'staff') {
        return res.status(403).json(
          ApiResponse.error('Bạn không có quyền xem chuyến của tài xế khác')
        );
      }
      
      const { source } = req.query;
      const assignmentFilter = { driver_id: driverId };
      if (source === 'staff') {
        assignmentFilter.$or = [
          { assignment_source: { $exists: false } },
          { assignment_source: 'staff' }
        ];
      } else if (source === 'driver') {
        assignmentFilter.assignment_source = 'driver';
      }

      const assignments = await TripAssignment.find(assignmentFilter)
        .populate({
          path: 'booking_id',
          populate: [
            { path: 'vehicleType' },
            { path: 'vehicle_type_id' }
          ]
        })
        .sort({ assigned_at: -1 });

      const bookingIds = assignments.map((a) => a.booking_id?._id).filter(Boolean);
      const payments = await Payment.find({ booking_id: { $in: bookingIds } })
        .select('booking_id payment_method payment_status paid_at')
        .lean();
      const paymentMap = new Map(payments.map((p) => [String(p.booking_id), p]));
      
      // Format dữ liệu giống với frontend Driver.types
      const trips = assignments.map(assignment => {
        const booking = assignment.booking_id;
        const p = booking?._id ? paymentMap.get(String(booking._id)) : null;
        return {
          id: assignment._id,
          booking_id: booking?._id,
          driver_confirm: assignment.driver_confirm,
          booking_status: booking?.status || 'pending',
          pickup_location: booking?.pickup_location || '',
          dropoff_location: booking?.dropoff_location || '',
          customer_name: booking?.customer_name || '',
          customer_phone: booking?.customer_phone || '',
          trip_date: booking?.trip_date,
          total_occupancy: booking?.passengers || 0,
          vehicle_seats: booking?.seats || 0,
          vehicle_name: booking?.vehicleType?.type_name || booking?.vehicle_type_id?.type_name,
          driver_notes: assignment.low_occupancy_reason,
          assigned_at: assignment.assigned_at,
          start_time: assignment.start_time,
          end_time: assignment.end_time,
          assignment_source: assignment.assignment_source || 'staff',
          price: booking?.price || 0,
          payment_method: booking?.payment_method || p?.payment_method || 'cash',
          payment_status: p?.payment_status || 'pending',
          paid_at: p?.paid_at || null
        };
      });
      
      // ✅ FIX: Wrap trong ApiResponse.success
      return res.status(200).json(
        ApiResponse.success(trips, 'Lấy danh sách chuyến thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy danh sách chuyến của tài xế:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server khi lấy danh sách chuyến', error.message)
      );
    }
  }

  // ✅ FIX #2: Response format - Wrap trong ApiResponse.success
  async getDriverStats(req, res) {
    try {
      const { driverId } = req.params;
      if (req.driverId !== driverId && req.userRole !== 'staff') {
        return res.status(403).json(
          ApiResponse.error('Bạn không có quyền xem thống kê của tài xế khác')
        );
      }
      
      const completedAssignments = await TripAssignment.find({
        driver_id: driverId,
        end_time: { $ne: null }
      }).populate('booking_id');
      
      const totalTrips = await TripAssignment.countDocuments({ driver_id: driverId });
      const completedTrips = completedAssignments.length;
      
      // Tính tổng thu nhập từ các booking đã hoàn thành
      const earnings = completedAssignments.reduce((sum, assignment) => {
        return sum + (assignment.booking_id?.price || 0);
      }, 0);
      
      // Tính rating trung bình (có thể lấy từ review collection nếu có)
      // Tạm thời dùng rating mặc định
      const rating = 4.8;
      
      const stats = {
        totalTrips,
        completedTrips,
        earnings,
        rating
      };
      
      // ✅ FIX: Wrap trong ApiResponse.success
      return res.status(200).json(
        ApiResponse.success(stats, 'Lấy thống kê tài xế thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê tài xế:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server khi lấy thống kê', error.message)
      );
    }
  }

  /**
   * Xác nhận nhận chuyến (tài xế confirm)
   * PUT /api/driverTrip/confirm-trip
   */
  async confirmTrip(req, res) {
    try {
      const { assignmentId, bookingId, reason } = req.body;
      const driverId = req.driverId;
      
      if (!assignmentId || !bookingId) {
        return res.status(400).json(
          ApiResponse.error('Vui lòng cung cấp đầy đủ thông tin')
        );
      }
      
      // Tìm assignment
      const assignment = await TripAssignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy phân công chuyến')
        );
      }
      
      // Kiểm tra tài xế có đúng không
      if (assignment.driver_id.toString() !== driverId) {
        return res.status(403).json(
          ApiResponse.error('Bạn không phải tài xế được phân công chuyến này')
        );
      }
      
      // Kiểm tra booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy booking')
        );
      }
      
      // Kiểm tra trạng thái booking
      if (booking.status !== 'assigned' && booking.status !== 'confirmed') {
        return res.status(400).json(
          ApiResponse.error(`Không thể xác nhận chuyến ở trạng thái ${booking.status_text}`)
        );
      }
      
      // Cập nhật assignment
      assignment.driver_confirm = 1;
      if (reason) {
        assignment.low_occupancy_reason = reason;
      }
      assignment.start_time = new Date();
      await assignment.save();
      
      // Cập nhật trạng thái booking
      booking.status = 'in-progress';
      await booking.save();
      
      // Cập nhật trạng thái tài xế
      await Driver.findByIdAndUpdate(driverId, { status: 'busy' });
      
      // Cập nhật trạng thái xe
      if (assignment.vehicle_id) {
        await Vehicle.findByIdAndUpdate(assignment.vehicle_id, { status: 'in-progress' });
      }
      
      return res.status(200).json(
        ApiResponse.success({
          assignmentId: assignment._id,
          bookingId: booking._id,
          status: booking.status,
          status_text: booking.status_text
        }, 'Xác nhận nhận chuyến thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi xác nhận chuyến:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server khi xác nhận chuyến', error.message)
      );
    }
  }

  /**
   * Hoàn thành chuyến đi
   * PUT /api/driverTrip/complete-trip/:bookingId
   */
  async completeTrip(req, res) {
    try {
      const { bookingId } = req.params;
      const driverId = req.driverId;
      
      // Tìm booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy booking')
        );
      }
      
      // Tìm assignment
      const assignment = await TripAssignment.findOne({ booking_id: bookingId });
      if (!assignment) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy phân công chuyến')
        );
      }
      
      // Kiểm tra quyền
      if (assignment.driver_id.toString() !== driverId) {
        return res.status(403).json(
          ApiResponse.error('Bạn không phải tài xế được phân công chuyến này')
        );
      }
      
      // Kiểm tra trạng thái
      if (booking.status !== 'in-progress') {
        return res.status(400).json(
          ApiResponse.error(`Không thể hoàn thành chuyến ở trạng thái ${booking.status_text}`)
        );
      }
      
      // Cập nhật
      assignment.end_time = new Date();
      await assignment.save();
      
      booking.status = 'completed';
      await booking.save();
      
      // Cập nhật thống kê khách hàng
      if (booking.customer_id) {
        const Customer = require('../models/Customer.models');
        const customer = await Customer.findById(booking.customer_id);
        if (customer) {
          await customer.updateStats();
        }
      }
      
      // Kiểm tra tất cả các chuyến chưa hoàn thành của tài xế này
      const remainingAssignments = await TripAssignment.countDocuments({
        driver_id: driverId,
        end_time: null
      });

      if (remainingAssignments === 0) {
        // Giải phóng tài xế hoàn toàn (xóa current_vehicle_id)
        await Driver.findByIdAndUpdate(driverId, { 
          status: 'active',
          current_vehicle_id: null 
        });
        
        // Đưa xe về trạng thái sẵn sàng cho chuyến sau
        if (assignment.vehicle_id) {
          await Vehicle.findByIdAndUpdate(assignment.vehicle_id, { status: 'ready' });
        }
      }
      
      return res.status(200).json(
        ApiResponse.success({
          bookingId: booking._id,
          assignmentId: assignment._id,
          status: booking.status,
          status_text: booking.status_text
        }, 'Hoàn thành chuyến đi thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi hoàn thành chuyến:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server khi hoàn thành chuyến', error.message)
      );
    }
  }

  /**
   * Lấy trạng thái hiện tại của tài xế (lightweight polling)
   * GET /api/driverTrip/status
   */
  /**
   * Xe đang gắn với tài xế (profile hoặc lần phân công gần nhất)
   * GET /api/driverTrip/me/vehicle
   */
  async getMyVehicle(req, res) {
    try {
      const driverId = req.driverId;
      const driver = await Driver.findById(driverId).populate({
        path: 'current_vehicle_id',
        populate: [
          { path: 'vehicle_type_id' }
        ]
      });

      if (!driver) {
        return res.status(404).json(ApiResponse.error('Không tìm thấy tài xế'));
      }

      let vehicle = driver.current_vehicle_id;
      let source = 'profile';

      if (!vehicle) {
        const lastAssignment = await TripAssignment.findOne({ driver_id: driverId })
          .sort({ assigned_at: -1 })
          .populate({
            path: 'vehicle_id',
            populate: [{ path: 'vehicle_type_id' }]
          });
        vehicle = lastAssignment?.vehicle_id;
        source = 'last_assignment';
      }

      if (!vehicle) {
        return res.status(404).json(
          ApiResponse.error(
            'Chưa có xe gắn với tài khoản. Vui lòng được nhân viên phân công trước hoặc liên hệ quản trị.'
          )
        );
      }

      const vt = vehicle.vehicle_type_id;
      const typeName = vt?.type_name || `Xe ${vehicle.seats} chỗ`;

      return res.status(200).json(
        ApiResponse.success(
          {
            vehicle: {
              _id: vehicle._id,
              vehicle_name: vehicle.vehicle_name,
              license_plate: vehicle.license_plate,
              seats: vehicle.seats,
              vehicle_type_id: vehicle.vehicle_type_id,
              type_name: typeName,
              status: vehicle.status
            },
            source
          },
          'Lấy thông tin xe thành công'
        )
      );
    } catch (error) {
      console.error('❌ Lỗi getMyVehicle:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy thông tin xe', error.message)
      );
    }
  }

  /**
   * Tài xế tự tạo chuyến (khách + điểm đón hiện tại + điểm đến)
   * POST /api/driverTrip/self-booking
   */
  async createDriverSelfBooking(req, res) {
    try {
      const driverId = req.driverId;
      const {
        customerName,
        customerPhone,
        pickupCoords,
        pickupAddressLabel,
        dropoff,
        dropoffCoords,
        tripDate,
        passengers
      } = req.body;

      if (!customerName || !customerPhone || !dropoff) {
        return res.status(400).json(
          ApiResponse.error('Vui lòng nhập họ tên, số điện thoại khách và điểm đến')
        );
      }

      if (!pickupCoords || typeof pickupCoords.lat !== 'number' || typeof pickupCoords.lng !== 'number') {
        return res.status(400).json(
          ApiResponse.error('Thiếu tọa độ điểm đón (vị trí hiện tại)')
        );
      }

      if (!dropoffCoords || typeof dropoffCoords.lat !== 'number' || typeof dropoffCoords.lng !== 'number') {
        return res.status(400).json(
          ApiResponse.error('Thiếu tọa độ điểm đến')
        );
      }

      const phone = String(customerPhone).replace(/\s/g, '');
      if (!/^0[35789]\d{8}$/.test(phone)) {
        return res.status(400).json(
          ApiResponse.error('Số điện thoại khách không hợp lệ (10 số, đầu 03/05/07/08/09)')
        );
      }

      const activeAssignment = await TripAssignment.findOne({
        driver_id: driverId,
        end_time: null
      });
      if (activeAssignment) {
        return res.status(400).json(
          ApiResponse.error('Bạn đang có chuyến chưa hoàn thành. Vui lòng hoàn thành trước khi tạo chuyến mới.')
        );
      }

      const driver = await Driver.findById(driverId).populate({
        path: 'current_vehicle_id',
        populate: [{ path: 'vehicle_type_id' }]
      });

      if (!driver) {
        return res.status(404).json(ApiResponse.error('Không tìm thấy tài xế'));
      }

      let vehicle = driver.current_vehicle_id;
      if (!vehicle) {
        const lastAssignment = await TripAssignment.findOne({ driver_id: driverId })
          .sort({ assigned_at: -1 })
          .populate({
            path: 'vehicle_id',
            populate: [{ path: 'vehicle_type_id' }]
          });
        vehicle = lastAssignment?.vehicle_id;
      }

      if (!vehicle) {
        return res.status(400).json(
          ApiResponse.error('Chưa có xe gắn với tài khoản. Vui lòng được nhân viên phân công trước.')
        );
      }

      const seats = vehicle.seats;
      const distance = haversineKm(
        pickupCoords.lat,
        pickupCoords.lng,
        dropoffCoords.lat,
        dropoffCoords.lng
      );
      const passengerCount = Number(passengers) || 1;
      const price = calculatePriceBySeats(seats, distance, passengerCount);

      const pickupLabel =
        pickupAddressLabel && String(pickupAddressLabel).trim() !== ''
          ? String(pickupAddressLabel).trim()
          : 'Vị trí hiện tại';

      if (passengerCount > seats) {
        return res.status(400).json(
          ApiResponse.error(`Số khách không được vượt quá ${seats} chỗ`)
        );
      }

      let tripDateVal = tripDate ? new Date(tripDate) : new Date();
      if (Number.isNaN(tripDateVal.getTime())) {
        tripDateVal = new Date();
      }

      let customerDoc = await Customer.findOne({ phone });
      if (!customerDoc) {
        customerDoc = await Customer.create({
          name: customerName.trim(),
          phone
        });
      } else {
        if (customerDoc.name !== customerName.trim()) {
          customerDoc.name = customerName.trim();
          await customerDoc.save();
        }
      }

      const vehicleTypeId = vehicle.vehicle_type_id?._id || vehicle.vehicle_type_id;

      const booking = await Booking.create({
        customer_name: customerName.trim(),
        customer_phone: phone,
        customer_email: null,
        customer_id: customerDoc._id,
        pickup_location: pickupLabel,
        dropoff_location: String(dropoff).trim(),
        pickup_coords: { lat: pickupCoords.lat, lng: pickupCoords.lng },
        dropoff_coords: { lat: dropoffCoords.lat, lng: dropoffCoords.lng },
        distance,
        trip_date: tripDateVal,
        passengers: passengerCount,
        seats,
        vehicle_type_id: vehicleTypeId,
        price,
        payment_method: 'cash',
        status: 'pending',
        notes: null,
        booking_source: 'driver'
      });

      // Tạo payment record để driver/staff theo dõi trạng thái thanh toán
      await Payment.findOneAndUpdate(
        { booking_id: booking._id },
        {
          payment_method: 'cash',
          amount: Number(booking.price || 0),
          payment_status: 'pending'
        },
        { upsert: true }
      );

      const assignment = await TripAssignment.create({
        booking_id: booking._id,
        driver_id: driverId,
        vehicle_id: vehicle._id,
        staff_id: null,
        assignment_source: 'driver',
        driver_confirm: 0
      });

      const populatedBooking = await Booking.findById(booking._id)
        .populate('vehicleType');

      return res.status(201).json(
        ApiResponse.success(
          {
            bookingId: booking._id,
            assignmentId: assignment._id,
            booking: populatedBooking,
            driver_snapshot: {
              name: driver.name,
              phone: driver.phone
            },
            price,
            distance_km: Math.round(distance * 100) / 100
          },
          'Tạo chuyến thành công'
        )
      );
    } catch (error) {
      console.error('❌ Lỗi createDriverSelfBooking:', error);
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors || {}).map((e) => e.message);
        return res.status(400).json(
          ApiResponse.error('Dữ liệu không hợp lệ', messages.join('; ') || error.message)
        );
      }
      return res.status(500).json(
        ApiResponse.error('Không thể tạo chuyến', error.message)
      );
    }
  }

  async getDriverStatus(req, res) {
    try {
      const driverId = req.driverId;
      
      const driver = await Driver.findById(driverId).select('status updated_at name');
      
      if (!driver) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy tài xế')
        );
      }
      
      return res.status(200).json(
        ApiResponse.success({
          id: driver._id,
          name: driver.name,
          status: driver.status,
          role: 'driver',
          updated_at: driver.updated_at
        }, 'Lấy trạng thái thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy trạng thái tài xế:', error);
      return res.status(500).json(
        ApiResponse.error('Lỗi server khi lấy trạng thái', error.message)
      );
    }
  }
}

module.exports = new DriverTripController();