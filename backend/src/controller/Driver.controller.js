// controller/Driver.controller.js
const Driver = require('../models/Driver.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OtpService = require('../services/OtpService');
const EmailService = require('../services/EmailService');

// Validate functions
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

const validateUsername = (username) => {
  return username && username.length >= 4;
};

const maskContact = (contact, method) => {
  if (method === 'email') {
    return contact.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  }
  return contact.replace(/(.{3})(.*)(.{2})/, '$1***$3');
};

// REGISTER DRIVER
const registerDriver = async (req, res) => {
  try {
    const { name, phone, license_number, username, password } = req.body;

    console.log('📝 Register attempt:', { name, phone, license_number, username });

    if (!name || !phone || !license_number || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ. Số điện thoại phải là 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09'
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập phải có ít nhất 4 ký tự'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)'
      });
    }

    const [existingUsername, existingPhone, existingLicense] = await Promise.all([
      Driver.findOne({ username }),
      Driver.findOne({ phone }),
      Driver.findOne({ license_number })
    ]);

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      });
    }

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã được sử dụng'
      });
    }

    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: 'Số giấy phép lái xe đã tồn tại'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newDriver = new Driver({
      name,
      phone,
      license_number,
      username,
      password: hashedPassword,
      status: 'active'
    });

    await newDriver.save();
    console.log('✅ Driver saved successfully:', newDriver._id);

    const token = jwt.sign(
      { 
        id: newDriver._id, 
        username: newDriver.username,
        phone: newDriver.phone,
        role: 'driver'  // QUAN TRỌNG: Thêm role driver
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log('✅ Đăng ký tài xế thành công:', {
      id: newDriver._id,
      name: newDriver.name,
      username: newDriver.username,
      status: newDriver.status,
      role: 'driver'
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản tài xế thành công',
      data: {
        id: newDriver._id,
        name: newDriver.name,
        phone: newDriver.phone,
        license_number: newDriver.license_number,
        username: newDriver.username,
        status: newDriver.status,
        role: 'driver',
        token
      }
    });

  } catch (error) {
    console.error('❌ Lỗi đăng ký tài xế:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'username' ? 'Tên đăng nhập' : 
                       field === 'phone' ? 'Số điện thoại' : 
                       field === 'license_number' ? 'Số giấy phép lái xe' : field;
      return res.status(400).json({
        success: false,
        message: `${fieldName} đã tồn tại trong hệ thống`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký tài khoản tài xế',
      error: error.message
    });
  }
};

// LOGIN DRIVER
const loginDriver = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Login attempt - Input:', { username });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập và mật khẩu'
      });
    }

    const driver = await Driver.findOne({ username }).select('+password');

    console.log('🔎 Found driver:', driver ? 'Yes' : 'No');

    if (!driver) {
      console.log('❌ Driver not found with username:', username);
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, driver.password);
    console.log('🔐 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for driver:', driver.username);
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    if (driver.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
      });
    }

    // Tạo token với role='driver'
    const token = jwt.sign(
      { 
        id: driver._id, 
        username: driver.username,
        phone: driver.phone,
        role: 'driver'  // QUAN TRỌNG: Thêm role driver
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log('✅ Đăng nhập tài xế thành công:', {
      id: driver._id,
      name: driver.name,
      username: driver.username,
      status: driver.status,
      role: 'driver'
    });

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        license_number: driver.license_number,
        username: driver.username,
        status: driver.status,
        role: 'driver',
        token
      }
    });

  } catch (error) {
    console.error('❌ Lỗi đăng nhập tài xế:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
};

// LOGOUT DRIVER
const logoutDriver = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi đăng xuất tài xế:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất'
    });
  }
};

// GET CURRENT DRIVER (FULL INFO)
const getCurrentDriver = async (req, res) => {
  try {
    console.log('🔍 getCurrentDriver called, driverId:', req.driverId);
    
    const driver = await Driver.findById(req.driverId).select('-password');

    if (!driver) {
      console.log('❌ Driver not found with ID:', req.driverId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin tài xế'
      });
    }

    console.log('📦 Driver found:', { 
      id: driver._id, 
      name: driver.name, 
      status: driver.status,
      updated_at: driver.updated_at
    });

    res.status(200).json({
      success: true,
      data: {
        ...driver.toObject(),
        role: 'driver'
      }
    });
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin tài xế:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin tài xế'
    });
  }
};

