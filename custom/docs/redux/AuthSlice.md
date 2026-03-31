# 👮 Redux: Authentication Slice (Quản Lý Trạng Thái Login)

`authSlice.ts` phụ trách việc quản lý Cửa Đi Vào Hệ Thống Trọng Yếu nhất.

## 1. State Định Nghĩa Gốc (InitialState)
```ts
const initialState: AuthState = {
  user: null, // Lưu Object: Tên Driver X, Role Hắn là gì...
  token: null, // JWT Chuỗi siêu dài
  isLoading: false, 
  error: null,
};
```
Mặc định vừa vào thì sẽ Null (Khách vãng lai). Frontend dò thấy LocalStorage có Lưu cũ thì `JSON.parse` thả vào State (Đánh ngầm 1 vòng API `/api/.../me` verify JWT hợp lệ thì cho ở lại Trang - Invalid thì ném Action Xoá trắng Data).

## 2. Các Hành Động Cơ Bản (Actions)
- **`loginStart`**: Dispatch lên kéo Cờ `isLoading = true`, Disable mờ Nút Đăng nhập cho Khách khỏi bấm 2 cái sinh lỗi Trùng Server, quay con BỌ Spinner.
- **`loginSuccess`**: Cắm `action.payload.user` và `token` lấp đầy State trên. Vứt Loading đi bằng F.
- **`loginFailure`**: Nhận Err từ Backend (Sai Pass), Hiện Toast đỏ, vứt Loading đi bằng F.
- **`logout`**: Reset cái Slice này nguyên trạng (Xoá Cokie LocalStorage luôn bằng Hook ngầm).

## 3. Cách Bắt State Chỗ Khác (`useSelector`)
Ở cái Avatar Nút Đăng Xuất cần Tên Thay vì chữ Login:
```tsx
const { user, token } = useSelector((state: RootState) => state.auth);
```
Nếu có Use -> Vẽ Chữ Hi, `user.name`!
Khỏi cần truyền Props dọc 3 tầng thư mục phức tạp.
