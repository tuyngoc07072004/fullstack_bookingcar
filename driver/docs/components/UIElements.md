# 🎛️ Components: UI Elements (Thẻ Tái Sử Dụng)

Được code tách tệp nhỏ nhất để Staff Trang, hay Khách Hàng Trang gọi lại Component bằng Import 1 dòng là dùng luôn. Không cần xây dựng lại HTML và TailwindCSS.

- **`Button.tsx`**: Khối nút Bấm. Hỗ trợ Variants: `Primary` (Xanh biển nổ bật Mắt Nhất), `Secondary` (Trắng viền xám rỗng), `Danger` (Nút màu đỏ xoá, từ chối, huỷ, block người dùng). Hỗ trợ Trạng Thái Loading Quay Tròn Spinner trong nút.
- **`Input.tsx`**: Chứa Title, Placeholder, Error Label Warning (Hiện màu đỏ viền khi User điền chữ vào cột số).
- **`Modal.tsx`**: Thẻ Popup Nhấn Đen màn Hình lồi Box thoại lên (Dùng cho Form Nhập liệu Ghép Xe Staff). React Portal gọi lớp Overlay Z-index rất cao ép nổi đè 100% App đằng sau.
- **`Badge.tsx`**: Khúc Component Hình Thuốc Nhộng (Pill). Viền tròn mỏng. Render màu sắc Động Theo Trạng Thái (VD: Thả Object `"pending"` vào tự nở ra Vàng, thả `"assigned"` vào nó Nở Ra Cam). Hàm `getStatusColor()` trong bộ ruột.
- **`LoadingSpinner`**: Animation xoay 360 độ (Tailwind `animate-spin`). Bọc lúc Loading chờ API trả.
