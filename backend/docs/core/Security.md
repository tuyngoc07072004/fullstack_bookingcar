# 🛡️ Core: Security & Middleware (Xác Thực Bảo Mật)

Lõi hệ thống Backend đảm bảo an ninh dữ liệu nằm ở thư mục `src/middleware`. Hệ thống chặn tất cả những người dùng không có quyền truy cập thông tin tuyệt mật từ Dashboard.

## 1. 🔑 JWT Authentication (`authMiddleware.js`)

Hoạt động dưới dạng một bộ lọc (Interceptor) đứng chặn trước cổng mọi Controller của Mongoose.

### Cách thức verify
1. Khi có request gọi vào Backend API, Middleware dò tìm Header `Authorization` (VD: `Bearer <token>`).
2. Nếu không có `Header` => Chuyển sang tìm chuỗi `token=<token>` đang dính trong `req.cookies`. Dành riêng cho trình duyệt bảo mật không truyền Header.
3. Nếu vẫn Null => Server Đá ra Lỗi `401 Unauthorized` (Không có vé vào cửa).
4. Khởi chạy thuật toán mã hoá Giải Mã RSA/HMAC thư viện `jsonwebtoken.verify(token, process.env.JWT_SECRET)`.
5. Nếu thời gian sống đã hết (Expired) => Đá `401`. Phải Login Mới lại từ đầu.
6. Nếu hợp lệ: Trả Payload `(id, role)` gán đè vào biến Global Request của luồng Node.js (`req.user = decoded`). Gửi lệnh `next()` cho các luồng đằng sau.

---

## 2. 👮 Role-based Access Control (`roleMiddleware.js`)

Đây là con chip thứ 2 ngay sau Auth JWT kiểm tra Payload.

- Cấu trúc: Hàm Currying nhận 1 chuỗi Rest Params các Quyền. VD: `authorizeRole('staff', 'admin')`.
- Nếu JWT Payload `req.user.role` không nằm trong chuỗi cung cấp => Trả `403 Forbidden` (Cấm Truy Cập) chứ không phải 401. Tức là Bạn là người của hệ thống (Ví dụ là Tài Xế), nhưng khu vực này Tài Xế không được nhòm ngó (Staff/Dashboard).

---

## 3. CORS & CSRF (Config Core `server.js`)

- `cors({ origin: [...] })`: Định danh cứng 2 cổng của Vite Client (`5173`, `5174`) và MoMo Redirect IP. Khoá cứng không cho Server Lạ, Hacker gọi Cross-Origin API phá hoại Server Database.
- Credentials Cookie: Bật `credentials: true` hỗ trợ Cookie dính chặt trên Domain Localhost.
