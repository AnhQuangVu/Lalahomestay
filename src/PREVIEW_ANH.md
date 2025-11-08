# 🖼️ Preview & Test Hệ Thống Ảnh

## 🎯 Xem Tất Cả Ảnh Đang Dùng

Hệ thống có **2 trang preview** để kiểm tra ảnh:

---

## 1️⃣ Preview Tất Cả Ảnh (Pool)

**URL**: `/images`

**Hiển thị**:
- ✅ **18 ảnh phòng** từ pool Unsplash
- ✅ **8 ảnh cơ sở** từ pool Unsplash
- ✅ Grid layout đẹp mắt
- ✅ Hover effect zoom in
- ✅ Số thứ tự mỗi ảnh
- ✅ Stats tổng hợp

**Mục đích**:
- Xem toàn bộ ảnh có sẵn trong hệ thống
- Kiểm tra ảnh có load được không
- Preview quality của ảnh
- Thêm/xóa/thay ảnh dễ dàng

**Screenshot**:
```
┌─────────────────────────────────────────┐
│  🖼️ Preview Tất Cả Ảnh                  │
├─────────────────────────────────────────┤
│  Ảnh Phòng (18 ảnh)                     │
│  ┌────┬────┬────┬────┐                 │
│  │ #1 │ #2 │ #3 │ #4 │                 │
│  ├────┼────┼────┼────┤                 │
│  │ #5 │ #6 │ #7 │ #8 │                 │
│  └────┴────┴────┴────┘                 │
│                                         │
│  Ảnh Cơ Sở (8 ảnh)                     │
│  ┌────┬────┬────┬────┐                 │
│  │ #1 │ #2 │ #3 │ #4 │                 │
│  └────┴────┴────┴────┘                 │
└─────────────────────────────────────────┘
```

---

## 2️⃣ Test Ảnh Phòng Thật (From Database)

**URL**: `/test-images`

**Hiển thị**:
- ✅ **3 cơ sở** từ database với ảnh đã gán
- ✅ **14 phòng** từ database với ảnh đã gán
- ✅ Thông tin chi tiết: Tên phòng, loại, giá, trạng thái
- ✅ ID của từng room/location
- ✅ Button refresh để reload data
- ✅ So sánh code cũ vs mới

**Mục đích**:
- Xem ảnh thực tế đang được dùng cho 14 phòng
- Verify hash algorithm hoạt động đúng
- Kiểm tra consistency (cùng ID → cùng ảnh)
- Debug nếu ảnh không hiển thị đúng

**Screenshot**:
```
┌─────────────────────────────────────────┐
│  🧪 Test Ảnh Phòng & Cơ Sở Thật        │
│  [🔄 Làm mới dữ liệu]                   │
├─────────────────────────────────────────┤
│  🏢 Cơ Sở (3 cơ sở)                    │
│  ┌──────────┬──────────┬──────────┐   │
│  │ Dương QH │  Kim Mã  │ Nghi Tàm │   │
│  │  [IMG]   │  [IMG]   │  [IMG]   │   │
│  └──────────┴──────────┴──────────┘   │
│                                         │
│  🏠 Phòng (14 phòng)                   │
│  ┌────┬────┬────┬────┐                │
│  │101 │102 │103 │104 │                │
│  │IMG │IMG │IMG │IMG │                │
│  │Mch │Mch │Pst │Pst │ ...            │
│  └────┴────┴────┴────┘                │
└─────────────────────────────────────────┘
```

---

## 🚀 Cách Sử Dụng

### Bước 1: Khởi tạo dữ liệu
Nếu chưa có phòng trong DB:
1. Vào `/setup`
2. Click "Khởi tạo dữ liệu mẫu"
3. Đợi tạo xong 14 phòng + 3 cơ sở

### Bước 2: Xem Preview Pool
1. Vào `/images`
2. Scroll xem 18 ảnh phòng + 8 ảnh cơ sở
3. Verify tất cả ảnh đều load được

### Bước 3: Test Ảnh Thật
1. Vào `/test-images`
2. Xem 14 phòng có ảnh chưa
3. Refresh vài lần → Verify ảnh không đổi (consistent)
4. Check ID và ảnh tương ứng

