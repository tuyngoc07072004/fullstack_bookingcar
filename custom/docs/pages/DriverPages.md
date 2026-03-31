# 📱 Pages: Driver App (Trang Tài Xế Di Động)

Ứng dụng nội bộ trên màn hình hẹp (Mobile Responsive WebApp) dành cho Lái Xe của hãng. Luồng `/driver-dashboard`. Protected Login. Không hiển thị Sidebar như Dashboard của Staff, sử dụng Bottom Navigation (Thanh nút chạm ngón tay dưới đáy Mobile Màn hình).

---

## 1. Màn Nhá Push (Notification Home - `DriverDashboard.tsx`)
Điểm nổ của Mọi Hoạt động. Layout chính:
- Tab Xưng danh hiển thị mặt tài xế + Số Biển Kiểm Soát Xe hiện tại đang được cầm. Cờ Trạng Thái của chính bản thân (`Active` / `Busy`).
- **Trung Tâm Pinging (Polling):** `useEffect` móc 10s lại gõ cửa Server 1 lần dò xem có thằng Điều Phối (Staff) nào thả đơn mồi gán vào xe mình chưa?
- Khi Server báo "CÓ!", màn hình hiện Bảng Thông Báo Chớp Nhoáng kèm Nút Xanh "Xác Nhận Đi" (Gọi API Đổi cờ Driver lên `Busy`, Xe vào `not_started`).

## 2. Trang Quản Thực Thi (`CurrentTrip.tsx`)
- Khi đã vào `Busy` (Đang giữ khách). Bảng này thay thế thẻ Trạng thái. Hiển thị Toàn cảnh bản đồ (Leaflet): Vị trí Khách đứng, Vị trí thả khách. Số tiền Khách trả (Tiền mặt thu lúc này chưa?).
- Nút Cứng ở Cuối: **"Hoàn Thành Trả Khách (End Trip)"**. 
Bấm nút này: Đơn khách coi như Kết Thúc Hợp Đồng, DB Ghi vào Done, Token tài xế được cởi trói trả về Nhận khách Cuộc Đời Mới.

## 3. Tool: Tạo Cuốc Dọc Đường (`SelfBooking`)
Nút to Float (Trôi lơ lửng màn hình). 
- Phím Tắt dành cho bác tài vẫy ngoài phố. Bấm vào => Gõ tên khách, SĐT (để cty CSKH gửi voucher nếu có), quãng đường. Nhập giá tay. Báo về máy chủ tự sinh Đơn Booking + Bật luôn Trạng Thái In-Progress lên tài khoản bác tài mà không bị Điều Phối viên tranh giành cuốc.

## 4. `DriverReviewsList.tsx` & `DriverStatCard.tsx` (Thống kê & KPI)
- Danh sách bình luận "Tài Lái Ngáo Trả Khách Sai Chỗ 1 Sao" của Khách vãng lai để lên. Tài xế được Quyền View (ReadOnly) thu nạp Feedback.
- Biểu đồ Cốt lõi về Tiền Lương.
