# 🚗 Car Booking System - Tài Liệu Hệ Thống

Chào mừng bạn đến với tài liệu hướng dẫn và giải thích kỹ thuật cho dự án **Car Booking System**. Dự án được chia làm hai phần chính: **Backend (Node.js/Express)** và **Frontend (React/Vite)**.

Hệ thống cung cấp tính năng đặt xe từ khách hàng, quản lý đơn hàng/đội xe từ nhân viên (Staff) và hệ thống tiếp nhận chuyến đi cho tài xế (Driver).

Tài liệu chi tiết đã được tự động tạo và phân chia vào từng thư mục tương ứng.

---

## 🖥️ Frontend Documentation

Trình bày về các tính năng giao diện, luồng người dùng, kiến trúc Redux và các Component sử dụng trong React.

- 📖 **[Tổng quan Frontend](./frontend/docs/OVERVIEW.md)**
- ✨ **[Tính năng chi tiết (Luồng đặt xe, thanh toán, đánh giá, ghép chuyến...)](./frontend/docs/FEATURES.md)**
- 🗺️ **[Sơ đồ các trang web (Pages)](./frontend/docs/PAGES.md)**
- 🧩 **[Các Component dùng chung](./frontend/docs/COMPONENTS.md)**
- 📦 **[Quản lý State với Redux Toolkit](./frontend/docs/REDUX.md)**

> **Khởi động Frontend**: Đi tới thư mục `frontend` và chạy `npm install` -> `npm run dev`.

---

## ⚙️ Backend Documentation

Trình bày về kiến trúc Server, các API Endpoints, cấu trúc Cơ sở dữ liệu, Logic tính giá và Phân quyền Auth.

- 📖 **[Tổng quan Backend](./backend/docs/OVERVIEW.md)**
- 🌐 **[Tài liệu API Endpoints](./backend/docs/API.md)**
- 🗄️ **[Cấu trúc Cơ sở dữ liệu (MongoDB Models)](./backend/docs/MODELS.md)**
- 🛡️ **[Xác thực & Phân quyền (Middleware)](./backend/docs/MIDDLEWARE.md)**
- 💰 **[Logic thuật toán tính giá chuyến đi](./backend/docs/PRICING.md)**

> **Khởi động Backend**: Đi tới thư mục `backend` và chạy `npm install` -> `npm run dev` (hoặc `node server.js`). Mặc định chạy tại cổng 5000.

---

*Tài liệu được sinh tự động nhằm mục đích giúp Developer và Maintainer dễ dàng nắm bắt kiến trúc và luồng dữ liệu của hệ thống.*
