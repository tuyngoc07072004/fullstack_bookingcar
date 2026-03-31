# 🗂️ Frontend - Redux State Management

Sử dụng **Redux Toolkit** với cấu trúc slice per-feature.

**Store file:** `src/redux/store.ts`

---

## Cấu trúc Redux

```
redux/
├── store.ts                    # Redux store tổng hợp
├── Booking/                    # State đặt xe
├── Staff/                      # State nhân viên
├── Driver/                     # State tài xế
├── Trip/                       # State chuyến ghép
├── Vehicle/                    # State xe
├── DriverManagement/           # State quản lý tài xế (Staff view)
├── DriverReview/               # State đánh giá tài xế
├── DriverSelfTrip/             # State tài xế tự tạo chuyến
├── DriverTrip/                 # State chuyến đi của tài xế
├── Payment/                    # State thanh toán
├── StaffBooking/               # State booking dành cho staff
└── StaffCustomer/              # State khách hàng (Staff view)
```

---

## 1. Staff Slice

**File:** `redux/Staff/Staff.Slice.ts`

Quản lý trạng thái xác thực nhân viên.

### State

```ts
{
  currentStaff: StaffInfo | null,
  token: string | null,
  isAuthenticated: boolean,
  loading: boolean,
  error: string | null
}
```

### Actions / Thunks

| Action | Mô tả |
|--------|-------|
| `staffLogin({ username, password })` | Đăng nhập, lưu token vào localStorage |
| `staffLogout()` | Đăng xuất, xóa token |
| `fetchCurrentStaff()` | Lấy thông tin nhân viên hiện tại |

---

## 2. Driver Slice

**File:** `redux/Driver/Driver.Slice.ts`

Quản lý trạng thái tài xế đang đăng nhập.

### State

```ts
{
  currentDriver: DriverInfo | null,
  token: string | null,
  loading: boolean,
  error: string | null
}
```

### Actions / Thunks

| Action | Mô tả |
|--------|-------|
| `driverLogin({ username, password })` | Đăng nhập tài xế |
| `driverLogout()` | Đăng xuất |
| `updateDriverInfo(driverInfo)` | Cập nhật info (dùng khi polling status) |
| `resetState()` | Reset toàn bộ state |

---

## 3. DriverTrip Slice

**File:** `redux/DriverTrip/DriverTrip.Slice.ts` + `DriverTrip.Api.ts`

Quản lý chuyến đi của tài xế.

### API functions (DriverTrip.Api.ts)

| Function | Mô tả |
|----------|-------|
| `getDriverTrips(driverId)` | Lấy tất cả chuyến của tài xế |
| `getDriverTripStats(driverId)` | Thống kê chuyến (total, completed, earnings, rating) |
| `getDriverStatus()` | Lấy trạng thái hiện tại |
| `confirmTrip(payload)` | Xác nhận nhận chuyến |
| `completeTrip(bookingId)` | Hoàn thành chuyến |

---

## 4. Vehicle Slice

**File:** `redux/Vehicle/Vehicle.Slice.ts`

Quản lý danh sách xe dùng trong StaffDashboard.

### State

```ts
{
  vehicles: Vehicle[],
  loading: boolean,
  error: string | null
}
```

### Thunks

| Action | Mô tả |
|--------|-------|
| `fetchAllVehicles()` | Lấy toàn bộ xe |
| `addVehicle(data)` | Thêm xe mới |
| `updateVehicle(id, data)` | Cập nhật xe |
| `deleteVehicle(id)` | Xóa xe |

---

## 5. DriverManagement Slice

**File:** `redux/DriverManagement/DriverManagement.Slice.ts`

Quản lý danh sách tài xế từ góc nhìn nhân viên.

### State

```ts
{
  drivers: Driver[],
  loading: boolean,
  error: string | null
}
```

### Thunks

| Action | Mô tả |
|--------|-------|
| `fetchAllDrivers()` | Lấy danh sách tài xế |
| `updateDriverStatus(id, status)` | Cập nhật trạng thái tài xế |

---

## 6. StaffBooking Slice

**File:** `redux/StaffBooking/StaffBooking.Slice.ts`

Quản lý đơn hàng từ góc nhìn nhân viên.

### Thunks

| Action | Mô tả |
|--------|-------|
| `fetchAllBookings(filters)` | Lấy danh sách đơn có thể lọc |
| `fetchBookingStats()` | Lấy thống kê đơn |
| `confirmBooking(id)` | Xác nhận đơn |
| `assignDriverAndVehicle(id, data)` | Phân công tài xế + xe |
| `updateBookingStatus(id, status)` | Cập nhật trạng thái |

---

## 7. DriverReview Slice

**File:** `redux/DriverReview/DriverReview.Slice.ts`

Quản lý đánh giá tài xế.

### State

```ts
{
  reviewsByBooking: Record<string, DriverReview | null>,
  submitting: boolean,
  error: string | null
}
```

### Actions / Thunks

| Action | Mô tả |
|--------|-------|
| `fetchReviewByBooking(bookingId)` | Kiểm tra đã đánh giá chưa |
| `submitReview({ bookingId, rating, comment })` | Gửi đánh giá |

---

## 8. StaffCustomer Slice

**File:** `redux/StaffCustomer/StaffCustomer.Slice.ts`

Quản lý thông tin khách hàng (Staff).

### Thunks

| Action | Mô tả |
|--------|-------|
| `fetchAllCustomers()` | Danh sách khách hàng |
| `fetchCustomerBookings(customerId)` | Lịch sử đặt xe của khách |

---

## 9. Payment Slice

**File:** `redux/Payment/Payment.Slice.ts`

Quản lý thanh toán.

### Thunks

| Action | Mô tả |
|--------|-------|
| `fetchPayments()` | Lấy danh sách thanh toán (Staff) |
| `confirmCashPayment(bookingId)` | Xác nhận tiền mặt |

---

## Sử dụng trong component

```tsx
import { useAppDispatch, useAppSelector } from '../redux/store';

// Lấy state
const { currentDriver } = useAppSelector(state => state.driver);
const { vehicles } = useAppSelector(state => state.vehicle);

// Dispatch action
const dispatch = useAppDispatch();
dispatch(fetchAllVehicles());
dispatch(staffLogin({ username, password }));
```
