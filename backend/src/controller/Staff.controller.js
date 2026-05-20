// controller/Staff.controller.js
const Staff = require('../models/Staff.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OtpService = require('../services/OtpService');
const EmailService = require('../services/EmailService');

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return phoneRegex.test(phone);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

const maskContact = (contact, method) => {
  if (method === 'email') {
    return contact.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  }
  return contact.replace(/(.{3})(.*)(.{2})/, '$1***$3');
};

const registerStaff = async (req, res) => {
  try {
    const { name, phone, email, username, password } = req.body;
    
    if (!name || !phone || !email || !username || !password) {
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
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không đúng định dạng'
      });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)'
      });
    }
    
    const existingUsername = await Staff.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      });
    }
    
    const existingEmail = await Staff.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }
    
    const existingPhone = await Staff.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã được sử dụng'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = new Staff({
      name,
      phone,
      email,
      username,
      password: hashedPassword
    });

    await newStaff.save();
    
    // Thêm role='staff' vào token
    const token = jwt.sign(
      { 
        id: newStaff._id, 
        username: newStaff.username,
        email: newStaff.email,
        role: 'staff'  // QUAN TRỌNG: Thêm role
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
    
    console.log('✅ Đăng ký nhân viên thành công:', {
      id: newStaff._id,
      name: newStaff.name,
      phone: newStaff.phone,
      email: newStaff.email,
      username: newStaff.username,
      role: 'staff'
    });
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        id: newStaff._id,
        name: newStaff.name,
        phone: newStaff.phone,
        email: newStaff.email,
        username: newStaff.username,
        role: 'staff',
        token
      }
    });
  } catch (error) {
    console.error('❌ Lỗi đăng ký:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký'
    });
  }
};

const loginStaff = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    console.log('🔐 Login attempt - Input:', { username, email });
    
    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập/email và mật khẩu'
      });
    }

    const input = username || email;
    
    console.log('🔍 Searching with input:', input);
    
    let query = {};
    
    if (input && input.includes('@')) {
      if (!validateEmail(input)) {
        return res.status(400).json({
          success: false,
          message: 'Email không đúng định dạng'
        });
      }
      query.email = input.toLowerCase();
      console.log('📧 Searching by email:', query.email);
    } else {
      query.username = input.toLowerCase();
      console.log('👤 Searching by username:', query.username);
    }

    const staff = await Staff.findOne(query).select('+password');
    
    console.log('🔎 Found staff:', staff ? 'Yes' : 'No');
    
    if (!staff) {
      console.log('❌ Staff not found with query:', query);
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập/email hoặc mật khẩu không đúng'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    console.log('🔐 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', staff.username);
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập/email hoặc mật khẩu không đúng'
      });
    }

    // Thêm role='staff' vào token
    const token = jwt.sign(
      { 
        id: staff._id, 
        username: staff.username,
        email: staff.email,
        role: 'staff'  // QUAN TRỌNG: Thêm role
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

    console.log('✅ Login successful:', {
      id: staff._id,
      name: staff.name,
      username: staff.username,
      email: staff.email,
      role: 'staff'
    });

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        id: staff._id,
        name: staff.name,
        phone: staff.phone,
        email: staff.email,
        username: staff.username,
        role: 'staff',
        token
      }
    });

  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
};

const logoutStaff = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi đăng xuất:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất'
    });
  }
};

const getCurrentStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId).select('-password');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...staff.toObject(),
        role: 'staff'
      }
    });
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin'
    });
  }
};

// UPDATE STAFF PROFILE
const updateStaffProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const staffId = req.staffId;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    // Validate phone if changed
    if (phone && phone !== staff.phone) {
      if (!validatePhoneNumber(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ'
        });
      }

      const existingPhone = await Staff.findOne({ phone, _id: { $ne: staffId } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
    }

    // Validate email if changed
    if (email && email !== staff.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email không đúng định dạng'
        });
      }

      const existingEmail = await Staff.findOne({ email, _id: { $ne: staffId } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      staffId,
      {
        name: name || staff.name,
        phone: phone || staff.phone,
        email: email || staff.email,
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
        ...updatedStaff.toObject(),
        role: 'staff'
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

// REQUEST PASSWORD CHANGE - Send OTP
const requestPasswordChange = async (req, res) => {
  try {
    const { method } = req.body;
    const staffId = req.staffId;

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

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    const contact = method === 'email' ? staff.email : staff.phone;

    if (method === 'email') {
      if (!validateEmail(contact)) {
        return res.status(400).json({
          success: false,
          message: 'Email không đúng định dạng'
        });
      }
    } else if (method === 'sms') {
      if (!validatePhoneNumber(contact)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ'
        });
      }
    }

    // Generate OTP
    const otpData = await OtpService.createOtp(staffId, contact, method);

    // Send OTP via email or SMS
    if (method === 'email') {
      await EmailService.sendOtpEmail(contact, otpData.otpCode, staff.name);
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

// VERIFY OTP
const verifyStaffOtp = async (req, res) => {
  try {
    const { otpId, otp } = req.body;
    const staffId = req.staffId;

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

    if (String(result.userId) !== String(staffId)) {
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

// CHANGE PASSWORD
const changeStaffPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, verificationToken } = req.body;
    const staffId = req.staffId;

    if (!currentPassword || !newPassword || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Verify the verification token
    const tokenValid = await OtpService.verifyVerificationToken(verificationToken);
    if (!tokenValid.valid) {
      return res.status(400).json({
        success: false,
        message: tokenValid.message || 'Lỗi xác thực'
      });
    }

    if (String(tokenValid.userId) !== String(staffId)) {
      return res.status(403).json({
        success: false,
        message: 'Mã xác thực không thuộc tài khoản hiện tại'
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)'
      });
    }

    const staff = await Staff.findById(staffId).select('+password');
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, staff.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    staff.password = hashedPassword;
    staff.updated_at = new Date();
    await staff.save();

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

module.exports = {
  registerStaff,
  loginStaff,
  logoutStaff,
  getCurrentStaff,
  updateStaffProfile,
  requestPasswordChange,
  verifyStaffOtp,
  changeStaffPassword,
};