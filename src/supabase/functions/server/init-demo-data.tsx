import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

export async function initializeDemoData() {
  try {
    console.log('Starting demo data initialization...');

    // 1. CƠ SỞ (LOCATIONS)
    console.log('1. Creating co_so...');
    const coSoData = [
      {
        ten_co_so: 'LaLa House Dương Quảng Hàm',
        dia_chi: '123 Dương Quảng Hàm, Cầu Giấy, Hà Nội',
        hotline: '0987654321',
        mo_ta: 'Cơ sở chính tại Cầu Giấy, gần các trường đại học',
        trang_thai: true
      },
      {
        ten_co_so: 'LaLa House Tố Hữu',
        dia_chi: '456 Tố Hữu, Hà Đông, Hà Nội',
        hotline: '0987654322',
        mo_ta: 'Chi nhánh tại Hà Đông, gần khu vực ăn uống sầm uất',
        trang_thai: true
      },
      {
        ten_co_so: 'LaLa House Trần Duy Hưng',
        dia_chi: '789 Trần Duy Hưng, Cầu Giấy, Hà Nội',
        hotline: '0987654323',
        mo_ta: 'Cơ sở cao cấp tại khu vực trung tâm',
        trang_thai: true
      }
    ];

    const { data: coSo, error: coSoError } = await supabase
      .from('co_so')
      .insert(coSoData)
      .select();

    if (coSoError) throw new Error(`Error creating co_so: ${coSoError.message}`);
    console.log(`✓ Created ${coSo.length} co_so`);

    // 2. LOẠI PHÒNG (ROOM CONCEPTS)
    console.log('2. Creating loai_phong...');
    const loaiPhongData = [
      {
        ten_loai: 'Matcha',
        mo_ta: 'Phòng concept Matcha với thiết kế tươi mát, xanh mát, phù hợp nghỉ ngơi thư giãn',
        gia_gio: 150000,
        gia_dem: 500000,
        id_co_so: coSo[0].id,
        trang_thai: true
      },
      {
        ten_loai: 'Pastel',
        mo_ta: 'Phòng concept Pastel với màu sắc nhẹ nhàng, lãng mạn, thích hợp cho cặp đôi',
        gia_gio: 150000,
        gia_dem: 500000,
        id_co_so: coSo[0].id,
        trang_thai: true
      },
      {
        ten_loai: 'Minimalist',
        mo_ta: 'Phòng concept tối giản, hiện đại với nội thất đơn giản, sang trọng',
        gia_gio: 180000,
        gia_dem: 600000,
        id_co_so: coSo[1].id,
        trang_thai: true
      },
      {
        ten_loai: 'Vintage',
        mo_ta: 'Phòng phong cách vintage cổ điển, hoài cổ',
        gia_gio: 180000,
        gia_dem: 600000,
        id_co_so: coSo[1].id,
        trang_thai: true
      },
      {
        ten_loai: 'Luxury',
        mo_ta: 'Phòng cao cấp với đầy đủ tiện nghi 5 sao',
        gia_gio: 250000,
        gia_dem: 800000,
        id_co_so: coSo[2].id,
        trang_thai: true
      }
    ];

    const { data: loaiPhong, error: loaiPhongError } = await supabase
      .from('loai_phong')
      .insert(loaiPhongData)
      .select();

    if (loaiPhongError) throw new Error(`Error creating loai_phong: ${loaiPhongError.message}`);
    console.log(`✓ Created ${loaiPhong.length} loai_phong`);

    // 3. PHÒNG (ROOMS)
    console.log('3. Creating phong...');
    const phongData = [
      // Matcha rooms
      { ma_phong: '101', id_loai_phong: loaiPhong[0].id, trang_thai: 'trong', tinh_trang_vesinh: 'sach' },
      { ma_phong: '102', id_loai_phong: loaiPhong[0].id, trang_thai: 'dang_dung', tinh_trang_vesinh: 'dang_don' },
      { ma_phong: '103', id_loai_phong: loaiPhong[0].id, trang_thai: 'trong', tinh_trang_vesinh: 'sach' },
      { ma_phong: '104', id_loai_phong: loaiPhong[0].id, trang_thai: 'sap_nhan', tinh_trang_vesinh: 'sach' },
      
      // Pastel rooms
      { ma_phong: '201', id_loai_phong: loaiPhong[1].id, trang_thai: 'trong', tinh_trang_vesinh: 'sach' },
      { ma_phong: '202', id_loai_phong: loaiPhong[1].id, trang_thai: 'dang_dung', tinh_trang_vesinh: 'dang_don' },
      { ma_phong: '203', id_loai_phong: loaiPhong[1].id, trang_thai: 'trong', tinh_trang_vesinh: 'sach' },
      
      // Minimalist rooms
      { ma_phong: '301', id_loai_phong: loaiPhong[2].id, trang_thai: 'trong', tinh_trang_vesinh: 'sach' },
      { ma_phong: '302', id_loai_phong: loaiPhong[2].id, trang_thai: 'sap_nhan', tinh_trang_vesinh: 'sach' },
      { ma_phong: '303', id_loai_phong: loaiPhong[2].id, trang_thai: 'bao_tri', tinh_trang_vesinh: 'chua_don', ghi_chu: 'Đang sửa điều hòa' },
      
      // Vintage rooms
      { ma_phong: '401', id_loai_phong: loaiPhong[3].id, trang_thai: 'trong', tinh_trang_vesinh: 'sach' },
      { ma_phong: '402', id_loai_phong: loaiPhong[3].id, trang_thai: 'trong', tinh_trang_vesinh: 'sach' },
      
      // Luxury rooms
      { ma_phong: '501', id_loai_phong: loaiPhong[4].id, trang_thai: 'dang_dung', tinh_trang_vesinh: 'dang_don' },
      { ma_phong: '502', id_loai_phong: loaiPhong[4].id, trang_thai: 'trong', tinh_trang_vesinh: 'sach' }
    ];

    const { data: phong, error: phongError } = await supabase
      .from('phong')
      .insert(phongData)
      .select();

    if (phongError) throw new Error(`Error creating phong: ${phongError.message}`);
    console.log(`✓ Created ${phong.length} phong`);

    // 4. TIỆN ÍCH (AMENITIES)
    console.log('4. Creating tien_ich...');
    const tienIchData = [
      { ten_tien_ich: 'WiFi miễn phí', icon: 'wifi' },
      { ten_tien_ich: 'TV màn hình phẳng', icon: 'tv' },
      { ten_tien_ich: 'Điều hòa nhiệt độ', icon: 'ac' },
      { ten_tien_ich: 'Tủ lạnh mini', icon: 'fridge' },
      { ten_tien_ich: 'Máy sấy tóc', icon: 'dryer' },
      { ten_tien_ich: 'Bàn làm việc', icon: 'desk' },
      { ten_tien_ich: 'Két an toàn', icon: 'safe' },
      { ten_tien_ich: 'Đồ ăn sáng miễn phí', icon: 'breakfast' },
      { ten_tien_ich: 'Máy pha cà phê', icon: 'coffee' },
      { ten_tien_ich: 'Bồn tắm', icon: 'bathtub' }
    ];

    const { data: tienIch, error: tienIchError } = await supabase
      .from('tien_ich')
      .insert(tienIchData)
      .select();

    if (tienIchError) throw new Error(`Error creating tien_ich: ${tienIchError.message}`);
    console.log(`✓ Created ${tienIch.length} tien_ich`);

    // 5. PHÒNG-TIỆN ÍCH (ROOM AMENITIES MAPPING)
    console.log('5. Creating phong_tienich...');
    const phongTienIchData = [];
    
    // All rooms get basic amenities (WiFi, TV, AC)
    for (const room of phong) {
      phongTienIchData.push(
        { id_phong: room.id, id_tien_ich: tienIch[0].id }, // WiFi
        { id_phong: room.id, id_tien_ich: tienIch[1].id }, // TV
        { id_phong: room.id, id_tien_ich: tienIch[2].id }  // AC
      );
    }
    
    // Luxury rooms get all amenities
    const luxuryRooms = phong.filter(p => p.ma_phong.startsWith('5'));
    for (const room of luxuryRooms) {
      for (const amenity of tienIch.slice(3)) {
        phongTienIchData.push({ id_phong: room.id, id_tien_ich: amenity.id });
      }
    }

    const { error: phongTienIchError } = await supabase
      .from('phong_tienich')
      .insert(phongTienIchData);

    if (phongTienIchError) throw new Error(`Error creating phong_tienich: ${phongTienIchError.message}`);
    console.log(`✓ Created ${phongTienIchData.length} phong_tienich records`);

    // 6. KHÁCH HÀNG (CUSTOMERS)
    console.log('6. Creating khach_hang...');
    const khachHangData = [
      {
        ho_ten: 'Nguyễn Văn An',
        sdt: '0901234567',
        email: 'nguyenvanan@gmail.com',
        dia_chi: 'Hà Nội',
        ghi_chu: 'Khách VIP, thường xuyên đặt phòng'
      },
      {
        ho_ten: 'Trần Thị Bình',
        sdt: '0912345678',
        email: 'tranthibinh@gmail.com',
        dia_chi: 'Hà Nội'
      },
      {
        ho_ten: 'Lê Văn Cường',
        sdt: '0923456789',
        email: 'levancuong@gmail.com',
        dia_chi: 'Hà Nội',
        ghi_chu: 'Yêu cầu phòng yên tĩnh'
      },
      {
        ho_ten: 'Phạm Thị Dung',
        sdt: '0934567890',
        email: 'phamthidung@gmail.com',
        dia_chi: 'Hà Nội'
      },
      {
        ho_ten: 'Hoàng Văn Em',
        sdt: '0945678901',
        email: 'hoangvanem@gmail.com',
        dia_chi: 'Hà Nội'
      },
      {
        ho_ten: 'Vũ Thị Phương',
        sdt: '0956789012',
        email: 'vuthiphuong@gmail.com',
        dia_chi: 'Hà Nội'
      }
    ];

    const { data: khachHang, error: khachHangError } = await supabase
      .from('khach_hang')
      .insert(khachHangData)
      .select();

    if (khachHangError) throw new Error(`Error creating khach_hang: ${khachHangError.message}`);
    console.log(`✓ Created ${khachHang.length} khach_hang`);

    // 7. TÀI KHOẢN (ACCOUNTS)
    console.log('7. Creating tai_khoan...');
    const taiKhoanData = [
      {
        ho_ten: 'Admin LaLa House',
        email: 'admin@lalahouse.vn',
        sdt: '0900000001',
        vai_tro: 'quan_tri',
        trang_thai: true
      },
      {
        ho_ten: 'Nguyễn Thị Lễ Tân',
        email: 'letan1@lalahouse.vn',
        sdt: '0900000002',
        vai_tro: 'le_tan',
        trang_thai: true
      },
      {
        ho_ten: 'Trần Văn Lễ Tân',
        email: 'letan2@lalahouse.vn',
        sdt: '0900000003',
        vai_tro: 'le_tan',
        trang_thai: true
      },
      {
        ho_ten: 'Lê Thị Kế Toán',
        email: 'ketoan@lalahouse.vn',
        sdt: '0900000004',
        vai_tro: 'ke_toan',
        trang_thai: true
      }
    ];

    const { data: taiKhoan, error: taiKhoanError } = await supabase
      .from('tai_khoan')
      .insert(taiKhoanData)
      .select();

    if (taiKhoanError) throw new Error(`Error creating tai_khoan: ${taiKhoanError.message}`);
    console.log(`✓ Created ${taiKhoan.length} tai_khoan`);

    // 8. ĐẶT PHÒNG (BOOKINGS)
    console.log('8. Creating dat_phong...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const datPhongData = [
      {
        ma_dat: 'LALA-20251108-0001',
        id_khach_hang: khachHang[0].id,
        id_phong: phong.find(p => p.ma_phong === '102')?.id,
        thoi_gian_nhan: yesterday.toISOString(),
        thoi_gian_tra: today.toISOString(),
        so_khach: 2,
        ghi_chu: 'Khách VIP, cần chuẩn bị hoa tươi',
        kenh_dat: 'website',
        trang_thai: 'checkin',
        tong_tien: 500000,
        coc_csvc: 500000
      },
      {
        ma_dat: 'LALA-20251108-0002',
        id_khach_hang: khachHang[1].id,
        id_phong: phong.find(p => p.ma_phong === '202')?.id,
        thoi_gian_nhan: today.toISOString(),
        thoi_gian_tra: tomorrow.toISOString(),
        so_khach: 2,
        kenh_dat: 'facebook',
        trang_thai: 'checkin',
        tong_tien: 500000,
        coc_csvc: 500000
      },
      {
        ma_dat: 'LALA-20251108-0003',
        id_khach_hang: khachHang[2].id,
        id_phong: phong.find(p => p.ma_phong === '104')?.id,
        thoi_gian_nhan: tomorrow.toISOString(),
        thoi_gian_tra: nextWeek.toISOString(),
        so_khach: 3,
        ghi_chu: 'Check-in sớm nếu được',
        kenh_dat: 'zalo',
        trang_thai: 'da_tt',
        tong_tien: 3000000,
        coc_csvc: 500000
      },
      {
        ma_dat: 'LALA-20251108-0004',
        id_khach_hang: khachHang[3].id,
        id_phong: phong.find(p => p.ma_phong === '302')?.id,
        thoi_gian_nhan: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        thoi_gian_tra: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        so_khach: 2,
        kenh_dat: 'website',
        trang_thai: 'da_coc',
        tong_tien: 1200000,
        coc_csvc: 500000
      },
      {
        ma_dat: 'LALA-20251108-0005',
        id_khach_hang: khachHang[4].id,
        id_phong: phong.find(p => p.ma_phong === '501')?.id,
        thoi_gian_nhan: yesterday.toISOString(),
        thoi_gian_tra: today.toISOString(),
        so_khach: 2,
        ghi_chu: 'Yêu cầu phòng tầng cao, view đẹp',
        kenh_dat: 'khac',
        trang_thai: 'checkin',
        tong_tien: 800000,
        coc_csvc: 500000
      },
      {
        ma_dat: 'LALA-20251108-0006',
        id_khach_hang: khachHang[5].id,
        id_phong: phong.find(p => p.ma_phong === '201')?.id,
        thoi_gian_nhan: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        thoi_gian_tra: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        so_khach: 2,
        kenh_dat: 'website',
        trang_thai: 'checkout',
        tong_tien: 1000000,
        coc_csvc: 500000
      }
    ];

    const { data: datPhong, error: datPhongError } = await supabase
      .from('dat_phong')
      .insert(datPhongData)
      .select();

    if (datPhongError) throw new Error(`Error creating dat_phong: ${datPhongError.message}`);
    console.log(`✓ Created ${datPhong.length} dat_phong`);

    // 9. THANH TOÁN (PAYMENTS)
    console.log('9. Creating thanh_toan...');
    const thanhToanData = [
      {
        id_dat_phong: datPhong[0].id,
        phuong_thuc: 'vnpay',
        so_tien: 500000,
        trang_thai: 'thanh_cong'
      },
      {
        id_dat_phong: datPhong[1].id,
        phuong_thuc: 'momo',
        so_tien: 500000,
        trang_thai: 'thanh_cong'
      },
      {
        id_dat_phong: datPhong[2].id,
        phuong_thuc: 'ck',
        so_tien: 3000000,
        trang_thai: 'thanh_cong'
      },
      {
        id_dat_phong: datPhong[3].id,
        phuong_thuc: 'vnpay',
        so_tien: 300000, // Deposit only
        trang_thai: 'thanh_cong'
      },
      {
        id_dat_phong: datPhong[4].id,
        phuong_thuc: 'tien_mat',
        so_tien: 800000,
        trang_thai: 'thanh_cong'
      },
      {
        id_dat_phong: datPhong[5].id,
        phuong_thuc: 'momo',
        so_tien: 1000000,
        trang_thai: 'thanh_cong'
      }
    ];

    const { data: thanhToan, error: thanhToanError } = await supabase
      .from('thanh_toan')
      .insert(thanhToanData)
      .select();

    if (thanhToanError) throw new Error(`Error creating thanh_toan: ${thanhToanError.message}`);
    console.log(`✓ Created ${thanhToan.length} thanh_toan`);

    // 10. PHẢN HỒI (REVIEWS)
    console.log('10. Creating phan_hoi...');
    const phanHoiData = [
      {
        id_khach_hang: khachHang[0].id,
        noi_dung: 'Phòng rất đẹp và sạch sẽ, nhân viên thân thiện. Sẽ quay lại lần sau!',
        danh_gia: 5
      },
      {
        id_khach_hang: khachHang[1].id,
        noi_dung: 'Phòng ổn, giá hợp lý. Tuy nhiên hơi ồn vào ban đêm.',
        danh_gia: 4
      },
      {
        id_khach_hang: khachHang[5].id,
        noi_dung: 'Trải nghiệm tuyệt vời! Concept Pastel rất lãng mạn, phù hợp cho cặp đôi.',
        danh_gia: 5
      },
      {
        id_khach_hang: khachHang[2].id,
        noi_dung: 'Phòng đẹp nhưng điều hòa hơi yếu.',
        danh_gia: 3
      }
    ];

    const { data: phanHoi, error: phanHoiError } = await supabase
      .from('phan_hoi')
      .insert(phanHoiData)
      .select();

    if (phanHoiError) throw new Error(`Error creating phan_hoi: ${phanHoiError.message}`);
    console.log(`✓ Created ${phanHoi.length} phan_hoi`);

    console.log('\n✅ Demo data initialization completed successfully!');

    return {
      success: true,
      message: 'Khởi tạo dữ liệu demo thành công!',
      summary: {
        co_so: coSo.length,
        loai_phong: loaiPhong.length,
        phong: phong.length,
        tien_ich: tienIch.length,
        phong_tienich: phongTienIchData.length,
        khach_hang: khachHang.length,
        tai_khoan: taiKhoan.length,
        dat_phong: datPhong.length,
        thanh_toan: thanhToan.length,
        phan_hoi: phanHoi.length
      }
    };

  } catch (error) {
    console.error('Error initializing demo data:', error);
    throw error;
  }
}
