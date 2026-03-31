// ============================================================
// VEHICLE_CONTROLLER.JS - FIXED VERSION
// ============================================================

const Vehicle = require('../models/Vehicle.models');
const VehicleType = require('../models/VehicleType.models');

const getStatusText = (status) => {
  const statusMap = {
    'ready': 'Chuẩn bị khởi hành',
    'not_started': 'Chưa khởi hành',
    'completed': 'Đã hoàn thành chuyến đi'
  };
  return statusMap[status] || status;
};

const getVehicleTypeText = (seats) => {
  const typeMap = {
    4: 'Xe 4 chỗ',
    7: 'Xe 7 chỗ',
    9: 'Xe 9 chỗ',
    16: 'Xe 16 chỗ',
    29: 'Xe 29 chỗ',
    45: 'Xe 45 chỗ'
  };
  return typeMap[seats] || 'Xe không xác định';
};

const checkStaffPermission = (req, res) => {
  if (req.userRole !== 'staff') {
    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này. Chỉ nhân viên mới có quyền.'
    });
    return false;
  }
  return true;
};

// Helper function to ensure VehicleType exists
const ensureVehicleTypeExists = async (seats) => {
  try {
    console.log(`🔍 Looking for VehicleType with seats: ${seats}`);
    
    let vehicleType = await VehicleType.findOne({ seats: seats });
    
    if (!vehicleType) {
      console.log(`⚠️ VehicleType not found for ${seats} seats, creating new one...`);
      
      const typeMap = {
        4: { type_name: 'Xe 4 chỗ', base_price: 1500000, price_per_km: 10000 },
        7: { type_name: 'Xe 7 chỗ', base_price: 1800000, price_per_km: 11000 },
        9: { type_name: 'Xe 9 chỗ', base_price: 2600000, price_per_km: 12000 },
        16: { type_name: 'Xe 16 chỗ', base_price: 2000000, price_per_km: 9000 },
        29: { type_name: 'Xe 29 chỗ', base_price: 3000000, price_per_km: 11000 },
        45: { type_name: 'Xe 45 chỗ', base_price: 5700000, price_per_km: 20000 }
      };
      
      const typeData = typeMap[seats];
      if (!typeData) {
        throw new Error(`Không tìm thấy cấu hình cho xe ${seats} chỗ`);
      }
      
      vehicleType = await VehicleType.create({
        type_name: typeData.type_name,
        seats: seats,
        base_price: typeData.base_price,
        price_per_km: typeData.price_per_km,
        is_active: true
      });
      
      console.log(`✅ Created VehicleType for ${seats} seats:`, vehicleType._id);
    } else {
      console.log(`✅ Found existing VehicleType for ${seats} seats:`, vehicleType._id);
    }
    
    return vehicleType;
  } catch (error) {
    console.error('❌ Error in ensureVehicleTypeExists:', error);
    throw error;
  }
};

