const Driver = require('../models/Driver.models');

const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({})
      .select('name phone license_number status created_at')
      .sort({ created_at: -1 });

    console.log(`📋 Lấy danh sách tài xế: ${drivers.length} tài xế`);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách tài xế thành công',
      data: drivers
    });

  } catch (error) {
    console.error('❌ Lỗi lấy danh sách tài xế:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách tài xế',
      error: error.message
    });
  }
};

const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id)
      .select('name phone license_number status created_at updated_at');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài xế'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin tài xế thành công',
      data: driver
    });

  } catch (error) {
    console.error('❌ Lỗi lấy thông tin tài xế:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID tài xế không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin tài xế',
      error: error.message
    });
  }
};

const getDriversByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    const validStatuses = ['active', 'inactive', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive, busy'
      });
    }

    const drivers = await Driver.find({ status })
      .select('name phone license_number status created_at');

    res.status(200).json({
      success: true,
      message: `Lấy danh sách tài xế có trạng thái ${status} thành công`,
      data: drivers
    });

  } catch (error) {
    console.error('❌ Lỗi lấy danh sách tài xế theo trạng thái:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách tài xế theo trạng thái',
      error: error.message
    });
  }
};

const updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Updating driver ${id} status to: ${status}`);

    const validStatuses = ['active', 'inactive', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive, busy'
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      { 
        status,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    ).select('name phone license_number status');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài xế'
      });
    }

    console.log(`✅ Cập nhật trạng thái tài xế ${driver.name} thành ${status}`);

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái tài xế thành công',
      data: driver
    });

  } catch (error) {
    console.error('❌ Lỗi cập nhật trạng thái tài xế:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID tài xế không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái tài xế',
      error: error.message
    });
  }
};

// SEARCH DRIVERS - Tìm kiếm tài xế theo tên hoặc số điện thoại
const searchDrivers = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    // Tạo pattern cho tìm kiếm không phân biệt hoa thường
    const searchPattern = new RegExp(keyword, 'i');

    const drivers = await Driver.find({
      $or: [
        { name: searchPattern },
        { phone: searchPattern },
        { license_number: searchPattern }
      ]
    }).select('name phone license_number status');

    res.status(200).json({
      success: true,
      message: `Tìm thấy ${drivers.length} tài xế`,
      data: drivers
    });

  } catch (error) {
    console.error('❌ Lỗi tìm kiếm tài xế:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tìm kiếm tài xế',
      error: error.message
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  getDriversByStatus,
  updateDriverStatus,
  searchDrivers
};