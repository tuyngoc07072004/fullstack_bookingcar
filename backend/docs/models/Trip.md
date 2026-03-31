# 🚐 Model: Trip & TripAssignment (Cuốc Xe Hiện Tại)

Luồng phân công chuyến khá phức tạp, tuỳ thuộc vào việc khách đặt xe bé (4/7 chỗ - xe độc quyền chỉ chở bản thân) hay đặt xe lớn (16/29/45 chỗ - xe ghép, chạy theo tuyến).

Hệ thống cung cấp hai collection lớn để quản lý việc này.

---

## 1. Schema: Trip (Dùng để Ghép Khách)

`Trip` quản lý các loại xe cỡ lớn chạy tuyến chung cố định (ví dụ Sài Gòn - Vũng Tàu). Một `Trip` sẽ chứa NHIỀU `Booking`.

- `trip_code` (String - unique): Mã định danh dễ đọc (VD: TRP-20231012).
- `vehicle_id` (ObjectId -> `Vehicle`): Chiếc xe được đăng ký chạy.
- `driver_id` (ObjectId -> `Driver`): Tài xế cầm lái chuyến.
- `staff_id` (ObjectId -> `Staff`): Điều phối viên đã đóng gói "Trip" này.
- `departure_time` (Date): Giờ xuất bến.
- `total_passengers` (Number): Tổng số khách đã gộp. Bằng tổng `booking.passengers` đang có trong mảng.
- `max_passengers` (Number): Lấy từ số ghế loại xe, dùng để kiểm tra chống nhồi nhét.
- `pickup_points` / `dropoff_points` (Array): Lưu tổng hợp toàn bộ điểm đón và trả của tất cả khách để Tài xế xem danh sách thứ tự trả bài trên một đường đi tuyến.
- `bookings` (Array của ObjectId): Danh sách từng khách hàng tham gia chuyến.
- `status` (`scheduled`, `assigned`, `in-progress`, `completed`...): Trạng thái bản thân của cả luồng chuyến đi chung.

### Các hàm hỗ trợ
- **`findAvailableSeats()` (Virtual)**: Tự động trừ lấy `max_passengers` trừ đi `total_passengers`.
- **`addBooking(bookingId)`**: Nạp thêm khách vào.
- **`removeBooking(bookingId)`**: Rút túi khách ra, trả lại khoảng trống bằng `seats`.

---

## 2. Schema: TripAssignment (Dùng cho xe 4/7 chỗ)

Thay vì gộp nhiều Booking, đối với xe cá nhân riêng, 1 Booking chỉ có 1 Assignment (1 khách tương ứng 1 xe 1 tài xế độc quyền).

- `booking_id` (ObjectId -> `Booking`): Map trực tiếp 1-1.
- `driver_id` (ObjectId): Map tài xế.
- `vehicle_id` (ObjectId): Map phương tiện.
- `driver_confirm` (Boolean/Int): Xác nhận từ Mobile/Web của Tài xế (`0` - chưa nhận, `1` - đã nhận chuyến).
- `assignment_source` (String): Ai là người chia việc (`staff` - điều phối app chia, `driver` - tài xế thấy dọc đường nên tự gán xe).
- `start_time` / `end_time` (Date): Bấm thời gian di chuyển thực tế.

### Luồng Hoạt Động (Post-save Hooks)
Khi 1 dòng DB `TripAssignment` được hệ thống lưu:
1. Nó tự kích hoạt Hook Pre/Post.
2. Tìm con `Driver` đổi cờ status sang `busy`.
3. Tìm `Booking` gốc đổi cờ sang `assigned`.
4. Tìm `Vehicle` gốc đổi trạng thái xe đang được dùng cấm được điều phối cho chuyến khác.
