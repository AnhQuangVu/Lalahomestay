# LaLa House Database Schema

## Bảng: `phong` (Phòng)

### Schema hiện tại (sau migration `add_room_images.sql`)

```sql
CREATE TABLE public.phong (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ma_phong text NOT NULL,
  id_loai_phong uuid NULL,
  trang_thai text NULL DEFAULT 'trong'::text,
  tinh_trang_vesinh text NULL DEFAULT 'sach'::text,
  anh_chinh text NULL,                    -- ✨ MỚI: URL ảnh chính (Cloudinary)
  anh_phu text[] NULL DEFAULT '{}',       -- ✨ MỚI: Mảng URLs ảnh phụ/gallery (Cloudinary)
  ghi_chu text NULL,
  
  CONSTRAINT phong_pkey PRIMARY KEY (id),
  CONSTRAINT phong_ma_phong_key UNIQUE (ma_phong),
  CONSTRAINT phong_id_loai_phong_fkey FOREIGN KEY (id_loai_phong) 
    REFERENCES loai_phong (id) ON DELETE CASCADE,
  CONSTRAINT phong_trang_thai_check CHECK (
    trang_thai = ANY (ARRAY[
      'trong'::text,
      'dang_dung'::text,
      'sap_nhan'::text,
      'sap_tra'::text,
      'bao_tri'::text,
      'dinh_chi'::text
    ])
  )
) TABLESPACE pg_default;
```

### Các trường (Fields)

| Tên trường | Kiểu | Nullable | Mặc định | Mô tả |
|------------|------|----------|----------|-------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `ma_phong` | text | NO | - | Mã phòng (unique), ví dụ: "101", "A12" |
| `id_loai_phong` | uuid | YES | NULL | Foreign key tới `loai_phong` (concept/category) |
| `trang_thai` | text | YES | `'trong'` | Trạng thái phòng: `trong`, `dang_dung`, `sap_nhan`, `sap_tra`, `bao_tri`, `dinh_chi` |
| `tinh_trang_vesinh` | text | YES | `'sach'` | Tình trạng vệ sinh: `sach`, `dang_don`, `chua_don` |
| **`anh_chinh`** | **text** | **YES** | **NULL** | **URL ảnh chính phòng (Cloudinary)** |
| **`anh_phu`** | **text[]** | **YES** | **`'{}'`** | **Mảng URLs ảnh gallery (Cloudinary)** |
| `ghi_chu` | text | YES | NULL | Ghi chú thêm |

### Ràng buộc (Constraints)

- **Primary Key**: `id`
- **Unique**: `ma_phong`
- **Foreign Key**: `id_loai_phong` → `loai_phong(id)` ON DELETE CASCADE
- **Check**: `trang_thai` phải thuộc danh sách cho phép

### Indexes (tự động)

- Primary key index trên `id`
- Unique index trên `ma_phong`
- Foreign key index trên `id_loai_phong`

---

## Ví dụ dữ liệu

### Phòng không có ảnh (fallback sang random images)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "ma_phong": "101",
  "id_loai_phong": "abc-def-...",
  "trang_thai": "trong",
  "tinh_trang_vesinh": "sach",
  "anh_chinh": null,
  "anh_phu": [],
  "ghi_chu": null
}
```

### Phòng có ảnh chính và gallery
```json
{
  "id": "234e5678-e89b-12d3-a456-426614174001",
  "ma_phong": "A12",
  "id_loai_phong": "abc-def-...",
  "trang_thai": "dang_dung",
  "tinh_trang_vesinh": "chua_don",
  "anh_chinh": "https://res.cloudinary.com/dumxzdunu/image/upload/v1234/rooms/room-a12-main.jpg",
  "anh_phu": [
    "https://res.cloudinary.com/dumxzdunu/image/upload/v1234/rooms/room-a12-1.jpg",
    "https://res.cloudinary.com/dumxzdunu/image/upload/v1234/rooms/room-a12-2.jpg",
    "https://res.cloudinary.com/dumxzdunu/image/upload/v1234/rooms/room-a12-3.jpg"
  ],
  "ghi_chu": "Phòng view đẹp"
}
```

---

## API Endpoints sử dụng bảng này

### 1. GET `/make-server-faeb1932/phong` - Lấy danh sách phòng
**Response** bao gồm `anh_chinh` và `anh_phu`:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "ma_phong": "101",
      "anh_chinh": "https://...",
      "anh_phu": ["https://...", "https://..."],
      "loai_phong": { ... },
      ...
    }
  ]
}
```

### 2. POST `/make-server-faeb1932/phong` - Tạo phòng mới
**Request body** chấp nhận:
```json
{
  "ma_phong": "102",
  "id_loai_phong": "uuid-here",
  "trang_thai": "trong",
  "tinh_trang_vesinh": "sach",
  "anh_chinh": "https://res.cloudinary.com/.../main.jpg",
  "anh_phu": [
    "https://res.cloudinary.com/.../gallery1.jpg",
    "https://res.cloudinary.com/.../gallery2.jpg"
  ],
  "ghi_chu": "Phòng mới"
}
```

### 3. PUT `/make-server-faeb1932/phong/:id` - Cập nhật phòng
**Request body** tương tự POST, có thể bỏ qua trường không cần update.

### 4. DELETE `/make-server-faeb1932/phong/:id` - Xóa phòng
Cascade sẽ xóa các booking liên quan nếu có ràng buộc.

---

## Frontend Usage

### Upload và lưu ảnh
```typescript
// 1. Upload file lên Cloudinary
import { uploadToCloudinary } from '@/utils/cloudinary';

const mainImageUrl = await uploadToCloudinary(mainImageFile, 'rooms');
const galleryUrls = await Promise.all(
  galleryFiles.map(f => uploadToCloudinary(f, 'rooms'))
);

// 2. Gửi request tạo/update phòng với URLs
const response = await fetch(`${API_URL}/phong`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    ma_phong: '103',
    id_loai_phong: selectedConceptId,
    anh_chinh: mainImageUrl,
    anh_phu: galleryUrls,
    // ... other fields
  })
});
```

### Hiển thị ảnh (với fallback)
```typescript
import { getRoomImage, getRoomImages } from '@/utils/imageUtils';

// Ưu tiên ảnh đã lưu, fallback sang random nếu không có
const displayImage = room.anh_chinh || getRoomImage(room.id);
const galleryImages = room.anh_phu?.length > 0 
  ? room.anh_phu 
  : getRoomImages(room.id, 4);
```

---

## Migration History

| Ngày | Migration | Mô tả |
|------|-----------|-------|
| 2025-11-17 | `add_room_images.sql` | Thêm cột `anh_chinh` (text) và `anh_phu` (text[]) |

## Notes

- **Storage**: Ảnh không lưu trong database, chỉ lưu URL từ Cloudinary.
- **Performance**: Text và text[] index hiệu quả, không ảnh hưởng performance.
- **Backward compatible**: Cột nullable nên không breaking existing data.
- **Fallback**: Frontend có logic fallback sang ảnh random nếu `anh_chinh`/`anh_phu` null/empty.