const addVehicle = async (req, res) => {
  try {
    if (!checkStaffPermission(req, res)) return;

    const { vehicle_name, license_plate, seats, status } = req.body;

    console.log('🚗 Add vehicle attempt:', { 
      vehicle_name, 
      license_plate, 
      seats, 
      status,
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!vehicle_name || !vehicle_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên xe là bắt buộc và không được để trống'
      });
    }

    if (!license_plate || !license_plate.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Biển số xe là bắt buộc và không được để trống'
      });
    }

    if (!seats) {
      return res.status(400).json({
        success: false,
        message: 'Số chỗ ngồi là bắt buộc'
      });
    }

    // Validate seats
    const validSeats = [4, 7, 9, 16, 29, 45];
    const seatsNum = parseInt(seats);
    
    if (!validSeats.includes(seatsNum)) {
      return res.status(400).json({
        success: false,
        message: `Số chỗ ngồi không hợp lệ. Chấp nhận: ${validSeats.join(', ')}`
      });
    }

    const normalizedPlate = license_plate.trim().toUpperCase();

    // Check duplicate license plate
    const existingVehicle = await Vehicle.findOne({ 
      license_plate: normalizedPlate 
    });
    
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: `Biển số xe "${normalizedPlate}" đã tồn tại trong hệ thống`
      });
    }

    // Ensure VehicleType exists
    let vehicleType;
    try {
      vehicleType = await ensureVehicleTypeExists(seatsNum);
      
      if (!vehicleType || !vehicleType._id) {
        throw new Error('Failed to get or create VehicleType');
      }
    } catch (typeError) {
      console.error('❌ Error ensuring VehicleType:', typeError);
      return res.status(400).json({
        success: false,
        message: typeError.message || 'Không thể xử lý loại xe'
      });
    }

    // Validate status
    const validStatuses = ['ready', 'not_started', 'completed'];
    let finalStatus = 'ready';
    if (status && validStatuses.includes(status)) {
      finalStatus = status;
    }

    // ✅ FIX: Create vehicle with all required fields
    const newVehicle = new Vehicle({
      vehicle_name: vehicle_name.trim(),
      license_plate: normalizedPlate,
      seats: seatsNum,
      vehicle_type_id: vehicleType._id,
      status: finalStatus
    });

    console.log('💾 Saving vehicle to database...');
    
    // ✅ FIX: Use try-catch for save operation
    try {
      await newVehicle.save();
      console.log('✅ Vehicle saved successfully:', newVehicle._id);
    } catch (saveError) {
      console.error('❌ Save error:', saveError);
      throw saveError;
    }

    // Populate vehicle type info for response
    const populatedVehicle = await Vehicle.findById(newVehicle._id)
      .populate('vehicle_type_info');

    res.status(201).json({
      success: true,
      message: 'Thêm xe thành công',
      data: {
        id: newVehicle._id,
        _id: newVehicle._id,
        vehicle_name: newVehicle.vehicle_name,
        license_plate: newVehicle.license_plate,
        seats: newVehicle.seats,
        vehicle_type: getVehicleTypeText(newVehicle.seats),
        status: newVehicle.status,
        status_text: getStatusText(newVehicle.status),
        created_at: newVehicle.created_at,
        updated_at: newVehicle.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error adding vehicle:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    // Handle ValidationError
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }

    // Handle Duplicate Key Error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'license_plate' ? 'Biển số xe' : field;
      return res.status(400).json({
        success: false,
        message: `${fieldName} đã tồn tại trong hệ thống`
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm xe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export other functions (giữ nguyên các hàm khác từ file trước)
const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({})
      .populate('vehicle_type_info')
      .sort({ created_at: -1 });

    console.log(`📋 Lấy danh sách xe: ${vehicles.length} xe`);

    const formattedVehicles = vehicles.map(vehicle => ({
      id: vehicle._id,
      _id: vehicle._id,
      vehicle_name: vehicle.vehicle_name,
      license_plate: vehicle.license_plate,
      seats: vehicle.seats,
      vehicle_type: getVehicleTypeText(vehicle.seats),
      status: vehicle.status,
      status_text: getStatusText(vehicle.status),
      created_at: vehicle.created_at,
      updated_at: vehicle.updated_at
    }));

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách xe thành công',
      data: formattedVehicles,
      total: vehicles.length
    });

  } catch (error) {
    console.error('❌ Error getting vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách xe',
      error: error.message
    });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id).populate('vehicle_type_info');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin xe thành công',
      data: {
        id: vehicle._id,
        _id: vehicle._id,
        vehicle_name: vehicle.vehicle_name,
        license_plate: vehicle.license_plate,
        seats: vehicle.seats,
        vehicle_type: getVehicleTypeText(vehicle.seats),
        status: vehicle.status,
        status_text: getStatusText(vehicle.status),
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error getting vehicle:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID xe không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin xe',
      error: error.message
    });
  }
};

const getVehiclesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    const validStatuses = ['ready', 'not_started', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chấp nhận: ready, not_started, completed'
      });
    }

    const vehicles = await Vehicle.find({ status })
      .populate('vehicle_type_info')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: `Lấy danh sách xe có trạng thái ${getStatusText(status)} thành công`,
      data: vehicles.map(vehicle => ({
        id: vehicle._id,
        _id: vehicle._id,
        vehicle_name: vehicle.vehicle_name,
        license_plate: vehicle.license_plate,
        seats: vehicle.seats,
        vehicle_type: getVehicleTypeText(vehicle.seats),
        status: vehicle.status,
        status_text: getStatusText(vehicle.status)
      })),
      total: vehicles.length
    });
  } catch (error) {
    console.error('❌ Error getting vehicles by status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách xe theo trạng thái',
      error: error.message
    });
  }
};

const getVehiclesBySeats = async (req, res) => {
  try {
    const { seats } = req.params;
    const seatsNum = parseInt(seats);
    
    const validSeats = [4, 7, 9, 16, 29, 45];
    if (!validSeats.includes(seatsNum)) {
      return res.status(400).json({
        success: false,
        message: 'Số chỗ không hợp lệ. Chấp nhận: 4, 7, 9, 16, 29, 45'
      });
    }

    const vehicles = await Vehicle.find({ seats: seatsNum })
      .populate('vehicle_type_info')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: `Lấy danh sách xe ${getVehicleTypeText(seatsNum)} thành công`,
      data: vehicles.map(vehicle => ({
        id: vehicle._id,
        _id: vehicle._id,
        vehicle_name: vehicle.vehicle_name,
        license_plate: vehicle.license_plate,
        seats: vehicle.seats,
        vehicle_type: getVehicleTypeText(vehicle.seats),
        status: vehicle.status,
        status_text: getStatusText(vehicle.status)
      })),
      total: vehicles.length
    });
  } catch (error) {
    console.error('❌ Error getting vehicles by seats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách xe theo số chỗ',
      error: error.message
    });
  }
};

