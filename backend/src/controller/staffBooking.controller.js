const Booking = require('../models/Booking.models');
const TripAssignment = require('../models/TripAssignment.models');
const Trip = require('../models/Trip.models');
const Vehicle = require('../models/Vehicle.models');
const Driver = require('../models/Driver.models');
const Payment = require('../models/Payment.models');
const ApiResponse = require('../models/ApiResponse.models');

class StaffBookingController {
  constructor() {
    this.getAllBookings = this.getAllBookings.bind(this);
    this.getBookingById = this.getBookingById.bind(this);
    this.confirmBooking = this.confirmBooking.bind(this);
    this.assignDriverAndVehicle = this.assignDriverAndVehicle.bind(this);
    this.updateBookingStatus = this.updateBookingStatus.bind(this);
    this.getBookingStats = this.getBookingStats.bind(this);
    this.getAvailableVehicles = this.getAvailableVehicles.bind(this);
    this.getAvailableDrivers = this.getAvailableDrivers.bind(this);
    this.getBookingDetailsForStaff = this.getBookingDetailsForStaff.bind(this);
    this.getAssignmentOptions = this.getAssignmentOptions.bind(this);
  }
  async getAllBookings(req, res) {
    try {
      const {
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        search
      } = req.query;

      const query = {};

      // Filter theo status
      if (status && status !== 'all') {
        query.status = status;
      }

      // Filter theo ngày
      if (startDate || endDate) {
        query.trip_date = {};
        if (startDate) {
          query.trip_date.$gte = new Date(startDate);
        }
        if (endDate) {
          query.trip_date.$lte = new Date(endDate);
        }
      }

      // Search theo tên khách hàng hoặc số điện thoại
      if (search) {
        query.$or = [
          { customer_name: { $regex: search, $options: 'i' } },
          { customer_phone: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .populate('vehicleType')
          .populate({
            path: 'tripAssignment',
            populate: [
              { path: 'driver', select: 'name phone' },
              { path: 'vehicle', select: 'vehicle_name license_plate seats' },
              { path: 'staff_id', select: 'name username' }
            ]
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Booking.countDocuments(query)
      ]);

      // Merge payment status vào booking để staff có thể hiển thị/xác nhận.
      const bookingIds = bookings.map(b => b._id);
      const payments = await Payment.find({ booking_id: { $in: bookingIds } })
        .select('booking_id payment_method payment_status paid_at')
        .lean();

      const paymentMap = new Map(
        payments.map(p => [String(p.booking_id), p])
      );

      const bookingsWithPayment = bookings.map((b) => {
        const obj = b.toObject ? b.toObject() : b;
        const p = paymentMap.get(String(obj._id));
        obj.payment_status = p?.payment_status || 'pending';
        obj.paid_at = p?.paid_at || null;
        obj.payment_method = obj.payment_method || p?.payment_method || 'cash';
        return obj;
      });

      return res.status(200).json(
        ApiResponse.success({
          bookings: bookingsWithPayment,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
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
   * Lấy chi tiết booking cho nhân viên (bao gồm thông tin phân công)
   */
  async getBookingDetailsForStaff(req, res) {
    try {
      const { id } = req.params;

      const booking = await Booking.findById(id)
        .populate('vehicleType')
        .populate({
          path: 'tripAssignment',
          populate: [
            { 
              path: 'driver', 
              select: 'name phone license_number status' 
            },
            { 
              path: 'vehicle', 
              select: 'vehicle_name license_plate seats status vehicle_type' 
            },
            { path: 'staff_id', select: 'name username' }
          ]
        });

      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe')
        );
      }

      const payment = await Payment.findOne({ booking_id: id }).select('payment_method payment_status paid_at');

      // Lấy danh sách xe phù hợp với số ghế
      const availableVehicles = await Vehicle.find({
        seats: booking.seats,
        status: 'ready'
      }).select('vehicle_name license_plate seats status');

      // Lấy danh sách tài xế đang hoạt động
      const availableDrivers = await Driver.find({
        status: 'active'
      }).select('name phone license_number status');

      const responseData = {
        booking: {
          ...booking.toObject(),
          formatted_date: booking.formatted_date,
          status_text: booking.status_text,
          payment_method_text: booking.payment_method_text
          ,
          payment_status: payment?.payment_status || 'pending',
          paid_at: payment?.paid_at || null
        },
        availableVehicles,
        availableDrivers,
        canAssign: booking.status === 'confirmed' || booking.status === 'pending'
      };

      return res.status(200).json(
        ApiResponse.success(responseData, 'Lấy chi tiết booking thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi lấy chi tiết booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy chi tiết booking', error.message)
      );
    }
  }

  /**
   * Gợi ý phân công: tài xế–xe đang chạy còn chỗ + tài xế rảnh + xe ready
   * GET /api/staff/bookings/assignment-options?seats=9
   */
  async getAssignmentOptions(req, res) {
    try {
      const seatsParam = req.query.seats;
      const seatsFilter = seatsParam != null && seatsParam !== '' ? parseInt(String(seatsParam), 10) : null;

      const activeAssignments = await TripAssignment.find({ end_time: null })
        .populate({ path: 'driver_id', select: 'name phone status current_vehicle_id' })
        .populate({ path: 'vehicle_id', select: 'vehicle_name license_plate seats status' })
        .populate({ path: 'booking_id', select: 'passengers seats status customer_name' });

      const pairMap = new Map();

      for (const a of activeAssignments) {
        const veh = a.vehicle_id;
        const drv = a.driver_id;
        if (!veh || !drv) continue;

        const vId = veh._id ? veh._id.toString() : veh.toString();
        const dId = drv._id ? drv._id.toString() : drv.toString();
        const key = `${dId}_${vId}`;

        if (!pairMap.has(key)) {
          pairMap.set(key, {
            driver_id: dId,
            driver: {
              _id: dId,
              name: drv.name,
              phone: drv.phone,
              status: drv.status
            },
            vehicle_id: vId,
            vehicle: {
              _id: vId,
              vehicle_name: veh.vehicle_name,
              license_plate: veh.license_plate,
              seats: veh.seats,
              status: veh.status
            },
            usedPassengers: 0,
            activeBookings: []
          });
        }

        const entry = pairMap.get(key);
        const b = a.booking_id;
        if (b && !['cancelled', 'completed'].includes(b.status)) {
          entry.usedPassengers += b.passengers || 0;
          entry.activeBookings.push({
            bookingId: b._id,
            customer_name: b.customer_name,
            passengers: b.passengers,
            status: b.status
          });
        }
      }

      let carpools = Array.from(pairMap.values()).map((c) => ({
        ...c,
        availableSeats: c.vehicle.seats - c.usedPassengers
      }));

      if (Number.isFinite(seatsFilter)) {
        carpools = carpools.filter((c) => c.vehicle.seats === seatsFilter);
      }
      carpools = carpools.filter((c) => c.availableSeats > 0);

      // === Query Trip entity đang active còn chổ ===
      const tripQuery = {
        status: { $in: ['scheduled', 'assigned', 'in-progress'] }
      };
      if (Number.isFinite(seatsFilter)) {
        tripQuery.max_passengers = seatsFilter;
      }

      const activeTripsRaw = await Trip.find(tripQuery)
        .populate('driver_id', 'name phone status')
        .populate('vehicle_id', 'vehicle_name license_plate seats status')
        .sort({ created_at: -1 });

      const activeTrips = activeTripsRaw
        .map((t) => ({
          trip_id: t._id,
          trip_code: t.trip_code,
          route: t.route,
          driver_id: t.driver_id?._id?.toString(),
          driver: { name: t.driver_id?.name, phone: t.driver_id?.phone },
          vehicle_id: t.vehicle_id?._id?.toString(),
          vehicle: {
            vehicle_name: t.vehicle_id?.vehicle_name,
            license_plate: t.vehicle_id?.license_plate,
            seats: t.vehicle_id?.seats
          },
          total_passengers: t.total_passengers,
          max_passengers: t.max_passengers,
          availableSeats: t.available_seats,
          departure_time: t.departure_time,
          bookings: t.bookings
        }))
        .filter((t) => t.availableSeats > 0);

      const driversWithActiveTrip = new Set();
      for (const a of activeAssignments) {
        const drv = a.driver_id;
        const dId = drv && drv._id ? drv._id.toString() : drv && drv.toString ? drv.toString() : null;
        if (dId) driversWithActiveTrip.add(dId);
      }

      let drivers = await Driver.find({ status: 'active' })
        .select('name phone license_number status current_vehicle_id')
        .sort({ name: 1 });

      drivers = drivers.filter((d) => !driversWithActiveTrip.has(d._id.toString()));

      let vehicles = await Vehicle.find({
        status: 'ready',
        ...(Number.isFinite(seatsFilter) ? { seats: seatsFilter } : {})
      })
        .select('vehicle_name license_plate seats status')
        .sort({ seats: 1, vehicle_name: 1 });

      return res.status(200).json(
        ApiResponse.success(
          {
            carpools,
            activeTrips,
            idleDrivers: drivers,
            readyVehicles: vehicles
          },
          'Lấy tùy chọn phân công thành công'
        )
      );
    } catch (error) {
      console.error('❌ Lỗi assignment-options:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy tùy chọn phân công', error.message)
      );
    }
  }

  /**
   * Xác nhận booking (chuyển từ pending -> confirmed)
   */
  async confirmBooking(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe')
        );
      }

      if (booking.status !== 'pending') {
        return res.status(400).json(
          ApiResponse.error(`Không thể xác nhận đơn đặt xe ở trạng thái ${booking.status_text}`)
        );
      }

      booking.status = 'confirmed';
      if (notes) {
        booking.notes = notes;
      }
      await booking.save();

      return res.status(200).json(
        ApiResponse.success({
          bookingId: booking._id,
          status: booking.status,
          status_text: booking.status_text
        }, 'Xác nhận đơn đặt xe thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi xác nhận booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể xác nhận đơn đặt xe', error.message)
      );
    }
  }

  /**
   * Phân công tài xế và xe cho booking
   */
  async assignDriverAndVehicle(req, res) {
    try {
      const { id } = req.params;
      const { driverId, vehicleId, startTime } = req.body;

      if (!driverId || !vehicleId) {
        return res.status(400).json(
          ApiResponse.error('Vui lòng chọn tài xế và xe')
        );
      }

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe')
        );
      }

      // Kiểm tra booking đã được xác nhận chưa
      if (booking.status !== 'confirmed' && booking.status !== 'pending') {
        return res.status(400).json(
          ApiResponse.error(`Không thể phân công cho đơn đặt xe ở trạng thái ${booking.status_text}`)
        );
      }

      // Kiểm tra xe có tồn tại và phù hợp không
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy xe')
        );
      }

