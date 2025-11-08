# 📊 PHÂN LOẠI HỆ THỐNG BÁO CÁO - LALA HOUSE

## Tổng quan
Hệ thống có **3 loại báo cáo** phục vụ các mục đích và đối tượng khác nhau.

---

## 1. 📈 BÁO CÁO QUẢN LÝ (Admin Reports)

### Đối tượng sử dụng
- **Quản lý cấp cao**
- **Chủ homestay**

### Vị trí trong hệ thống
- **Component**: `/components/admin/Reports.tsx`
- **Menu**: Admin → Báo cáo - Thống kê
- **Endpoint**: `/admin/reports`

### Mục đích
Phân tích kinh doanh tổng thể, đưa ra quyết định chiến lược

### Nội dung báo cáo

#### A. KPIs Chính (9 chỉ số)
1. **Tổng doanh thu** - Tổng tiền phòng (không bao gồm cọc)
2. **Tổng đặt phòng** - Số lượng booking trong kỳ
3. **Công suất phòng** - Tỷ lệ % phòng đang sử dụng
4. **Tổng khách hàng** - Số lượng khách hàng

#### B. KPIs Phụ (5 chỉ số)
5. **Tiền cọc CSVC** - Tổng tiền cọc đang giữ
6. **Số đêm đã bán** - Tổng số room-nights
7. **Giá TB/đêm** - Average Daily Rate (ADR)
8. **Giá TB/đơn** - Average Booking Value
9. **Tỷ lệ hủy** - Cancellation Rate

#### C. Biểu đồ phân tích (5 biểu đồ)
1. **Line Chart**: Doanh thu theo ngày
2. **Bar Chart**: Số lượng đặt phòng theo ngày
3. **Ranking List**: Top 5 phòng được đặt nhiều nhất
4. **Pie Chart 1**: Phân bố trạng thái đặt phòng
5. **Pie Chart 2**: Phân bố nguồn đặt phòng

#### D. Chi tiết thống kê
- Đã xác nhận
- Đã nhận phòng (check-in)
- Đã trả phòng (check-out)
- Đã hủy

### Tính năng đặc biệt
- ✅ Xuất Excel (đang phát triển)
- ✅ Xuất PDF (đang phát triển)
- ✅ Lọc theo khoảng thời gian
- ✅ Biểu đồ tương tác (Recharts)
- ✅ KPIs với so sánh kỳ trước

### Kết nối database
✅ **ĐÃ KẾT NỐI** - Sử dụng function `getDetailedReports()` từ SQL

---

## 2. 🏢 BÁO CÁO CÔNG SUẤT PHÒNG (Staff Room Report)

### Đối tượng sử dụng
- **Lễ tân**
- **Nhân viên receptionist**

### Vị trí trong hệ thống
- **Component**: `/components/staff/StaffReports.tsx`
- **Menu**: Lễ tân → Báo cáo
- **Endpoint**: `/staff/room-report`

### Mục đích
Theo dõi công suất phòng theo thời gian để lên kế hoạch nhận/trả phòng

### Nội dung báo cáo

#### Bảng theo ngày với các cột:
1. **Ngày** - Ngày trong khoảng thời gian
2. **Phòng trống** - Số phòng available
3. **Dự kiến trả** - Số booking check-out trong ngày
4. **Dự kiến nhận** - Số booking check-in trong ngày
5. **Đang sử dụng** - Số phòng occupied
6. **Công suất (%)** - Occupancy rate
   - 🟢 Xanh: ≥ 80%
   - 🟡 Vàng: 60-79%
   - 🔴 Đỏ: < 60%

### Tính năng
- ✅ Chọn khoảng thời gian (từ ngày - đến ngày)
- ✅ Xuất CSV
- ✅ Highlight theo công suất

### Kết nối database
✅ **ĐÃ KẾT NỐI** - Sử dụng function `getStaffRoomReport()` từ SQL

### Cách tính
```javascript
- occupied = Số booking đang ở trong ngày đó
- empty = Tổng phòng - occupied
- checkins = Số booking có ngày nhận = ngày đó
- checkouts = Số booking có ngày trả = ngày đó
- occupancy = (occupied / totalRooms) * 100
```

---

## 3. 💰 BÁO CÁO CUỐI NGÀY (Daily Financial Report)

### Đối tượng sử dụng
- **Lễ tân**
- **Kế toán**
- **Ca trực cuối ngày**

### Vị trí trong hệ thống
- **Component**: `/components/staff/DailyReport.tsx`
- **Menu**: Lễ tân → Báo cáo cuối ngày
- **Endpoint**: `/staff/daily-report`

### Mục đích
Đối chiếu thu chi cuối ca/cuối ngày, kiểm soát dòng tiền

### Nội dung báo cáo

