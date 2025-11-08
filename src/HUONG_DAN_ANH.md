# 🖼️ Hướng dẫn quản lý ảnh trong LaLa House

## Tổng quan

Hệ thống sử dụng **18 ảnh phòng** và **8 ảnh cơ sở** từ Unsplash, được quản lý tập trung trong `/utils/imageUtils.tsx`.

Mỗi phòng/cơ sở sẽ được gán **ảnh cố định** dựa trên ID, đảm bảo tính nhất quán khi render nhiều lần.

---

## 📁 File quản lý ảnh

**`/utils/imageUtils.tsx`**

Chứa:
- `ROOM_IMAGES`: Mảng 18 URL ảnh phòng homestay đẹp
- `LOCATION_IMAGES`: Mảng 8 URL ảnh cơ sở/homestay exterior
- `getRoomImage(id)`: Hàm lấy ảnh phòng dựa trên ID
- `getLocationImage(id)`: Hàm lấy ảnh cơ sở dựa trên ID
- `formatCurrency(amount)`: Format tiền VND
- `formatDateTime(date, format)`: Format ngày giờ kiểu Việt Nam

---

## 🎯 Cách hoạt động

### 1. Hash-based Image Selection

```typescript
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

- Hash ID thành số nguyên
- Mod với độ dài mảng để chọn index
- **Kết quả**: Cùng ID → Cùng ảnh (nhất quán)

### 2. Sử dụng trong component

```tsx
import { getRoomImage, getLocationImage, formatCurrency } from '../../utils/imageUtils';

// Trong component
<img src={getRoomImage(room.id)} alt={room.ma_phong} />
<img src={getLocationImage(location.id)} alt={location.ten_co_so} />
<p>{formatCurrency(room.loai_phong?.gia_gio)}</p>
```

---

## 📍 Các component đang dùng

### Giao diện khách hàng
- **HomePage** (`/components/customer/HomePage.tsx`)
  - Phòng nổi bật: `getRoomImage(room.id)`
  - Danh sách cơ sở: `getLocationImage(location.id)`
  
- **BookingPage** (`/components/customer/BookingPage.tsx`)
  - Grid 14 phòng: `getRoomImage(room.id)`
  - Pricing: `formatCurrency(price)`

---

## 🔄 Thay đổi danh sách ảnh

### Thêm ảnh mới

1. Vào `/utils/imageUtils.tsx`
2. Thêm URL vào `ROOM_IMAGES` hoặc `LOCATION_IMAGES`:

```typescript
export const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-XXX?w=800',
  'https://images.unsplash.com/photo-YYY?w=800',
  // Thêm ảnh mới ở đây
  'https://images.unsplash.com/photo-ZZZ?w=800',
];
```

3. Không cần sửa component nào khác!

### Tìm ảnh từ Unsplash

1. Vào [unsplash.com](https://unsplash.com)
2. Search: "hotel room", "homestay bedroom", "cozy interior"
3. Click ảnh → Share → Copy Link
4. Thêm `?w=800` vào cuối URL (optimize size)

Ví dụ:
```
https://images.unsplash.com/photo-1234567890?w=800
```

---

## 🎨 Ảnh hiện tại

### ROOM_IMAGES (18 ảnh)
- Modern minimalist bedrooms
- Cozy pastel rooms
- Vintage retro interiors
- Luxury hotel suites
- Contemporary homestay designs

### LOCATION_IMAGES (8 ảnh)
- Homestay exteriors
- Modern building facades
- Urban residential architecture
- Hanoi cityscape views

---

## ⚡ Performance Tips

1. **Đã optimize size**: Tất cả ảnh dùng `?w=800` hoặc `?w=1080`
2. **Lazy loading**: Browser tự động lazy load với native `<img>` tag
3. **Consistent hashing**: Không cần re-fetch hay regenerate

---

## 🔧 Troubleshooting

### Ảnh không hiển thị?
- Check console errors
- Verify Unsplash URL còn valid
- Thử thay URL ảnh khác

### Muốn ảnh random thật sự?
Thay hash logic thành `Math.random()`:
```typescript
export function getRoomImage(identifier: string): string {
  const index = Math.floor(Math.random() * ROOM_IMAGES.length);
  return ROOM_IMAGES[index];
}
```
⚠️ Lưu ý: Ảnh sẽ thay đổi mỗi lần re-render!

### Muốn map ảnh theo tên concept?
```typescript
const conceptImageMap: any = {
  'matcha': 'https://...',
  'pastel': 'https://...',
  'retro': 'https://...'
};

export function getRoomImage(conceptName: string): string {
  return conceptImageMap[conceptName.toLowerCase()] || ROOM_IMAGES[0];
}
```

---

## 📝 Best Practices

✅ **DO:**
- Dùng `getRoomImage(id)` cho tính nhất quán
- Import từ `utils/imageUtils`
- Thêm ảnh chất lượng cao từ Unsplash
- Optimize size với `?w=800`

❌ **DON'T:**
- Hardcode URL ảnh trong component
- Dùng Math.random() cho production
- Quên alt text cho accessibility
- Upload ảnh quá lớn (>500KB)

---

## 🚀 Mở rộng tương lai

### Tích hợp với Supabase Storage
```typescript
// Upload ảnh thật từ admin panel
export async function uploadRoomImage(file: File, roomId: string) {
  const { data, error } = await supabase.storage
    .from('room-images')
    .upload(`${roomId}/${file.name}`, file);
  
  if (error) throw error;
  return data.path;
}
```

### CDN caching
- Thêm CDN như Cloudflare Images
- Optimize với WebP format
- Implement image transformations

---

**Cập nhật lần cuối**: 8/11/2025  
**Tác giả**: LaLa House Development Team
