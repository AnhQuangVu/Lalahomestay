import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as sql from './sql-queries.tsx';
import { initializeDemoData } from './init-demo-data.tsx';

const app = new Hono();

// Initialize Supabase client for direct queries
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// ==================== HELPER FUNCTIONS ====================

// Helper function to generate booking code
function generateBookingCode(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LALA-${dateStr}-${random}`;
}

// ==================== CƠ SỞ (LOCATIONS) ====================

app.get('/make-server-faeb1932/co-so', async (c) => {
  try {
    const data = await sql.getAllCoSo();
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching co_so:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách cơ sở'
    }, 500);
  }
});

app.post('/make-server-faeb1932/co-so', async (c) => {
  try {
    const body = await c.req.json();
    const data = await sql.createCoSo(body);
    return c.json({
      success: true,
      data,
      message: 'Tạo cơ sở thành công'
    });
  } catch (error) {
    console.error('Error creating co_so:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo cơ sở'
    }, 500);
  }
});

app.put('/make-server-faeb1932/co-so/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = await sql.updateCoSo(id, body);
    return c.json({
      success: true,
      data,
      message: 'Cập nhật cơ sở thành công'
    });
  } catch (error) {
    console.error('Error updating co_so:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật cơ sở'
    }, 500);
  }
});

app.delete('/make-server-faeb1932/co-so/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await sql.deleteCoSo(id);
    return c.json({
      success: true,
      message: 'Xóa cơ sở thành công'
    });
  } catch (error) {
    console.error('Error deleting co_so:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xóa cơ sở'
    }, 500);
  }
});

// ==================== LOẠI PHÒNG (CONCEPTS) ====================

app.get('/make-server-faeb1932/loai-phong', async (c) => {
  try {
    const coSoId = c.req.query('co_so_id');
    const data = await sql.getAllLoaiPhong(coSoId);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching loai_phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách loại phòng'
    }, 500);
  }
});

app.post('/make-server-faeb1932/loai-phong', async (c) => {
  try {
    const body = await c.req.json();
    const data = await sql.createLoaiPhong(body);
    return c.json({
      success: true,
      data,
      message: 'Tạo loại phòng thành công'
    });
  } catch (error) {
    console.error('Error creating loai_phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo loại phòng'
    }, 500);
  }
});

app.put('/make-server-faeb1932/loai-phong/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = await sql.updateLoaiPhong(id, body);
    return c.json({
      success: true,
      data,
      message: 'Cập nhật loại phòng thành công'
    });
  } catch (error) {
    console.error('Error updating loai_phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật loại phòng'
    }, 500);
  }
});

app.delete('/make-server-faeb1932/loai-phong/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await sql.deleteLoaiPhong(id);
    return c.json({
      success: true,
      message: 'Xóa loại phòng thành công'
    });
  } catch (error) {
    console.error('Error deleting loai_phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xóa loại phòng'
    }, 500);
  }
});

// ==================== PHÒNG (ROOMS) ====================

app.get('/make-server-faeb1932/phong', async (c) => {
  try {
    const loaiPhongId = c.req.query('loai_phong_id');
    const trangThai = c.req.query('trang_thai');

    const filters: any = {};
    if (loaiPhongId) filters.loaiPhongId = loaiPhongId;
    if (trangThai) filters.trangThai = trangThai;

    const data = await sql.getAllPhong(filters);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách phòng'
    }, 500);
  }
});

app.post('/make-server-faeb1932/phong', async (c) => {
  try {
    const body = await c.req.json();
    const data = await sql.createPhong(body);
    return c.json({
      success: true,
      data,
      message: 'Tạo phòng thành công'
    });
  } catch (error) {
    console.error('Error creating phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo phòng'
    }, 500);
  }
});

app.put('/make-server-faeb1932/phong/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = await sql.updatePhong(id, body);
    return c.json({
      success: true,
      data,
      message: 'Cập nhật phòng thành công'
    });
  } catch (error) {
    console.error('Error updating phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật phòng'
    }, 500);
  }
});

app.delete('/make-server-faeb1932/phong/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await sql.deletePhong(id);
    return c.json({
      success: true,
      suspended: result.suspended,
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xóa phòng'
    }, 500);
  }
});

// ==================== KHÁCH HÀNG (CUSTOMERS) ====================

app.get('/make-server-faeb1932/khach-hang', async (c) => {
  try {
    const data = await sql.getAllKhachHang();
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching khach_hang:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách khách hàng'
    }, 500);
  }
});

app.get('/make-server-faeb1932/khach-hang/:phone', async (c) => {
  try {
    const phone = c.req.param('phone');
    const data = await sql.getKhachHangByPhone(phone);

    if (!data) {
      return c.json({
        success: false,
        error: 'Không tìm thấy khách hàng'
      }, 404);
    }

    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching khach_hang by phone:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy thông tin khách hàng'
    }, 500);
  }
});

app.post('/make-server-faeb1932/khach-hang', async (c) => {
  try {
    const body = await c.req.json();

    console.log('Creating khach_hang with data:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.ho_ten || body.ho_ten.trim() === '') {
      console.error('Validation error: ho_ten is required but got:', body.ho_ten);
      return c.json({
        success: false,
        error: 'Họ tên là bắt buộc'
      }, 400);
    }

    if (!body.sdt || body.sdt.trim() === '') {
      console.error('Validation error: sdt is required but got:', body.sdt);
      return c.json({
        success: false,
        error: 'Số điện thoại là bắt buộc'
      }, 400);
    }

    const data = await sql.createKhachHang(body);
    console.log('Created khach_hang successfully:', data.id);
    // DEBUG: print full created customer record (helps verify cccd fields)
    console.log('DEBUG created khach_hang record:', JSON.stringify(data, null, 2));

    return c.json({
      success: true,
      data,
      message: 'Tạo khách hàng thành công'
    });
  } catch (error) {
    console.error('Error creating khach_hang:', error);
    console.error('Error details:', error.message, error.details, error.hint);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo khách hàng'
    }, 500);
  }
});

app.put('/make-server-faeb1932/khach-hang/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = await sql.updateKhachHang(id, body);
    return c.json({
      success: true,
      data,
      message: 'Cập nhật khách hàng thành công'
    });
  } catch (error) {
    console.error('Error updating khach_hang:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật khách hàng'
    }, 500);
  }
});

// ==================== ĐẶT PHÒNG (BOOKINGS) ====================

app.get('/make-server-faeb1932/dat-phong', async (c) => {
  try {
    const trangThai = c.req.query('trang_thai');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const kenhDat = c.req.query('kenh_dat');

    const filters: any = {};
    if (trangThai) filters.trangThai = trangThai;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (kenhDat) filters.kenhDat = kenhDat;

    const data = await sql.getAllDatPhong(filters);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching dat_phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách đặt phòng'
    }, 500);
  }
});

app.get('/make-server-faeb1932/dat-phong/ma/:maDat', async (c) => {
  try {
    const maDat = c.req.param('maDat');
    const data = await sql.getDatPhongByMaDat(maDat);

    if (!data) {
      return c.json({
        success: false,
        error: 'Không tìm thấy đơn đặt phòng'
      }, 404);
    }

    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching dat_phong by ma_dat:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy thông tin đặt phòng'
    }, 500);
  }
});

app.get('/make-server-faeb1932/dat-phong/khach-hang/:khachHangId', async (c) => {
  try {
    const khachHangId = c.req.param('khachHangId');
    const data = await sql.getDatPhongByKhachHang(khachHangId);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching dat_phong by khach_hang:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy lịch sử đặt phòng'
    }, 500);
  }
});

app.post('/make-server-faeb1932/dat-phong', async (c) => {
  try {
    const body = await c.req.json();

    console.log('Creating booking with data:', JSON.stringify(body, null, 2));

    // Generate booking code if not provided
    if (!body.ma_dat) {
      body.ma_dat = generateBookingCode();
    }

    // Determine customer ID
    let customerId = body.id_khach_hang;

    // If no customer ID provided, try to find or create customer
    if (!customerId) {
      if (!body.sdt || !body.ho_ten) {
        console.error('Missing customer info: sdt or ho_ten');
        return c.json({
          success: false,
          error: 'Thiếu thông tin khách hàng (số điện thoại hoặc họ tên)'
        }, 400);
      }

      let khachHang = await sql.getKhachHangByPhone(body.sdt);
      if (!khachHang) {
        // Create new customer
        console.log('Creating new customer with ho_ten:', body.ho_ten, 'sdt:', body.sdt);
        console.log('CCCD data from request - mat_truoc:', body.cccd_mat_truoc, 'mat_sau:', body.cccd_mat_sau);
        khachHang = await sql.createKhachHang({
          ho_ten: body.ho_ten,
          sdt: body.sdt,
          email: body.email || null,
          dia_chi: body.dia_chi || null,
          ghi_chu: body.ghi_chu_khach || null,
          cccd_mat_truoc: body.cccd_mat_truoc || null,
          cccd_mat_sau: body.cccd_mat_sau || null
        });
        console.log('DEBUG new khachHang from createKhachHang:', JSON.stringify(khachHang, null, 2));
      } else {
        // Customer exists - only update CCCD if new images are provided
        console.log('Customer exists:', khachHang.ho_ten, '-', khachHang.sdt);
        console.log('Existing CCCD - mat_truoc:', khachHang.cccd_mat_truoc, 'mat_sau:', khachHang.cccd_mat_sau);
        console.log('New CCCD from request - mat_truoc:', body.cccd_mat_truoc, 'mat_sau:', body.cccd_mat_sau);

        const updateData: any = {};

        // Only update CCCD if new images are provided
        if (body.cccd_mat_truoc) {
          updateData.cccd_mat_truoc = body.cccd_mat_truoc;
          console.log('Will update cccd_mat_truoc');
        }
        if (body.cccd_mat_sau) {
          updateData.cccd_mat_sau = body.cccd_mat_sau;
          console.log('Will update cccd_mat_sau');
        }

        // Only call update if there's something to update
        if (Object.keys(updateData).length > 0) {
          console.log('Updating customer CCCD with data:', JSON.stringify(updateData, null, 2));
          await sql.updateKhachHang(khachHang.id, updateData);

          // Refresh customer data
          khachHang = await sql.getKhachHangByPhone(body.sdt);
          console.log('DEBUG refreshed khachHang after update:', JSON.stringify(khachHang, null, 2));
        } else {
          console.log('No CCCD update needed, using existing customer data');
        }
      }
      customerId = khachHang.id;
    }

    console.log('Using customer ID:', customerId);

    // Create booking
    // Accept ghi_chu coming from either body.ghi_chu (frontend) or body.ghi_chu_khach (legacy)
    const datPhongData = {
      ma_dat: body.ma_dat,
      id_khach_hang: customerId,
      id_phong: body.id_phong,
      thoi_gian_nhan: body.thoi_gian_nhan,
      thoi_gian_tra: body.thoi_gian_tra,
      so_khach: body.so_khach || 1,
      ghi_chu: body.ghi_chu ?? body.ghi_chu_khach ?? null,
      kenh_dat: body.kenh_dat || 'website',
      trang_thai: body.trang_thai || 'cho_coc',  // Mặc định: Chờ cọc
      tong_tien: body.tong_tien,
      coc_csvc: body.coc_csvc || 500000
    };

    console.log('Creating booking with data:', JSON.stringify(datPhongData, null, 2));
    console.log('Booking note (ghi_chu) value:', datPhongData.ghi_chu);

    const data = await sql.createDatPhong(datPhongData);

    console.log('Booking created successfully:', data.id);

    // Update room status
    await sql.updatePhong(body.id_phong, {
      trang_thai: 'sap_nhan'
    });

    return c.json({
      success: true,
      data,
      message: 'Đặt phòng thành công'
    });
  } catch (error) {
    console.error('Error creating dat_phong:', error);
    console.error('Error details:', error.message, error.details, error.hint);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo đặt phòng'
    }, 500);
  }
});

app.put('/make-server-faeb1932/dat-phong/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = await sql.updateDatPhong(id, body);

    // If booking status changed, synchronize room status accordingly
    try {
      const newStatus = body.trang_thai;
      // Determine room id from updated data or request body
      const roomId = data?.id_phong || body.id_phong || (data?.phong && data.phong.id);

      if (roomId && newStatus) {
        // Map booking statuses -> room statuses (support both old and new status names)
        // When booking is checked out or cancelled, free the room
        if (
          newStatus === 'checkout' ||
          newStatus === 'da_tra' ||
          newStatus === 'da_tra_phong' ||
          newStatus === 'da_huy' ||
          newStatus === 'huy'
        ) {
          await sql.updatePhong(roomId, { trang_thai: 'trong' });
        }
        // When booking is checked in or occupied, mark room as in-use
        else if (
          newStatus === 'checkin' ||
          newStatus === 'dang_o' ||
          newStatus === 'da_nhan_phong' ||
          newStatus === 'da_tt'
        ) {
          await sql.updatePhong(roomId, { trang_thai: 'dang_dung' });
        }
        // other statuses: do not change room status here
      }
    } catch (syncErr) {
      console.error('Error syncing room status after booking update:', syncErr);
    }

    return c.json({
      success: true,
      data,
      message: 'Cập nhật đặt phòng thành công'
    });
  } catch (error) {
    console.error('Error updating dat_phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật đặt phòng'
    }, 500);
  }
});

app.delete('/make-server-faeb1932/dat-phong/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await sql.deleteDatPhong(id);
    return c.json({
      success: true,
      message: 'Xóa đặt phòng thành công'
    });
  } catch (error) {
    console.error('Error deleting dat_phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xóa đặt phòng'
    }, 500);
  }
});

// Lookup bookings by code or phone
app.get('/make-server-faeb1932/bookings/lookup', async (c) => {
  try {
    const code = c.req.query('code');
    const phone = c.req.query('phone');

    let bookings = [];

    if (code) {
      // Search by booking code
      const booking = await sql.getDatPhongByMaDat(code);
      if (booking) {
        bookings = [{
          code: booking.ma_dat,
          customerName: booking.khach_hang?.ho_ten || '',
          customerPhone: booking.khach_hang?.sdt || '',
          customerEmail: booking.khach_hang?.email || '',
          roomConcept: booking.phong?.loai_phong?.ten_loai || '',
          roomNumber: booking.phong?.ma_phong || '',
          checkIn: booking.thoi_gian_nhan,
          checkOut: booking.thoi_gian_tra,
          numberOfGuests: booking.so_khach,
          totalAmount: booking.tong_tien,
          paymentStatus: 'pending',
          bookingStatus: booking.trang_thai === 'da_coc' ? 'confirmed' :
            (booking.trang_thai === 'da_nhan_phong' || booking.trang_thai === 'dang_o') ? 'checked-in' :
              (booking.trang_thai === 'da_tra_phong' || booking.trang_thai === 'da_tra' || booking.trang_thai === 'checkout') ? 'checked-out' :
                (booking.trang_thai === 'da_huy' || booking.trang_thai === 'huy') ? 'cancelled' :
                  (booking.trang_thai === 'cho_coc' ? 'pending' : 'pending'),
          createdAt: booking.created_at
        }];
      }
    } else if (phone) {
      // Search by phone - find customer first, then get their bookings
      const customer = await sql.getKhachHangByPhone(phone);
      if (customer) {
        const customerBookings = await sql.getDatPhongByKhachHang(customer.id);
        bookings = customerBookings.map((booking: any) => ({
          code: booking.ma_dat,
          customerName: booking.khach_hang?.ho_ten || customer.ho_ten,
          customerPhone: booking.khach_hang?.sdt || customer.sdt,
          customerEmail: booking.khach_hang?.email || customer.email || '',
          roomConcept: booking.phong?.loai_phong?.ten_loai || '',
          roomNumber: booking.phong?.ma_phong || '',
          checkIn: booking.thoi_gian_nhan,
          checkOut: booking.thoi_gian_tra,
          numberOfGuests: booking.so_khach,
          totalAmount: booking.tong_tien,
          paymentStatus: 'pending',
          bookingStatus: booking.trang_thai === 'da_coc' ? 'confirmed' :
            (booking.trang_thai === 'da_nhan_phong' || booking.trang_thai === 'dang_o') ? 'checked-in' :
              (booking.trang_thai === 'da_tra_phong' || booking.trang_thai === 'da_tra' || booking.trang_thai === 'checkout') ? 'checked-out' :
                (booking.trang_thai === 'da_huy' || booking.trang_thai === 'huy') ? 'cancelled' :
                  (booking.trang_thai === 'cho_coc' ? 'pending' : 'pending'),
          createdAt: booking.created_at
        }));
      }
    }

    return c.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error in bookings lookup:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tra cứu đặt phòng',
      bookings: []
    }, 500);
  }
});

// Manual booking endpoint for staff (legacy support)
app.post('/make-server-faeb1932/bookings/manual', async (c) => {
  try {
    const formData = await c.req.json();

    console.log('Manual booking with data:', JSON.stringify(formData, null, 2));

    // Validate required fields
    if (!formData.customerName || !formData.customerPhone) {
      return c.json({
        success: false,
        error: 'Thiếu thông tin khách hàng'
      }, 400);
    }

    if (!formData.room || !formData.checkIn || !formData.checkOut) {
      return c.json({
        success: false,
        error: 'Thiếu thông tin đặt phòng'
      }, 400);
    }

    // Create/get customer
    let khachHang = await sql.getKhachHangByPhone(formData.customerPhone);
    if (!khachHang) {
      khachHang = await sql.createKhachHang({
        ho_ten: formData.customerName,
        sdt: formData.customerPhone,
        email: formData.customerEmail || null,
        ghi_chu: formData.notes || null
      });
    }

    // Calculate total (simplified - in real app should get from room data)
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const nights = Math.ceil(hours / 24);
    const pricePerNight = 500000;
    const totalAmount = pricePerNight * nights;

    // Create booking
    const bookingCode = generateBookingCode();
    const bookingData = {
      ma_dat: bookingCode,
      id_khach_hang: khachHang.id,
      id_phong: formData.room,
      thoi_gian_nhan: formData.checkIn,
      thoi_gian_tra: formData.checkOut,
      so_khach: formData.numberOfGuests || 1,
      ghi_chu: formData.notes || null,
      kenh_dat: formData.bookingSource || 'other',
      trang_thai: 'da_coc',
      tong_tien: totalAmount,
      coc_csvc: 500000
    };

    const booking = await sql.createDatPhong(bookingData);

    // Update room status
    await sql.updatePhong(formData.room, {
      trang_thai: 'sap_nhan'
    });

    return c.json({
      success: true,
      bookingCode,
      data: booking,
      message: 'Đặt phòng thành công'
    });
  } catch (error) {
    console.error('Error creating manual booking:', error);
    console.error('Error details:', error.message, error.details, error.hint);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo đặt phòng'
    }, 500);
  }
});

// ==================== THANH TOÁN (PAYMENTS) ====================

app.get('/make-server-faeb1932/thanh-toan', async (c) => {
  try {
    const datPhongId = c.req.query('dat_phong_id');
    const data = await sql.getAllThanhToan(datPhongId);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching thanh_toan:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách thanh toán'
    }, 500);
  }
});

app.post('/make-server-faeb1932/thanh-toan', async (c) => {
  try {
    const body = await c.req.json();
    const data = await sql.createThanhToan(body);

    // Update booking payment status if paid
    if (body.trang_thai === 'thanh_cong') {
      await sql.updateDatPhong(body.id_dat_phong, {
        trang_thai: 'da_tt'
      });
    }

    return c.json({
      success: true,
      data,
      message: 'Tạo thanh toán thành công'
    });
  } catch (error) {
    console.error('Error creating thanh_toan:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo thanh toán'
    }, 500);
  }
});

app.put('/make-server-faeb1932/thanh-toan/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = await sql.updateThanhToan(id, body);
    return c.json({
      success: true,
      data,
      message: 'Cập nhật thanh toán thành công'
    });
  } catch (error) {
    console.error('Error updating thanh_toan:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật thanh toán'
    }, 500);
  }
});

// ==================== TÀI KHOẢN (ACCOUNTS) ====================

app.get('/make-server-faeb1932/tai-khoan', async (c) => {
  try {
    const data = await sql.getAllTaiKhoan();
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching tai_khoan:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách tài khoản'
    }, 500);
  }
});

app.get('/make-server-faeb1932/tai-khoan/email/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const data = await sql.getTaiKhoanByEmail(email);

    if (!data) {
      return c.json({
        success: false,
        error: 'Không tìm thấy tài khoản'
      }, 404);
    }

    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching tai_khoan by email:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy thông tin tài khoản'
    }, 500);
  }
});

app.post('/make-server-faeb1932/tai-khoan', async (c) => {
  try {
    const body = await c.req.json();
    const data = await sql.createTaiKhoan(body);
    return c.json({
      success: true,
      data,
      message: 'Tạo tài khoản thành công'
    });
  } catch (error) {
    console.error('Error creating tai_khoan:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo tài khoản'
    }, 500);
  }
});

app.put('/make-server-faeb1932/tai-khoan/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = await sql.updateTaiKhoan(id, body);
    return c.json({
      success: true,
      data,
      message: 'Cập nhật tài khoản thành công'
    });
  } catch (error) {
    console.error('Error updating tai_khoan:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật tài khoản'
    }, 500);
  }
});

app.delete('/make-server-faeb1932/tai-khoan/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await sql.deleteTaiKhoan(id);
    return c.json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (error) {
    console.error('Error deleting tai_khoan:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xóa tài khoản'
    }, 500);
  }
});

// ==================== TIỆN ÍCH ====================

app.get('/make-server-faeb1932/tien-ich', async (c) => {
  try {
    const data = await sql.getAllTienIch();
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching tien_ich:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách tiện ích'
    }, 500);
  }
});

app.get('/make-server-faeb1932/tien-ich/phong/:phongId', async (c) => {
  try {
    const phongId = c.req.param('phongId');
    const data = await sql.getTienIchByPhong(phongId);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching tien_ich by phong:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy tiện ích phòng'
    }, 500);
  }
});

// ==================== PHẢN HỒI ====================

app.get('/make-server-faeb1932/phan-hoi', async (c) => {
  try {
    const data = await sql.getAllPhanHoi();
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching phan_hoi:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách phản hồi'
    }, 500);
  }
});

app.post('/make-server-faeb1932/phan-hoi', async (c) => {
  try {
    const body = await c.req.json();
    const data = await sql.createPhanHoi(body);
    return c.json({
      success: true,
      data,
      message: 'Gửi phản hồi thành công'
    });
  } catch (error) {
    console.error('Error creating phan_hoi:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi gửi phản hồi'
    }, 500);
  }
});

// ==================== STATISTICS & REPORTS ====================

app.get('/make-server-faeb1932/admin/statistics', async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await sql.getStatistics(filters);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy thống kê'
    }, 500);
  }
});

app.get('/make-server-faeb1932/admin/reports', async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await sql.getDetailedReports(filters);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy báo cáo'
    }, 500);
  }
});

app.get('/make-server-faeb1932/admin/reports/export', async (c) => {
  try {
    const format = c.req.query('format') || 'excel';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    // For now, return a simple text response
    // In production, you would generate actual Excel/PDF files
    const message = `Xuất báo cáo ${format.toUpperCase()} từ ${startDate} đến ${endDate}`;

    return c.json({
      success: true,
      message,
      note: 'Chức năng xuất file đang được phát triển'
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xuất báo cáo'
    }, 500);
  }
});

// ==================== STAFF REPORTS ====================

app.get('/make-server-faeb1932/staff/room-report', async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await sql.getStaffRoomReport(filters);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching staff room report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy báo cáo phòng'
    }, 500);
  }
});

app.get('/make-server-faeb1932/staff/daily-report', async (c) => {
  try {
    const reportDate = c.req.query('report_date');

    const data = await sql.getDailyFinancialReport(reportDate);
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching daily financial report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lấy báo cáo cuối ngày'
    }, 500);
  }
});

// ==================== ADMIN - INITIALIZE DEMO DATA ====================

app.post('/make-server-faeb1932/admin/init-demo-data', async (c) => {
  try {
    const result = await initializeDemoData();
    return c.json(result);
  } catch (error) {
    console.error('Error initializing demo data:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi khởi tạo dữ liệu demo'
    }, 500);
  }
});

// ==================== DEBUG ENDPOINT ====================

app.get('/make-server-faeb1932/debug/revenue', async (c) => {
  try {
    // Query directly to see what's in database
    const { data: bookings, error } = await supabase
      .from('dat_phong')
      .select(`
        id,
        ma_dat,
        trang_thai,
        tong_tien,
        coc_csvc,
        thoi_gian_nhan,
        khach_hang(ho_ten),
        phong(ma_phong)
      `)
      .order('thoi_gian_nhan', { ascending: false });

    if (error) throw error;

    console.log('🔍 DEBUG: Total bookings from DB:', bookings.length);
    console.log('🔍 DEBUG: Sample booking:', bookings[0]);

    const breakdown = bookings.map(b => ({
      ma_dat: b.ma_dat,
      khach: b.khach_hang?.ho_ten,
      phong: b.phong?.ma_phong,
      trang_thai: b.trang_thai,
      tong_tien: b.tong_tien,
      tong_tien_type: typeof b.tong_tien,
      coc_csvc: b.coc_csvc,
      ngay: new Date(b.thoi_gian_nhan).toLocaleDateString('vi-VN')
    }));

    // Calculate multiple ways to debug
    const totalAll = bookings.reduce((sum, b) => sum + (b.tong_tien || 0), 0);
    const totalExcludeCancelled = bookings
      .filter(b => b.trang_thai !== 'da_huy')
      .reduce((sum, b) => sum + (b.tong_tien || 0), 0);
    const totalCancelled = bookings
      .filter(b => b.trang_thai === 'da_huy')
      .reduce((sum, b) => sum + (b.tong_tien || 0), 0);

    // Also try with parseFloat
    const totalAllParsed = bookings.reduce((sum, b) => sum + (parseFloat(b.tong_tien) || 0), 0);
    const totalExcludeCancelledParsed = bookings
      .filter(b => b.trang_thai !== 'da_huy')
      .reduce((sum, b) => sum + (parseFloat(b.tong_tien) || 0), 0);

    const statusCount = {
      da_coc: bookings.filter(b => b.trang_thai === 'da_coc').length,
      da_tt: bookings.filter(b => b.trang_thai === 'da_tt').length,
      checkin: bookings.filter(b => b.trang_thai === 'checkin').length,
      checkout: bookings.filter(b => b.trang_thai === 'checkout').length,
      da_huy: bookings.filter(b => b.trang_thai === 'da_huy').length,
    };

    console.log('💰 Total all bookings:', totalAll);
    console.log('💰 Total exclude cancelled:', totalExcludeCancelled);
    console.log('💰 Total parsed:', totalAllParsed);

    return c.json({
      success: true,
      debug: {
        total_bookings: bookings.length,
        status_count: statusCount,
        revenue: {
          total_all_bookings: totalAll,
          total_exclude_cancelled: totalExcludeCancelled,
          total_cancelled_bookings_only: totalCancelled,
          total_all_parsed: totalAllParsed,
          total_exclude_cancelled_parsed: totalExcludeCancelledParsed,
          note: 'If parsed and non-parsed are different, there may be a type conversion issue'
        },
        bookings_detail: breakdown,
        raw_sample: bookings.length > 0 ? {
          first_booking: bookings[0],
          data_types: {
            tong_tien_type: typeof bookings[0]?.tong_tien,
            tong_tien_value: bookings[0]?.tong_tien
          }
        } : null
      }
    });
  } catch (error) {
    console.error('Debug revenue error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==================== HEALTH CHECK ====================

app.get('/make-server-faeb1932/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LaLa House Booking API - SQL Version',
    database: 'PostgreSQL (Supabase)'
  });
});

// ==================== 404 HANDLER ====================

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found'
  }, 404);
});

// ==================== ERROR HANDLER ====================

app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    success: false,
    error: err.message || 'Internal server error'
  }, 500);
});

// Start server
Deno.serve(app.fetch);

console.log('LaLa House Booking API server started - Using PostgreSQL tables');
