# 🔐 Backend - Middleware (Xác thực & Phân quyền)

---

## authMiddleware.js

**File:** `src/middleware/authMiddleware.js`

Middleware xác thực JWT. Được áp dụng cho hầu hết các route cần bảo vệ.

### Cách hoạt động

1. Lấy token từ:
   - Header `Authorization: Bearer <token>`
   - Cookie `token`

2. Xác minh token với `JWT_SECRET`

3. Decode payload và gán vào `req`:
   - Nếu là **Driver**: `req.driverId`, `req.userRole = 'driver'`
   - Nếu là **Staff**: `req.staffId`, `req.userRole = 'staff'`
   - Khác: `req.userRole = 'unknown'`

4. Gọi `next()` để tiếp tục xử lý

### Lỗi trả về

| HTTP | Nguyên nhân |
|------|-------------|
| 401 | Không có token |
| 401 | Token không hợp lệ (JsonWebTokenError) |
| 401 | Token đã hết hạn (TokenExpiredError) |
| 500 | Lỗi server khi xác thực |

---

## roleMiddleware.js

**File:** `src/middleware/roleMiddleware.js`

Sau khi `authMiddleware` xác thực, `roleMiddleware` kiểm tra vai trò người dùng.

### Các middleware

| Middleware | Điều kiện | Lỗi nếu sai |
|---|---|---|
| `requireStaff` | `req.userRole === 'staff'` | 403 - Chỉ nhân viên mới có quyền |
| `requireDriver` | `req.userRole === 'driver'` | 403 - Chỉ tài xế mới có quyền |
| `requireAdmin` | `req.userRole === 'admin'` | 403 - Chỉ quản trị viên mới có quyền |

### Ví dụ sử dụng

```js
// Chỉ Staff mới thêm xe
router.post('/', authMiddleware, requireStaff, vehicleController.addVehicle);

// Chỉ Driver mới xác nhận chuyến
router.put('/confirm-trip', authMiddleware, requireDriver, driverTripController.confirmTrip);
```

---

## Luồng xác thực

```
Request
   │
   ▼
authMiddleware
   │  Lấy token (Header / Cookie)
   │  Verify JWT
   │  Gán req.userRole, req.userId, ...
   │
   ▼
roleMiddleware (nếu cần phân quyền)
   │  Kiểm tra req.userRole
   │
   ▼
Controller xử lý
```
