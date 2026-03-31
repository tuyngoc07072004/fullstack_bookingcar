# 📍 Components: Leaflet Map (Bản Đồ 2D)

Thành phần phức tạp nhất (Complex Component) nhưng mang lại hiệu ứng thị giác tuyệt lớn, giải quyết được bài toán GPS Tọa Độ. Được kết hợp bởi 2 lib: `leaflet` và `react-leaflet`.

## 1. Cấu trúc và Vòng đời (`RideMap.tsx`)
- Khởi tạo Container (vẽ cái hộp bản đồ 100% WxH trên màn hình).
- Nạp Base Layer nền từ OpenStreetMap (`TileLayer`). Một dịch vụ Map Free không bị đánh thuế như Google Maps.

## 2. Xử lý Logic Pick Up (Chọn điểm)
- `useMapEvents`: Lắng nghe cú click chuột của User trên React.
- State: `[pickup, setPickup]`, `[dropoff, setDropoff]`.
- Click Phát 1: Cụm Toạ Độ Trái Đất (Lat, Lng) nhét vảo Pickup. Tạo ra Marker Vị Trí A.
- Click Phát 2: Nhét vào Dropoff. Sinh Vị trí B (Destination).
- Logic Mở Rộng Địa Lý Geocoding (Fetch API Dịch Map Toạ độ ngược về Tên Đường cụ thể: `https://nominatim.openstreetmap.org/reverse`). Tự động nhét tên phố vào Form Khách Hàng cho đỡ phải gõ tay.

## 3. Auto Routing (Vẽ Đường Kẻ Nối - `MapClickHandler.tsx`)
- Khi có A và B, gọi Polyline (Bộ vẽ line màu xanh nước biển) tạo đường nối thẳng Haversine cắt địa hình.
- Công thức hàm `calculateDistance()` sẽ ôm 2 vĩ độ, 2 kinh độ, bán kính Trái đất (6371km) và nhả ra con số Km khoảng cách `(VD: 12.3 km)`. Con số tiền tệ chốt ván sẽ nảy sinh bắt nguồn từ con số này.
- Tính năng Tự Động Pan/Zoom Center Map đưa khung hình bao trọn cả A và B sau thao tác click.
