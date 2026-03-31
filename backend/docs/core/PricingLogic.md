# 💰 Core: Pricing Logic (Logic Định Giá)

Toàn bộ thuật toán đằng sau việc tính toán tự động số tiền phải trả cho 1 chuyến xe `Booking` được code cứng (hardcode config) bên trong Hàm Utility `tripPricing.js`.

---

## Công Thức Gốc

```math
Price = ( Base_Fare  +  (Distance * Per_Km_Rate) ) * Passenger_Multiplier 
```

### 1. `Base_Fare` (Giá Mở Cửa) và `Per_Km_Rate`
Hai biến này sẽ load bằng Object ID của `VehicleType` trên Mongoose hoặc bộ Config Cứng ban đầu nếu Query không hỗ trợ:
- VD Xe 4 Chỗ:
  - Mở cửa (`Base`): 50.000đ (Bao luôn 1-2km đầu).
  - Phụ trội Km sau: 12.000đ / KM.
- Thiết kế hệ số gốc luôn thay đổi do Giá Xăng / Tình hình Công ty, do đó không hardcode trong App Client (Vite Frontend) mà luôn Call POST về `/api/bookings/calculate-price` để tính toán trên Node.js. Chống Client tự sửa Code thay giá tiền ảo.

### 2. Số Hành Khách (`Passenger_Multiplier`)
Được thiết kế cho hệ số phụ trội với Hành khách tham gia "Xe tuyến bến":
- Cơ bản: (Hành Khách <= 1) -> Hệ số nhân = 1.0 (Số lượng không đổi giá cho xe riêng tư vẫy).
- Tuy nhiên do logic hệ thống yêu cầu Xe 16 chỗ chạy tuyến xa chia đều giá (Ghép Khách):
  - Khi xe Loại lớn 16 chỗ... Vé là Bán Đầu Người (Cụm Khách). N khách thì x N số vé phụ trội.

### 3. Quy Củ Làm Tròn `1000 VNĐ`
Do tiền tệ Việt Nam:
```javascript
const roundedPrice = Math.round(rawPrice / 1000) * 1000;
```
Tránh các số vô lý xuất hiện trên App Khách (VD: 55,234 VNĐ). Mở rộng trong tương lai có thể Add thuế VAT và phí môi trường.

---

## Tích hợp gọi trong API

API được mở cho Public. 

Hàm gọi gốc xuất phát ở:
- File Frontend: `frontend/src/pages/BookRide.tsx` gọi Fetch -> `priceCalculator` sau mỗi cú click chọn loại phương tiện.
- File Controller `calculatePrice()` kiểm duyệt và tính toán -> Trả về JSON `{ price: 345000 }` kèm `estimated_time` (Dựa trên trung bình vận tốc thành phố = `(khoảng cách / 40km/h) * 60 phút`).
