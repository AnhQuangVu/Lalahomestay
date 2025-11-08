# 📋 DANH SÁCH TRẠNG THÁI CHUẨN - LALA HOUSE

**Quan trọng**: File này định nghĩa tất cả các trạng thái chuẩn trong database. Khi code, PHẢI sử dụng đúng các giá trị này.

---

## 🏨 TRẠNG THÁI ĐẶT PHÒNG (dat_phong.trang_thai)

| Trạng thái | Giá trị Database | Mô tả | Màu hiển thị |
|------------|------------------|-------|--------------|
| **Đã cọc** | `da_coc` | Khách đã đặt cọc, chờ nhận phòng | 🟡 Yellow |
| **Đã thanh toán** | `da_tt` | Đã thanh toán đầy đủ, chờ nhận phòng | 🟢 Green |
| **Đã nhận phòng** | `checkin` | Khách đang ở | 🔵 Blue |
| **Đã trả phòng** | `checkout` | Đã hoàn tất | ⚫ Gray |
| **Đã hủy** | `da_huy` | Đơn đã bị hủy | 🔴 Red |

### ⚠️ LƯU Ý QUAN TRỌNG
- **ĐÚNG**: `da_huy` (có dấu gạch dưới)
- **SAI**: `huy` ❌
- **SAI**: `da-huy` ❌

### Luồng chuyển trạng thái
```
[Khách đặt phòng] 
    → da_coc (cọc 500k) 
    → da_tt (thanh toán còn lại)
    → checkin (nhận phòng)
    → checkout (trả phòng)

[Hủy bỏ]
    → da_huy (có thể hủy ở bất kỳ giai đoạn nào trước checkin)
```

---

## 🚪 TRẠNG THÁI PHÒNG (phong.trang_thai)

| Trạng thái | Giá trị Database | Mô tả |
|------------|------------------|-------|
| **Trống** | `trong` | Phòng sẵn sàng cho thuê |
| **Đang dùng** | `dang_dung` | Có khách đang ở |
| **Sắp nhận** | `sap_nhan` | Đã có booking, sắp check-in |
| **Bảo trì** | `bao_tri` | Đang sửa chữa, không cho thuê |
| **Dọn dẹp** | `don_dep` | Đang vệ sinh sau khi khách trả |

---

## 💰 TRẠNG THÁI THANH TOÁN (thanh_toan.trang_thai)

| Trạng thái | Giá trị Database | Mô tả |
|------------|------------------|-------|
| **Thành công** | `thanh_cong` | Thanh toán hoàn tất |
| **Thất bại** | `that_bai` | Giao dịch không thành công |
| **Chờ xử lý** | `cho_xu_ly` | Đang chờ xác nhận từ ngân hàng |

---

## 👤 VAI TRÒ TÀI KHOẢN (tai_khoan.vai_tro)

| Vai trò | Giá trị Database | Quyền hạn |
|---------|------------------|-----------|
| **Quản trị** | `quan_tri` | Full quyền, truy cập Admin |
| **Lễ tân** | `le_tan` | Quản lý đặt phòng, khách hàng |

---

## 📝 KÊNH ĐẶT PHÒNG (dat_phong.kenh_dat)

| Kênh | Giá trị Database | Mô tả |
|------|------------------|-------|
| Walk-in | `walk_in` | Khách đến trực tiếp |
| Điện thoại | `phone` | Gọi điện đặt |
| Website | `website` | Đặt qua website LaLa House |
| Facebook | `facebook` | Đặt qua Facebook |
| Zalo | `zalo` | Đặt qua Zalo |
| Booking.com | `booking_com` | Qua OTA Booking.com |
| Agoda | `agoda` | Qua OTA Agoda |
| Khác | `khac` | Kênh khác |

---

## 🔧 VỆ SINH PHÒNG (phong.tinh_trang_vesinh)

| Tình trạng | Giá trị | Mô tả |
|-----------|---------|-------|
| Sạch sẽ | `sach_se` | Đã vệ sinh, sẵn sàng |
| Cần dọn | `can_don` | Cần vệ sinh |
| Đang dọn | `dang_don` | Nhân viên đang dọn |

---

## 💡 MẸO KHI CODE

### ✅ ĐÚNG - Sử dụng trong code

```typescript
// Filter booking status
bookings.filter(b => b.trang_thai !== 'da_huy')  // ✅ ĐÚNG

// Check if cancelled
if (booking.trang_thai === 'da_huy') {  // ✅ ĐÚNG
  // Handle cancelled
}

// Check if checked in
if (booking.trang_thai === 'checkin') {  // ✅ ĐÚNG
  // Handle check-in
}
```