### Bước 4: Xem Giao Diện User
1. Vào `/` (HomePage)
   - Thấy 6 phòng nổi bật với ảnh
   - 3 cơ sở với ảnh

2. Vào `/booking` (BookingPage)
   - Thấy grid 14 phòng với ảnh
   - Filter và sort
   - Mỗi phòng có ảnh riêng

---

## 🔍 Kiểm Tra Chi Tiết

### Test Consistency
```bash
# Open console DevTools
# Vào /test-images
# Note ID của room đầu tiên và ảnh tương ứng
# Refresh trang 5 lần
# Verify: Cùng ID → Cùng ảnh ✅
```

### Test Pool Size
```javascript
import { ROOM_IMAGES, LOCATION_IMAGES } from './utils/imageUtils';

console.log('Room images:', ROOM_IMAGES.length);  // 18
console.log('Location images:', LOCATION_IMAGES.length);  // 8
```

### Test Hash Function
```javascript
import { getRoomImage } from './utils/imageUtils';

console.log(getRoomImage('abc123'));  // Same result every time
console.log(getRoomImage('def456'));  // Different from above
```

---

## 📊 Thống Kê

| Metric | Giá Trị |
|--------|---------|
| Tổng ảnh trong pool | 26 (18+8) |
| Phòng trong DB | 14 |
| Cơ sở trong DB | 3 |
| Coverage | 100% (mọi phòng có ảnh) |
| Size per image | ~200-500KB |
| Format | JPG (Unsplash) |
| Resolution | 800px (rooms), 1080px (locations) |

---

## ✅ Checklist Kiểm Tra

Trước khi deploy, đảm bảo:

- [ ] `/images` load tất cả 26 ảnh
- [ ] `/test-images` hiển thị 14 phòng với ảnh
- [ ] `/test-images` hiển thị 3 cơ sở với ảnh
- [ ] HomePage hiển thị 6 phòng nổi bật
- [ ] BookingPage hiển thị grid 14 phòng
- [ ] Refresh không làm ảnh thay đổi (consistent)
- [ ] Mọi ảnh có alt text
- [ ] Console không có lỗi 404

---

## 🐛 Troubleshooting

### Ảnh không hiển thị?
```bash
# 1. Check console errors
# 2. Verify Unsplash URLs
# 3. Check network tab (blocked?)
# 4. Try different browser
```

### Ảnh sai/lỗi?
```typescript
// Fallback được built-in sẵn
<img 
  src={getRoomImage(room.id)}
  onError={(e) => {
    e.target.src = 'https://fallback-url.jpg';
  }}
/>
```

### Muốn thay ảnh?
```typescript
// Vào /utils/imageUtils.tsx
export const ROOM_IMAGES = [
  'url-moi-1',
  'url-moi-2',
  // ... thêm hoặc thay URLs
];
```

---

## 🎨 Customize

### Thêm Ảnh Mới
1. Tìm ảnh đẹp trên [Unsplash](https://unsplash.com)
2. Copy link, thêm `?w=800`
3. Paste vào `ROOM_IMAGES` trong `/utils/imageUtils.tsx`
4. Test tại `/images`

### Thay Đổi Logic
```typescript
// Random thật (không consistent)
export function getRoomImage(id: string): string {
  return ROOM_IMAGES[Math.floor(Math.random() * ROOM_IMAGES.length)];
}

// Theo concept name
const map = { 'matcha': url1, 'pastel': url2 };
export function getRoomImage(conceptName: string): string {
  return map[conceptName] || ROOM_IMAGES[0];
}
```

---

## 📱 Routes Summary

| URL | Mục Đích | Ai Dùng |
|-----|----------|---------|
| `/images` | Xem pool 26 ảnh | Dev/QA |
| `/test-images` | Test 14 phòng từ DB | Dev/QA |
| `/` | HomePage user | Customer |
| `/booking` | Đặt phòng | Customer |
| `/admin/rooms` | Quản lý phòng | Admin |

---

**Cập nhật**: 08/11/2025  
**Version**: 1.2.1  
**Tác giả**: LaLa House Team
