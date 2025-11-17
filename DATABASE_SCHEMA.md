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
| 2025-11-17 | `add_room_images.sql` | Thêm cột `anh_chinh` (text) và `anh_phu` (text[]) vào bảng `phong` |
| 2025-11-17 | `add_dinh_chi_status.sql` | Thêm trạng thái 'dinh_chi' vào CHECK constraint của `phong.trang_thai` |
| 2025-11-17 | `add_customer_cccd_images.sql` | Thêm cột `cccd_mat_truoc` và `cccd_mat_sau` vào bảng `khach_hang` |
| 2025-11-17 | `add_location_images.sql` | Thêm cột `anh_dai_dien` (text) và `anh_phu` (text[]) vào bảng `co_so` |

---

## Bảng: `co_so` (Cơ sở / Chi nhánh)

### Schema hiện tại (sau migration `add_location_images.sql`)

```sql
CREATE TABLE public.co_so (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ten_co_so text NOT NULL,
  dia_chi text NULL,
  hotline text NULL,
  mo_ta text NULL,
  trang_thai boolean NULL DEFAULT true,
  anh_dai_dien text NULL,                -- ✨ MỚI: URL ảnh đại diện cơ sở (Cloudinary)
  anh_phu text[] NULL DEFAULT '{}',      -- ✨ MỚI: Mảng URLs ảnh gallery cơ sở (Cloudinary)
  
  CONSTRAINT co_so_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
```

### Các trường (Fields)

| Tên trường | Kiểu | Nullable | Mặc định | Mô tả |
|------------|------|----------|----------|-------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `ten_co_so` | text | NO | - | Tên cơ sở/chi nhánh, ví dụ: "LaLa House Quận 1", "LaLa House Thủ Đức" |
| `dia_chi` | text | YES | NULL | Địa chỉ cơ sở |
| `hotline` | text | YES | NULL | Số điện thoại hotline |
| `mo_ta` | text | YES | NULL | Mô tả chi tiết về cơ sở |
| `trang_thai` | boolean | YES | `true` | Trạng thái hoạt động: `true` = đang hoạt động, `false` = ngừng |
| **`anh_dai_dien`** | **text** | **YES** | **NULL** | **URL ảnh đại diện cơ sở (Cloudinary)** |
| **`anh_phu`** | **text[]** | **YES** | **`'{}'`** | **Mảng URLs ảnh gallery cơ sở (Cloudinary)** |

### Ràng buộc (Constraints)

- **Primary Key**: `id`

### API Usage (Frontend)

```typescript
// Thêm cơ sở mới với ảnh
const newLocation = {
  ten_co_so: "LaLa House Quận 1",
  dia_chi: "123 Đường ABC, Quận 1, TP.HCM",
  hotline: "0900123456",
  mo_ta: "Cơ sở chính nằm ngay trung tâm quận 1",
  trang_thai: true,
  anh_dai_dien: "https://res.cloudinary.com/.../location-main.jpg",
  anh_phu: ["https://res.cloudinary.com/.../gallery1.jpg", "https://res.cloudinary.com/.../gallery2.jpg"]
};

// POST /co-so
const response = await fetch(`${API_URL}/co-so`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': publicAnonKey },
  body: JSON.stringify(newLocation)
});
```

---

## Bảng: `khach_hang` (Khách hàng)

### Schema hiện tại (sau migration `add_customer_cccd_images.sql`)

```sql
CREATE TABLE public.khach_hang (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_id uuid NULL,
  ho_ten text NOT NULL,
  sdt text NOT NULL,
  email text NULL,
  dia_chi text NULL,
  ghi_chu text NULL,
  ngay_tao timestamp without time zone NULL DEFAULT now(),
  cccd_mat_truoc text NULL,              -- ✨ MỚI: URL ảnh CCCD mặt trước (Cloudinary)
  cccd_mat_sau text NULL,                -- ✨ MỚI: URL ảnh CCCD mặt sau (Cloudinary)
  
  CONSTRAINT khach_hang_pkey PRIMARY KEY (id),
  CONSTRAINT khach_hang_auth_id_fkey FOREIGN KEY (auth_id) 
    REFERENCES auth.users (id) ON DELETE SET NULL
) TABLESPACE pg_default;
```

### Các trường (Fields)

| Tên trường | Kiểu | Nullable | Mặc định | Mô tả |
|------------|------|----------|----------|-------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `auth_id` | uuid | YES | NULL | Foreign key tới `auth.users` (nếu có tài khoản) |
| `ho_ten` | text | NO | - | Họ và tên khách hàng |
| `sdt` | text | NO | - | Số điện thoại |
| `email` | text | YES | NULL | Email |
| `dia_chi` | text | YES | NULL | Địa chỉ |
| `ghi_chu` | text | YES | NULL | Ghi chú |
| `ngay_tao` | timestamp | YES | `now()` | Ngày tạo |
| **`cccd_mat_truoc`** | **text** | **YES** | **NULL** | **URL ảnh CCCD mặt trước (Cloudinary)** |
| **`cccd_mat_sau`** | **text** | **YES** | **NULL** | **URL ảnh CCCD mặt sau (Cloudinary)** |

### Ví dụ dữ liệu

```json
{
  "id": "abc-123-...",
  "auth_id": null,
  "ho_ten": "Nguyễn Văn A",
  "sdt": "0912345678",
  "email": "nguyenvana@email.com",
  "dia_chi": "Hà Nội",
  "ghi_chu": "Khách VIP",
  "ngay_tao": "2025-11-17T10:00:00Z",
  "cccd_mat_truoc": "https://res.cloudinary.com/dumxzdunu/image/upload/v1234/customers/cccd-front-123.jpg",
  "cccd_mat_sau": "https://res.cloudinary.com/dumxzdunu/image/upload/v1234/customers/cccd-back-123.jpg"
}
```

---

## Migration History

| Ngày | Migration | Mô tả |
|------|-----------|-------|
| 2025-11-17 | `add_room_images.sql` | Thêm cột `anh_chinh` (text) và `anh_phu` (text[]) vào bảng `phong` |
| 2025-11-17 | `add_dinh_chi_status.sql` | Thêm trạng thái 'dinh_chi' vào CHECK constraint của `phong.trang_thai` |
| 2025-11-17 | `add_customer_cccd_images.sql` | Thêm cột `cccd_mat_truoc` và `cccd_mat_sau` vào bảng `khach_hang` |

## Notes

- **Storage**: Ảnh không lưu trong database, chỉ lưu URL từ Cloudinary.
- **Performance**: Text và text[] index hiệu quả, không ảnh hưởng performance.
- **Backward compatible**: Cột nullable nên không breaking existing data.
- **Fallback**: Frontend có logic fallback sang ảnh random nếu `anh_chinh`/`anh_phu` null/empty.
