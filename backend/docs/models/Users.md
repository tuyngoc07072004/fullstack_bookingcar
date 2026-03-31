# 🪪 Model: System Users (Tài Khoản)

Hệ thống lưu trữ 3 dạng thực thể đối tượng Con Số / Người dùng khác nhau hoàn toàn: `Staff`, `Driver`, và `Customer`. Thiết kế này để đảm bảo phân quyền và cơ sở thông tin bảo mật ở 3 vùng chứa độc lập (Table/Collection khác nhau).

---

## 1. Schema: Staff (Nhân Viên / Điều Phối)

Người cầm quyền vận hành toàn bộ luồng hoạt động phía sau Dashboard.

- **`username` & `password`**: Lưu độc quyền, password luôn dùng `select: false` trong Schema để tránh lộ trong API gọi chung, sử dụng thư viện `bcrypt.js` để mã hoá 10 rounds muối (salt).
- `name` / `phone` / `email`: Thông tin cá nhân.
- `role`: (`staff` / `admin`). Hiện tại hệ thống không phân biệt rõ ràng nhưng tương lai Admin có quyền xóa tài khoản của Staff.
- `status`: (`active` / `inactive`). Nếu một nhân viên nghỉ việc, chuyển về inactive lúc này họ sẽ không thể gọi Login API lấy token.

---

## 2. Schema: Driver (Tài Xế)

Bao gồm người trực tiếp chạy chuyến xe, được theo dõi trên app DriverDashboard.

- **`username` & `password`**: Cách hoạt động như Auth của Staff.
- `name` / `phone`: Phone dùng để hệ thống SMS tự động nếu có.
- `license_number`: Bắt buộc điền bằng lái để khai báo, mỗi tài xế là độc nhất.
- `status`: Siêu quan trọng trong Logic tìm kiếm tài xế trống:
  - `active`: Đang sẵn sàng nhận chuyến từ điều phối (màu xanh lá).
  - `busy`: Đang cầm vô lăng của Assignment/Trip nào đó. Điều phối không thể đẩy tiếp (màu cam).
  - `inactive`: Tài xế cúp máy tắt máy nghỉ ăn trưa, về nhà (màu xám).
- `current_vehicle_id`: Khi nhận chuyến, xe đó được đánh dấu liên kết thẳng vào thông tin Tài xế (để hiển thị App Tài Xế tôi đang lái biển số mấy cho dễ nhìn).

---

## 3. Schema: Customer (Khách Hàng Cuối)

Hệ thống có thể cho phép khách ngoài truy cập Booking mà không bắt buộc tạo tài khoản ngay từ đầu (Guest Checkout), bằng cách dựa vào số điện thoại nhập trong form. 

Tuy nhiên, với khách hàng trung thành, hệ thống lưu trữ như sau:

- Định danh: Bắt buộc không thông qua User ID mà luôn Query theo cụm `customer_phone` để làm khoá chính tìm lịch sử.
- `total_trips` (Number): Số chuyến xe Khách đã đặt (để làm phần thưởng xếp hạng).
- `total_spent` (Number): Tổng số tiền Khách đã tiêu. Được cập nhật liên tục qua hàm `updateTotal` mỗi khi trạng thái Booking đổi sang Done.