      if (vehicle.seats !== booking.seats) {
        return res.status(400).json(
          ApiResponse.error(`Xe này có ${vehicle.seats} chỗ, không phù hợp với booking ${booking.seats} chỗ`)
        );
      }

      // Kiểm tra tài xế có tồn tại
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy tài xế')
        );
      }

      // Phân công cùng cặp tài xế–xe đang có chuyến chưa kết thúc (ghép khách – còn chỗ)
      const activeSamePair = await TripAssignment.find({
        driver_id: driverId,
        vehicle_id: vehicleId,
        end_time: null
      }).populate({ path: 'booking_id', select: 'passengers seats status' });

      let usedPassengers = 0;
      for (const a of activeSamePair) {
        const b = a.booking_id;
        if (b && !['cancelled', 'completed'].includes(b.status)) {
          usedPassengers += b.passengers || 0;
        }
      }

      const availableSeats = vehicle.seats - usedPassengers;
      if (booking.passengers > availableSeats) {
        return res.status(400).json(
          ApiResponse.error(
            `Không đủ chỗ trống trên xe. Còn ${availableSeats} chỗ, đơn này cần ${booking.passengers} khách`
          )
        );
      }

      const isAddingToCarpool = activeSamePair.length > 0;

      if (isAddingToCarpool) {
        if (driver.current_vehicle_id && driver.current_vehicle_id.toString() !== vehicleId.toString()) {
          return res.status(400).json(
            ApiResponse.error('Tài xế đang gắn với một xe khác. Mỗi tài xế chỉ được phân một xe tại một thời điểm.')
          );
        }
        if (!['not_started', 'in-progress'].includes(vehicle.status)) {
          return res.status(400).json(
            ApiResponse.error(`Không thể ghép thêm: xe đang ở trạng thái ${vehicle.status_text || vehicle.status}`)
          );
        }
        if (driver.status !== 'busy' && driver.status !== 'active') {
          return res.status(400).json(
            ApiResponse.error('Trạng thái tài xế không cho phép ghép thêm khách lên chuyến này')
          );
        }
      } else {
        if (vehicle.status !== 'ready') {
          return res.status(400).json(
            ApiResponse.error(`Xe đang ở trạng thái ${vehicle.status_text || vehicle.status}, không thể mở chuyến mới`)
          );
        }
        if (driver.status !== 'active') {
          return res.status(400).json(
            ApiResponse.error('Tài xế đang bận hoặc không hoạt động. Chọn chế độ ghép chuyến nếu cùng tài xế–xe.')
          );
        }
        // Tự động xóa current_vehicle_id cũ nếu tài xế đã active (hoàn thành chuyến trước)
        if (driver.current_vehicle_id && driver.current_vehicle_id.toString() !== vehicleId.toString()) {
          await Driver.findByIdAndUpdate(driverId, { current_vehicle_id: null });
        }
      }

      // Kiểm tra xem đã có phân công chưa
      const existingAssignment = await TripAssignment.findOne({ booking_id: id });
      if (existingAssignment) {
        return res.status(400).json(
          ApiResponse.error('Booking này đã được phân công rồi')
        );
      }

      // Tạo phân công mới (TripAssignment)
      const assignment = await TripAssignment.create({
        booking_id: booking._id,
        driver_id: driverId,
        vehicle_id: vehicleId,
        staff_id: req.staffId,
        start_time: startTime ? new Date(startTime) : null,
        driver_confirm: 0
      });

      // === Tạo hoặc cập nhật Trip ===
      try {
        // Tìm Trip đang active cùng cặp driver+vehicle còn chỗ
        const existingTrip = await Trip.findOne({
          driver_id: driverId,
          vehicle_id: vehicleId,
          status: { $in: ['scheduled', 'assigned', 'in-progress'] }
        });

        if (existingTrip && existingTrip.available_seats >= booking.passengers) {
          // Ghép vào Trip hiện có
          await existingTrip.addBooking(booking);
          console.log(`✅ Ghép booking ${booking._id} vào Trip ${existingTrip.trip_code}`);
        } else {
          // Tạo Trip mới
          const tripCode = `TRIP${Date.now()}${Math.floor(Math.random() * 100)}`;
          const newTrip = new Trip({
            trip_code: tripCode,
            vehicle_id: vehicleId,
            driver_id: driverId,
            staff_id: req.staffId,
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
            departure_time: startTime ? new Date(startTime) : booking.trip_date,
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
          // Liên kết booking với Trip
          booking.trip_id = newTrip._id;
          await booking.save();
          console.log(`✅ Tạo Trip mới ${tripCode} cho booking ${booking._id}`);
        }
      } catch (tripErr) {
        console.error('⚠️ Không tạo được Trip (không ảnh hưởng TripAssignment):', tripErr.message);
      }

      // Cập nhật trạng thái booking
      booking.status = 'assigned';
      await booking.save();

      // Tài xế + xe: hook post-save TripAssignment đã cập nhật busy / current_vehicle / not_started khi cần

      const populatedAssignment = await TripAssignment.findById(assignment._id)
        .populate('driver', 'name phone')
        .populate('vehicle', 'vehicle_name license_plate seats')
        .populate('staff_id', 'name username');

      return res.status(200).json(
        ApiResponse.success({
          assignment: populatedAssignment,
          booking: {
            id: booking._id,
            status: booking.status,
            status_text: booking.status_text
          }
        }, 'Phân công tài xế và xe thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi phân công:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể phân công tài xế và xe', error.message)
      );
    }
  }

  /**
   * Cập nhật trạng thái booking
   */
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const validStatuses = ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json(
          ApiResponse.error('Trạng thái không hợp lệ')
        );
      }

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe')
        );
      }

      // Nếu hủy booking, cần giải phóng tài xế và xe
      if (status === 'cancelled' && booking.status !== 'cancelled') {
        const assignment = await TripAssignment.findOne({ booking_id: id });
        
        if (assignment) {
          // Đánh dấu hủy phân công chuyến (set end_time để tránh trigger post save hook)
          assignment.end_time = new Date();
          assignment.low_occupancy_reason = reason || 'Nhân viên hủy đơn';
          await assignment.save();

          // Kiểm tra xem tài xế còn chuyến nào không
          const remainingAssignments = await TripAssignment.countDocuments({
            driver_id: assignment.driver_id,
            end_time: null
          });

          if (remainingAssignments === 0) {
            // Giải phóng xe
            await Vehicle.findByIdAndUpdate(assignment.vehicle_id, { status: 'ready' });
            // Giải phóng tài xế hoàn toàn
            await Driver.findByIdAndUpdate(assignment.driver_id, { status: 'active', current_vehicle_id: null });
          } else {
            // Chỉ giải phóng tài xế khỏi busy nếu cần (nhưng không xóa xe)
            await Driver.findByIdAndUpdate(assignment.driver_id, { status: 'active' });
          }
        }
        
        booking.low_occupancy_reason = reason || 'Nhân viên hủy đơn';
      }

      booking.status = status;
      await booking.save();

      return res.status(200).json(
        ApiResponse.success({
          bookingId: booking._id,
          status: booking.status,
          status_text: booking.status_text
        }, `Cập nhật trạng thái thành ${booking.status_text}`)
      );

    } catch (error) {
      console.error('❌ Lỗi cập nhật trạng thái:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể cập nhật trạng thái', error.message)
      );
    }
  }

  /**
   * Lấy thống kê bookings
   */
  async getBookingStats(req, res) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        totalBookings,
        pendingBookings,
        confirmedBookings,
        assignedBookings,
        inProgressBookings,
        completedBookings,
        cancelledBookings,
        todayBookings,
        weekBookings,
        monthBookings,
        revenueToday,
        revenueWeek,
        revenueMonth
      ] = await Promise.all([
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'pending' }),
        Booking.countDocuments({ status: 'confirmed' }),
        Booking.countDocuments({ status: 'assigned' }),
        Booking.countDocuments({ status: 'in-progress' }),
        Booking.countDocuments({ status: 'completed' }),
        Booking.countDocuments({ status: 'cancelled' }),
        Booking.countDocuments({ trip_date: { $gte: startOfDay } }),
        Booking.countDocuments({ trip_date: { $gte: startOfWeek } }),
        Booking.countDocuments({ trip_date: { $gte: startOfMonth } }),
        Booking.aggregate([
          { $match: { status: 'completed', trip_date: { $gte: startOfDay } } },
          { $group: { _id: null, total: { $sum: '$price' } } }
        ]),
        Booking.aggregate([
          { $match: { status: 'completed', trip_date: { $gte: startOfWeek } } },
          { $group: { _id: null, total: { $sum: '$price' } } }
        ]),
        Booking.aggregate([
          { $match: { status: 'completed', trip_date: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$price' } } }
        ])
      ]);

      const stats = {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        assigned: assignedBookings,
        inProgress: inProgressBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        today: todayBookings,
        week: weekBookings,
        month: monthBookings,
        revenue: {
          today: revenueToday[0]?.total || 0,
          week: revenueWeek[0]?.total || 0,
          month: revenueMonth[0]?.total || 0
        }
      };

      return res.status(200).json(
        ApiResponse.success(stats, 'Lấy thống kê thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi lấy thống kê:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy thống kê', error.message)
      );
    }
  }

  /**
   * Lấy danh sách xe có sẵn theo số ghế
   */
  async getAvailableVehicles(req, res) {
    try {
      const { seats } = req.query;
      
      const query = { status: 'ready' };
      if (seats) {
        query.seats = parseInt(seats);
      }

      const vehicles = await Vehicle.find(query)
        .select('vehicle_name license_plate seats status')
        .sort({ seats: 1, vehicle_name: 1 });

      return res.status(200).json(
        ApiResponse.success(vehicles, 'Lấy danh sách xe thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi lấy danh sách xe:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy danh sách xe', error.message)
      );
    }
  }

  /**
   * Lấy danh sách tài xế có sẵn
   */
  async getAvailableDrivers(req, res) {
    try {
      const drivers = await Driver.find({ status: 'active' })
        .select('name phone license_number status')
        .sort({ name: 1 });

      return res.status(200).json(
        ApiResponse.success(drivers, 'Lấy danh sách tài xế thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi lấy danh sách tài xế:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy danh sách tài xế', error.message)
      );
    }
  }

  /**
   * Lấy chi tiết booking theo ID (phiên bản đơn giản)
   */
  async getBookingById(req, res) {
    try {
      const { id } = req.params;

      const booking = await Booking.findById(id)
        .populate('vehicleType')
        .populate({
          path: 'tripAssignment',
          populate: [
            { path: 'driver', select: 'name phone license_number' },
            { path: 'vehicle', select: 'vehicle_name license_plate seats' }
          ]
        });

      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe')
        );
      }

      const payment = await Payment.findOne({ booking_id: id }).select('payment_method payment_status paid_at');

      return res.status(200).json(
        ApiResponse.success({
          ...booking.toObject(),
          formatted_date: booking.formatted_date,
          status_text: booking.status_text,
          payment_method_text: booking.payment_method_text,
          payment_status: payment?.payment_status || 'pending',
          paid_at: payment?.paid_at || null
        }, 'Lấy thông tin booking thành công')
      );

    } catch (error) {
      console.error('❌ Lỗi lấy booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy thông tin booking', error.message)
      );
    }
  }
}

module.exports = new StaffBookingController();