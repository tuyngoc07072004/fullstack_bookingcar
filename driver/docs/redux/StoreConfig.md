# 📦 Redux: Cấu Hình Store (Data Của Cả Hệ Thống)

Redux Toolkit (RTK) được triển khai như Một Trái Tim Quản Lý Biến Global. Tất cả mọi thông tin cần xài chung ở cả Header, Component Con, Footer đều nhét vào khối `store.ts`.

## 1. Thiết Lập Gốc (`store.ts`)
- Cục Não bộ Store Import tất cả các "Khúc Cắt" (`Slices`) và API Endpoints (`setupListeners` của RTK Query nếu tích hợp).
- Bơm khối bộ não này vào bằng cách wrap ở file Root Component (`main.tsx`):
```tsx
import { Provider } from 'react-redux';
import { store } from './redux/store';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

## 2. Redux Logger (Middleware Thêm)
Được setup tại Middleware array của RTK (Chế độ Node `development`), cho phép Inspect trên Browser F12 theo dõi Action: Khi nào Dispatch lên, Payload mang data chữ gì. Rất dễ debug lỗi màn vỡ Data.

## 3. Storage Persist
- Thay vì để Refresh F5 Bay sạch dữ liệu, Token Auth được dùng Hook hoặc gói Redux Persist để nhúng xuống LocalStorage Web Browser tự động, mở trình duyệt lên là Đăng nhập sẵn.
