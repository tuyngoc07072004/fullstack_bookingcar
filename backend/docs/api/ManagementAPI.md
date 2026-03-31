# 🏢 API: Management (Quản Lý Tài nguyên)

Tất cả các tuyến Controller này đảm nhiệm chức năng CRUD (Thêm Sửa Xoá Tra Cứu) dữ liệu vật lý và nhân sự cho Dashboard của Staff/Admin.

---

## 1. 🚙 Quản Lý Phương Tiện (Vehicle)

Prefix: `/api/vehicles` 

- **`GET /stats`** 
  - Trả về số lượng tổng xe, số bị khoá, số rảnh rỗi.
- **`GET /` & `GET /search`**
  - Bảng Data Table của Vehicle Manager.
  - Hỗ trợ lấy theo `status` hoặc Phân Trang Pagination.
- **`GET /seats/:seats`**
  - Mốc cực dùng lúc Nhân viên chia cuốc xe. 
  - *Ví dụ:* Điều phối cần vứt chuyến cho khách (3 người) -> Query API lấy danh sách loại bằng cách Gửi req `/seats/4`. API lọc toàn bộ xe 4 chỗ và kèm thêm Điều Kiện: `status=ready` (Không gọi xe đang hỏng máy hay xe dang bận vào danh sách dropdown).
- **`POST /`**
  - Nhập hàng (Thêm xe vào kho). Payload: `vehicle_name`, `license_plate`, `seats`.
- **`PATCH /:id/status`**
  - Admin bấm nút (Ngắt hoạt động cái xe này - VD: "Đem đi bảo trì thay Dầu Máy"). Đổi sang trạng thái ngắt khóa không thể gán khách được nữa.
- **`DELETE /:id`**
  - Xoá xe khỏi hệ thống. Thường chặn bằng Ràng buộc xoá mềm (Soft Delete) nếu chiếc xe đó có lịch sử Booking.

---

## 2. 👥 Quản Lý Tài Xế (Driver Management)

Prefix: `/api/staff/drivers` (Protected: `Role=Staff`)

Chỉ một danh sách danh mục (Catalog) cung cấp cho phần quản trị viên Dashboard. Khác với luồng (Driver App) của riêng tài xế ở `DriverAPI`.

- **`GET /drivers`** & **`GET /drivers/search`**
  - Chức năng: Đổ dữ liệu Table Dashboard (Có Search Tên/SDT) trang Quản lý Nhân sự Lái Xe.
- **`GET /drivers/status/:status`**
  - Endpoint mà Tab Dispatch Điều Phối cần liên tục: "Lọc tất cả Tài xế ĐANG RẢNH (Active) ở Gara để tôi thả cuốc này đi ăn trưa".
- **`PUT /drivers/:id/status`**
  - Admin kỷ luật tài xế: Chuyển cờ Driver về dạng `Inactive` -> Driver đó bị Force Logout, xoá Cokie Session ép phải ra quầy làm việc.

---

## 3. 👤 Quản Lý Khách Hàng Thân Thiết (Customers)

Prefix: `/api/staffListCustomers/customers`

- **`GET /`**
  - Đổ thống kê Danh sách ID Khách VIP dựa trên `total_spent` và `total_trips`.
- **`GET /:id/bookings`**
  - Lấy lịch sử chi tiết cho Customer Care / CS Check lại khi khách phàn nàn giá không đúng hôm qua.
