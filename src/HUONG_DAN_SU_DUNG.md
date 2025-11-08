# 🚀 HƯỚNG DẪN SỬ DỤNG LALA HOUSE BOOKING SYSTEM

## 📍 BƯỚC 1: THIẾT LẬP HỆ THỐNG LẦN ĐẦU

### Cách truy cập trang thiết lập:

**CÁCH 1: Từ trang chủ**
1. Mở trình duyệt và truy cập trang web
2. Bạn sẽ thấy banner màu tím ở đầu trang với nút "**Thiết lập ngay**"
3. Click vào nút đó

**CÁCH 2: Truy cập trực tiếp**
- Nhập URL: `http://localhost:3000/setup` (hoặc domain của bạn + `/setup`)

---

## 🔧 BƯỚC 2: KHỞI TẠO HỆ THỐNG

Sau khi vào trang `/setup`, làm theo thứ tự:

### 1️⃣ Test Connection (Kiểm tra kết nối)
- Tìm card "**Kiểm tra kết nối**"
- Click nút "**Test Connection**"
- ✅ Nếu hiện "Kết nối thành công" → Tiếp tục
- ❌ Nếu báo lỗi → Kiểm tra Supabase có đang chạy không

### 2️⃣ Khởi tạo tài khoản
- Tìm card "**Khởi tạo tài khoản**"
- Click nút "**Khởi tạo tài khoản**"
- Đợi vài giây
- ✅ Thấy thông báo "Users initialized successfully"

Tài khoản sẽ được tạo:
```
Admin:
Email: admin@lalahouse.vn
Password: admin123

Staff (Lễ tân):
Email: staff@lalahouse.vn
Password: staff123
```

### 3️⃣ Khởi tạo dữ liệu
- Tìm card "**Khởi tạo dữ liệu**"
- Click nút "**Khởi tạo dữ liệu**"
- Đợi vài giây
- ✅ Thấy thông báo với số lượng đã tạo

Dữ liệu sẽ được tạo:
- 2 cơ sở (Dương Quảng Hàm, Tố Hữu)
- 3 loại phòng (Matcha, Pastel, Minimalist)
- 7 phòng mẫu

---

## 🔐 BƯỚC 3: ĐĂNG NHẬP

### Đăng nhập Admin:
1. Click vào "**Quay lại trang chủ**" (hoặc vào `/login`)
2. Nhập:
   - **Email:** `admin@lalahouse.vn`
   - **Password:** `admin123`
3. Click "**Đăng nhập**"
4. Bạn sẽ được chuyển đến `/admin` (trang quản trị)

### Đăng nhập Staff (Lễ tân):
1. Vào `/login`
2. Nhập:
   - **Email:** `staff@lalahouse.vn`
   - **Password:** `staff123`
3. Click "**Đăng nhập**"
4. Bạn sẽ được chuyển đến `/staff` (trang lễ tân)

---

## 🎯 CÁC TRANG CHÍNH

### Khách hàng (Customer) - Không cần đăng nhập
- **Trang chủ:** `/`
- **Đặt phòng:** `/booking`
- **Tra cứu:** `/lookup`
- **Liên hệ:** `/contact`

### Lễ tân (Staff) - Cần đăng nhập với staff account
- **Dashboard:** `/staff`
- **Tạo đơn mới:** `/staff/new-booking`
- **Danh sách khách:** `/staff/guests`
- **Báo cáo:** `/staff/reports`

### Quản trị (Admin) - Cần đăng nhập với admin account
- **Dashboard:** `/admin`
- **Quản lý khách hàng:** `/admin/customers`
- **Quản lý phòng:** `/admin/rooms`
- **Quản lý đặt phòng:** `/admin/bookings`
- **Quản lý tài khoản:** `/admin/accounts`
- **Báo cáo thống kê:** `/admin/reports`
- **Thiết lập hệ thống:** `/admin/setup`

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Bảo mật:
- ⚠️ Trang `/setup` là trang công khai và cần được **XÓA hoặc BẢO VỆ** khi deploy lên production
- 🔒 Đổi mật khẩu mặc định sau khi đăng nhập lần đầu
- 🔐 Không chia sẻ tài khoản admin

### Sau khi hoàn thành setup:
1. ✅ Test tất cả chức năng
2. ✅ Đổi mật khẩu admin
3. ⚠️ Xóa route `/setup` khỏi `App.tsx`
4. ✅ Deploy lên production

---

## 🆘 XỬ LÝ LỖI THƯỜNG GẶP

### "Không thể kết nối với server"
- Kiểm tra Supabase Edge Function đã được deploy chưa
- Kiểm tra CORS settings
- Kiểm tra environment variables

### "User already exists" khi khởi tạo tài khoản
- Điều này là bình thường nếu bạn đã chạy khởi tạo rồi
- Bỏ qua và tiếp tục với bước tiếp theo

### Không vào được /admin hoặc /staff
- Đảm bảo bạn đã đăng nhập với đúng tài khoản
- Kiểm tra role của user trong metadata
- Đăng xuất và đăng nhập lại

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Browser Console (F12) để xem lỗi
2. Network tab để xem API calls
3. Supabase Dashboard để xem logs

---

**Chúc bạn sử dụng hệ thống thành công! 🎉**
