# 📎 Pages: Kế toán, Chăm sóc Khách Hàng & Các Trợ Năng Mở Rộng

Tài liệu này giải thích nốt 5% các màn hình phụ trợ của hệ thống, bao gồm mảng Kế toán dòng tiền, Quản lý Khách thân thiết và Form lý do thất thoát của Lái xe.

---

## 1. 💵 Kế Toán Công Ty (PaymentsTab.tsx)

Nằm trong Sidebar của màn Điều Phối (`StaffDashboard`). Tab `PaymentsTab` cung cấp quyền kiểm soát dòng tiền mặt và ví điện tử, độc lập với Tab Booking.

- **Dữ Liệu Hiển Thị**: Đổ 100% bảng Schema `Payment` (Có filter theo Trạng thái "Pending", "Cash", "Transfer").
- **Nghiệp Vụ Chính**: 
  - Khách đi xe nhưng chọn `Cash` (Tiền mặt trả sau), Tài xế cầm 500k của khách.
  - Cuối ngày Tài xế về Kho nộp 500k cho Kế toán.
  - Kế toán mở bảng này lên, tìm lại mã Code Chuyến đó (Ví dụ: Đơn Nội Bài 500k), nhấn nút xanh lục: **"Xác Nhận Đã Nhận Tiền / Verify Cash"**. 
  - Hệ thống gọi API `PATCH /payments/.../confirm-cash`, đóng dòng nợ lại vĩnh viễn với chữ ký Audit Trial (`confirmed_by_staff_id`).

## 2. 👥 Chăm Sóc Khách Hàng (CustomersTab.tsx)

Tương tự nằm trong Bảng Điều Khiển `StaffDashboard`. Không hỗ trợ tạo chỉnh sửa, chỉ Read-only dữ liệu phân tích.

- Cấu trúc: Form danh sách người dùng được tính toán Real-time bằng Aggregation Query dựa trên số điện thoại (Vì hệ thống hỗ trợ Khách Checkout Tự Do / Guest Checkout).
- Bấm vào Mắt (Xem). Sổ ra 10 chuyến đi mà khách tên Nam sđt 09xx đã đi. Giúp Staff chăm sóc, phát Voucher bù đắp nếu hôm qua Nam bị trễ xe. 

---

## 3. 🚨 Form Báo Cáo Chuyến Rỗng (LowOccupancyForm.tsx)

Đây là 1 Modal Component nhỏ nhưng Mang đậm nghiệp vụ kinh doanh của Tài xế (`Driver Dashboard`).

- **Ngữ Cảnh**: Tài xế bốc được khách A đặt xe 16 chỗ chạy tuyến lên vùng cao. Nhưng chờ mòn mắt Điều phối chỉ ghép được thêm khách B (Tức là trên 16 chỗ chỉ có đúng 2 người ngồi). 
- Đến giờ khởi hành 6h Sáng bắt buộc phải nhấn Chạy. 
- **Quy Trình Hoạt Động**: Frontend bắt lấy Validation kiện: Hệ thống kiểm tra `Chỗ ngồi (16) > Số khách hiện tại (2)`. Form Modal Cảnh Báo Đỏ nhảy lên ngắt mạch:
```
  "Báo cáo: Chuyến đang Rỗng 14 Chỗ! Bạn chắc chắn muốn lăn bánh? Xin hãy điền lý do:"
```
- Bác tải phải bám vào ô Input gõ Text giải thích: *"Do chiều đi trả khách đông, chiều về rỗng đành phải vét vát chạy lấy giờ"*.
- Submit phát. Lời giải thích lưu Database để Ban giám đốc tra soát chống chạy khống bòn rút tiền xăng xe công ty. 

## 4. 🗂️ Lịch Sử Nghề Nghiệp (TripHistory.tsx & ActiveTrips.tsx)

Nằm ở thiết bị Mobile Driver.
- **`ActiveTrips`**: Không phải chuyến "Đang Rảnh", mà là Mảng các chuyến mình **Chuẩn.Bị.Phải.Chạy** vào ngày mai, ngày mốt tuần sau do Điều Phối phân cho. Lái Xe ngó Tên Địa chỉ từ đêm hôm trước để sạc pin xe.
- **`TripHistory`**: Quá khứ. Có thể lọc theo Tháng để nhẩm tính Thu Nhập. Hiển thị dưới dạng Component tái sử dụng `TripCard.tsx`.

---

## 5. 🚪 Cụm Đăng Nhập Hệ Thống (Auth Pages)

Gồm 4 file giao diện tĩnh khổng lồ: `StaffLogin.tsx`, `StaffRegister.tsx`, `DriverLogin.tsx`, `DriverRegister.tsx`.

**Logic Giao Diện Chung:**
- Bắt lỗi Validation bằng Regex siêu khắt khe (Phone 10 số, Pass > 6 ký tự...).
- Bắt buộc Lái xe tải bằng `B2 / C...` phải điền `license_number` (ID Bằng Lái) thì Nút Submit Mới Xanh. 
- Gọi Fetch sang Redux Store hàm `loginStart()`. Hoàn Tất trả API `token` thì Navigate nhét thẳng Client vào Protected Dashboard.
