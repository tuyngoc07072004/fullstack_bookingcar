# ⚙️ Luồng Đi: Thực Thi Lái Xe & Giao Việc (Dispatch)

Workflow cực quan trọng, đánh dấu sự chuyển giao tài sản (Nhân Mã) của công ty sang phục vụ Cuốc Xe Booking đang Pending trên trời.

## Vế 1: Bảng Chỉ Huy (StaffDashboard -> BookingsTab.tsx)
- Cuốc Web Khách vừa đặt nhảy phòi lên Bảng của Tab "Đơn Hàng" với chíp Vàng `Pending`.
- Staff mở Lên, Nheo Mắt Nhìn Số Khách Đi + Địa điểm, Lộ trình (Được quyền Xem Lại Toạ Độ Bản Đồ của Khách - Tính năng Tương Lai).
- Staff Cầm điện thoại gọi thẳng SĐT Khách Vãng Lai: "Alô công ty xe xác nhận đơn đi Nội Bài 6h sáng mai nhé". (Manual Verify). Khách Ok.
- Staff bấm Nút **"Xác Nhận (Confirm)"**. Booking chuyển Cam. Khách Đang Nhòm Màn Loading 1s/1 Lần Bị Gật Đổi Màu Cam Theo (UX Realtime).

## Vế 2: Ghép Xe & Cấy Lái (Assign Modal Logic Component)
- Bấm **Phân Công**.
- Form Nhảy ra Modal: Select Tài Xế (Drop list Auto Filter tài khoản Trạng thái `Active` Xanh Lá Đang Rảnh Mới Được Bốc Nhé). Select Cái Xe Vật Lý Biển Số (Drop list Bắt Theo Điều Kiện `Xe Đang Ready Ở Kho` + Phải Cùng Loại Chỗ Ngồi mà Khách Chọn Trả Tiền Cho `vehicle_type_id`).
- Staff Ấn Bóp Chốt POST Assignment.
  => Backend Bơm Data, sinh DB `TripAssignment`.

## Vế 3: Tài Xế Xách Xe Đi Làm (Driver App -> CurrentTrip)
- Lái Xe Chớp Notification. Mở màn thấy Tên Khách, Toạ Độ Đến.
- Lái Xe Ấn Xác Nhận trên DB (`driver_confirm = 1`). Driver Tự động Trạng thái biến Cờ Xám Cam `Busy`.
- Tài xế Phi xe tới Điểm A, Bấm Bắt đầu Đón. Khách Lên Xe Ấn Đi.
- Chạy tới Điểm B. Khách Rút Tiền Cash 50K ra đưa nếu lỡ Chọn Tiền Mặt lúc Đặt.
- Lái Xe Cầm 50K => Bấm Nút "Đã Lấy Tiền", Backend Kéo Data Bảng Giao Dịch báo Xong `paid_cash`.
- Lái Xe Cầm Điện Thoại Lại Nhấn "Kết Thúc Cuốc (End Trip)".
- Vòng lặp Xả Băng hoàn thiện Server. Khách Nhấn Nhận SMS Báo Cáo. Tài Xế Về `Active` Tìm Bát Cháo Khác Gỡ Gạc Đời Bão Tá Giông. Staff Nhìn Trên Bảng Biến Màn Màu Xanh Dương Xong Chữ `Completed`.
