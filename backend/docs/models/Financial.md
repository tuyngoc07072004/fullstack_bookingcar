# 💸 Model: Financial (Thanh Toán & Hóa Đơn)

Dòng tiền trong hệ thống được thể hiện qua Schema `Payment`, chịu trách nhiệm lưu trữ lịch sử trả tiền mặt (Cash) hoặc chuyển khoản qua IPN Hệ thống cổng thanh toán thứ 3 (MoMo).

## 1. Schema: Payment (Lịch sử thanh toán)

Chỉ có 1 đơn `Payment` được map độc nhất vào một `Booking` thông qua khoá ngoại `booking_id`.

- `booking_id` (ObjectId -> `Booking` - unique).
- `payment_method` (String): Xác định phương thức xử lý (Enum: `cash`, `transfer`).
- `amount` (Number): Mức giá phải thu, tính bằng VNĐ (luôn đồng nhất với `Booking.price`).
- `payment_status` (Enum quan trọng):
  - `pending`: Đơn hàng vừa đặt thành công, MoMo chưa quét mã vạch và trả tiền, hoặc tiền mặt đang đợi tài xế thu.
  - `paid_cash`: Tài xế hoặc Nhân viên điều phối đã check "Tôi đã nhận tiền đủ".
  - `paid_transfer`: MoMo Server đã gọi hàm CallBack Webhook (IPN) để xác thực người dùng đã nhập mã Pin thành công trên ví MoMo.

### Trường mở rộng (MoMo Sandbox)
Khi `payment_method = transfer`, hệ thống sẽ yêu cầu thêm 2 trường sau để đối soát trên trang tính doanh nghiệp:
- `momo_order_id`: Mã đơn tự sinh gửi qua MoMo.
- `momo_trans_id`: Mã khoá giao dịch ngân hàng của MoMo gọi ngược lại máy chủ server xác thực.

### Trường kiểm duyệt Tiền Mặt
Khi `payment_method = cash`, cần xác định luồng dòng tiền để tránh tài xế nợ tiền.
- `confirmed_by_staff_id` (ObjectId -> `Staff`): ID Nhân viên xác thực việc nộp tiền.
- `confirmed_by_driver_id` (ObjectId -> `Driver`): ID Tài xế ghi lại dấu vân tay xác nhận việc thu tiền.
- `paid_at` (Date): Giây phút ấn nút trả tiền hoàn tất.

---

## Logic tích hợp Backend API với MoMo IPN

Quá trình hoạt động được hệ thống ghi nhận tự động vào bảng này qua Middleware `MoMo API`:
1. (Frontend) Khách chọn MoMo, Bấm Next.
2. (Backend) Khởi tạo Payment dòng mới chạy ở trạng thái `pending`. Build Signature HMAC_SHA256, ném Json gọi REST request lên `test-payment.momo.vn`.
3. (MoMo) MoMo sinh ra DeepLink, WebApp mở QR.
4. (Khách) Mở ví, quét mã, chuyển.
5. (MoMo) MoMo âm thầm gửi POST Request dưới dạng ngầm đến `/api/payments/momo/ipn` chứa chữ ký ngược.
6. (Backend) Bắt được IPN IP ẩn.
   Hàm Post IPN đi tìm Payment theo OrderId MoMo, sau đó móc tiếp `booking_id` gọi hàm đổi sang `paid_transfer`. 
   Lưu xong, gán `momo_trans_id`. Tích điểm cho Tài khoản `Customer`. Đổi Booking `status` từ `pending` sang `confirmed` ngay tức khắc không chờ Staff nhấn tay!
7. (Frontend) Redirect Khách hàng về `/confirmation?id=...`. Hệ thống xanh lá, trả vé.
