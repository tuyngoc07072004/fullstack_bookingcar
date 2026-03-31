# 🌊 Luồng Nhập: Flow Đặt Xe (A đến Z)

Đây là quy trình khách hàng thực hiện (User Journey) đầy đủ. 

## Bước 1: Quyết định Lộ Trình (HomePage / BookRide)
- Gõ điểm A, B hoặc Chọt Bản đồ Cắm Mốc (Map Leaflet Handle).
- App gửi điểm tới Nominatim Reverse API (nếu cần đổi Tọa Độ ra Đường Xá).

## Bước 2: Nhập thông số phụ trợ (BookRide Form Step 2)
- Khách dùng Component `InputType Date` để chốt: **Ngày Khởi Hành (trip_date)**.
- Gõ Số Khách Tham Gia đi cùng Bầy Đàn (passengers).

## Bước 3: Đưa Lựa Chọn Ví Tiền (Vehicle Selection Component)
- Có 2 Điểm (A-B) => Kéo App gọi Cục Backend `calculate-price`. Truyền KM Đường Đi (Distance).
- Nhả Json Array 6 Loại Xe Cấu Hình Kèm Giá Trị.
- Frontend Map List Mảng Cục JSON này vẽ Thành 6 Khối Card (Tấm Thẻ Click được).
- Trong Các Tấm thẻ Card có Khối Text Giá Tiền đã tính toán sẵn bằng chữ VNĐ Đỏ Rực.
- Khách Nhấn Thẻ => `setVehicleTypeId(id cái thẻ)`. Chuyển Bước 4.

## Bước 4: Nhập Đích Danh + Thanh Toán Chốt Cuốc (Guest Info)
- `Input Name`, `Input Phone`. Chữ cái Bắt buộc (Validate Form).
- Radio Button Chọn `Cash` / `Transfer`.
- Nhấn Gọi Nút "Booking".
- App bắn Fetch Post Lên `/api/bookings/`.
- Backend Quăng về Id của Chuyến Xe `booking_id: "XX22..."`.

## Bước 5: Phân Nhánh Thanh Toán (Routing Checkout / Confimation Page)
- Nếu Chọn Tiền Mặt (`Cash`), Booking Lập Tức Dẫn Link `navigate('/confirmation?id=XX22')`. Quá trình kết thúc tại Màn Loading tìm tài xế (Màu Cam Đợi Đổi Thành Màu Xanh).
- Nếu Chọn MoMo Chuyển Tiền (`Transfer`). Web không vội sang Confirmation.
  - App cầm mã Booking ID kia, gọi POST phát nữa sang `/api/payments/.../create-transfer`.
  - Backend Nhả MoMo DeepLink Tới Đth Khách (`payUrl`). Frontend Xử lý chạy Window Open Location sang Màn Đỏ MoMo.
  - Khách Quyết Đấu PassCode Trả 50K. 
  - IPN Hoàn tất MoMo đập vào Lưng Server. Server móc Trạng thái chuyển xanh, xong Server đá Khách Về Trang Web /Confirmation của mình (ReturnUrl Route Cấu Hình). Khách Thấy Màu Xanh Lá. Đã Đặt Tiền. Chờ Xe Nhé.
