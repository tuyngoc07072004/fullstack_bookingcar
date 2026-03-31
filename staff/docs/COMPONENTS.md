# 🧩 Frontend - Components Dùng Chung

**Thư mục:** `src/components/`

---

## 1. Header.tsx

Header toàn cục hiển thị trên tất cả các trang public (Home, BookRide, MyTrips, Confirmation).

**Nội dung:**
- Logo và tên ứng dụng
- Navigation links: Trang Chủ, Đặt Xe, Lịch Sử
- Responsive: hamburger menu trên mobile

---

## 2. Footer.tsx

Footer toàn cục phía dưới cùng.

**Nội dung:**
- Thông tin công ty
- Links nhanh (Trang chủ, Đặt xe, Lịch sử)
- Thông tin liên hệ
- Copyright

---

## 3. Sidebar.tsx

Sidebar dọc dành cho **StaffDashboard**.

**Props:**

| Prop | Kiểu | Mô tả |
|------|------|-------|
| `activeTab` | string | Tab đang được chọn |
| `onTabChange` | function | Callback khi đổi tab |
| `isOpen` | boolean | Mở/đóng trên mobile |
| `onClose` | function | Callback đóng sidebar |
| `staffInfo` | object | Thông tin nhân viên |
| `onLogout` | function | Callback đăng xuất |

**Các menu item:**
- Đơn Hàng
- Thanh Toán
- Tài Xế
- Xe
- Khách Hàng
- Thống Kê

---

## 4. Modals.tsx

Chứa các modal popup dùng chung trong StaffDashboard.

### ViewBookingModal

Modal xem chi tiết đơn hàng.

**Props:**
- `booking` — Thông tin đơn hàng
- `onClose` — Đóng modal

**Nội dung:**
- Thông tin khách hàng
- Thông tin chuyến đi (điểm đón/trả, thời gian, loại xe)
- Trạng thái đơn
- Thông tin tài xế và xe đã phân công (nếu có)

### AssignmentModal

Modal phân công tài xế và xe cho một đơn hàng.

**Props:**
- `booking` — Đơn hàng cần phân công
- `drivers` — Danh sách tài xế
- `vehicles` — Danh sách xe
- `occupancy` — Thông tin ghế đã dùng
- `assignment` — State lựa chọn hiện tại
- `setAssignment` — Setter
- `onAssign` — Callback khi xác nhận
- `onClose` — Đóng modal

**Tính năng:**
- Dropdown chọn tài xế (lọc theo trạng thái active)
- Dropdown chọn xe (lọc theo loại xe phù hợp)
- Hiển thị thông tin chiếm dụng ghế theo ngày

---

## 5. ProtectedRoute.tsx

HOC bảo vệ các trang cần đăng nhập.

**Cơ chế:**
- Kiểm tra token trong localStorage / Redux store
- Nếu chưa đăng nhập → redirect đến trang login tương ứng
- Hiển thị loading spinner khi đang kiểm tra auth

---

## 6. Common.tsx

Một số component nhỏ tái sử dụng:
- Loading spinner
- Empty state placeholder
- Alert / Notification

---

## 7. InputGroup.tsx

Component wrapper cho input field với label.

**Props:**
- `label` — Nhãn input
- `children` — Input element

Dùng để đồng nhất style form trên toàn app.