### ❌ SAI - Không dùng

```typescript
// WRONG STATUS NAMES
bookings.filter(b => b.trang_thai !== 'huy')  // ❌ SAI
if (booking.trang_thai === 'cancelled') {  // ❌ SAI
if (booking.trang_thai === 'da-huy') {  // ❌ SAI (dấu gạch ngang)
```

---

## 🎯 CHECKLIST TÍNH TOÁN DOANH THU

Khi tính doanh thu, **LUÔN LUÔN** exclude các đơn đã hủy:

```typescript
const totalRevenue = bookings
  .filter(b => b.trang_thai !== 'da_huy')  // ✅ Loại bỏ đơn hủy
  .reduce((sum, b) => sum + (b.tong_tien || 0), 0);
```

### Các đơn được tính vào doanh thu:
- ✅ `da_coc` - Đã cọc
- ✅ `da_tt` - Đã thanh toán
- ✅ `checkin` - Đang ở
- ✅ `checkout` - Đã trả phòng

### Các đơn KHÔNG tính vào doanh thu:
- ❌ `da_huy` - Đã hủy (tiền cọc có thể hoàn lại)

---

## 🐛 CÁC LỖI THƯỜNG GẶP ĐÃ SỬA

### 1. ❌ Lỗi: Doanh thu DatabaseViewer ≠ Reports
**Nguyên nhân**: `getStatistics()` dùng filter `'huy'` thay vì `'da_huy'`
**Đã sửa**: Thống nhất dùng `'da_huy'`

### 2. ❌ Lỗi: Badge màu sai cho đơn hủy
**Nguyên nhân**: Check `trang_thai === 'huy'` thay vì `'da_huy'`
**Đã sửa**: Dùng đúng `'da_huy'`

### 3. ❌ Lỗi: Không filter được đơn hủy
**Nguyên nhân**: Typo trong tên trạng thái
**Giải pháp**: Tham khảo file này

---

## 📊 DATABASE SCHEMA REFERENCE

### Table: dat_phong
```sql
CREATE TYPE trang_thai_dat_phong AS ENUM (
  'da_coc',      -- Đã cọc
  'da_tt',       -- Đã thanh toán
  'checkin',     -- Đã nhận phòng
  'checkout',    -- Đã trả phòng
  'da_huy'       -- Đã hủy
);

CREATE TABLE dat_phong (
  id UUID PRIMARY KEY,
  ma_dat VARCHAR(20) UNIQUE,
  trang_thai trang_thai_dat_phong DEFAULT 'da_coc',
  tong_tien NUMERIC(10,0),
  coc_csvc NUMERIC(10,0) DEFAULT 500000,
  -- ... other fields
);
```

### Table: phong
```sql
CREATE TYPE trang_thai_phong AS ENUM (
  'trong',       -- Trống
  'dang_dung',   -- Đang dùng
  'sap_nhan',    -- Sắp nhận
  'bao_tri',     -- Bảo trì
  'don_dep'      -- Dọn dẹp
);

CREATE TABLE phong (
  id UUID PRIMARY KEY,
  ma_phong VARCHAR(10) UNIQUE,
  trang_thai trang_thai_phong DEFAULT 'trong',
  tinh_trang_vesinh VARCHAR(20) DEFAULT 'sach_se',
  -- ... other fields
);
```

---

## 🔍 CÁCH KIỂM TRA

### Test trong browser console:
```javascript
// Fetch bookings
const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/make-server-faeb1932/dat-phong',
  { headers: { 'Authorization': 'Bearer YOUR_KEY' }}
);
const data = await response.json();

// Check status values
console.log('All statuses:', [...new Set(data.data.map(b => b.trang_thai))]);
// Expected output: ['da_coc', 'da_tt', 'checkin', 'checkout', 'da_huy']
```

---

## 📅 CẬP NHẬT

- **Ngày tạo**: 08/11/2024
- **Phiên bản**: 1.0
- **Người tạo**: System
- **Lần sửa cuối**: 08/11/2024 - Fix doanh thu inconsistency

---

## 🚨 QUY TẮC VÀNG

1. **LUÔN** tham khảo file này khi làm việc với trạng thái
2. **KHÔNG BAO GIỜ** tự ý đặt tên trạng thái mới
3. **KIỂM TRA KỸ** dấu gạch dưới `_` vs dấu gạch ngang `-`
4. **TEST** với dữ liệu thật từ database
5. **CẬP NHẬT** file này nếu có thay đổi schema

---

*File này là nguồn chân lý duy nhất (Single Source of Truth) cho tất cả các giá trị trạng thái trong hệ thống LaLa House.*
