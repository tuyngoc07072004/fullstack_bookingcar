# 📝 Model: Booking (Đơn Đặt Xe)

## Trách nhiệm chính
`Booking` là trọng tâm của hệ thống, quản lý thông tin đặt xe của khách hàng từ lúc tạo mới cho đến khi hoàn thành hoặc bị huỷ. 
Nó liên kết với `Customer`, `VehicleType`, và cả `Trip` (nếu được ghép vào chuyến xe lớn).

---

## Các Trường Dữ Liệu (Schema Fields)

### Thông tin khách hàng
- `customer_name` (String): Tên người đi xe.
- `customer_phone` (String): Số điện thoại dùng để liên lạc và định danh tra cứu. Truy vấn lịch sử chuyến đi của khách chưa đăng nhập đều phụ thuộc vào số này.
- `customer_email` (String): Email (không bắt buộc) dùng để nhận hoá đơn / thông báo nếu cần.
- `customer_id` (ObjectId -> `Customer`): Tham chiếu đến bảng Khách hàng nếu khách đã có tài khoản (nếu khách lạ sẽ null).

### Hành trình và Điểm đến
- `pickup_location` (String): Địa chỉ điểm đón dạng văn bản (VD: "Sân bay Nội Bài").
- `dropoff_location` (String): Địa chỉ điểm trả dạng văn bản.
- `pickup_coords` / `dropoff_coords` (Object `{ lat, lng }`): Tuạ độ GPS bắt buộc để phòng trường hợp ứng dụng Tài xế cần mở bản đồ định vị chuyến.
- `distance` (Number): Tổng quãng đường tính bằng Kilomet (được tính toán bởi frontend hoặc map API trước khi gửi lên).
- `trip_date` (Date): Ngày giờ khách yêu cầu xe đến đón.

### Thông tin loại xe và Số khách
- `passengers` (Number): Số người đi (VD: 3).
- `seats` (Number): Hạng ghế xe khách đặt (VD: Chọn xe 4 chỗ).
- `vehicle_type_id` (ObjectId -> `VehicleType`): Tham chiếu loại xe trong hệ thống, giúp tính toán giá cước tự động.

### Thanh toán 
- `price` (Number): Giá tiền đã được chốt cho chuyến đi.
- `payment_method` (String): 
  - `cash`: Trả tiền mặt tài xế.
  - `transfer`: Chuyển khoản (MoMo).
- `status` (Enum): Bắt buộc một trong các quy trình:
  - `pending`: Vừa đặt xong, chờ điều phối xác nhận.
  - `confirmed`: Điều phối đã nhận đơn, chờ tìm xe.
  - `assigned`: Đã được gắn cho 1 tài xế/1 xe.
  - `in-progress`: Tài xế đã bấm "Bắt đầu chuyến" hoặc TripAssignment đang chạy.
  - `completed`: Chuyến kết thúc tốt đẹp.
  - `cancelled`: Khách/Điều phối huỷ đơn.

### Mở rộng
- `trip_id` (ObjectId -> `Trip`): Tham chiếu đến id chuyến xe ghép (nếu xe 16/29/45 chỗ có nhiều Booking cùng lúc).
- `booking_source` (Enum): Lưu lại lịch sử đơn được tạo từ đâu (`public` Web Khách / `driver` Tài xế tự bắt khách).

---

## Luồng Hoạt Động Cốt Lõi (Methods)

- **`updateStatus(newStatus)`**: Hàm cập nhật trạng thái đơn đặt xe an toàn. Khi đổi sang `completed`, hàm này sẽ gọi thêm logic cập nhật thông kê thu nhập/chi tiêu vào bảng `Customer`.
- **`cancel(reason)`**: Hàm dùng cho Khách hoặc Nhân viên, nếu đang có xe được gán, hệ thống sẽ tự động tìm bảng `TripAssignment` hoặc `Trip` để gỡ thông tin xe ra.
