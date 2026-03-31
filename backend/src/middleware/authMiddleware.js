// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'driver') {
      req.driverId = decoded.id;
      req.driverUsername = decoded.username;
      req.driverPhone = decoded.phone;
      req.userRole = 'driver';
      req.userId = decoded.id;
      req.username = decoded.username;
      console.log('🔐 Authenticated as DRIVER:', decoded.username);
    } else if (decoded.role === 'staff') {
      req.staffId = decoded.id;
      req.staffUsername = decoded.username;
      req.staffEmail = decoded.email;
      req.userRole = 'staff';
      req.userId = decoded.id;
      req.username = decoded.username;
      console.log('🔐 Authenticated as STAFF:', decoded.username);
    } else {
      req.userRole = 'unknown';
      req.userId = decoded.id;
      req.username = decoded.username;
      console.log('🔐 Authenticated as UNKNOWN ROLE:', decoded.username);
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }

    console.error('❌ Lỗi xác thực:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực'
    });
  }
};

module.exports = authMiddleware;