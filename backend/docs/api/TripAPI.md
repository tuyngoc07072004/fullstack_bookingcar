# 🚐 API: Trips (Ghép Chuyến và Điều Hành)

Trip API phục vụ cho Điều Phối Viên (Staff) gộp nhiều đơn khách lẻ (Booking) lên một tuyến xe dài (như xe 16/29 chỗ) và Tài xế (Driver) để nhận lệnh chạy.

---

## 1. 🎛️ Trip Management API (Dành cho Staff)

Prefix: `/api/trips` (Protected: `Role = Staff`)

Staff sẽ tạo tuyến đường và nhét khách liên tục vào đó.

- **`GET /`** 
  - Lấy danh sách toàn bộ chuyến ghép đang chạy (`Trip`).
  
- **`GET /find-trips/:bookingId`** 
  - **Logic Ghép Chuyến thông minh**: Staff ấn vào một Booking của Khách, hệ thống gọi API này. 
  - Backend lọc Database trả về những Trip:
    1. Cùng ngày đi (`trip_date`).
    2. Tổng số khách đang ngồi (total) + số khách muốn lên xe <= `max_passengers` (Xe chưa đầy chỗ trống).
    3. Cùng loại chuyến / loại xe.
    
- **`POST /assign-booking/:id`** 
  - **Payload**: `tripId` (Mã chuyến đi chung), gán vào `bookingId` (Ông khách).
  - Backend: Dùng Object logic, lấy ID khách đó `push` vào mảng `bookings` của Trip. Cộng `total_passengers += booking.passengers`.
  - Nếu thành công, Trạng thái Booking vọt lên `assigned` nhưng không có bảng `TripAssignment` sinh ra vì dữ liệu nằm trực tiếp trong `Trip`.

- **`DELETE /:tripId/bookings/:bookingId`** 
  - Staff đuổi khách (huỷ ghép) khỏi chuyến tuyến. 
  - Rút mảng ra, trừ đi `total_passengers`. Gỡ cờ Booking về `pending`.
  
- **`PATCH /:id/status`** 
  - Đổi cờ toàn tuyến: `scheduled` -> `in-progress` (Khởi hành xuất bến) -> `completed` (Kết thúc chuyến).
  - Tự kích hoạt vòng lặp `for loop` vòng qua tất cả id hành khách đang ngồi trên xe và đổi Booking Status của Khách lên luôn `completed`. Khách thấy cập nhật tức thì.

---

## 2. 🪪 Driver Trip Operations (Dành cho Tài Xế Lái Xe)

Prefix: `/api/driverTrip` (Protected: `Role = Driver`)

API dành riêng cho điện thoại, Tablett, Ứng dụng PWA mà tài xế gắn trên táp-lô ô tô. Không một Staff nào được gọi API này.

- **`GET /status`**
  - Tài xế check mình đang rảnh rỗi (`active`), hay đang chạy xe (`busy`).
  
- **`GET /me/vehicle`**
  - Đọc biển số xe đang lái, số chỗ trống.

- **`GET /:driverId/trips`**
  - Load lịch sử các chuộc xe đã hoàn thành và sắp chạy.

- **`PUT /confirm-trip`**
  - Notification nổ trên App: _"Bạn có cuốc mới"_ -> Driver ngó xem và bấm **"Tôi đã nhận"**.
  - Đổi biến Cờ xác thực từ WebApp/Mobile để báo lại Server là tài xế đã sẵng sàng.

- **`POST /self-booking`**
  - **Tự Bắt Khách Riêng**: Tài xế đang chạy thấy khách vẫy dọc đường. 
  - Mở App tạo "Đơn Nhanh" truyền: `{ price, distance, name, phone,... }`.
  - Backend sinh ra Booking `status=in-progress` + TripAssignment `driver_id=chính mình`, gán `assignment_source='driver'`. Hệ thống Staff chỉ theo dõi, không có quyền can thiệp vào cuốc xe tự phựt tiền này.
  
- **`PUT /complete-trip/:bookingId`**
  - Bấm nút **Kết thúc luồng trên App**.
  - API xử lý:
    - Tìm `Assignment`/`Trip` báo ngắt `end_time = now()`.
    - Trả Tài Xế về Mode xanh `active` (Giải phóng lái).
    - Trả Xe Vay về Mode xanh `ready` (Giải phóng xe, vào gara đợi lượt mưới).
    - Trả Booking Khách về `completed` (Kích hoạt email tính tiền).
