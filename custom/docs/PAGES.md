# 📄 Frontend - Các Trang (Pages)

---

## Trang dành cho Khách hàng

### 1. Home — Trang chủ

**File:** `src/pages/Home.tsx`  
**Route:** `/`

Trang landing page giới thiệu dịch vụ đặt xe.

**Nội dung:**
- **Hero section** với ảnh nền fullscreen, tiêu đề và 2 nút CTA:
  - "Đặt Xe Ngay" → `/book-ride`
  - "Lịch Sử Chuyến Đi" → `/my-trips`
- **Features section** (3 tính năng nổi bật):
  - An Toàn Tuyệt Đối
  - Đúng Giờ & Nhanh Chóng
  - Giá Cả Minh Bạch
- **Đội Xe Đa Dạng:** Hiển thị 4 loại xe (9, 16, 29, 45 chỗ) với ảnh và giá tham khảo

---

### 2. BookRide — Đặt xe

**File:** `src/pages/BookRide.tsx`  
**Route:** `/book-ride`

Trang đặt xe chính, bao gồm form nhiều bước với bản đồ tương tác.

**Tính năng:**
- Form đặt xe nhiều bước (multi-step):
  1. Chọn điểm đón / điểm đến trên bản đồ (Leaflet)
  2. Chọn ngày giờ, số hành khách
  3. Chọn loại xe (4/7/9/16/29/45 chỗ)
  4. Tính giá tự động dựa trên khoảng cách + loại xe + số khách
  5. Nhập thông tin cá nhân (tên, SĐT, email)
  6. Chọn phương thức thanh toán (tiền mặt / chuyển khoản MoMo)
- Tính khoảng cách thực tế bằng Haversine
- Hiển thị bảng tính giá chi tiết
- Tích hợp Google AI để gợi ý địa chỉ (nếu cấu hình)

---

### 3. Confirmation — Xác nhận đặt xe

**File:** `src/pages/Confirmation.tsx`  
**Route:** `/confirmation`

Trang hiển thị sau khi đặt xe thành công.

**Nội dung:**
- Mã đơn hàng
- Thông tin tóm tắt chuyến đi
- Hướng dẫn các bước tiếp theo
- Nút tra cứu trạng thái → `/my-trips`

---

### 4. MyTrips — Lịch sử chuyến đi

**File:** `src/pages/MyTrips.tsx`  
**Route:** `/my-trips`

Khách hàng tra cứu lịch sử chuyến đi bằng số điện thoại.

**Tính năng:**
- Nhập số điện thoại → gọi API `/api/bookings/phone/:phone`
- Validate SĐT Việt Nam (regex)
- Hiển thị danh sách chuyến: trạng thái, điểm đón/đến, giờ, loại xe, giá
- Hiển thị thông tin tài xế & biển số khi đã phân công
- **Đánh giá tài xế** (Rating 1–5 sao + nhận xét) cho chuyến đã hoàn thành
  - Một booking chỉ được đánh giá 1 lần
  - Kiểm tra trạng thái đánh giá qua Redux `DriverReview.Slice`
- Trạng thái thông báo trực quan theo từng giai đoạn chuyến đi

---

## Trang dành cho Nhân viên (Staff)

### 5. StaffLogin — Đăng nhập nhân viên

**File:** `src/pages/Staff/StaffLogin.tsx`  
**Route:** `/staff-login`

Form đăng nhập nhân viên với username và password.

---

### 6. StaffRegister — Đăng ký nhân viên

**File:** `src/pages/Staff/StaffRegister.tsx`  
**Route:** `/staff-register`

Form đăng ký tài khoản nhân viên mới (name, phone, email, username, password).

---

### 7. StaffDashboard — Bảng điều khiển nhân viên

**File:** `src/pages/Staff/StaffDashboard.tsx`  
**Route:** `/staff-dashboard`

Dashboard chính của nhân viên với sidebar điều hướng và 6 tab quản lý:

| Tab | ID | Mô tả |
|-----|----|-------|
| Đơn Hàng | `bookings` | Xem và quản lý toàn bộ đơn đặt xe |
| Thanh Toán | `payments` | Theo dõi trạng thái thanh toán |
| Tài Xế | `drivers` | Quản lý danh sách tài xế |
| Xe | `vehicles` | Quản lý đội xe |
| Khách Hàng | `customers` | Xem thông tin khách hàng |
| Thống Kê | `stats` | Biểu đồ doanh thu và thống kê |

**Chức năng dashboard:**
- Kiểm tra xác thực (JWT/localStorage)
- Hiển thị tên nhân viên đang đăng nhập
- Responsive: sidebar trên desktop, menu hamburger trên mobile
- Phân công tài xế qua modal `AssignmentModal`
- Xem chi tiết khách hàng qua modal

---

### 8. BookingsTab — Tab quản lý đơn hàng

**File:** `src/pages/Staff/BookingsTab.tsx`

Quản lý toàn bộ đơn đặt xe.

**Tính năng:**
- Hiển thị danh sách đơn hàng theo thời gian thực
- Lọc theo trạng thái (pending, confirmed, assigned, in-progress, completed, cancelled)
- Tìm kiếm theo tên, SĐT, địa chỉ
- Xác nhận đơn hàng
- Phân công tài xế + xe (mở modal)
- Tìm chuyến ghép phù hợp
- Xem chi tiết đơn hàng