const searchVehicles = async (req, res) => {
  try {
    const { keyword, status, seats, sortBy, sortOrder, page, limit } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (keyword) {
      query.$or = [
        { vehicle_name: { $regex: keyword, $options: 'i' } },
        { license_plate: { $regex: keyword.toUpperCase(), $options: 'i' } }
      ];
    }

    if (status) {
      const validStatuses = ['ready', 'not_started', 'completed'];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    if (seats) {
      const seatsNum = parseInt(seats);
      const validSeats = [4, 7, 9, 16, 29, 45];
      if (validSeats.includes(seatsNum)) {
        query.seats = seatsNum;
      }
    }

    let sortObj = { created_at: -1 };
    if (sortBy) {
      const validSortFields = ['created_at', 'vehicle_name', 'license_plate', 'seats', 'status'];
      if (validSortFields.includes(sortBy)) {
        const order = sortOrder === 'asc' ? 1 : -1;
        sortObj = { [sortBy]: order };
      }
    }

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .populate('vehicle_type_info')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: `Tìm thấy ${vehicles.length} xe`,
      data: vehicles.map(vehicle => ({
        id: vehicle._id,
        _id: vehicle._id,
        vehicle_name: vehicle.vehicle_name,
        license_plate: vehicle.license_plate,
        seats: vehicle.seats,
        vehicle_type: getVehicleTypeText(vehicle.seats),
        status: vehicle.status,
        status_text: getStatusText(vehicle.status)
      })),
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_items: total,
        items_per_page: limitNum
      }
    });
  } catch (error) {
    console.error('❌ Error searching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tìm kiếm xe',
      error: error.message
    });
  }
};

const updateVehicle = async (req, res) => {
  try {
    if (!checkStaffPermission(req, res)) return;

    const { id } = req.params;
    const { vehicle_name, license_plate, seats, status } = req.body;

    console.log('🔄 Update vehicle attempt:', { id, vehicle_name, license_plate, seats, status });

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    const updateData = {};
    const errors = [];

    if (vehicle_name !== undefined && vehicle_name !== null && vehicle_name !== vehicle.vehicle_name) {
      if (!vehicle_name.trim()) {
        errors.push('Tên xe không được để trống');
      } else {
        updateData.vehicle_name = vehicle_name.trim();
      }
    }

    if (license_plate !== undefined && license_plate !== null && license_plate !== vehicle.license_plate) {
      if (!license_plate.trim()) {
        errors.push('Biển số xe không được để trống');
      } else {
        const normalizedPlate = license_plate.trim().toUpperCase();
        const existingVehicle = await Vehicle.findOne({ 
          license_plate: normalizedPlate,
          _id: { $ne: id }
        });
        
        if (existingVehicle) {
          errors.push('Biển số xe đã tồn tại trong hệ thống');
        } else {
          updateData.license_plate = normalizedPlate;
        }
      }
    }

    if (seats !== undefined && seats !== null && seats !== vehicle.seats) {
      const seatsNum = parseInt(seats);
      const validSeats = [4, 7, 9, 16, 29, 45];
      
      if (!validSeats.includes(seatsNum)) {
        errors.push(`Số chỗ ngồi không hợp lệ. Chấp nhận: ${validSeats.join(', ')}`);
      } else {
        updateData.seats = seatsNum;
        
        try {
          const vehicleType = await ensureVehicleTypeExists(seatsNum);
          updateData.vehicle_type_id = vehicleType._id;
        } catch (typeError) {
          errors.push('Không thể cập nhật loại xe');
        }
      }
    }

    if (status !== undefined && status !== null && status !== vehicle.status) {
      const validStatuses = ['ready', 'not_started', 'completed'];
      if (!validStatuses.includes(status)) {
        errors.push(`Trạng thái không hợp lệ. Chấp nhận: ${validStatuses.join(', ')}`);
      } else {
        updateData.status = status;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có thay đổi',
        data: {
          id: vehicle._id,
          _id: vehicle._id,
          vehicle_name: vehicle.vehicle_name,
          license_plate: vehicle.license_plate,
          seats: vehicle.seats,
          vehicle_type: getVehicleTypeText(vehicle.seats),
          status: vehicle.status,
          status_text: getStatusText(vehicle.status)
        }
      });
    }

    updateData.updated_at = new Date();

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('vehicle_type_info');

    console.log('✅ Vehicle updated successfully:', updatedVehicle._id);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin xe thành công',
      data: {
        id: updatedVehicle._id,
        _id: updatedVehicle._id,
        vehicle_name: updatedVehicle.vehicle_name,
        license_plate: updatedVehicle.license_plate,
        seats: updatedVehicle.seats,
        vehicle_type: getVehicleTypeText(updatedVehicle.seats),
        status: updatedVehicle.status,
        status_text: getStatusText(updatedVehicle.status),
        updated_at: updatedVehicle.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error updating vehicle:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID xe không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin xe',
      error: error.message
    });
  }
};

