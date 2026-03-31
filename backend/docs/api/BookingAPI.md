# 📡 API: Bookings (Điều Phối Đơn Xe)

Đây là Core API Route xử lý toàn bộ logic gửi thông tin đặt xe, thay đổi tình trạng vé, phân công chuyến từ xa. Dữ liệu Request gửi tại các API này đều phải theo sát chuẩn Schema `Booking`.

Được tách ra thành 2 Module Router:

---

## 1. 🌐 Public Booking API (Khách Vãng Lai)

Prefix: `/api/bookings`

Website mở cửa tự do HTTP Post không yêu cầu Authentication, nên luồng gọi mở khoá Cors Header trên Express Server.

- **`POST /`**
  - **Payload Data**: `customer_name`, `phone`, `pickup_coords/location`, `dropoffs...`, `distance`, `passengers`, `trip_date`, `payment_method`, `vehicle_type_id`.
  - **Workflow**: Ghi một bảng ghi `pending` hoàn toàn mới.
  - Sau khi lưu, kiểm tra `payment_method`:
    - Nếu `cash`: Trả về JSON Result `{ success: true, booking: Data }`.
    - Nếu `transfer`: Chưa cần tạo MoMo ở đây, Frontend chuyển sang Gateway MoMo sau.
    
- **`POST /calculate-price`**
  - Tính toán giá tiền trực tiếp.
  - Nhập vào `distance` và `vehicle_type_id`.
  - Backend mở `VehicleType`, lấy `base_fare` và `per_km_rate`. Bắn phép nhân chia trả về `price` (có cấu hình làm tròn 1000 VNĐ).

- **`GET /status/:id`** 
  - Trả nhanh chuỗi ký tự ENUM Booking Status để Frontend Loading Screen gọi API 1s/1 lần. (Cho màn hình Confirmation Web Khách).
  
- **`GET /phone/:phone`** 
  - Truy vấn list lịch sử dành cho Web khách vào "Chuyến của tôi" thông qua nhập SĐT xác thực nhanh thay cho Login.

- **`POST /:id/cancel`**
  - Request Body: `{ reason: "..."}`.
  - Bắt buộc phải là đơn chưa hoàn thành (`pending` hoặc `confirmed`).
  - Giao tiếp với Module Phân Công huỷ bảng `TripAssignment` gỡ tài xế đó về lại Trạng thái Đang Chờ Việc, ném Notification.

---

## 2. 🎛️ Staff Booking Management API (Điều Phối Viên)

Prefix: `/api/staff/bookings` (Protected: `Role = Staff`)

Chỉ có điều phối viên đã login (Bearer Token Auth) mới có quyền gọi các tuyến đường này để duyệt.

- **`GET /`** 
  - Lấy tất cả Đơn hàng kèm thông tin Khách (Paginated mặc định trang đầu), có Populate Filter theo Trạng Thái (VD: `status=pending`).
  
- **`GET /stats`** 
  - Aggregate gom nhóm Status thành các Pie Chart. (VD: "Pending: 5", "Assigned: 10", "Done: 40").
  
- **`PATCH /:id/confirm`** 
  - Staff bấm "Xác Nhận Đơn". 
  - Booking chuyển cờ từ `pending` lên `confirmed`. Khách hàng trên trang Loading nhìn thấy màu thay đổi nhấp nháy chuyển qua trạng thái đang đợi xe.

- **`POST /:id/assign`** 
  - **Sự Kiện Quan Trọng Nhất Hệ Thống:**
  - Nhận vào Body: `{ driver_id, vehicle_id }`.
  - Đọc `Booking`, thấy loại xe là xe độc lập (VD xe 7 chỗ).
  - Khởi tạo bảng `TripAssignment`. Gắn id xe, id tài, id staff đang đăng nhập tạo lệnh.
  - Kéo bảng `Booking` sang trạng thái `assigned`. Kéo bảng thẻ `Vehicle` tắt sang `not_started`. Báo cho `Driver` thành `busy`.
  - Socket / Push Notification bắn app tài xế báo hiệu CÓ CUỐC MỚI, VUI LÒNG ĐẾN ĐIỂM ĐÓN ... (App hiển thị chớp tắt trên đth tài xế).
