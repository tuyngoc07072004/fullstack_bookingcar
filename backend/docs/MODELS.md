# 🗄️ Backend - Models (Cơ sở dữ liệu)

Hệ thống sử dụng **MongoDB** với **Mongoose**. Dưới đây là toàn bộ các collection và schema.

---

## 1. Booking (Đơn đặt xe)

**File:** `src/models/Booking.models.js`

Schema lưu trữ thông tin một lượt đặt xe của khách hàng.

### Các trường chính

| Trường | Kiểu | Mô tả |
|---|---|---|
| `customer_name` | String | Tên khách hàng |
| `customer_phone` | String | Số điện thoại (dùng để tra cứu) |
| `customer_email` | String | Email (không bắt buộc) |
| `customer_id` | ObjectId → Customer | Liên kết khách hàng đã đăng ký |
| `pickup_location` | String | Địa chỉ đón |
| `dropoff_location` | String | Địa chỉ đến |
| `pickup_coords` | `{lat, lng}` | Toạ độ điểm đón |
| `dropoff_coords` | `{lat, lng}` | Toạ độ điểm đến |
| `distance` | Number | Khoảng cách (km) |
| `trip_date` | Date | Ngày giờ khởi hành |
| `passengers` | Number | Số hành khách |
| `seats` | Number | Số chỗ xe (4/7/9/16/29/45) |
| `vehicle_type_id` | ObjectId → VehicleType | Loại xe được chọn |
| `price` | Number | Giá chuyến (VNĐ) |
| `payment_method` | `cash` \| `transfer` | Phương thức thanh toán |
| `status` | Enum | Trạng thái đơn hàng |
| `trip_id` | ObjectId → Trip | Chuyến ghép (nếu có) |
| `booking_source` | `public` \| `driver` | Nguồn tạo đơn |

### Trạng thái (status)

```
pending     → Chờ xác nhận
confirmed   → Đã xác nhận
assigned    → Đã phân công tài xế
in-progress → Đang thực hiện
completed   → Hoàn thành
cancelled   → Đã hủy
```

### Virtual fields

- `status_text` — Trạng thái dạng văn bản tiếng Việt
- `payment_method_text` — Phương thức thanh toán tiếng Việt
- `formatted_date` — Ngày giờ định dạng vi-VN
- `can_cancel` — Có thể hủy không (`pending` / `confirmed`)
- `can_assign` — Có thể phân công không
- `can_complete` — Có thể hoàn thành không

### Methods

- `updateStatus(newStatus)` — Cập nhật trạng thái, tự động cập nhật stats khách hàng
- `cancel(reason)` — Hủy đơn, giải phóng phân công nếu có

---

## 2. Trip (Chuyến ghép)

**File:** `src/models/Trip.models.js`

Một Trip là một chuyến xe chứa nhiều Booking (ghép khách).

### Các trường chính

| Trường | Kiểu | Mô tả |
|---|---|---|
| `trip_code` | String | Mã chuyến (duy nhất) |
| `vehicle_id` | ObjectId → Vehicle | Xe được phân công |
| `driver_id` | ObjectId → Driver | Tài xế phụ trách |
| `staff_id` | ObjectId → Staff | Nhân viên tạo chuyến |
| `route` | String | Mô tả lộ trình |
| `pickup_points` | Array | Danh sách điểm đón |
| `dropoff_points` | Array | Danh sách điểm trả |
| `departure_time` | Date | Giờ khởi hành |
| `total_passengers` | Number | Tổng hành khách hiện tại |
| `max_passengers` | Number | Tối đa hành khách (theo loại xe) |
| `status` | Enum | Trạng thái chuyến |
| `bookings` | Array | Danh sách các booking trong chuyến |

### Trạng thái

```
scheduled   → Đã lên lịch
assigned    → Đã phân công
in-progress → Đang thực hiện
completed   → Hoàn thành
cancelled   → Đã hủy
```

### Virtual fields

- `available_seats` — Số ghế còn trống
- `has_available_seats` — Còn ghế không

### Methods

- `addBooking(booking, staffId)` — Thêm booking vào chuyến, cập nhật pickup/dropoff points
- `removeBooking(bookingId)` — Xóa booking, hoàn lại ghế

---

## 3. TripAssignment (Phân công chuyến)

**File:** `src/models/TripAssignment.models.js`

Ghi lại thông tin phân công tài xế + xe cho một Booking cụ thể.

### Các trường chính