const updateVehicleStatus = async (req, res) => {
  try {
    if (!checkStaffPermission(req, res)) return;

    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Updating vehicle ${id} status to: ${status}`);

    const validStatuses = ['ready', 'not_started', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chấp nhận: ready, not_started, completed'
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    if (vehicle.status === status) {
      return res.status(400).json({
        success: false,
        message: `Xe đã ở trạng thái ${getStatusText(status)}`
      });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { 
        status,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái xe thành công',
      data: {
        id: updatedVehicle._id,
        _id: updatedVehicle._id,
        vehicle_name: updatedVehicle.vehicle_name,
        license_plate: updatedVehicle.license_plate,
        seats: updatedVehicle.seats,
        vehicle_type: getVehicleTypeText(updatedVehicle.seats),
        status: updatedVehicle.status,
        status_text: getStatusText(updatedVehicle.status),
        updated_at: updatedVehicle.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error updating vehicle status:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID xe không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái xe',
      error: error.message
    });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    if (!checkStaffPermission(req, res)) return;

    const { id } = req.params;

    console.log('🗑️ Delete vehicle attempt:', id);

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    await Vehicle.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Xóa xe thành công',
      data: {
        id: vehicle._id,
        _id: vehicle._id,
        vehicle_name: vehicle.vehicle_name,
        license_plate: vehicle.license_plate
      }
    });

  } catch (error) {
    console.error('❌ Error deleting vehicle:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID xe không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa xe',
      error: error.message
    });
  }
};

const getVehicleStats = async (req, res) => {
  try {
    const statusStats = await Vehicle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const seatsStats = await Vehicle.aggregate([
      {
        $group: {
          _id: '$seats',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalVehicles = await Vehicle.countDocuments();

    const statusMap = {
      'ready': 'Chuẩn bị khởi hành',
      'not_started': 'Chưa khởi hành',
      'completed': 'Đã hoàn thành'
    };

    const formattedStatusStats = {};
    statusStats.forEach(stat => {
      formattedStatusStats[statusMap[stat._id] || stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê xe thành công',
      data: {
        total: totalVehicles,
        by_status: formattedStatusStats,
        by_seats: seatsStats
      }
    });

  } catch (error) {
    console.error('❌ Error getting vehicle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê xe',
      error: error.message
    });
  }
};

const getVehiclesByFilters = async (req, res) => {
  try {
    const { status, seats, vehicle_type } = req.query;
    let query = {};

    if (status) {
      const validStatuses = ['ready', 'not_started', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }
      query.status = status;
    }

    if (seats) {
      const seatsNum = parseInt(seats);
      const validSeats = [4, 7, 9, 16, 29, 45];
      if (!validSeats.includes(seatsNum)) {
        return res.status(400).json({
          success: false,
          message: 'Số chỗ không hợp lệ'
        });
      }
      query.seats = seatsNum;
    }

    if (vehicle_type) {
      const validTypes = ['Xe 4 chỗ', 'Xe 7 chỗ', 'Xe 9 chỗ', 'Xe 16 chỗ', 'Xe 29 chỗ', 'Xe 45 chỗ'];
      if (!validTypes.includes(vehicle_type)) {
        return res.status(400).json({
          success: false,
          message: 'Loại xe không hợp lệ'
        });
      }
      query.vehicle_type = vehicle_type;
    }

    const vehicles = await Vehicle.find(query)
      .populate('vehicle_type_info')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: `Tìm thấy ${vehicles.length} xe`,
      data: vehicles.map(vehicle => ({
        id: vehicle._id,
        _id: vehicle._id,
        vehicle_name: vehicle.vehicle_name,
        license_plate: vehicle.license_plate,
        seats: vehicle.seats,
        vehicle_type: getVehicleTypeText(vehicle.seats),
        status: vehicle.status,
        status_text: getStatusText(vehicle.status)
      }))
    });

  } catch (error) {
    console.error('❌ Error getting vehicles by filters:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lọc xe',
      error: error.message
    });
  }
};

module.exports = {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  getVehiclesByStatus,
  getVehiclesBySeats,
  searchVehicles,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
  getVehicleStats,
  getVehiclesByFilters
};