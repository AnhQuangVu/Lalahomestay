# 🔧 XỬ LÝ LỖI "Invalid login credentials"

## 🎯 Vấn đề
Khi đăng nhập với `admin@lalahouse.vn` / `admin123` hoặc `staff@lalahouse.vn` / `staff123`, bạn gặp lỗi **"Invalid login credentials"**.

## 🔍 Nguyên nhân
Lỗi này xảy ra vì:
1. ❌ Tài khoản chưa được tạo trong Supabase Auth
2. ❌ Tài khoản đã tạo nhưng email chưa được confirm
3. ❌ Server không được deploy hoặc không chạy đúng
4. ❌ Environment variables chưa được cấu hình

---

## ✅ GIẢI PHÁP - LÀM THEO TỪNG BƯỚC

### **BƯỚC 1: Kiểm tra Supabase đã được setup chưa**

Mở trang `/setup` và:

1. **Click "Test Connection"**
   - ✅ Nếu thấy thông báo "Kết nối thành công" → OK, chuyển sang Bước 2
   - ❌ Nếu báo lỗi → Xem phần "Xử lý lỗi kết nối" bên dưới

---

### **BƯỚC 2: Khởi tạo tài khoản**

Trên trang `/setup`:

1. **Click "Khởi tạo tài khoản"**
2. Đợi vài giây
3. Kiểm tra kết quả:
   - ✅ "Users initialized successfully" → Tài khoản đã được tạo
   - ⚠️ "Already exists" → Tài khoản đã tồn tại (OK, chuyển sang Bước 3)
   - ❌ Báo lỗi khác → Xem logs trong Console (F12)

---

### **BƯỚC 3: Test đăng nhập trực tiếp**

Trên trang `/setup`, tìm card **"🔍 Debug Authentication"**:

1. **Click "Test Admin Login"**
2. Xem kết quả:
   - ✅ Thấy user info hiện ra → Tài khoản OK!
   - ❌ "Invalid login credentials" → Xem Bước 4
   - ❌ "Email not confirmed" → Xem Bước 5

---

### **BƯỚC 4: Xóa và tạo lại tài khoản**

Nếu vẫn báo "Invalid login credentials":

#### Option A: Xóa user trong Supabase Dashboard
1. Mở **Supabase Dashboard** (https://supabase.com)
2. Chọn project của bạn
3. Vào **Authentication** → **Users**
4. Tìm và **XÓA** users: `admin@lalahouse.vn` và `staff@lalahouse.vn`
5. Quay lại trang `/setup`
6. Click lại **"Khởi tạo tài khoản"**

#### Option B: Tạo user thủ công
1. Mở **Supabase Dashboard**
2. Vào **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Nhập:
   ```
   Email: admin@lalahouse.vn
   Password: admin123
   Auto Confirm User: ✅ BẬT (QUAN TRỌNG!)
   ```
5. Click **"Create user"**
6. Sau khi tạo xong, click vào user
7. Vào tab **"User Metadata"**
8. Thêm metadata:
   ```json
   {
     "name": "Admin LaLa House",
     "role": "admin"
   }
   ```
9. Lặp lại cho staff account

---

### **BƯỚC 5: Kiểm tra email confirmation**

Nếu báo "Email not confirmed":

1. Mở **Supabase Dashboard**
2. Vào **Authentication** → **Users**
3. Click vào user `admin@lalahouse.vn`
4. Kiểm tra **"Email Confirmed"** có đang là **True** không
5. Nếu chưa, click **"Send confirmation email"** hoặc manually confirm

---

## 🔧 XỬ LÝ LỖI KẾT NỐI

### Lỗi: "Không thể kết nối với server"

**Kiểm tra:**

1. **Supabase Edge Function đã được deploy chưa?**
   ```bash
   # Deploy function
   supabase functions deploy make-server-faeb1932
   ```

2. **Environment variables đã được set chưa?**
   - Kiểm tra file `.env` hoặc Supabase dashboard
   - Cần có: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

3. **CORS có được cấu hình đúng không?**
   - Server code đã có `cors({ origin: '*' })`

---

## 🎯 CÁCH NHANH NHẤT - TẠO USER BẰNG DASHBOARD

Nếu bạn muốn tạo nhanh không cần chờ:

### Tạo Admin:
1. Supabase Dashboard → Authentication → Users → Add user
2. Điền:
   - Email: `admin@lalahouse.vn`
   - Password: `admin123`  
   - Auto Confirm: ✅ ON
   - Metadata: 
     ```json
     {
       "name": "Admin LaLa House",
       "role": "admin"
     }
     ```

### Tạo Staff:
1. Supabase Dashboard → Authentication → Users → Add user
2. Điền:
   - Email: `staff@lalahouse.vn`
   - Password: `staff123`
   - Auto Confirm: ✅ ON
   - Metadata:
     ```json
     {
       "name": "Nhân viên lễ tân",
       "role": "staff"
     }
     ```

---

## 📊 DEBUG CHECKLIST

Trước khi hỏi thêm, hãy kiểm tra:

- [ ] Supabase Edge Function đã deploy chưa
- [ ] Environment variables đã set đúng chưa
- [ ] Test Connection thành công chưa (trang `/setup`)
- [ ] Users đã được tạo trong Supabase Dashboard chưa
- [ ] Email của users đã được confirmed chưa
- [ ] User metadata có `role` field chưa
- [ ] Password đúng: `admin123` và `staff123`
- [ ] Đã thử test login trong Debug Auth component chưa
- [ ] Đã xem Console logs (F12) chưa
- [ ] Đã xem Network tab trong DevTools chưa

---

## 💡 TIP HAY

**Cách dễ nhất để debug:**

1. Mở trang `/setup`
2. Mở Console (F12)
3. Click "Test Connection" → Xem logs
4. Click "Khởi tạo tài khoản" → Xem logs
5. Click "Test Admin Login" trong Debug Auth → Xem kết quả
6. Copy error message và search Google hoặc Supabase docs

---

## 🆘 VẪN KHÔNG ĐƯỢC?

Nếu sau khi làm tất cả các bước trên vẫn không được:

1. **Kiểm tra Supabase Project có đang active không**
   - Đôi khi free tier bị pause

2. **Thử tạo user mới với email khác**
   - Dùng email cá nhân của bạn để test

3. **Check Supabase logs**
   - Dashboard → Logs → Auth logs

4. **Copy đầy đủ error message**
   - Từ Console (F12)
   - Từ Network tab
   - Từ Supabase Dashboard logs

---

**Chúc bạn sửa lỗi thành công! 🎉**