#### A. Tổng hợp (5 số liệu)
1. **Tổng doanh thu** - Tổng tiền phòng
2. **Thực thu** - Tiền thực tế nhận được
3. **Tiền cọc** - Tiền cọc nhận trong ngày
4. **Hoàn cọc** - Tiền cọc trả lại khách
5. **Ghi nợ** - Công nợ chưa thu

#### B. Bảng giao dịch chi tiết
Mỗi dòng là 1 giao dịch với các cột:

1. **Mã đơn** - Booking code
2. **Thời gian** - Giờ phút giao dịch
3. **Khách hàng** - Tên khách
4. **Phòng** - Số phòng
5. **Doanh thu** - Tiền phòng (nếu checkout)
6. **Thực thu** - Tiền nhận thực tế
7. **Cọc** - Tiền cọc nhận (nếu checkin)
8. **Hoàn cọc** - Tiền cọc trả (nếu checkout)
9. **Ghi nợ** - Nếu chưa thanh toán đủ
10. **Ghi chú** - Kênh đặt, trạng thái

#### C. Thông tin báo cáo
- Ngày báo cáo
- Giờ lập báo cáo
- Cơ sở
- Người lập

### Tính năng
- ✅ Chọn ngày cụ thể
- ✅ Xuất CSV
- ✅ Chi tiết từng giao dịch
- ✅ Tự động tính tổng

### Kết nối database
✅ **ĐÃ KẾT NỐI** - Sử dụng function `getDailyFinancialReport()` từ SQL

### Logic nghiệp vụ

**Check-in (Nhận phòng)**
```
- Deposit = coc_csvc (500.000đ)
- Received = deposit
- Revenue = 0
```

**Check-out (Trả phòng)**
```
- Revenue = tong_tien
- Received = revenue
- Refund = coc_csvc
- Debt = revenue - (số tiền đã thanh toán)
```

---

## 📊 So sánh 3 loại báo cáo

| Tiêu chí | Admin Reports | Staff Room Report | Daily Financial Report |
|----------|---------------|-------------------|------------------------|
| **Đối tượng** | Quản lý | Lễ tân | Lễ tân + Kế toán |
| **Tần suất** | Tuần/Tháng | Hàng ngày | Cuối ca/ngày |
| **Khoảng thời gian** | Linh hoạt (30 ngày mặc định) | Linh hoạt (7 ngày mặc định) | 1 ngày cụ thể |
| **Mục đích** | Phân tích kinh doanh | Quản lý công suất | Đối chiếu thu chi |
| **Độ phức tạp** | Cao (9 KPIs + 5 biểu đồ) | Trung bình (bảng theo ngày) | Đơn giản (danh sách giao dịch) |
| **Xuất file** | Excel/PDF | CSV | CSV |
| **Database** | ✅ Kết nối | ✅ Kết nối | ✅ Kết nối |

---

## 🔗 Cấu trúc Database

### Endpoints API
```
GET /admin/reports?start_date=...&end_date=...
GET /staff/room-report?start_date=...&end_date=...
GET /staff/daily-report?report_date=...
```

### Functions trong sql-queries.tsx
```typescript
- getDetailedReports(filters) → Admin Reports
- getStaffRoomReport(filters) → Staff Room Report  
- getDailyFinancialReport(reportDate) → Daily Financial Report
```

### Bảng SQL sử dụng
```
dat_phong (bookings)
├── khach_hang (customers)
├── phong (rooms)
│   └── loai_phong (room types)
└── thanh_toan (payments)
```

---

## ✅ Trạng thái triển khai

### ✅ Hoàn thành
- [x] Admin Reports - Kết nối database hoàn chỉnh
- [x] Staff Room Report - Kết nối database hoàn chỉnh
- [x] Daily Financial Report - Kết nối database hoàn chỉnh
- [x] Các endpoint API
- [x] Xuất CSV cho báo cáo lễ tân

### 🚧 Đang phát triển
- [ ] Xuất Excel cho Admin Reports
- [ ] Xuất PDF cho Admin Reports
- [ ] Print template cho Daily Report

---

## 📝 Ghi chú quan trọng

1. **Tất cả 3 báo cáo đã kết nối database thật**, không còn dùng mock data
2. **Trạng thái đặt phòng** sử dụng đúng với database:
   - `da_coc` - Đã cọc
   - `da_tt` - Đã thanh toán
   - `checkin` - Đang ở
   - `checkout` - Đã trả
   - `da_huy` - Đã hủy

3. **Định dạng tiền tệ**: VND với `toLocaleString('vi-VN')`
4. **Định dạng ngày**: dd/MM/yyyy (định dạng Việt Nam)

---

Cập nhật: 08/11/2024
Phiên bản: 1.0
