// middleware/roleMiddleware.js
const requireStaff = (req, res, next) => {
  if (req.userRole !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này. Chỉ nhân viên mới có quyền.'
    });
  }
  next();
};

const requireDriver = (req, res, next) => {
  if (req.userRole !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này. Chỉ tài xế mới có quyền.'
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới có quyền.'
    });
  }
  next();
};

module.exports = { requireStaff, requireDriver, requireAdmin };