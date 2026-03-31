# 🧩 Components: Layouts (Giao Diện Bố Cục)

Chịu trách nhiệm bao bọc 100% màn hình, không xử lý Data phức tạp, chỉ quan tâm việc "Tôi Đặt Phần Lõi Con Của Tôi Vào Chỗ Nào Trên Khung Web" (Outlet).

## 1. Mạch Máu `App.tsx` & Router
Sử dụng `HashRouter` của `react-router-dom`: 
Bao gồm cấu trúc Layout `Routes -> Route -> Header -> Navbar -> <Outlet /> -> Footer`.

## 2. Thẻ Đóng Gói Riêng Cho Staff (`Sidebar`)
- Thay vì Header dài nằm ngang đè lên trên, Staff cần khu vực thao tác siêu linh hoạt 8 tiếng / ngày. 
- Build 1 cái `StaffLayout`: Block Menu dọc Cánh Trái (Width: 250px) Cố Định Không Trượt dài theo con lăn Chuột (Position Fixed/Sticky). 
- Khu nội dung bên phải (Width: `calc(100% - 250px)`). 
- Bấm vào Tab: "Lịch Trình", chỉ đổi React Component lọt giữa màn bên phải, Sidebar nằm im.

## 3. ProtectedRoutes (Màng Lọc Bảo Vệ Layout)
Component Chặn đứng User khi Navigate sai Luật:
```tsx
const ProtectedRoute = ({ children, allowedRole }) => {
   const { user, token } = useSelector(state => state.auth);
   // Nếu ko có Token -> Đá về Login Component
   if (!token) return <Navigate to="/staff-login" />;
   // Nếu Token Role là Lái Xe mà Đòi vào Dashboard Staff -> Đá văng nốt màng 2.
   if (user.role !== allowedRole) return <Navigate to="/" />;
   
   // Hợp Lệ 100% -> Nhả Cái Component Được Bọc Ra Cho User.
   return children;
};
```
Sử dụng trên React Router cấu hình:
`<Route path="/staff-dashboard" element={<ProtectedRoute allowedRole='staff'><StaffDashboard /></ProtectedRoute>} />`
