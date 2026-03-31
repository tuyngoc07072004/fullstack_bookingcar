# ⭐ Model: Review (Đánh Giá Tài Xế)

Hệ thống cung cấp một module tương tác trực tiếp sau khi hoàn tất chuyến `DriverReview` để kiểm duyệt chất lượng phục vụ và tạo Feedback định tính cho tài xế.

Tính năng này được triển khai độc lập, có thể mở rộng để tính Rating trung bình xếp hạng tài xế chạy ưu tiên trong tương lai.

---

## 1. Schema: DriverReview

Một `DriverReview` được sinh ra khi và chỉ khi 1 chuyến xe Booking đã kết thúc (status = `completed`) và khách vào ứng dụng nhấn Đánh giá.

- `booking_id` (ObjectId -> `Booking` - unique): Chỉ một đánh giá trên mỗi đơn đặt hàng để tránh bơm đánh giá Spam / Clone.
- `driver_id` (ObjectId -> `Driver`): Tham chiếu mạnh đến bảng Tài xế. Chịu trách nhiệm để thực hiện Query tính trung bình.
- `customer_id` (ObjectId -> `Customer`): Lưu tên tài khoản đã rate (nếu khách dùng Guest Checkout tài khoản chưa đăng ký thẻ không thể rate).
- `customer_name` (String): Bộ nhớ cache cứng trực tiếp để trên Dashboard không cần Join Table lấy tên khi cần lấy list reviews nhanh.
- `rating` (Number - required): Giới hạn cứng trong Mongoose Constraint (Scale: Min 1 - Max 5). 
- `comment` (String): Nhận xét dạng Text Field (có giới hạn MaxLength là 500 ký tự ngăn chặn mã độc XSS hoặc DDOS Data Storage).

---

## Các Tính năng đi kèm tại Backend API

Không có Post-save hook tự động ở bảng này, tuy nhiên các Router sau liên kết chặt chẽ với nó:

1. **Get Driver Dashboard API (`/api/driver/stats/:id`)**:
   Khi hệ thống Load Dashboard cho Tài Xế, backend sử dụng hệ thống MongoDB Aggregation:
   ```javascript
   const avgRating = await DriverReview.aggregate([
       { $match: { driver_id: driverId } },
       { $group: { _id: null, rating: { $avg: '$rating' } } }
   ]);
   ```
   Hệ thống móc toàn bộ History rồi nhả con số Trung Bình (VD: `4.5` sao) vẽ lên Dashboard React Native / WebApp để tài xế biết KPI và năng lực của mình.

2. **Hạn Chế Form Load**:
   Đầu Endpoint `/api/reviews/booking/:id` trả về Boolean cho App. App Frontend gọi vào trước khi ấn "Hoàn Thành" xem xe đã Rate chưa, để hiển thị Component ẩn Rate Form nếu tìm thấy `booking_id` đang tồn tại sẵn.