| Trường | Kiểu | Mô tả |
|---|---|---|
| `booking_id` | ObjectId → Booking | Đơn đặt xe |
| `driver_id` | ObjectId → Driver | Tài xế được phân công |
| `vehicle_id` | ObjectId → Vehicle | Xe được phân công |
| `staff_id` | ObjectId → Staff | Nhân viên thực hiện phân công |
| `assignment_source` | `staff` \| `driver` | Ai phân công |
| `driver_confirm` | 0 \| 1 | Tài xế đã xác nhận chưa |
| `start_time` | Date | Thời gian bắt đầu chuyến |
| `end_time` | Date | Thời gian kết thúc chuyến |

### Virtual fields

- `full_status` — Trạng thái đầy đủ: Chờ xác nhận / Đã xác nhận / Đang thực hiện / Đã hoàn thành
- `duration_hours` / `duration_minutes` — Thời lượng chuyến đi
- `is_completed` / `is_in_progress` / `is_confirmed` — Các flag trạng thái

### Methods

- `startTrip()` — Bắt đầu chuyến: set start_time, chuyển booking → `in-progress`, driver → `busy`
- `endTrip()` — Kết thúc: set end_time, booking → `completed`, driver → `active`
- `confirmByDriver()` — Tài xế xác nhận nhận chuyến
- `removeAssignment()` — Xóa phân công, giải phóng tài xế và xe

### Post-save middleware

Tự động sau khi tạo phân công:
- Booking → `assigned`
- Driver → `busy`, gắn `current_vehicle_id`
- Vehicle → `not_started` (nếu đang `ready`)

---

## 4. Driver (Tài xế)

**File:** `src/models/Driver.models.js`

| Trường | Mô tả |
|---|---|
| `name` | Tên tài xế |
| `phone` | Số điện thoại (unique) |
| `license_number` | Số bằng lái (unique) |
| `username` | Tên đăng nhập (unique) |
| `password` | Mật khẩu (select: false) |
| `status` | `active` / `inactive` / `busy` |
| `current_vehicle_id` | Xe đang gắn với tài xế |

---

## 5. Vehicle (Phương tiện)

**File:** `src/models/Vehicle.models.js`

| Trường | Mô tả |
|---|---|
| `vehicle_name` | Tên xe |
| `license_plate` | Biển số (unique, uppercase) |
| `seats` | Số chỗ: 4/7/9/16/29/45 |
| `vehicle_type_id` | Loại xe tương ứng |
| `status` | `ready` / `not_started` / `completed` |

Pre-save middleware tự động gán `vehicle_type_id` dựa trên số ghế.

---

## 6. Staff (Nhân viên)

**File:** `src/models/Staff.models.js`

| Trường | Mô tả |
|---|---|
| `name` | Tên nhân viên |
| `phone` | Số điện thoại (unique) |
| `email` | Email (unique) |
| `username` | Tên đăng nhập (unique) |
| `password` | Mật khẩu (select: false) |
| `role` | `staff` / `admin` |
| `status` | `active` / `inactive` |

---

## 7. Payment (Thanh toán)

**File:** `src/models/Payment.models.js`

| Trường | Mô tả |
|---|---|
| `booking_id` | Đơn đặt xe (unique) |
| `payment_method` | `cash` / `transfer` |
| `payment_status` | `pending` / `paid_cash` / `paid_transfer` |
| `amount` | Số tiền (VNĐ) |
| `paid_at` | Thời gian thanh toán |
| `momo_order_id` | Mã đơn MoMo |
| `momo_trans_id` | Mã giao dịch MoMo |
| `confirmed_by_staff_id` | Nhân viên xác nhận tiền mặt |
| `confirmed_by_driver_id` | Tài xế xác nhận tiền mặt |

---

## 8. DriverReview (Đánh giá tài xế)

**File:** `src/models/DriverReview.models.js`

| Trường | Mô tả |
|---|---|
| `booking_id` | Đơn đặt xe được đánh giá (unique) |
| `driver_id` | Tài xế được đánh giá |
| `customer_id` | Khách hàng đánh giá |
| `customer_name` | Tên khách |
| `rating` | Số sao (1–5) |
| `comment` | Nhận xét (tối đa 500 ký tự) |

---

## 9. VehicleType (Loại xe)

**File:** `src/models/VehicleType.models.js`

Bảng master định nghĩa các loại xe theo số chỗ (4, 7, 9, 16, 29, 45 chỗ).

---

## 10. Customer (Khách hàng)

**File:** `src/models/Customer.models.js`

Khách hàng lưu lại từ thông tin đặt xe. Có `updateStats()` để cập nhật tổng số chuyến và tổng chi tiêu.

---

## Sơ đồ quan hệ

```
Customer ──┐
           ├──> Booking ──> TripAssignment ──> Driver
           │                       │
           │                       └──> Vehicle
           │                       
           └──> DriverReview ──> Driver

Staff ──> TripAssignment / Trip
Trip ──> Booking (nhiều booking trong một trip)
Payment ──> Booking (1-1)
```
