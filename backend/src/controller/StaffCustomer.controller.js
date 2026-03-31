const Customer = require('../models/Customer.models');
const Booking = require('../models/Booking.models');
const ApiResponse = require('../models/ApiResponse.models');

class StaffCustomerController {

  async getAllCustomers(req, res) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [customers, total] = await Promise.all([
        Customer.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Customer.countDocuments(query)
      ]);
      
      return res.status(200).json(
        ApiResponse.success({
          customers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }, 'Lấy danh sách khách hàng thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy danh sách khách hàng:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy danh sách khách hàng', error.message)
      );
    }
  }
  
  /**
   * Lấy tất cả bookings của một khách hàng (chỉ staff mới được dùng)
   * Bao gồm tất cả trạng thái: pending, confirmed, assigned, in-progress, completed, cancelled
   */
  async getCustomerBookings(req, res) {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      
      // Kiểm tra khách hàng tồn tại
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy khách hàng')
        );
      }
      
      // Xây dựng query
      const query = { customer_id: customerId };
      
      // Lọc theo status nếu có
      if (status && status !== 'all') {
        query.status = status;
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Lấy danh sách bookings với đầy đủ thông tin
      const [bookings, total] = await Promise.all([
        Booking.find(query)
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
                select: 'vehicle_name license_plate seats status' 
              },
              { 
                path: 'staff_id', 
                select: 'name username' 
              }
            ]
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Booking.countDocuments(query)
      ]);
      
      // Format lại dữ liệu booking để dễ sử dụng
      const formattedBookings = bookings.map(booking => ({
        ...booking.toObject(),
        formatted_date: booking.formatted_date,
        status_text: booking.status_text,
        payment_method_text: booking.payment_method_text,
        // Thêm thông tin phân công nếu có
        assignment_info: booking.tripAssignment ? {
          driver_name: booking.tripAssignment.driver?.name,
          driver_phone: booking.tripAssignment.driver?.phone,
          vehicle_name: booking.tripAssignment.vehicle?.vehicle_name,
          license_plate: booking.tripAssignment.vehicle?.license_plate,
          assigned_by: booking.tripAssignment.staff_id?.name,
          assigned_at: booking.tripAssignment.assigned_at,
          driver_confirmed: booking.tripAssignment.driver_confirm === 1
        } : null
      }));
      
      // Thống kê số lượng booking theo từng trạng thái
      const statusStats = await Booking.aggregate([
        { $match: { customer_id: customer._id } },
        { $group: { 
          _id: '$status', 
          count: { $sum: 1 } 
        }}
      ]);
      
      const statusCount = {};
      statusStats.forEach(stat => {
        statusCount[stat._id] = stat.count;
      });
      
      return res.status(200).json(
        ApiResponse.success({
          customer: {
            id: customer._id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            total_bookings: customer.total_bookings,
            total_spent: customer.total_spent,
            last_booking_date: customer.last_booking_date
          },
          bookings: formattedBookings,
          statistics: {
            total: total,
            pending: statusCount.pending || 0,
            confirmed: statusCount.confirmed || 0,
            assigned: statusCount.assigned || 0,
            in_progress: statusCount['in-progress'] || 0,
            completed: statusCount.completed || 0,
            cancelled: statusCount.cancelled || 0
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }, 'Lấy danh sách booking của khách hàng thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy bookings của khách hàng:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy bookings của khách hàng', error.message)
      );
    }
  }
  
  /**
   * Lấy chi tiết booking của khách hàng (thông tin đầy đủ)
   */
  async getCustomerBookingDetail(req, res) {
    try {
      const { customerId, bookingId } = req.params;
      
      // Kiểm tra khách hàng tồn tại
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy khách hàng')
        );
      }
      
      // Lấy chi tiết booking
      const booking = await Booking.findOne({ 
        _id: bookingId, 
        customer_id: customerId 
      })
        .populate('vehicleType')
        .populate({
          path: 'tripAssignment',
          populate: [
            { path: 'driver', select: 'name phone license_number status' },
            { path: 'vehicle', select: 'vehicle_name license_plate seats status' },
            { path: 'staff_id', select: 'name username' }
          ]
        });
      
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Không tìm thấy đơn đặt xe của khách hàng này')
        );
      }
      
      return res.status(200).json(
        ApiResponse.success({
          ...booking.toObject(),
          formatted_date: booking.formatted_date,
          status_text: booking.status_text,
          payment_method_text: booking.payment_method_text,
          can_cancel: booking.can_cancel,
          can_edit: booking.can_edit
        }, 'Lấy chi tiết booking thành công')
      );
      
    } catch (error) {
      console.error('❌ Lỗi lấy chi tiết booking:', error);
      return res.status(500).json(
        ApiResponse.error('Không thể lấy chi tiết booking', error.message)
      );
    }
  }
}

module.exports = new StaffCustomerController();