# 🚗 Model: Vehicle & VehicleType (Phương Tiện)

Hệ thống quản lý cả Danh mục tổng quát (VehicleType) chứa chính sách giá xe và Thông tin vật lý từng chiếc (Vehicle).

---

## 1. Schema: VehicleType (Loại phương tiện)

Lưu các thiết lập về giá cả và kích thước xe nói chung cho hệ thống, làm gốc cho các bảng sau.

- **`seats`** (Khóa phân biệt): Số lượng ghế chuẩn mực 4, 7, 9, 16, 29, 45 (Không thể trùng lặp).
- `type_name`: Tên dễ đọc (VD: Xe du lịch 4 chỗ).
- `base_fare`: Giá mở cửa của riêng loại xe này.
- `per_km_rate`: Giá cước tính trên mỗi Kilomet sau giá mở cửa.

### Hoạt động
Khi hệ thống lấy danh sách để tính giá chung trên web Khách Hàng tĩnh (`/api/bookings/calculate-price`), nó không quan tâm chiếc xe vật lý ngoài kia là xe gì. Nó chỉ Query vào bảng *VehicleType* để nhặt giá gốc này ra nhân với quãng đường (Distance) và Hệ số hành khách.

---

## 2. Schema: Vehicle (Chiếc xe vật lý)

Tạo một chiếc xe và bấm biển kiểm soát độc nhất. Bất cứ khi nào Khách / Điều phối cần một chiếc chạy, họ Query trên bảng này.

- `vehicle_name` (String): Tên xe thực tế ("Toyota Vios Trắng", "Ford Transit 2024").
- `license_plate` (String - unique): Biển đăng ký (uppercase - chữ in hoa chống trùng), đảm bảo duy nhất. Bắt buộc để nhận dạng.
- `seats` (Number): Khai báo số chỗ (4, 7, 9, 16, 29, 45).
- `vehicle_type_id` (ObjectId): Mỗi lần lưu, hệ thống sẽ tự sinh Middleware để Hook cái `seats` vào lấy `id` của bảng `VehicleType` gắn sang cho `vehicle_type_id`. Tránh dư thừa hoặc lỗi số ghế.
- `status`: Siêu quan trọng với Thuật toán tìm chuyến. Hiện trạng của xe:
  - `ready` (Xe trống chờ khách - Màu Xanh Lá).
  - `not_started` (Xe vừa được Staff ấn vào nút "Gán" cho Booking, bắt đầu chờ xuất bến - Màu cam, không thể gán nữa).
  - `completed` (Xe kết thúc, chuẩn bị chuyển ngược về Ready).

---

## Automation (Middleware)

Khi Staff dùng API `POST /api/vehicles` tạo xe:
```javascript
// Trích xuất Pre-save Middleware
vehicleSchema.pre('save', async function(next) {
    const vt = await VehicleType.findOne({ seats: this.seats });
    if (vt) this.vehicle_type_id = vt._id; 
    // Nếu VehicleType chưa tồn tại, code ném Error chặn việc khởi tạo Data bẩn!
    next();
});
```
Luôn đảm bảo hệ thống có đủ master data trước khi cắm xe vật lý vào garage.
