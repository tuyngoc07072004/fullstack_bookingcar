# 🚍 Thuật Toán Kéo Ghép Chuyến Lớn (Carpooling Logic)

Workflow chuyên cho Hệ Trống Trọng điểm: Xe Chạy Tuyến Hành Khách Bự (Ví Dụ 16 Chỗ HN-Hạ Long). Khác biệt hoàn toàn với Luồng Nhận Khách Đơn Giao Xe Cá Nhân 4 Chỗ.

## Tại Sao Phải Ghép (Logic)?
Khách thứ 1 đặt: Vios 4 Chỗ, Giá 500k bao nguyên xe. (1 Đơn `Booking` = 1 `TripAssignment` gán cứng 1 Xe Vios + 1 Thằng Lái).
Khách thứ 2 đặt: Ford Transit 16 Chỗ, 3 vé = 600K đi Tuyến Bến. Không Công Ty Nào Ngu ngốc dùng lệnh `Assign`: Bắt 1 Xe Bự Ford Transit 16 chỗ Gán chỉ cho đúng 1 Booking 3 Khách kia mà Cấm luôn các Booking khác của Khách Thứ 3 Khách Thứ 4 Nhảy lên nhồi chung chuyến 10h Đêm cả!

## Flow Giải Bài Toán Hệ Thống

1. Trang `TripsTab` (Quản Lý Xe Tuyến Thường): Điều Phối Biên (Staff) chủ động Create 1 Chuyến Giả Lập Trước. (Đặt ID TRP-01: Chạy HN-HP Lúc 6h Sáng). Gắn luôn Lái Tên Tùng và Xe Ford VÀO chuyến này. Ở ĐÂY SỐ KHÁCH BẰNG 0.

2. Ở Tab `Bookings` (Người Đặt Xe):
   1 Khách Hàng (Tên Huy) Đặt xe Tuyến Lúc 5h30 sáng muốn lên xe 16 chỗ. Ra 1 Đơn Vàng Pending.

3. Thuật Toán Smart Gợi Ý Gọi Mồi (`CarPool Find API`): 
   - Staff Không Bấm Phân Công Kiểu Cũ. Mà kéo sang Bấm Nút Có Icon Hành Khách Gọi Là Chữ `Ghép Chuyến`. 
   - Lệnh này móc cái Data Đang Pending của Khách Tên Huy quăng mẹ lên Backend Function Logic Check Động:
     - Nó Loop Data Toàn Chuyến Tuyến: Dò Trùng Ngày Có Xe Nào Chạy Ko? Có! Trùng Loại Xe Khách Huy Mua Mâm (16 Chỗ) Ko? Có. Xe đó có còn Dư Toạ Độ Rỗng Ở Mông Lớn Hay Bằng Số Vé mà Huy Mua Không? (Tức Là MaxSeats > Tổng Vé Hiện Có). Có!!!
   - Nó Trả List Về Cho Giao Diện Gợi Ý: **Ê Staff, nhét ông Huy này vào Trip TRP-01 của xe Tùng đi, còn hợp lắm dư 10 ghế kìa!**

4. Chốt Kéo Hành Thẻ (Push into Arrays):
   - Staff Tick Bấm OK Gán Khách Tên Huy vô Trip này.
   - Thằng Code JS Nổi Chuyển Booking Của Huy Thành Assigned. Kéo Vị Trí Vĩ Độ Đ đón Điểm Đ Trả Của Huy Nhét vào `pickup_points[]` mảng Vị trí Tổng Tuyến của Ông Chuyến Chạy Trip TRP-01 Cho Lái Tùng Biết. Cộng Tổng Hành Khách +3. Chỗ Trống Lại Tự Mất Đi.

=> Cuối Điểm, Khi 6h Sáng Tùng Rồ Ga Bấm "Start Trip". Chuyến Đỏ Bừng... Huy và 11 Người Khác Cùng lúc Bị Nổ Tin Nhắn "Mã Xe Ford Đang Trên Đường Tới Chỗ Đón". 

Tuyệt hảo tối ưu logic nhồi Khách.