// GET DRIVER STATUS ONLY (LIGHTWEIGHT POLLING)
const getDriverStatus = async (req, res) => {
  try {
    const driverId = req.driverId;
    console.log('🔍 [STATUS POLLING] getDriverStatus called for driver:', driverId);
    
    const driver = await Driver.findById(driverId).select('status updated_at name');
    
    if (!driver) {
      console.log('❌ Driver not found with ID:', driverId);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    console.log('📊 [STATUS POLLING] Current status:', driver.status, 'for driver:', driver.name);
    
    res.status(200).json({
      success: true,
      data: {
        id: driver._id,
        name: driver.name,
        status: driver.status,
        role: 'driver',
        updated_at: driver.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error getting driver status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting driver status'
    });
  }
};

// UPDATE DRIVER PROFILE
const updateDriverProfile = async (req, res) => {
  try {
    const { name, phone, license_number } = req.body;
    const driverId = req.driverId;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài xế'
      });
    }

    if (phone && phone !== driver.phone) {
      if (!validatePhoneNumber(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ'
        });
      }

      const existingPhone = await Driver.findOne({ phone, _id: { $ne: driverId } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
    }

    if (license_number && license_number !== driver.license_number) {
      const existingLicense = await Driver.findOne({ 
        license_number, 
        _id: { $ne: driverId } 
      });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'Số giấy phép lái xe đã tồn tại'
        });
      }
    }

    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      {
        name: name || driver.name,
        phone: phone || driver.phone,
        license_number: license_number || driver.license_number,
        updated_at: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        ...updatedDriver.toObject(),
        role: 'driver'
      }
    });

  } catch (error) {
    console.error('❌ Lỗi cập nhật thông tin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin'
    });
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, verificationToken } = req.body;
    const driverId = req.driverId;

    if (!currentPassword || !newPassword || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    const tokenValid = await OtpService.verifyVerificationToken(verificationToken);
    if (!tokenValid.valid) {
      return res.status(400).json({
        success: false,
        message: tokenValid.message || 'Mã xác thực không hợp lệ'
      });
    }

    if (String(tokenValid.userId) !== String(driverId)) {
      return res.status(403).json({
        success: false,
        message: 'Mã xác thực không thuộc tài khoản hiện tại'
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      });
    }

    const driver = await Driver.findById(driverId).select('+password');
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài xế'
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, driver.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    driver.password = hashedPassword;
    driver.updated_at = new Date();
    await driver.save();

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('❌ Lỗi đổi mật khẩu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu'
    });
  }
};

// REQUEST PASSWORD CHANGE - Send OTP for driver
const requestPasswordChangeDriver = async (req, res) => {
  try {
    const { method } = req.body;
    const driverId = req.driverId;

    if (!method) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn phương thức xác thực'
      });
    }

    if (!['email', 'sms'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức không hợp lệ'
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài xế'
      });
    }

    if (method === 'email') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản tài xế hiện chưa hỗ trợ xác thực qua email'
      });
    }

    const contact = driver.phone;

    if (!validatePhoneNumber(contact)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ'
      });
    }

    // Generate OTP
    const otpData = await OtpService.createOtp(driverId, contact, method);

    // Send OTP via email or SMS
    if (method === 'email') {
      await EmailService.sendOtpEmail(contact, otpData.otpCode, driver.name);
    } else if (method === 'sms') {
      await EmailService.sendOtpSms(contact, otpData.otpCode);
    }

    res.status(200).json({
      success: true,
      message: `Mã OTP đã được gửi đến ${method === 'email' ? 'email' : 'số điện thoại'}`,
      data: {
        otpId: otpData.otpId,
        expiresAt: otpData.expiresAt,
        contact: maskContact(contact, method)
      }
    });
  } catch (error) {
    console.error('❌ Lỗi gửi OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi OTP'
    });
  }
};

// VERIFY OTP for driver
const verifyDriverOtp = async (req, res) => {
  try {
    const { otpId, otp } = req.body;
    const driverId = req.driverId;

    if (!otpId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập OTP'
      });
    }

    const result = await OtpService.verifyOtp(otpId, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message || 'OTP không hợp lệ'
      });
    }

    if (String(result.userId) !== String(driverId)) {
      return res.status(403).json({
        success: false,
        message: 'OTP không thuộc tài khoản hiện tại'
      });
    }

    // Generate verification token
    const verificationToken = await OtpService.generateVerificationToken(otpId);

    res.status(200).json({
      success: true,
      message: 'OTP xác thực thành công',
      data: {
        verificationToken
      }
    });
  } catch (error) {
    console.error('❌ Lỗi xác thực OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực OTP'
    });
  }
};

// Helper function to validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  registerDriver,
  loginDriver,
  logoutDriver,
  getCurrentDriver,
  getDriverStatus,
  updateDriverProfile,
  requestPasswordChangeDriver,
  verifyDriverOtp,    
  changePassword
};
  