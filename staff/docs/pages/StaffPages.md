# 💻 Pages: Staff Dashboard (Trang Điều Phối)

Trang nội bộ công ty dành cho Nhân viên Quản lý - Routing Protected `/staff-dashboard`. Bắt buộc Token JWT hợp lệ lấy từ Server về.

Giao diện Sidebar (Thanh kéo dọc Menu bên trái) để chuyển Page (Các `Tabs`).

---

## 1. `BookingsTab.tsx` (Trái Tim Hệ Thống Điều Hành)
- Danh sách 100% Đơn khách đổ từ Internet, App Lái Xe, Gọi Số Hotline nhập tay.
- Giao diện Table (Hàng ngang). Cột "Status" thể hiện Badge Màu tuỳ cờ.
- Nút Action đặc quyền: "Xác Nhận Đơn".
- Nút Nâng Cao: **"Ghép Xe / Assign Driver"**.
  -> Mở Modal To (Popup): Đổ 1 mảng dữ liệu xe Đang Rảnh (Xanh Lá), Tài xế Đang Rảnh. Chọn 1 cặp thả vào và Gửi POST Server. Hoàn tất việc điều hành chuyến cá nhân 4/7 chỗ.

## 2. `TripsTab.tsx` (Chuyên Chuyến Xe Bến Khách / 16 Chỗ)
- Tab chuyên biệt. Staff lập Lịch chạy (Ví dụ: "10h sáng xe HN-Sơn La biển 29A...").
- Cấu trúc Card. Staff bấm mở List Khách.
- Logic gán khách: Từ Tab BookingTab, với khách đặt xe 16 chỗ, Staff không ấn Assign Driver mà ấn Find Trip. Bảng này móc Trip vào và Ném Data lên Database thay vì tạo TripAssignment.

## 3. `DriversTab.tsx` & `VehiclesTab.tsx` (Kho Đồ Vật Tư)
- Nơi Data Entry nhập liệu biển số, tạo xe mới (Create Vehicle), Xoá xe ngưng hoạt động. Khởi tạo tài khoản Tài Xế cho lái.
- Hiển thị Cột "Xe Đang Chạy (In-progress)" - Staff bấm vào là gọi ngay số điện thoại.

## 4. `StatsTab.tsx` (Trung tâm biểu đồ Báo Cáo KPI)
- Load thư viện `Recharts`.
- Nhận API Get Aggregate từ DB.
- Trúc x: Số lượng đơn. Trục y: Ngày, Tháng.
- Pie Chart thống kê 50% đơn đang Hủy vì lý do gì, Bao nhiêu phần trăm khách bùng (Không tài xế nhận). Doanh thu tổng. Báo cáo Ban Giám Đốc.
