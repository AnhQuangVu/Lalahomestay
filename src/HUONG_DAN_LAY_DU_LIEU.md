# 📊 HƯỚNG DẪN LẤY DỮ LIỆU TỪ SUPABASE

## 🎯 Tổng quan

Hệ thống LaLa House sử dụng **Supabase KV Store** (key-value table) để lưu trữ tất cả dữ liệu. Để hiển thị báo cáo và số liệu trong Admin Dashboard, bạn cần:

1. ✅ Tạo dữ liệu mẫu (bookings, rooms, concepts)
2. ✅ Server sẽ tính toán thống kê từ dữ liệu đó
3. ✅ Frontend fetch và hiển thị

---

## 🚀 CÁCH LẤY DỮ LIỆU CHO DASHBOARD & REPORTS

### **BƯỚC 1: Tạo dữ liệu mẫu**

Vào trang: **`http://localhost:3000/setup`**

Làm theo thứ tự:

1. **Khởi tạo tài khoản** (admin & staff)
2. **Khởi tạo dữ liệu cơ sở** (locations, concepts, rooms)
3. **Khởi tạo đơn đặt phòng mẫu** ⭐ **QUAN TRỌNG** - Đây là dữ liệu cho Dashboard!

### **BƯỚC 2: Đăng nhập Admin**

1. Vào: `/login`
2. Đăng nhập với:
   - Email: `admin@lalahouse.vn`
   - Password: `admin123`

### **BƯỚC 3: Xem Dashboard**

Dashboard sẽ tự động:
- ✅ Fetch dữ liệu từ Supabase
- ✅ Tính toán thống kê
- ✅ Hiển thị biểu đồ
- ✅ Hiển thị đơn đặt gần nhất

---

## 📡 CÁC API ENDPOINT ĐÃ TẠO

### 1. **Lấy thống kê Dashboard**

```
GET /make-server-faeb1932/admin/stats?timeFilter=today
```

**Query params:**
- `timeFilter`: `today` | `7days` | `month` | `lastmonth`

**Response:**
```json
{
  "success": true,
  "stats": {
    "revenue": { "value": 6500000, "change": 0 },
    "bookings": { "value": 5, "change": 0 },
    "roomsInUse": { "current": 3, "total": 7, "percentage": 42 },
    "guests": { "value": 11, "change": 0 }
  },
  "charts": {
    "revenue": [
      { "name": "08/11", "revenue": 1200000 },
      { "name": "09/11", "revenue": 1400000 }
    ],
    "channel": [
      { "name": "Website", "value": 2500000 },
      { "name": "Facebook", "value": 1400000 }
    ]
  },
  "recentBookings": [...]
}
```

### 2. **Tạo dữ liệu đặt phòng mẫu**

```
POST /make-server-faeb1932/admin/init-demo-bookings
```

**Response:**
```json
{
  "success": true,
  "message": "Đã tạo 5 đơn đặt phòng mẫu",
  "bookingCodes": [
    "LALA-20251108-0001",
    "LALA-20251108-0002"
  ]
}
```

### 3. **Lấy tất cả đơn đặt (cho quản lý)**

```
GET /make-server-faeb1932/admin/bookings?status=confirmed&conceptId=matcha
```

**Query params:**
- `status`: `pending` | `confirmed` | `cancelled` | `completed`
- `conceptId`: ID của loại phòng

### 4. **Cập nhật đơn đặt**

```
PUT /make-server-faeb1932/admin/bookings/:code
```

**Body:**
```json
{
  "bookingStatus": "confirmed",
  "paymentStatus": "paid"
}
```

---

## 💾 CẤU TRÚC DỮ LIỆU TRONG KV STORE

### **Bookings** (Key: `booking:LALA-YYYYMMDD-XXXX`)

```json
{
  "code": "LALA-20251108-0001",
  "conceptId": "matcha",
  "roomNumber": "101",
  "checkIn": "2025-11-08",
  "checkOut": "2025-11-10",
  "numberOfGuests": 2,
  "customerName": "Nguyễn Văn An",
  "customerPhone": "0901234567",
  "customerEmail": "test@example.com",
  "totalAmount": 1200000,
  "paymentStatus": "paid",
  "bookingStatus": "confirmed",
  "source": "website",
  "createdAt": "2025-11-08T10:30:00Z"
}
```

### **Rooms** (Key: `room:room-101`)

```json
{
  "id": "room-101",
  "conceptId": "matcha",
  "number": "101",
  "status": "available",
  "cleanStatus": "clean"
}
```

### **Concepts** (Key: `concept:matcha`)

```json
{
  "id": "matcha",
  "locationId": "duong-quang-ham",
  "name": "Matcha",
  "description": "Phòng concept Matcha...",
  "price2h": 200000,
  "priceNight": 600000,
  "amenities": ["wifi", "tv", "ac"]
}
```

### **Customers** (Key: `customer:0901234567`)

```json
{
  "name": "Nguyễn Văn An",
  "phone": "0901234567",
  "email": "test@example.com",
  "bookings": ["LALA-20251108-0001", "LALA-20251108-0002"]
}
```

---

## 🔧 CÁCH THÊM DỮ LIỆU MỚI

### **Option 1: Dùng Setup Page** (Khuyên dùng)

