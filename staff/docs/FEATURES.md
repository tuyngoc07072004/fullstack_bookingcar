# ✨ Frontend - Tính Năng Chi Tiết (Features)

---

## 1. Luồng đặt xe (Khách hàng)

```
Trang chủ
   │
   ▼
Chọn điểm đón/đến trên bản đồ Leaflet
   │
   ▼
Chọn ngày giờ + số hành khách
   │
   ▼
Chọn loại xe (4/7/9/16/29/45 chỗ)
   │
   ▼
Xem bảng tính giá chi tiết (base_fare + distance × per_km × passengers)
   │
   ▼
Nhập thông tin cá nhân (tên, SĐT, email)
   │
   ▼
Chọn phương thức thanh toán:
   ├── Tiền mặt → tạo booking, xác nhận sau
   └── Chuyển khoản → tạo payment MoMo, chuyển đến trang QR
   │
   ▼
Trang Confirmation (thành công + mã đơn)
```

---

## 2. Luồng xử lý đơn hàng (Nhân viên)

```
Đơn hàng mới (status: pending)
   │
   ▼
Nhân viên xem trong tab "Đơn Hàng"
   │
   ▼
Xác nhận đơn (status: confirmed)
   │
   ▼
Phân công tài xế + xe (status: assigned)
   │  - Chọn tài xế active + chọn xe đúng loại
   │  - Có thể ghép nhiều booking vào cùng chuyến (Trip)
   │
   ▼
Tài xế xác nhận nhận chuyến (status: in-progress xét theo TripAssignment)
   │
   ▼
Tài xế hoàn thành (status: completed)
```

---

## 3. Luồng tài xế nhận và thực hiện chuyến

```
Tài xế đăng nhập → Dashboard
   │
   ▼
Tab "Chuyến Hiện Tại" → danh sách chuyến được phân công
   │
   ▼
Nhấn "Xác nhận nhận chuyến"
   ├── Nếu xe đủ tải → xác nhận bình thường
   └── Nếu xe thiếu khách → nhập lý do (low_occupancy_reason)
   │
   ▼
Thực hiện chuyến → nhấn "Hoàn thành chuyến"
   │
   ▼
Booking → completed, Driver → active, Vehicle → completed
```

---

## 4. Luồng tài xế tự tạo chuyến

Tài xế có thể chủ động tạo booking khi họ đang có khách nhưng chưa được phân công qua hệ thống.

```
Driver Dashboard → nút "Tạo chuyến"
   │
   ▼
DriverCreateTrip page
   │
   ▼
Nhập thông tin khách hàng + tuyến đường + số khách
   │
   ▼
POST /api/driverTrip/self-booking
   │  booking_source = 'driver'
   │
   ▼
Booking được tạo với TripAssignment liên kết tất xế + xe hiện tại
```

---

## 5. Hệ thống thanh toán MoMo

```
Khách chọn "Chuyển khoản" khi đặt xe
   │
   ▼
POST /api/payments/booking/:id/create-transfer
   │  Backend tạo đơn MoMo và trả về payUrl
   │
   ▼
Khách được redirect đến trang thanh toán MoMo
   │
   ▼
MoMo gọi IPN: POST /api/payments/momo/ipn
   │  Backend xác nhận + cập nhật payment_status = paid_transfer
   │
   ▼
MoMo redirect khách về: GET /api/payments/momo/return
```

---

## 6. Hệ thống đánh giá tài xế

```
Khách vào MyTrips → tìm chuyến đã completed
   │
   ▼
Hiển thị form đánh giá (rating + comment)
   │  - Mỗi booking chỉ đánh giá 1 lần
   │  - Kiểm tra qua GET /api/reviews/booking/:id
   │
   ▼
Gửi đánh giá: POST /api/reviews
   │
   ▼
Hiển thị đánh giá đã gửi (read-only)
```

---

## 7. Ghép chuyến (Carpooling)

Nhân viên có thể ghép nhiều booking vào cùng một Trip (xe lớn như 16, 29, 45 chỗ).

```
Staff chọn booking cần gán
   │
   ▼
GET /api/trips/find-trips/:bookingId
   │  Hệ thống tìm chuyến phù hợp:
   │  - Cùng ngày
   │  - Còn đủ chỗ
   │  - Cùng loại xe
   │
   ▼
Staff chọn chuyến để ghép hoặc tạo chuyến mới
   │
   ▼
POST /api/trips/assign-booking/:tripId
   │  Booking được thêm vào Trip
   │
   ▼
Tất cả khách trong Trip đi cùng một xe + tài xế
```

---

## 8. Polling trạng thái tài xế

Trang DriverDashboard tự động cập nhật trạng thái tài xế mỗi **10 giây**:

```tsx
useEffect(() => {
  pollingIntervalRef.current = setInterval(fetchDriverStatus, 10000);
  return () => clearInterval(pollingIntervalRef.current);
}, [currentDriver, token]);
```

Khi trạng thái thay đổi (active ↔ busy ↔ inactive) → Redux store được cập nhật → Badge hiển thị đúng màu.

---

## 9. Bản đồ Leaflet

BookRide sử dụng **React Leaflet** cho:
- Chọn điểm đón và điểm đến bằng click trên bản đồ
- Hiển thị marker tại 2 điểm
- Vẽ đường thẳng kết nối (polyline)
- Tính khoảng cách Haversine từ coordinates

---

## 10. Responsive Design

- **Desktop:** Sidebar cố định bên trái + nội dung chính bên phải
- **Mobile:** Sidebar ẩn, hamburger menu để mở, bottom navigation

---

## 11. Authentication Flow

```
Đăng nhập thành công
   │
   ▼
Token JWT lưu vào:
   ├── Redux store (runtime)
   └── localStorage (persist qua refresh)
   │
   ▼
Mỗi API call: gửi token qua header Authorization
   │
   ▼
Token hết hạn / invalid → redirect về trang login
```

---

## 12. Thống kê (Biểu đồ Recharts)

**StatsTab (Staff):**
- BarChart: doanh thu theo ngày
- PieChart: tỉ lệ trạng thái đơn hàng
- Số liệu tổng quát: tổng đơn, tổng doanh thu, tổng tài xế, tổng xe

**DriverStats:**
- BarChart: thu nhập theo tháng
- Tổng chuyến, hoàn thành, rating trung bình
