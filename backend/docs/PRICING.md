# 💰 Backend - Logic Tính Giá Chuyến Đi

**File:** `src/utils/tripPricing.js`

---

## Công thức tính giá

```
Tổng = base_fare + (distance_km × per_km_per_person × passengers)
Tổng = max(min_fare, Tổng)
```

> Giá luôn tối thiểu bằng `min_fare` để tránh giá quá thấp cho chặng ngắn.

---

## Bảng giá theo loại xe

| Loại xe | Giá cơ bản | Giá/km/người | Giá tối thiểu |
|---------|-----------|-------------|-------------|
| Xe 4 chỗ | 25.000đ | 10.000đ | 25.000đ |
| Xe 7 chỗ | 30.000đ | 10.000đ | 30.000đ |
| Xe 9 chỗ | 35.000đ | 9.500đ | 35.000đ |
| Xe 16 chỗ | 50.000đ | 9.000đ | 50.000đ |
| Xe 29 chỗ | 70.000đ | 8.500đ | 70.000đ |
| Xe 45 chỗ | 90.000đ | 8.000đ | 90.000đ |

> Xe càng lớn, giá/km/người càng thấp → ưu đãi nhóm lớn.

---

## Ví dụ tính giá

**Tình huống:** Xe 9 chỗ, đi 50km, 3 hành khách

```
variable = 50 × 9.500 × 3 = 1.425.000đ
raw_total = 35.000 + 1.425.000 = 1.460.000đ
total = max(35.000, 1.460.000) = 1.460.000đ
```

---

## Các hàm tiện ích

### `calculatePriceBreakdown(seats, distance, passengers)`

Trả về object chi tiết:
```json
{
  "seats": 9,
  "passengers": 3,
  "distance": 50,
  "vehicle_type": "Xe 9 chỗ",
  "base_fare": 35000,
  "per_km_per_person": 9500,
  "min_fare": 35000,
  "variable_fare": 1425000,
  "price": 1460000
}
```

### `calculatePriceBySeats(seats, distance, passengers)`

Trả về chỉ số tiền cuối cùng (Number).

### `getPricingBySeats(seats)`

Lấy cấu hình giá theo loại xe.

### `haversineKm(lat1, lon1, lat2, lon2)`

Tính khoảng cách giữa 2 tọa độ theo công thức **Haversine** (đơn vị km). Được dùng để tính khoảng cách thực tế giữa điểm đón và điểm đến khi khách hàng chọn trên bản đồ.

---

## Tích hợp với Booking API

Khi khách hàng gọi `POST /api/bookings/calculate-price`, backend:
1. Nhận `seats`, `distance`, `passengers`
2. Gọi `calculatePriceBreakdown()`
3. Trả về bảng chi tiết giá để hiển thị cho khách
