import { createClient } from 'npm:@supabase/supabase-js@2';

// Initialize Supabase client for SQL queries
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// ==================== CƠ SỞ (LOCATIONS) ====================

export async function getAllCoSo() {
  const { data, error } = await supabase
    .from('co_so')
    .select('*')
    .order('ten_co_so');

  if (error) throw error;
  return data;
}

export async function createCoSo(coSo: any) {
  const { data, error } = await supabase
    .from('co_so')
    .insert(coSo)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCoSo(id: string, updates: any) {
  const { data, error } = await supabase
    .from('co_so')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCoSo(id: string) {
  const { error } = await supabase
    .from('co_so')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== LOẠI PHÒNG (CONCEPTS) ====================

export async function getAllLoaiPhong(coSoId?: string) {
  let query = supabase
    .from('loai_phong')
    .select('*, co_so(*)');

  if (coSoId) {
    query = query.eq('id_co_so', coSoId);
  }

  const { data, error } = await query.order('ten_loai');

  if (error) throw error;
  return data;
}

export async function createLoaiPhong(loaiPhong: any) {
  const { data, error } = await supabase
    .from('loai_phong')
    .insert(loaiPhong)
    .select('*, co_so(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function updateLoaiPhong(id: string, updates: any) {
  const { data, error } = await supabase
    .from('loai_phong')
    .update(updates)
    .eq('id', id)
    .select('*, co_so(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLoaiPhong(id: string) {
  const { error } = await supabase
    .from('loai_phong')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== PHÒNG (ROOMS) ====================

export async function getAllPhong(filters?: { loaiPhongId?: string, trangThai?: string }) {
  let query = supabase
    .from('phong')
    .select(`
      *,
      loai_phong(
        *,
        co_so(*)
      )
    `);

  if (filters?.loaiPhongId) {
    query = query.eq('id_loai_phong', filters.loaiPhongId);
  }

  if (filters?.trangThai) {
    query = query.eq('trang_thai', filters.trangThai);
  }

  const { data, error } = await query.order('ma_phong');

  if (error) throw error;
  return data;
}

export async function createPhong(phong: any) {
  // Accepts: ma_phong, id_loai_phong, trang_thai, tinh_trang_vesinh, anh_chinh, anh_phu, ghi_chu
  // anh_chinh: text (Cloudinary URL)
  // anh_phu: text[] (array of Cloudinary URLs)
  const { data, error } = await supabase
    .from('phong')
    .insert(phong)
    .select(`
      *,
      loai_phong(
        *,
        co_so(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updatePhong(id: string, updates: any) {
  // Accepts all phong fields including anh_chinh (text) and anh_phu (text[])
  const { data, error } = await supabase
    .from('phong')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      loai_phong(
        *,
        co_so(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deletePhong(id: string) {
  // Kiểm tra xem phòng có booking nào không
  const { data: bookings, error: checkError } = await supabase
    .from('dat_phong')
    .select('id')
    .eq('id_phong', id)
    .limit(1);

  if (checkError) throw checkError;

  // Nếu có booking (phát sinh giao dịch) → cập nhật trạng thái thành "đình chỉ"
  if (bookings && bookings.length > 0) {
    // Lấy ghi_chu hiện tại của phòng
    const { data: roomData } = await supabase
      .from('phong')
      .select('ghi_chu')
      .eq('id', id)
      .single();

    const currentNote = roomData?.ghi_chu || '';
    const newNote = currentNote ? `${currentNote} [Đã đình chỉ]` : '[Đã đình chỉ]';

    const { error: updateError } = await supabase
      .from('phong')
      .update({
        trang_thai: 'dinh_chi',
        ghi_chu: newNote
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return { suspended: true, message: 'Phòng có giao dịch nên đã chuyển sang trạng thái đình chỉ' };
  }

  // Nếu không có booking → xóa hẳn
  const { error: deleteError } = await supabase
    .from('phong')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;

  return { suspended: false, message: 'Đã xóa phòng hoàn toàn' };
}

// ==================== KHÁCH HÀNG (CUSTOMERS) ====================

export async function getAllKhachHang() {
  const { data, error } = await supabase
    .from('khach_hang')
    .select('*')
    .order('ngay_tao', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getKhachHangByPhone(sdt: string) {
  const { data, error } = await supabase
    .from('khach_hang')
    .select('*')
    .eq('sdt', sdt)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function createKhachHang(khachHang: any) {
  const { data, error } = await supabase
    .from('khach_hang')
    .insert(khachHang)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKhachHang(id: string, updates: any) {
  const { data, error } = await supabase
    .from('khach_hang')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== ĐẶT PHÒNG (BOOKINGS) ====================

export async function getAllDatPhong(filters?: {
  trangThai?: string,
  startDate?: string,
  endDate?: string,
  kenhDat?: string,
  roomId?: string,
  overlapDate?: string
}) {
  let query = supabase
    .from('dat_phong')
    .select(`
      *,
      khach_hang(*),
      phong(
        *,
        loai_phong(
          *,
          co_so(*)
        )
      ),
      thanh_toan(*)
    `);

  if (filters?.trangThai) {
    query = query.eq('trang_thai', filters.trangThai);
  }
  if (filters?.kenhDat) {
    query = query.eq('kenh_dat', filters.kenhDat);
  }
  if (filters?.roomId) {
    query = query.eq('id_phong', filters.roomId);
  }

  // New overlap logic
  if (filters?.overlapDate) {
    const startOfDay = new Date(filters.overlapDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.overlapDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    query = query.lt('thoi_gian_nhan', endOfDay.toISOString());
    query = query.gt('thoi_gian_tra', startOfDay.toISOString());
  } else {
    // Keep old logic if not using overlap
    if (filters?.startDate) {
      query = query.gte('thoi_gian_nhan', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('thoi_gian_tra', filters.endDate);
    }
  }

  const { data, error } = await query.order('ngay_tao', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDatPhongByMaDat(maDat: string) {
  const { data, error } = await supabase
    .from('dat_phong')
    .select(`
      *,
      khach_hang(*),
      phong(
        *,
        loai_phong(
          *,
          co_so(*)
        )
      ),
      thanh_toan(*)
    `)
    .eq('ma_dat', maDat)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getDatPhongByKhachHang(khachHangId: string) {
  const { data, error } = await supabase
    .from('dat_phong')
    .select(`
      *,
      khach_hang(*),
      phong(
        *,
        loai_phong(
          *,
          co_so(*)
        )
      ),
      thanh_toan(*)
    `)
    .eq('id_khach_hang', khachHangId)
    .order('ngay_tao', { ascending: false });

  if (error) throw error;
  return data;
}

export async function checkBookingOverlap(id_phong: string, thoi_gian_nhan: string, thoi_gian_tra: string) {
  const { data, error } = await supabase
    .from('dat_phong')
    .select('id, ma_dat, thoi_gian_nhan, thoi_gian_tra')
    .eq('id_phong', id_phong)
    .neq('trang_thai', 'da_huy') // Chỉ kiểm tra các booking còn hiệu lực
    .lt('thoi_gian_nhan', thoi_gian_tra) // Lượt đặt cũ bắt đầu TRƯỚC khi lượt đặt mới kết thúc
    .gt('thoi_gian_tra', thoi_gian_nhan); // Lượt đặt cũ kết thúc SAU khi lượt đặt mới bắt đầu

  if (error) throw error;
  return data;
}

export async function createDatPhong(datPhong: any) {
  const { data, error } = await supabase
    .from('dat_phong')
    .insert(datPhong)
    .select(`
      *,
      khach_hang(*),
      phong(
        *,
        loai_phong(
          *,
          co_so(*)
        )
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateDatPhong(id: string, updates: any) {
  const { data, error } = await supabase
    .from('dat_phong')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      khach_hang(*),
      phong(
        *,
        loai_phong(
          *,
          co_so(*)
        )
      ),
      thanh_toan(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDatPhong(id: string) {
  const { error } = await supabase
    .from('dat_phong')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== THANH TOÁN (PAYMENTS) ====================

export async function getAllThanhToan(datPhongId?: string) {
  let query = supabase
    .from('thanh_toan')
    .select(`
      *,
      dat_phong(
        *,
        khach_hang(*)
      )
    `);

  if (datPhongId) {
    query = query.eq('id_dat_phong', datPhongId);
  }

  const { data, error } = await query.order('ngay_tt', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createThanhToan(thanhToan: any) {
  const { data, error } = await supabase
    .from('thanh_toan')
    .insert(thanhToan)
    .select(`
      *,
      dat_phong(
        *,
        khach_hang(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateThanhToan(id: string, updates: any) {
  const { data, error } = await supabase
    .from('thanh_toan')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== TÀI KHOẢN (ACCOUNTS) ====================

export async function getAllTaiKhoan() {
  const { data, error } = await supabase
    .from('tai_khoan')
    .select('*')
    .order('ngay_tao', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTaiKhoanByEmail(email: string) {
  const { data, error } = await supabase
    .from('tai_khoan')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createTaiKhoan(taiKhoan: any) {
  const { data, error } = await supabase
    .from('tai_khoan')
    .insert(taiKhoan)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaiKhoan(id: string, updates: any) {
  const { data, error } = await supabase
    .from('tai_khoan')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTaiKhoan(id: string) {
  const { error } = await supabase
    .from('tai_khoan')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== TIỆN ÍCH ====================

export async function getAllTienIch() {
  const { data, error } = await supabase
    .from('tien_ich')
    .select('*')
    .order('ten_tien_ich');

  if (error) throw error;
  return data;
}

export async function getTienIchByPhong(phongId: string) {
  const { data, error } = await supabase
    .from('phong_tienich')
    .select(`
      tien_ich(*)
    `)
    .eq('id_phong', phongId);

  if (error) throw error;
  return data?.map(item => item.tien_ich) || [];
}

// ==================== PHẢN HỒI ====================

export async function getAllPhanHoi() {
  const { data, error } = await supabase
    .from('phan_hoi')
    .select(`
      *,
      khach_hang(*)
    `)
    .order('ngay_gui', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPhanHoi(phanHoi: any) {
  const { data, error } = await supabase
    .from('phan_hoi')
    .insert(phanHoi)
    .select(`
      *,
      khach_hang(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

// ==================== STATISTICS ====================

export async function getStatistics(filters?: { startDate?: string, endDate?: string }) {
  // Get all bookings with filters - SAME AS getDetailedReports
  let bookingsQuery = supabase
    .from('dat_phong')
    .select(`
      *,
      khach_hang(*),
      phong(*, loai_phong(*))
    `)
    .order('thoi_gian_nhan', { ascending: false });

  if (filters?.startDate) {
    bookingsQuery = bookingsQuery.gte('thoi_gian_nhan', filters.startDate);
  }
  if (filters?.endDate) {
    bookingsQuery = bookingsQuery.lte('thoi_gian_nhan', filters.endDate + 'T23:59:59');
  }

  const { data: bookings, error } = await bookingsQuery;
  if (error) throw error;

  // Calculate statistics - USING CORRECT STATUS NAMES
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b =>
    b.trang_thai === 'da_coc' || b.trang_thai === 'da_tt' ||
    b.trang_thai === 'checkin' || b.trang_thai === 'checkout'
  ).length;
  const cancelledBookings = bookings.filter(b => b.trang_thai === 'da_huy').length;

  // Total revenue - exclude cancelled bookings
  const totalRevenue = bookings
    .filter(b => b.trang_thai !== 'da_huy')
    .reduce((sum, b) => sum + (b.tong_tien || 0), 0);

  // Get all rooms
  const rooms = await getAllPhong();
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r =>
    r.trang_thai === 'dang_dung' || r.trang_thai === 'sap_nhan'
  ).length;

  // Get all customers
  const customers = await getAllKhachHang();
  const totalCustomers = customers.length;

  return {
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    totalRevenue,
    totalRooms,
    occupiedRooms,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    totalCustomers
  };
}

export async function getDetailedReports(filters?: { startDate?: string, endDate?: string }) {
  // Get bookings with filters
  let bookingsQuery = supabase
    .from('dat_phong')
    .select(`
      *,
      khach_hang(*),
      phong(*, loai_phong(*))
    `)
    .order('thoi_gian_nhan', { ascending: false });

  if (filters?.startDate) {
    bookingsQuery = bookingsQuery.gte('thoi_gian_nhan', filters.startDate);
  }
  if (filters?.endDate) {
    bookingsQuery = bookingsQuery.lte('thoi_gian_nhan', filters.endDate + 'T23:59:59');
  }

  const { data: bookings, error } = await bookingsQuery;
  if (error) throw error;

  // Get all rooms
  const rooms = await getAllPhong();

  // Get all customers (no date filter since khach_hang may not have created_at)
  const allCustomers = await getAllKhachHang();

  // Filter customers who have bookings in the date range
  const customerIdsInRange = new Set(bookings.map(b => b.id_khach_hang));
  const filteredCustomers = allCustomers.filter(c => customerIdsInRange.has(c.id));

  // Calculate basic stats
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b =>
    b.trang_thai === 'da_coc' || b.trang_thai === 'da_tt'
  ).length;
  const cancelledBookings = bookings.filter(b => b.trang_thai === 'da_huy').length;
  const checkedInBookings = bookings.filter(b =>
    b.trang_thai === 'da_nhan_phong' || b.trang_thai === 'checkin'
  ).length;
  const checkedOutBookings = bookings.filter(b =>
    b.trang_thai === 'da_tra_phong' || b.trang_thai === 'checkout'
  ).length;

  // Tổng hợp bảng chi tiết hiệu suất phòng (roomUsageDetails)
  let startDate = filters?.startDate ? new Date(filters.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  let endDate = filters?.endDate ? new Date(filters.endDate) : new Date();
  
  // Set hours for accurate calculation
  startDate.setHours(0,0,0,0);
  endDate.setHours(23,59,59,999);

  let totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  const roomUsageDetails = rooms.map(room => {
    // Lọc các booking của phòng này trong kỳ báo cáo, không tính booking đã hủy
    const roomBookings = bookings.filter(b => b.id_phong === room.id && b.trang_thai !== 'da_huy');
    // Tính tổng số ngày sử dụng
    let usedDays = 0;
    
    roomBookings.forEach(b => {
      const checkIn = new Date(b.thoi_gian_nhan);
      const checkOut = new Date(b.thoi_gian_tra);
      
      // Tính số ngày giao với kỳ báo cáo (Intersection)
      let overlapStart = checkIn > startDate ? checkIn : startDate;
      let overlapEnd = checkOut < endDate ? checkOut : endDate;
      
      if (overlapEnd > overlapStart) {
        let days = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24);
        usedDays += days;
      }
    });

    // Rounding and Capping
    usedDays = Number(usedDays.toFixed(1));
    if (usedDays > totalDays) usedDays = totalDays;

    // Số ngày khả dụng là tổng số ngày trong kỳ báo cáo
    const availableDays = totalDays;
    // Công suất (%)
    const occupancy = availableDays > 0 ? Math.round((usedDays / availableDays) * 100) : 0;
    // Số lượt đặt
    const bookingsCount = roomBookings.length;
    return {
      branch: room.loai_phong?.co_so?.ten_co_so || '',
      room: room.ma_phong || '',
      type: room.loai_phong?.ten_loai || '',
      usedDays,
      availableDays,
      occupancy,
      bookings: bookingsCount
    };
  });
  
  // Sort by occupancy desc
  roomUsageDetails.sort((a, b) => b.occupancy - a.occupancy);

  const cancelRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

  // Calculate revenue
  const totalRevenue = bookings
    .filter(b => b.trang_thai !== 'da_huy')
    .reduce((sum, b) => sum + (b.tong_tien || 0), 0);

  const totalDeposit = bookings
    .filter(b => b.trang_thai !== 'da_huy')
    .reduce((sum, b) => sum + (b.coc_csvc || 0), 0);
  // Calculate nights
  const totalNights = bookings
    .filter(b => b.trang_thai !== 'da_huy')
    .reduce((sum, b) => {
      const checkIn = new Date(b.thoi_gian_nhan);
      const checkOut = new Date(b.thoi_gian_tra);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(nights, 0);
    }, 0);

  const averageNightlyRate = totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0;
  const averageBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  // Room stats
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r =>
    r.trang_thai === 'dang_dung' || r.trang_thai === 'sap_nhan'
  ).length;
  const availableRooms = totalRooms - occupiedRooms;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Customer stats
  const totalCustomers = allCustomers.length;
  const newCustomers = filteredCustomers.length;

  // Calculate growth (mock for now - would need previous period data)
  const growthRate = 15.5; // Mock data

  // Daily revenue
  const dailyRevenueMap = new Map<string, { revenue: number; bookings: number }>();
  bookings.forEach(b => {
    if (b.trang_thai === 'da_huy') return;

    const date = new Date(b.thoi_gian_nhan).toISOString().split('T')[0];
    const current = dailyRevenueMap.get(date) || { revenue: 0, bookings: 0 };
    dailyRevenueMap.set(date, {
      revenue: current.revenue + (b.tong_tien || 0),
      bookings: current.bookings + 1
    });
  });

  const dailyRevenue = Array.from(dailyRevenueMap.entries())
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      revenue: data.revenue,
      bookings: data.bookings
    }))
    .sort((a, b) => {
      const [dayA, monthA] = a.date.split('/');
      const [dayB, monthB] = b.date.split('/');
      return (parseInt(monthA) * 100 + parseInt(dayA)) - (parseInt(monthB) * 100 + parseInt(dayB));
    });

  // Top rooms
  const roomRevenueMap = new Map<string, { name: string; bookings: number; revenue: number }>();
  bookings.forEach(b => {
    if (b.trang_thai === 'da_huy' || !b.phong) return;

    const roomName = `${b.phong.loai_phong?.ten_loai || 'N/A'} - ${b.phong.ma_phong}`;
    const current = roomRevenueMap.get(roomName) || { name: roomName, bookings: 0, revenue: 0 };
    roomRevenueMap.set(roomName, {
      name: roomName,
      bookings: current.bookings + 1,
      revenue: current.revenue + (b.tong_tien || 0)
    });
  });

  const topRooms = Array.from(roomRevenueMap.values())
    .sort((a, b) => b.bookings - a.bookings);

  // Booking sources
  const sourceMap = new Map<string, number>();
  bookings.forEach(b => {
    const source = b.kenh_dat || 'other';
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
  });

  const sourceLabels: Record<string, string> = {
    walk_in: 'Walk-in',
    phone: 'Điện thoại',
    website: 'Website',
    facebook: 'Facebook',
    zalo: 'Zalo',
    khac: 'Khác',
    booking_com: 'Booking.com',
    agoda: 'Agoda',
    other: 'Khác'
  };

  const bookingSources = Array.from(sourceMap.entries())
    .map(([source, count]) => ({
      source: sourceLabels[source] || source,
      count
    }));

  // Booking status
  const statusMap = new Map<string, number>();
  bookings.forEach(b => {
    const status = b.trang_thai || 'pending';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const statusLabels: Record<string, string> = {
    // New status values
    cho_coc: 'Chờ cọc',
    da_coc: 'Đã cọc',
    da_nhan_phong: 'Đã nhận phòng',
    da_tra_phong: 'Đã trả phòng',
    da_huy: 'Đã hủy',
    // Old status values (backward compatibility)
    da_tt: 'Đã thanh toán',
    checkin: 'Đang ở',
    checkout: 'Đã trả'
  };

  const bookingStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status: statusLabels[status] || status,
      count
    }));

  return {
    // Tổng quan
    totalBookings,
    totalRevenue,
    totalDeposit,
    totalCustomers,
    newCustomers,

    // Phòng
    totalRooms,
    occupiedRooms,
    availableRooms,
    occupancyRate,
    totalNights,

    // Đặt phòng
    confirmedBookings,
    cancelledBookings,
    checkedInBookings,
    checkedOutBookings,
    cancelRate,

    // Doanh thu
    averageBookingValue,
    averageNightlyRate,
    growthRate,

    // Chi tiết
    dailyRevenue,
    topRooms,
    bookingSources,
    bookingStatus,
    
    // Dữ liệu bảng chi tiết (Mới thêm)
    roomUsageDetails
  };
}

// ==================== STAFF REPORTS ====================

export async function getStaffRoomReport(filters?: { startDate?: string, endDate?: string }) {
  // Generate date range
  const start = filters?.startDate ? new Date(filters.startDate) : new Date();
  const end = filters?.endDate ? new Date(filters.endDate) : new Date();

  const dateRange: Date[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get all rooms
  const rooms = await getAllPhong();
  const totalRooms = rooms.length;

  // Get all bookings
  const bookings = await getAllDatPhong(filters);

  // Calculate daily stats
  const dailyStats = dateRange.map(date => {
    const dateStr = date.toISOString().split('T')[0];

    // Bookings on this date
    const dateBookings = bookings.filter(b => {
      const checkIn = new Date(b.thoi_gian_nhan).toISOString().split('T')[0];
      const checkOut = new Date(b.thoi_gian_tra).toISOString().split('T')[0];
      return dateStr >= checkIn && dateStr <= checkOut && b.trang_thai !== 'da_huy';
    });

    // Check-outs on this date
    const checkOuts = bookings.filter(b => {
      const checkOut = new Date(b.thoi_gian_tra).toISOString().split('T')[0];
      return dateStr === checkOut && b.trang_thai !== 'da_huy';
    });

    // Check-ins on this date
    const checkIns = bookings.filter(b => {
      const checkIn = new Date(b.thoi_gian_nhan).toISOString().split('T')[0];
      return dateStr === checkIn && b.trang_thai !== 'da_huy';
    });

    const occupied = dateBookings.length;
    const empty = totalRooms - occupied;
    const occupancy = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      emptyRooms: empty,
      checkouts: checkOuts.length,
      checkins: checkIns.length,
      occupied,
      occupancy
    };
  });

  return dailyStats;
}

// ==================== DAILY FINANCIAL REPORT ====================

export async function getDailyFinancialReport(reportDate?: string) {
  const targetDate = reportDate || new Date().toISOString().split('T')[0];

  // Get bookings that had activity on this date (check-in or check-out)
  const { data: bookings, error } = await supabase
    .from('dat_phong')
    .select(`
      *,
      khach_hang(*),
      phong(*, loai_phong(*)),
      thanh_toan(*)
    `)
    .or(`thoi_gian_nhan.gte.${targetDate}T00:00:00,thoi_gian_tra.gte.${targetDate}T00:00:00`)
    .or(`thoi_gian_nhan.lte.${targetDate}T23:59:59,thoi_gian_tra.lte.${targetDate}T23:59:59`)
    .order('thoi_gian_nhan', { ascending: true });

  if (error) throw error;

  // Filter bookings that actually had activity on target date
  const relevantBookings = bookings?.filter(b => {
    const checkInDate = new Date(b.thoi_gian_nhan).toISOString().split('T')[0];
    const checkOutDate = new Date(b.thoi_gian_tra).toISOString().split('T')[0];
    return checkInDate === targetDate || checkOutDate === targetDate;
  }) || [];

  // Build transaction list
  const transactions = relevantBookings.map(booking => {
    const checkInDate = new Date(booking.thoi_gian_nhan).toISOString().split('T')[0];
    const checkOutDate = new Date(booking.thoi_gian_tra).toISOString().split('T')[0];

    const isCheckIn = checkInDate === targetDate;
    const isCheckOut = checkOutDate === targetDate;

    let revenue = 0;
    let received = 0;
    let deposit = 0;
    let refund = 0;
    let debt = 0;

    if (isCheckIn) {
      // Check-in: receive deposit
      deposit = booking.coc_csvc || 0;
      received = deposit;
    }

    if (isCheckOut) {
      // Check-out: receive payment and refund deposit
      revenue = booking.tong_tien || 0;
      received = revenue;
      refund = booking.coc_csvc || 0;

      // If not fully paid, mark as debt
      const paid = booking.thanh_toan?.reduce((sum: number, t: any) =>
        sum + (t.trang_thai === 'thanh_cong' ? t.so_tien : 0), 0) || 0;
      debt = Math.max(0, revenue - paid);
    }

    const sourceLabels: Record<string, string> = {
      walk_in: 'Walk-in',
      phone: 'Điện thoại',
      website: 'Website',
      facebook: 'Facebook',
      zalo: 'Zalo',
      booking_com: 'Booking.com',
      agoda: 'Agoda',
      khac: 'Khác'
    };

    let note = `Đặt qua ${sourceLabels[booking.kenh_dat] || booking.kenh_dat}`;
    if (isCheckOut) note += ', Đã trả phòng';
    if (booking.ghi_chu) note += `, ${booking.ghi_chu}`;

    return {
      code: booking.ma_dat,
      time: new Date(isCheckIn ? booking.thoi_gian_nhan : booking.thoi_gian_tra)
        .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      customerName: booking.khach_hang?.ho_ten || 'N/A',
      room: booking.phong?.ma_phong || 'N/A',
      revenue,
      received,
      deposit,
      refund,
      debt,
      note
    };
  });

  // Calculate totals
  const totalRevenue = transactions.reduce((sum, t) => sum + t.revenue, 0);
  const totalReceived = transactions.reduce((sum, t) => sum + t.received, 0);
  const totalDeposit = transactions.reduce((sum, t) => sum + t.deposit, 0);
  const totalRefund = transactions.reduce((sum, t) => sum + t.refund, 0);
  const totalDebt = transactions.reduce((sum, t) => sum + t.debt, 0);

  return {
    transactions,
    summary: {
      totalRevenue,
      totalReceived,
      totalDeposit,
      totalRefund,
      totalDebt
    }
  };
}