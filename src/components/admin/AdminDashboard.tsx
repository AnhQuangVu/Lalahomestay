import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Home, Users, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Simple real-time date/time display component
function CurrentDateTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="font-mono text-xs text-gray-700">{now.toLocaleString('vi-VN')}</span>
  );
}

export default function AdminDashboard() {
  const [timeFilter, setTimeFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [rawStats, setRawStats] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState('');

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

  // --- FIX: Hàm format ngày theo giờ địa phương (Việt Nam) ---
  // Tránh lỗi toISOString() bị lệch sang ngày hôm trước do múi giờ UTC
  function formatLocalYMD(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper to get start/end date from timeFilter (LOGIC ĐÃ SỬA)
  function getDateRange(filter: string) {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (filter === 'today') {
      // Giữ nguyên start/end là hôm nay
    } else if (filter === '7days') {
      // 7 ngày gần nhất (tính cả hôm nay)
      start.setDate(now.getDate() - 6);
    } else if (filter === 'month') {
      // Đầu tháng này đến cuối tháng này
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (filter === 'lastmonth') {
      // Đầu tháng trước đến cuối tháng trước
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Trả về chuỗi YYYY-MM-DD chuẩn giờ Việt Nam
    return {
      start_date: formatLocalYMD(start),
      end_date: formatLocalYMD(end)
    };
  }

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { start_date, end_date } = getDateRange(timeFilter);
      
      // Log để kiểm tra xem ngày gửi đi đúng chưa
      console.log(`Fetching stats for: ${start_date} to ${end_date}`);

      // Gọi API thống kê
      const statsResponse = await fetch(`${serverUrl}/admin/statistics?start_date=${start_date}&end_date=${end_date}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const statsResult = await statsResponse.json();
      setRawStats(statsResult);

      // Gọi API danh sách booking - CÓ filter ngày theo timeFilter
      const bookingsResponse = await fetch(`${serverUrl}/dat-phong?start_date=${start_date}&end_date=${end_date}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const bookingsResult = await bookingsResponse.json();

      if (statsResult.success) { // Chấp nhận hiển thị thống kê dù booking có thể lỗi nhẹ
        // Lọc và sắp xếp đơn theo ngày tạo mới nhất
        const filteredBookings = (bookingsResult.success && Array.isArray(bookingsResult.data)) 
          ? bookingsResult.data
              .sort((a: any, b: any) => new Date(b.ngay_tao || b.created_at).getTime() - new Date(a.ngay_tao || a.created_at).getTime())
              .slice(0, 20)
              .map((b: any) => ({
              createdAt: b.ngay_tao ? new Date(b.ngay_tao).toLocaleString('vi-VN') : '',
              code: b.ma_dat,
              customerName: b.khach_hang?.ho_ten || 'N/A',
              roomNumber: b.phong?.ma_phong || 'N/A',
              checkIn: b.thoi_gian_nhan ? new Date(b.thoi_gian_nhan).toLocaleDateString('vi-VN') : '-',
              checkOut: b.thoi_gian_tra ? new Date(b.thoi_gian_tra).toLocaleDateString('vi-VN') : '-',
              bookingStatus: b.trang_thai,
              totalAmount: b.tong_tien
            }))
          : [];

        // Xử lý dữ liệu biểu đồ (giữ nguyên logic normalize của bạn)
        const normalizeCharts = (data: any) => {
          // ... (Giữ nguyên logic normalizeCharts cũ nếu cần hiển thị biểu đồ sau này)
          return { revenue: [], channel: [] }; 
        };

        const charts = normalizeCharts(statsResult.data || {});

        setStats({
          success: true,
          stats: {
            revenue: { 
              value: statsResult.data.totalRevenue || 0,
              change: 0 
            },
            bookings: { 
              value: statsResult.data.totalBookings || 0,
              change: 0 
            },
            roomsInUse: {
              current: statsResult.data.occupiedRooms || 0,
              total: statsResult.data.totalRooms || 0,
              percentage: statsResult.data.occupancyRate || 0
            },
            guests: { 
              value: statsResult.data.totalCustomers || 0,
              change: 0 
            }
          },
          charts,
          recentBookings: filteredBookings
        });
      } else {
        setError(statsResult.error || 'Không thể tải dữ liệu thống kê');
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, [timeFilter, serverUrl]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'da_coc': 'bg-green-100 text-green-800',
      'da_nhan_phong': 'bg-blue-100 text-blue-800',
      'da_tra_phong': 'bg-gray-100 text-gray-800',
      'cho_coc': 'bg-yellow-100 text-yellow-800',
      'da_huy': 'bg-red-100 text-red-800',
    };
    const labels: { [key: string]: string } = {
      'da_coc': 'Đã cọc',
      'da_nhan_phong': 'Đang ở',
      'da_tra_phong': 'Đã trả',
      'cho_coc': 'Chờ cọc',
      'da_huy': 'Đã hủy',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">❌ {error}</p>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Thử lại</button>
      </div>
    );
  }

  const displayStats = stats?.stats || {
    revenue: { value: 0, change: 0 },
    bookings: { value: 0, change: 0 },
    roomsInUse: { current: 0, total: 0, percentage: 0 },
    guests: { value: 0, change: 0 }
  };

  const recentBookingsList = stats?.recentBookings || [];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button onClick={() => setShowRaw((s: boolean) => !s)} className="ml-3 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50">
            {showRaw ? 'Ẩn raw' : 'Xem raw'}
          </button>
        </div>
        
        {showRaw && rawStats && (
          <div className="mt-4 p-3 bg-gray-50 rounded border text-sm overflow-auto max-h-64">
            <pre className="whitespace-pre-wrap">{JSON.stringify(rawStats, null, 2)}</pre>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">Thời gian thực</span>
            <CurrentDateTime />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
            >
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="month">Tháng này</option>
              <option value="lastmonth">Tháng trước</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">⚠️ {error} - Đang hiển thị dữ liệu cũ</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            {/* Tạm ẩn trend vì chưa tính toán logic so sánh */}
          </div>
          <p className="text-gray-600 text-sm mb-1">Tổng doanh thu</p>
          <p className="text-2xl font-bold text-gray-900">{(displayStats.revenue.value || 0).toLocaleString('vi-VN')}đ</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Tổng số đơn đặt</p>
          <p className="text-2xl font-bold text-gray-900">{displayStats.bookings.value} đơn</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Phòng đang dùng</p>
          <p className="text-2xl font-bold text-gray-900">
            {displayStats.roomsInUse.current} / {displayStats.roomsInUse.total}
            <span className="text-sm font-normal text-gray-500 ml-2">({displayStats.roomsInUse.percentage}%)</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Khách hàng</p>
          <p className="text-2xl font-bold text-gray-900">{displayStats.guests.value} khách</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Đơn đặt gần đây ({timeFilter === 'today' ? 'Hôm nay' : timeFilter})</h2>
        {recentBookingsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ngày tạo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Mã đơn</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Khách hàng</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Phòng</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check-in / Out</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentBookingsList.map((booking: any) => (
                  <tr key={booking.code} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-500">{booking.createdAt}</td>
                    <td className="py-3 px-4 text-sm font-medium text-purple-600">{booking.code}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{booking.customerName}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{booking.roomNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {booking.checkIn} <br/> <span className="text-xs">đến</span> {booking.checkOut}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(booking.bookingStatus)}</td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                      {(booking.totalAmount || 0).toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có đơn đặt phòng nào trong khoảng thời gian này</p>
          </div>
        )}
      </div>
    </div>
  );
}