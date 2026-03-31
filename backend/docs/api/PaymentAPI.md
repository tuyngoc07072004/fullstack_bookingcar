# 💳 API: Payments (Giao Dịch Thanh Toán) 

Quy trình quản lý dòng tiền Payment được tách biệt với Đặt xe để bảo mật vòng lặp và hạn chế lỗi rớt đơn khi rớt mạng Third Party.

Prefix: `/api/payments`

---

## 1. 💵 Hóa Đơn & Tiền Mặt

- **`POST /booking/:bookingId/create`**
  - Endpoint public khởi tạo hóa đơn mặc định ban đầu.
  - Thường chỉ lấy Method `cash`. Gọi ngầm lúc tạo đơn thành công. Trạng thái hoá đơn `pending`.

- **`GET /booking/:bookingId/status`**
  - Truy vấn cực nhanh không đòi Auth để kiểm tra xem đơn số 5555 này đã trả tiền hay nợ.
  - Dành cho Frontend gọi polling check cờ trạng thái `payment_status`.

- **`PATCH /booking/:bookingId/confirm-cash`** (Protected: `Auth`)
  - Staff / Driver thao tác ấn nút xác nhận "Khách đã đưa 500k tiền mặt xong". 
  - Kích hoạt JWT Payload lấy `id` người bấm -> Gán vào `confirmed_by_staff_id`/`_driver_id`. Đổi hoá đơn báo `paid_cash` -> Server Đóng tiền lại.

---

## 2. 📱 Thanh Toán MoMo (IPN Flow)

Sử dụng môi trường Test MoMo Sandbox với cấu hình trong `.env`:
`MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_IPN_URL`.

- **`POST /booking/:bookingId/create-transfer`**
  - API Nóng để User Bấm nút.
  - Payload Build Signature JSON (HMAC-256) từ SecretKey.
  - Gọi HTTP bằng axios đến `https://test-payment.momo.vn/v2/gateway/api/create`.
  - JSON Lấy `payUrl` của MoMo -> Thả cho FrontEnd chuyển trang (Redirect Client) tới màn hình mã QR Quét đỏ hoặc mở Deeplink app di động.

- **`POST /momo/ipn`** 
  - **Webhook (Internet Protocol Notification)**. MoMo gọi chứ không phải Client gọi! 
  - Không có Cokie/JWT tại đây, verify tính đứng đắn qua Chữ Ký MoMo. Mở khóa, kiểm soát.
  - MoMo Call Backend -> "Khách Trả Xong Rồi". 
  - Backend cập nhật Data bảng `Payment` mượt mà -> Update Booking `status` = `confirmed` -> Kết thúc lệnh.

- **`GET /momo/return`**
  - Cổng mở chờ ứng dụng MoMo trả Session của App Khách hàng sau khi họ báo "Giao Dịch Thành Công" / Cần Back Về App Khác.
  - Tuỳ tham số URL (`resultCode`), Web Backend Server Route sẽ `res.redirect()` Client sang Window Confirm Booking (`/confirmation?status=success` hoặc `/confirmation?status=failed`) để Client Frontend in ra trang trắng xanh/đỏ cho user dễ nhìn. 
