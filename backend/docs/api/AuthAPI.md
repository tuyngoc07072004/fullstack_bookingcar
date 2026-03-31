# 🔐 API: Authentication & Users (Xác Thực Bảo Mật)

Bảo mật của hệ thống được thực hiện bằng JSON Web Token (JWT), lưu trữ Session ở Frontend và quản lý Role dựa trên các Secret Key của NodeJS. Trạng thái mã hoá mật khẩu trước khi đưa vào Database bằng BCrypt JS.

Tại đây có 3 dòng API hoàn toàn độc lập cho 3 đối tác:

## 1. 👮 Staff Auth (Nhân viên Điều phối)

Prefix: `/api/staff`

Khối hệ thống yêu cầu tài khoản phải tồn tại trước.

- **`POST /api/staff/register`** 
  - Đăng ký nhân viên nội bộ (Tên thật, số điện thoại, usename, pass, email).
  - Yêu cầu cấu hình role admin nếu muốn thực thi (hiện tạo miễn phí).
- **`POST /api/staff/login`** 
  - (Params: `username`, `password`). 
  - Xác thực bằng bcrypt Hash => Khởi tạo jwt signPayload `{ id, role: "staff" }`.
  - Trả về Token kèm thông tin user trong Data Res.
- **`POST /api/staff/logout`** 
  - Frontend gọi để xóa Cokie/Session lưu trữ nếu cần (Hiên backend chèn logic cookie xoá Token).
- **`GET /api/staff/me`** 
  - Endpoint Protected (Cần Role Staff & Token Hợp lệ). Trả về Profile đang đăng nhập.

---

## 2. 🪪 Driver Auth (Tài xế Lái Xe)

Prefix: `/api/driver`

Quy trình quản lý vòng đời tài khoản gắn với App Mobile của Tài xế lái xe:

- **`POST /api/driver/driver-register`** 
  - Khởi tạo tài khoản, bao gồm bằng lái xe bắt buộc (`license_number`).
  - Mặc định trạng thái là `inactive` thay vì `active`. Chờ KYC tại văn phòng nếu cần.
- **`POST /api/driver/driver-login`** 
  - `phone` / `username` auth.
  - Phân Token mang Payload Role "Driver" khác biệt hoàn toàn với "Staff".
  - Một JWT Token của Driver không thể trỏ gửi GET lên Route của Staff (bị Filter 403 Forbidden chặn).
- **`GET /api/driver/me`** 
  - Frontend App gọi mỗi khi load ứng dụng để verify Redux Store.

--- 

## 3. 👥 Quản lý Khách Hàng (Dành cho Staff)

Prefix: `/api/staffListCustomers` 

Hệ thống điều phối viên có thể nhìn vào tổng quan người dùng theo API này mà Không yêu cầu Khách cần Auth (Bằng số điện thoại Guest Checkout).

- **`GET /customers`**
  - Group By SQL Query (Mongoose Aggregate) lấy toàn bộ kho số điện thoại đã từng đặt xe trên WebApp. 
  - Xuất ra `total_trips` và `total_spent` xếp hạng khách hàng.
- **`GET /customers/:customerId/bookings`**
  - Staff ấn vào để xem ông khách này đã đặt bao nhiêu chuyến vào những ngày nào trong lịch sử đời mình.