Vào `/setup` và click **"Khởi tạo đơn đặt phòng mẫu"** nhiều lần để thêm dữ liệu.

### **Option 2: Tạo booking từ Staff Dashboard**

1. Đăng nhập với `staff@lalahouse.vn` / `staff123`
2. Vào **"Tạo đơn mới"**
3. Điền form và submit

### **Option 3: Tạo booking từ Customer Website**

1. Vào trang chủ (`/`)
2. Click **"Đặt phòng ngay"**
3. Chọn phòng, điền thông tin, submit

### **Option 4: Call API trực tiếp**

```javascript
const response = await fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-faeb1932/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    conceptId: 'matcha',
    roomNumber: '101',
    checkIn: '2025-11-10',
    checkOut: '2025-11-12',
    numberOfGuests: 2,
    customerName: 'Test User',
    customerPhone: '0900000000',
    customerEmail: 'test@test.com',
    paymentMethod: 'vnpay',
    totalAmount: 1200000
  })
});
```

---

## 📈 CÁCH DASHBOARD HOẠT ĐỘNG

### **Frontend: AdminDashboard.tsx**

```typescript
// 1. Fetch data khi component mount
useEffect(() => {
  fetchStats();
}, [timeFilter]);

// 2. Call API
const response = await fetch(`${serverUrl}/admin/stats?timeFilter=${timeFilter}`, {
  headers: {
    'Authorization': `Bearer ${publicAnonKey}`
  }
});

// 3. Parse response
const result = await response.json();

// 4. Update state
setStats(result);

// 5. Render charts với data
<BarChart data={stats.charts.revenue} />
```

### **Backend: index.tsx**

```typescript
// 1. Lấy tất cả bookings từ KV store
const bookingKeys = await kv.getByPrefix('booking:');
const bookings = bookingKeys.map(item => JSON.parse(item.value));

// 2. Filter theo timeFilter
const filteredBookings = bookings.filter(b => {
  const createdAt = new Date(b.createdAt);
  return createdAt >= startDate && createdAt <= now;
});

// 3. Tính toán stats
const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0);
const totalBookings = filteredBookings.length;

// 4. Trả về JSON
return c.json({ success: true, stats, charts });
```

---

## 🎨 CÁCH TÙY CHỈNH DASHBOARD

### **Thêm filter mới**

1. Thêm select trong AdminDashboard.tsx:
```tsx
<select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
  <option value="all">Tất cả cơ sở</option>
  <option value="dqh">Dương Quảng Hàm</option>
</select>
```

2. Update URL khi fetch:
```tsx
const url = `${serverUrl}/admin/stats?timeFilter=${timeFilter}&locationId=${locationFilter}`;
```

3. Update server để filter thêm:
```tsx
if (locationId) {
  filteredBookings = filteredBookings.filter(b => b.locationId === locationId);
}
```

### **Thêm chart mới**

1. Thêm vào server response:
```tsx
charts: {
  revenue: [...],
  channel: [...],
  occupancy: [...] // NEW
}
```

2. Render trong frontend:
```tsx
<LineChart data={stats.charts.occupancy}>
  <Line dataKey="percentage" />
</LineChart>
```

---

## 🐛 TROUBLESHOOTING

### ❌ "Chưa có dữ liệu" trong Dashboard

**Nguyên nhân:** Chưa tạo booking nào

**Giải pháp:**
1. Vào `/setup`
2. Click **"Khởi tạo đơn đặt phòng mẫu"**
3. Refresh Dashboard

---

### ❌ "Không thể kết nối với server"

**Nguyên nhân:** Supabase Edge Function chưa deploy hoặc không chạy

**Giải pháp:**
1. Check server có deploy chưa
2. Test connection tại `/setup`
3. Xem logs trong Supabase Dashboard

---

### ❌ Dữ liệu không real-time

**Lưu ý:** Hiện tại Dashboard **KHÔNG** real-time. Cần click **"Làm mới"** để cập nhật.

**Cải tiến tương lai:** Tích hợp Supabase Realtime để auto-refresh khi có booking mới.

---

## 📚 TÀI LIỆU THAM KHẢO

- **Supabase KV Store:** `/supabase/functions/server/kv_store.tsx`
- **Server Endpoints:** `/supabase/functions/server/index.tsx`
- **Admin Dashboard:** `/components/admin/AdminDashboard.tsx`
- **Reports:** `/components/admin/Reports.tsx`

---

## 💡 MẸO HAY

### Tạo nhiều dữ liệu test nhanh

1. Vào `/setup`
2. Click **"Khởi tạo đơn đặt phòng mẫu"** nhiều lần
3. Mỗi lần tạo 5 bookings mới với ngày random

### Xem dữ liệu raw

1. Mở Console (F12)
2. Gõ:
```javascript
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-faeb1932/admin/stats', {
  headers: { 'Authorization': 'Bearer YOUR_ANON_KEY' }
})
.then(r => r.json())
.then(console.log)
```

### Reset toàn bộ dữ liệu

⚠️ **Cảnh báo:** Xóa toàn bộ dữ liệu

Hiện tại cần xóa thủ công trong Supabase Dashboard → Storage → KV table.

---

**Chúc bạn sử dụng thành công! 🎉**
