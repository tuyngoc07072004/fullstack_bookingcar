# 🖥️ Frontend - Tổng Quan

## Giới thiệu

Frontend được xây dựng bằng **React 19 + TypeScript + Vite**, sử dụng **TailwindCSS** cho giao diện và **Redux Toolkit** cho state management. Ứng dụng phục vụ 3 nhóm người dùng chính: **khách hàng**, **nhân viên**, và **tài xế**.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | TailwindCSS v4 |
| State Management | Redux Toolkit + React Redux |
| Routing | React Router DOM v7 (Hash Router) |
| HTTP Client | Axios + fetch |
| Map | Leaflet + React Leaflet |
| Charts | Recharts |
| Icons | Lucide React + Heroicons |
| Animation | Motion (Framer Motion) |
| AI | @google/genai |
| Date utils | date-fns |

## Cấu trúc thư mục

```
frontend/src/
├── App.tsx                # Layout chính (Header + Outlet + Footer)
├── main.tsx               # Entry point, bọc redux store + router
├── index.css              # Global styles
├── types.ts               # Type definitions chung
├── routes/
│   ├── router.tsx         # Cấu hình Hash Router
│   └── api.ts             # Express router phụ (local SQLite - legacy)
├── pages/
│   ├── Home.tsx           # Trang chủ
│   ├── BookRide.tsx       # Đặt xe
│   ├── Confirmation.tsx   # Xác nhận đặt xe
│   ├── MyTrips.tsx        # Lịch sử chuyến đi của khách
│   ├── Staff/             # Các trang dành cho nhân viên
│   └── Driver/            # Các trang dành cho tài xế
├── components/            # Components dùng chung
├── redux/                 # Redux slices, API calls
├── types/                 # TypeScript interfaces
├── db/                    # Local SQLite database (legacy)
├── config/                # Cấu hình API base URL
└── utils/                 # Tiện ích dùng chung
```

## Sơ đồ điều hướng (Routing)

```
/                    → Home (Trang chủ)
/book-ride           → BookRide (Đặt xe)
/confirmation        → Confirmation (Xác nhận)
/my-trips            → MyTrips (Lịch sử của khách)

/staff-login         → StaffLogin
/staff-register      → StaffRegister
/staff-dashboard     → StaffDashboard (Protected)

/driver-login        → DriverLogin
/driver-register     → DriverRegister
/driver-dashboard    → DriverDashboard (Protected)
/driver/create-trip  → DriverCreateTrip (Protected)
```

---

> Xem chi tiết từng phần:
> - [PAGES.md](./PAGES.md) — Tất cả các trang
> - [COMPONENTS.md](./COMPONENTS.md) — Components dùng chung
> - [REDUX.md](./REDUX.md) — State management
> - [FEATURES.md](./FEATURES.md) — Tính năng chi tiết