---

### 9. VehiclesTab — Tab quản lý xe

**File:** `src/pages/Staff/VehiclesTab.tsx`

Quản lý đội phương tiện.

**Tính năng:**
- CRUD xe (thêm, sửa, xóa, cập nhật trạng thái)
- Hiển thị danh sách xe với trạng thái (ready / not_started / completed)
- Lọc theo loại xe, trạng thái
- Xem tỉ lệ chiếm dụng chỗ ngồi

---

### 10. DriversTab — Tab quản lý tài xế

**File:** `src/pages/Staff/DriversTab.tsx`

Quản lý tài xế.

**Tính năng:**
- Xem danh sách tài xế với trạng thái hoạt động
- Tìm kiếm tài xế
- Lọc theo trạng thái (active / inactive / busy)
- Cập nhật trạng thái tài xế

---

### 11. CustomersTab — Tab quản lý khách hàng

**File:** `src/pages/Staff/CustomersTab.tsx`

Xem thông tin khách hàng và lịch sử đặt xe.

**Tính năng:**
- Danh sách khách hàng với tổng số chuyến và tổng chi tiêu
- Xem chi tiết lịch sử đặt xe của từng khách

---

### 12. PaymentsTab — Tab quản lý thanh toán

**File:** `src/pages/Staff/PaymentsTab.tsx`

Theo dõi trạng thái thanh toán.

**Tính năng:**
- Danh sách thanh toán (tiền mặt / MoMo)
- Trạng thái: pending / paid_cash / paid_transfer
- Xác nhận nhận tiền mặt

---

### 13. StatsTab — Tab thống kê

**File:** `src/pages/Staff/StatsTab.tsx`

Dashboard thống kê hệ thống với biểu đồ Recharts.

**Tính năng:**
- Biểu đồ doanh thu theo ngày/tuần
- Số đơn hàng theo trạng thái
- Số xe và tài xế đang hoạt động
- Thống kê tổng quan (total bookings, revenue, drivers, vehicles)

---

## Trang dành cho Tài xế (Driver)

### 14. DriverLogin — Đăng nhập tài xế

**File:** `src/pages/Driver/DriverLogin.tsx`  
**Route:** `/driver-login`

Form đăng nhập với username và password.

---

### 15. DriverRegister — Đăng ký tài xế

**File:** `src/pages/Driver/DriverRegister.tsx`  
**Route:** `/driver-register`

Form đăng ký tài xế mới (name, phone, license_number, username, password).

---

### 16. DriverDashboard — Bảng điều khiển tài xế

**File:** `src/pages/Driver/DriverDashboard.tsx`  
**Route:** `/driver-dashboard`

Dashboard cá nhân của tài xế.

**Tính năng:**
- Hiển thị thông tin tài xế + badge trạng thái (active / busy / inactive)
- Polling tự động mỗi 10 giây để cập nhật trạng thái
- 4 thẻ thống kê: Tổng Chuyến, Thu Nhập, Đánh Giá, Hoàn Thành
- 4 tab:
  - **Chuyến Hiện Tại**: Các chuyến đang chờ xác nhận hoặc đang thực hiện
  - **Lịch Sử**: Các chuyến đã hoàn thành hoặc hủy
  - **Thống Kê**: Biểu đồ thu nhập, hiệu suất
  - **Đánh Giá**: Danh sách nhận xét từ khách
- Animation chuyển tab bằng Motion
- Nút tạo chuyến mới → `/driver/create-trip`

---

### 17. DriverCreateTrip — Tài xế tạo chuyến

**File:** `src/pages/Driver/DriverCreateTrip.tsx`  
**Route:** `/driver/create-trip`

Tài xế tự tạo booking khi chủ động đón khách.

**Tính năng:**
- Form nhập thông tin khách hàng
- Chọn tuyến đường trên bản đồ
- Chọn xe đang gắn với tài xế
- Tính giá tự động
- Tạo BookingSource = `driver`

---

### 18. TripCard — Card thông tin chuyến

**File:** `src/pages/Driver/TripCard.tsx`

Component card hiển thị chi tiết một chuyến đi cho tài xế.

**Tính năng:**
- Thông tin đón/trả, giờ, số khách, giá
- Nút **Xác nhận nhận chuyến** (với form lý do nếu chở ít khách)
- Nút **Hoàn thành chuyến**
- Hiển thị trạng thái thanh toán (tiền mặt / MoMo)
- Hiển thị thông tin xe đang gắn

---

### 19. DriverStats — Thống kê tài xế

**File:** `src/pages/Driver/DriverStats.tsx`

Biểu đồ và số liệu thống kê cá nhân của tài xế.

---

### 20. DriverReviewsList — Danh sách đánh giá

**File:** `src/pages/Driver/DriverReviewsList.tsx`

Hiển thị tất cả đánh giá mà tài xế nhận được từ khách hàng.

---

### 21. TripHistory — Lịch sử chuyến

**File:** `src/pages/Driver/TripHistory.tsx`

Danh sách chuyến đã hoàn thành/hủy, cho phép lọc theo nguồn (do staff phân công / tự tạo).
