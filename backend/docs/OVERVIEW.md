# 📦 Backend - Tổng Quan Hệ Thống

## Giới thiệu

Backend của hệ thống đặt xe được xây dựng bằng **Node.js + Express.js**, kết nối **MongoDB** thông qua **Mongoose**. Server phục vụ hai client riêng biệt (khách hàng web và tài xế).

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB (Mongoose v9) |
| Xác thực | JWT (jsonwebtoken) |
| Mã hoá mật khẩu | bcryptjs |
| Thanh toán | MoMo API |
| Tính năng khác | cookie-parser, cors, dotenv, uuid |

## Cấu trúc thư mục

```
backend/
├── server.js               # Entry point - khởi động server
├── .env                    # Biến môi trường (PORT, DB_URL, JWT_SECRET, ...)
├── src/
│   ├── config/
│   │   └── db.js           # Kết nối MongoDB
│   ├── middleware/
│   │   ├── authMiddleware.js   # Xác thực JWT
│   │   └── roleMiddleware.js   # Phân quyền (staff/driver/admin)
│   ├── models/             # Mongoose schemas
│   ├── controller/         # Business logic
│   ├── router/             # API routes
│   └── utils/
│       └── tripPricing.js  # Tính giá chuyến đi
```

## Cổng và CORS

- Mặc định chạy tại `http://localhost:5000`
- Chấp nhận request từ:
  - `http://localhost:5173` (frontend khách hàng)
  - `http://localhost:5174` (frontend tài xế / môi trường khác)

## Danh sách API Routes

| Prefix | Router | Mô tả |
|---|---|---|
| `/api/staff` | Staff.router | Đăng ký / đăng nhập nhân viên |
| `/api/driver` | Driver.router | Đăng ký / đăng nhập tài xế |
| `/api/staff/drivers` | DriverManagement.router | Nhân viên quản lý tài xế |
| `/api/vehicles` | Vehicle.router | Quản lý phương tiện |
| `/api/bookings` | Booking.router | Đặt xe (public + staff) |
| `/api/staff/bookings` | staffBooking.router | Booking dành cho staff |
| `/api/staffListCustomers` | StaffCustomer.router | Danh sách khách hàng |
| `/api/trips` | Trip.router | Quản lý chuyến ghép (staff) |
| `/api/driverTrip` | driverTrip.router | Chuyến đi dành cho tài xế |
| `/api/payments` | Payment.router | Thanh toán |
| `/api/reviews` | driverReview.router | Đánh giá tài xế |

## Vai trò người dùng

```
Staff  → quản lý đơn hàng, tài xế, xe, khách hàng, thống kê
Driver → nhận và hoàn thành chuyến đi, tạo chuyến tự mình
Public → đặt xe, tra cứu chuyến, hủy đơn, đánh giá tài xế
```

---

> Xem chi tiết từng phần trong các file tài liệu riêng:
> - [MODELS.md](./MODELS.md) — Cơ sở dữ liệu & Schema
> - [API.md](./API.md) — Toàn bộ API endpoints
> - [MIDDLEWARE.md](./MIDDLEWARE.md) — Xác thực & phân quyền
> - [PRICING.md](./PRICING.md) — Logic tính giá
