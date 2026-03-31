# 🌐 Backend - API Endpoints

Tất cả API đều có base URL: `http://localhost:5000`

Các response đều theo chuẩn:
```json
{
  "success": true | false,
  "message": "...",
  "data": { ... }
}
```

---

## 🔐 Xác thực

Token JWT được gửi qua:
- Header: `Authorization: Bearer <token>`
- Cookie: `token=<token>`

---

## 👤 Staff Authentication

Base: `/api/staff`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/register` | ❌ | Đăng ký tài khoản nhân viên |
| POST | `/login` | ❌ | Đăng nhập, trả về JWT |
| POST | `/logout` | ❌ | Đăng xuất |
| GET | `/me` | ✅ Staff | Lấy thông tin nhân viên hiện tại |

---

## 🚗 Driver Authentication

Base: `/api/driver`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/driver-register` | ❌ | Đăng ký tài khoản tài xế |
| POST | `/driver-login` | ❌ | Đăng nhập tài xế |
| POST | `/driver-logout` | ❌ | Đăng xuất |
| GET | `/me` | ✅ Driver | Thông tin tài xế hiện tại |
| PUT | `/profile` | ✅ Driver | Cập nhật hồ sơ |
| PUT | `/change-password` | ✅ Driver | Đổi mật khẩu |
| GET | `/status` | ✅ Driver | Trạng thái hiện tại của tài xế |
| GET | `/trips/:driverId` | ✅ | Danh sách chuyến |
| GET | `/stats/:driverId` | ✅ | Thống kê tài xế |
| PUT | `/confirm-trip` | ✅ Driver | Xác nhận nhận chuyến |
| PUT | `/complete-trip/:bookingId` | ✅ Driver | Hoàn thành chuyến |

---

## 📋 Booking (Đặt xe)

Base: `/api/bookings`

### Public (Không cần đăng nhập)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/` | Tạo đơn đặt xe mới |
| POST | `/calculate-price` | Tính giá tạm tính |
| GET | `/status/:id` | Kiểm tra trạng thái đơn |
| GET | `/phone/:phone` | Lấy các chuyến theo số điện thoại |
| GET | `/:id` | Lấy thông tin đơn theo ID |
| POST | `/:id/cancel` | Hủy đơn đặt xe |

### Staff Only

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| PUT | `/:id/confirm` | ✅ Staff | Xác nhận đơn hàng |
| PUT | `/:id/complete` | ✅ Staff | Hoàn thành chuyến đi |

---

## 📋 Staff Booking Management

Base: `/api/staff/bookings` — Yêu cầu Auth Staff

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/stats` | Thống kê đơn hàng |
| GET | `/` | Lấy toàn bộ đơn hàng |
| GET | `/assignment-options` | Tùy chọn phân công |
| GET | `/vehicles/available` | Xe sẵn sàng phân công |
| GET | `/drivers/available` | Tài xế sẵn sàng phân công |
| GET | `/:id/details` | Chi tiết đơn dành cho staff |
| GET | `/:id` | Thông tin đơn |
| PATCH | `/:id/confirm` | Xác nhận đơn |
| POST | `/:id/assign` | Phân công tài xế + xe |
| PATCH | `/:id/status` | Cập nhật trạng thái |

---

## 🗺️ Trip (Chuyến ghép)

Base: `/api/trips` — Yêu cầu Auth Staff

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/stats` | Thống kê chuyến |
| GET | `/` | Tất cả chuyến |
| GET | `/:id` | Chi tiết chuyến |
| GET | `/:id/bookings` | Danh sách booking trong chuyến |
| PATCH | `/:id/status` | Cập nhật trạng thái chuyến |
| DELETE | `/:tripId/bookings/:bookingId` | Xóa booking khỏi chuyến |
| POST | `/assign-booking/:id` | Gán booking vào chuyến |
| GET | `/find-trips/:bookingId` | Tìm chuyến phù hợp để ghép |

---

## 🚘 Driver Trip

Base: `/api/driverTrip` — Yêu cầu Auth Driver

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/status` | Trạng thái hiện tại tài xế |
| GET | `/me/vehicle` | Xe đang gắn với tài xế |
| POST | `/self-booking` | Tự tạo booking (tài xế mang khách) |
| GET | `/:driverId/trips` | Chuyến của tài xế |
| GET | `/:driverId/stats` | Thống kê tài xế |
| PUT | `/confirm-trip` | Xác nhận nhận chuyến |
| PUT | `/complete-trip/:bookingId` | Hoàn thành chuyến |

---

## 🚙 Vehicle (Phương tiện)

Base: `/api/vehicles` — Yêu cầu Auth

### Staff Only

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/` | Thêm xe mới |
| PUT | `/:id` | Cập nhật thông tin xe |
| PATCH | `/:id/status` | Cập nhật trạng thái xe |
| DELETE | `/:id` | Xóa xe |

### Tất cả người dùng đã đăng nhập

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Lấy tất cả xe |
| GET | `/stats` | Thống kê xe |
| GET | `/search` | Tìm kiếm xe |
| GET | `/filter` | Lọc xe theo điều kiện |
| GET | `/status/:status` | Lấy xe theo trạng thái |
| GET | `/seats/:seats` | Lấy xe theo số ghế |
| GET | `/:id` | Thông tin xe theo ID |

---

## 👥 Driver Management (Quản lý tài xế bởi Staff)

Base: `/api/staff` — Yêu cầu Auth

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/drivers` | Danh sách tất cả tài xế |
| GET | `/drivers/search` | Tìm kiếm tài xế |
| GET | `/drivers/status/:status` | Lọc tài xế theo trạng thái |
| GET | `/drivers/:id` | Thông tin tài xế |
| PUT | `/drivers/:id/status` | Cập nhật trạng thái tài xế |

---

## 👤 Khách hàng (Staff xem)

Base: `/api/staffListCustomers` — Yêu cầu Auth Staff

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/customers` | Danh sách khách hàng |
| GET | `/customers/:customerId/bookings` | Lịch sử đặt xe của khách |
| GET | `/customers/:customerId/bookings/:bookingId` | Chi tiết một đơn |

---

## 💳 Payment (Thanh toán)

Base: `/api/payments`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/booking/:bookingId/create` | ❌ | Tạo thanh toán tiền mặt |
| POST | `/booking/:bookingId/create-transfer` | ❌ | Tạo thanh toán MoMo |
| GET | `/booking/:bookingId/status` | ❌ | Kiểm tra trạng thái thanh toán |
| PATCH | `/booking/:bookingId/confirm-cash` | ✅ Staff/Driver | Xác nhận đã nhận tiền mặt |
| POST | `/momo/ipn` | ❌ | Nhận callback từ MoMo |
| GET | `/momo/return` | ❌ | Redirect sau khi thanh toán MoMo |

---

## ⭐ Driver Review (Đánh giá tài xế)

Base: `/api/reviews`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/` | ❌ | Tạo đánh giá |
| GET | `/booking/:bookingId` | ❌ | Kiểm tra đã đánh giá chưa |
| GET | `/driver/:driverId` | ❌ | Tất cả đánh giá của tài xế |
