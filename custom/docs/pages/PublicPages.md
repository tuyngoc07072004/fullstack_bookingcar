# 🌍 Pages: Public (Trang Web Khách Vãng Lai)

Nhóm trang Web được thiết kế dành cho mọi Khách Hàng Truy cập trên Internet không cần Login. Kiến trúc theo hơi hướng Web Bán Hàng (E-Commerce) với Flow Đặt Hàng chuẩn mực.

---

## 1. `Home.tsx` (Homepage / Đích đến Khách)
- Nơi khách rớt xuống (Landing Page) khi gõ tên miền.
- **UI:** Gọi 1 Navbar đơn giản trong veo trên khối Header Hero Image/Video. Khối Text "Dịch vụ thuê xe tốt nhất".
- **CTA (Call-to-Action):** Ném vào giữa 1 Module Đặt Xe Nhanh (Search Form điểm Đi Điểm Nhận) -> Ấn `Router.push("/book-ride")`.

## 2. `BookRide.tsx` (Màn Chóp Đặt Xe Bằng Bản Đồ)
Đây là Component vĩ đại nhất của luồng Khách hàng. Xử lý đa luồng (Form validation + External Map API + Backend API):

- **Bản Đồ React Leaflet:** Cầm nguyên thư viện Bản đồ Nguồn Mở. Bắt Khách bấm click điểm A và điểm B. Leaflet sinh ra hai Marker (Icon Nút Ghim) -> Tính bằng Công Thức Haversine ra độ dài đường bay chim `Distance`.
- **Form Đăng Ký (Step 2):** Khách điền Ngày tháng (DatePicker `date-fns`), Số khách muốn đi.
- **Chọn Loại Xe (Step 3):** Truyền Data Distance xuống Backend Fetch `/api/bookings/calculate-price`. In ra Danh Sách Card chọn Loại Xe (4, 7, 16 chỗ) với Giá Tiền tương ứng thời điểm thực. Thấy giá phù hợp khách chọn Loại Xe đó.
- **Điền Thông Tin Trả Tiền (Step 4):** Lấy Tên, Số điện thoại (Validation Regex), Nút Chọn `Cash` / `Transfer`.
- Nhấn Submit -> Bắn ra Đơn Booking.

## 3. `Confirmation.tsx` (Màn Giao Dịch Cuối Cùng)
- Trang Đích đến (Redirect) sau khi MoMo Nhả IPN về hoặc Đặt tiền mặt xong.
- Hiển thị QR Code hoặc Text ID Tracking Number (`TRPID-xxx`).
- Có 1 Hook ngầm định Polling API (`setInterval` check DB 1s/1 lần) để nhìn trạng thái Loading "Nhân Viên Điều Phối đang xếp xe cho bạn vui lòng đợi". Đổi từ Cam -> Xanh Lá khi API báo `assigned`.

## 4. `MyTrips.tsx` (Quản Lý Hành Trình Riêng)
- Cánh cổng quản lý cho khách. Nhập Số Điện Thoại vào Ô Input -> Ném Filter về Query `GET /phone/:phone`.
- Trả ra Dọc Table Lịch Sử. Những chuyến đang `active` hoặc `done` hôm qua. Cung cấp nút `Đánh giá Tài xế` ở góc cạnh những cuốc `done`.
