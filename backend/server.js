const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
dotenv.config();

// Diagnostic logging for Docker environment
console.log('--- Environment Diagnostics ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_URL:', process.env.DB_URL ? `Data exists (Length: ${process.env.DB_URL.length})` : 'MISSING ❌');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'MISSING ❌');
console.log('CLIENT_URL_SHIP:', process.env.CLIENT_URL_SHIP || 'MISSING ❌');
console.log('-------------------------------\n');

const port = process.env.PORT || 5000;
const staffRoutes = require('./src/router/Staff.router');
const driverRoutes = require('./src/router/Driver.router');
const driverManagementRoutes = require('./src/router/DriverManagement.router');
const vehicleRoutes = require('./src/router/Vehicle.router');
const bookingRoutes = require('./src/router/Booking.router');
const staffBookingRoutes = require('./src/router/staffBooking.router');
const staffCustomerRoutes = require('./src/router/StaffCustomer.router');
const tripRoutes = require('./src/router/Trip.router');
const driverTripRoutes = require('./src/router/driverTrip.router');
const paymentRoutes = require('./src/router/Payment.router')
const driverReviewRoutes = require('./src/router/driverReview.router');
const connectDB = async () => {
  try {
    if (!process.env.DB_URL) {
      throw new Error('Cấu hình DB_URL bị thiếu (undefined)');
    }
    await mongoose.connect(process.env.DB_URL);
    console.log('✅ Kết nối MongoDB thành công');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};
connectDB();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_SHIP,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Cho phép subdomain của render.com trong production nếu cần
      if (process.env.NODE_ENV === 'production' && origin.endsWith('.render.com')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

app.use('/api/staff', staffRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/staff', driverManagementRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/staff/bookings', staffBookingRoutes);
app.use('/api/staffListCustomers', staffCustomerRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/driverTrip', driverTripRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', driverReviewRoutes);
app.use((req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy tài nguyên'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Lỗi server:', err.stack);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối bởi CORS'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`\n🚀 Server đang chạy tại http://localhost:${port}`);
  console.log(`📋 API Vehicles: http://localhost:${port}/api/vehicles`);
  console.log(`🌐 Allowed CORS Origins: ${allowedOrigins.join(', ')}\n`);
});