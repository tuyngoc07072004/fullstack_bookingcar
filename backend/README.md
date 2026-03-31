# ⚙️ Backend Car Booking System

Đây là phần Backend API của Car Booking System. Được xây dựng dựa trên Node.js, ExpressJS và MongoDB (thông qua Mongoose).

## 📖 Mục Lục Tài Liệu Chi Tiết

Hệ thống tài liệu Backend đã được phân rã thành các thư mục chuyên biệt giải thích cặn kẽ từng Model, API, và Logic lõi.

### 🗄️ 1. Cấu trúc Database (Models)
Giải thích chi tiết các schema DB, virtuals, methods liên quan.
- **[Booking (Đơn Đặt Xe)](./docs/models/Booking.md)**
- **[Trip & TripAssignment (Chuyến và Cuốc Xe)](./docs/models/Trip.md)**
- **[System Users (Tài khoản Staff, Driver, Customer)](./docs/models/Users.md)**
- **[Vehicle (Thông số Phương tiện)](./docs/models/Vehicle.md)**
- **[Financial (Thanh toán & Hoá đơn)](./docs/models/Financial.md)**
- **[Review (Đánh giá chất lượng)](./docs/models/Review.md)**

### 🌐 2. Luồng Gọi API (Endpoints)
- **[Auth & Users API](./docs/api/AuthAPI.md)**
- **[Booking API (Tạo Đơn Giao Đơn)](./docs/api/BookingAPI.md)**
- **[Trip API (Hệ thống Ghép Chuyến)](./docs/api/TripAPI.md)**
- **[Management API (Quản lý Vật tư Nhân Sự)](./docs/api/ManagementAPI.md)**
- **[Payment API (Logic Thanh Toán MoMo)](./docs/api/PaymentAPI.md)**

### 🛡️ 3. Lõi Hệ Thống (Core)
- **[Security & Middleware (JWT/Bảo mật)](./docs/core/Security.md)**
- **[Pricing Logic (Thuật Toán Tính Giá Tiền)](./docs/core/PricingLogic.md)**

---

## 🚀 Cài Đặt và Khởi Chạy

Yêu cầu: Node.js version 18+ đã cài đặt trong máy và đã có kết nối MongoDB hợp lệ trong file `.env`.

1. **Cài đặt thư viện (Dependencies):**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo hoặc chỉnh sửa file `.env` với các khóa cấu hình chính như `DB_URL`, `JWT_SECRET`, và `PORT`.

3. **Chạy Dev server (Có nodemon):**
   ```bash
   npm run dev
   ```
   Hoặc chạy production: `node server.js`

*Mặc định hệ thống sẽ khởi chạy tại cổng port 5000 (localhost).*
