# 📡 Redux: API Calls (Kết nối Máy Chủ)

Các Component không tự Fetch API chay bằng Vanilla Fetch JS (Ngoại trừ vài điểm nhỏ). Thường toàn bộ được Code trong 1 folder `api` bằng Axios hoặc RTK Query.

## 1. File Cấu Hình `axiosInstance`
Đoạn Code Trục Xương Sống (`src/config/axios.ts` / `utils/api.ts`):
- `baseURL`: `http://localhost:5000` (Ném ra file biến `.env`).
- **Interceptor Request**: Tự động đánh cắp `token` trong kho LocalStorage hoặc State Redux gắn ngay vào Header `Authorization: Bearer <...>` mỗi lần Cóc Lệnh `axios.post` ra ngoài. 
=> Tái sử dụng tối thượng, FrontEnd Không cần Dev nào phải Coder tay từng dòng gán Header nữa.

- **Interceptor Response**: Xử lý Ngoại lệ Gốc. Cứ Server ném 401 thì Bắn mẹ Event Logout tống Dev / User ra Màn Hình Home Đăng Nhập mà Không cần Try Catch ở mọi Component.

## 2. Redux Thunk (Async Actions)
Ở các Hành động đòi API dài, Thunk được dùng.
- Ví Dụ Lệnh: `dispatch(fetchBookings())` (Gọi Lấy danh sách Toàn bộ đơn).
- Thunk tự gọi API Bằng Axios Instance trên. Lấy JSON về. Gọi Dispatch Gán Nhồi `bookingsArray` vào Redux Store.
- View Component (Ví dụ `BookingsTab`) được `useSelector` nối dây Cáp, thấy mảng Booking kia có data lập tức ReactJS Vẽ luôn Bảng Table, không tự Loading bên trong Component dài dòng khó bảo trì.
