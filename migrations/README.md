# Database Migrations - LaLa House

## Hướng dẫn chạy migrations

### Cách 1: Chạy trực tiếp trên Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Copy nội dung file SQL từ folder `migrations/`
5. Paste vào editor và click **Run**

### Cách 2: Sử dụng Supabase CLI
```bash
# Cài đặt Supabase CLI (nếu chưa có)
npm install -g supabase

# Link project của bạn
supabase link --project-ref YOUR_PROJECT_REF

# Chạy migration
supabase db push

# Hoặc chạy file cụ thể
psql $DATABASE_URL -f migrations/add_room_images.sql
```

### Cách 3: Sử dụng psql command line
```bash
# Lấy connection string từ Supabase Dashboard > Settings > Database
# Thay YOUR_CONNECTION_STRING bằng connection string thật
psql "YOUR_CONNECTION_STRING" -f migrations/add_room_images.sql
```

## Danh sách migrations

### `add_room_images.sql` - Thêm cột ảnh cho bảng phòng
**Ngày tạo**: 2025-11-17

**Mô tả**: 
- Thêm cột `anh_chinh` (text) - URL ảnh chính của phòng
- Thêm cột `anh_phu` (text[]) - Mảng URLs ảnh phụ/gallery của phòng
- Ảnh được lưu trên Cloudinary và chỉ lưu URL trong database

**Tác động**:
- Không ảnh hưởng đến dữ liệu hiện tại (cột nullable)
- Schema sau khi chạy:
  ```sql
  phong (
    id uuid PRIMARY KEY,
    ma_phong text UNIQUE NOT NULL,
    id_loai_phong uuid REFERENCES loai_phong(id),
    trang_thai text DEFAULT 'trong',
    tinh_trang_vesinh text DEFAULT 'sach',
    anh_chinh text NULL,              -- MỚI
    anh_phu text[] DEFAULT '{}',      -- MỚI
    ghi_chu text NULL
  )
  ```

**Rollback** (nếu cần):
```sql
ALTER TABLE public.phong DROP COLUMN IF EXISTS anh_chinh;
ALTER TABLE public.phong DROP COLUMN IF EXISTS anh_phu;
```

## Kiểm tra sau khi chạy migration

```sql
-- Kiểm tra cột đã được thêm
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'phong' 
AND column_name IN ('anh_chinh', 'anh_phu');

-- Test insert với ảnh
INSERT INTO phong (ma_phong, id_loai_phong, anh_chinh, anh_phu)
VALUES (
  'TEST-999',
  (SELECT id FROM loai_phong LIMIT 1),
  'https://res.cloudinary.com/test/main.jpg',
  ARRAY['https://res.cloudinary.com/test/gallery1.jpg', 'https://res.cloudinary.com/test/gallery2.jpg']
);

-- Xóa test data
DELETE FROM phong WHERE ma_phong = 'TEST-999';
```

## Lưu ý quan trọng

1. **Backup trước khi chạy**: Luôn backup database trước khi chạy migration
2. **Môi trường staging**: Test migration trên staging trước khi apply lên production
3. **Server functions**: Sau khi chạy migration, cần deploy server functions đã cập nhật
4. **Cloudinary config**: Đảm bảo upload preset `lalahome_cccd` cho phép upload ảnh phòng

## Triển khai server functions (sau khi chạy migration)

```bash
# Deploy server functions lên Supabase
supabase functions deploy make-server-faeb1932

# Hoặc deploy từ Supabase Dashboard:
# 1. Vào Functions > Upload function
# 2. Upload folder src/supabase/functions/server/
```
