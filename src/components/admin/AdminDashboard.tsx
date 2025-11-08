import { useState, useEffect } from 'react';
import { DollarSign, Calendar, Home, Users, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
// charts removed per user request
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export default function AdminDashboard() {
  const [timeFilter, setTimeFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [rawStats, setRawStats] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState('');

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch statistics (include selected time filter so backend can return chart data)
      const statsResponse = await fetch(`${serverUrl}/admin/statistics?filter=${encodeURIComponent(timeFilter)}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
  const statsResult = await statsResponse.json();
  // store raw payload for debugging
  setRawStats(statsResult);
      
      // Fetch recent bookings
      const bookingsResponse = await fetch(`${serverUrl}/dat-phong`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const bookingsResult = await bookingsResponse.json();
      
      if (statsResult.success && bookingsResult.success) {
        // Transform data for display
        const recentBookings = bookingsResult.data.slice(0, 10).map((b: any) => ({
          code: b.ma_dat,
          customerName: b.khach_hang?.ho_ten || 'N/A',
          roomNumber: b.phong?.ma_phong || 'N/A',
          checkIn: new Date(b.thoi_gian_nhan).toLocaleDateString('vi-VN'),
          checkOut: new Date(b.thoi_gian_tra).toLocaleDateString('vi-VN'),
          bookingStatus: b.trang_thai === 'checkout' ? 'completed' : 
                        b.trang_thai === 'checkin' ? 'confirmed' :
                        b.trang_thai === 'da_huy' ? 'cancelled' : 'pending',
          totalAmount: b.tong_tien
        }));

        // normalize or pick charts from returned payload if present
        const normalizeCharts = (data: any) => {
          // Common expected shapes:
          // 1) data.charts = { revenue: [...], channel: [...] }
          if (data?.charts && (data.charts.revenue || data.charts.channel)) {
            return {
              revenue: data.charts.revenue || [],
              channel: data.charts.channel || []
            };
          }

          // 2) data.dailyRevenue || data.revenueByDay: array of { date, value }
          const mapDateArray = (arr: any[]) => arr.map((r: any) => ({ name: r.date || r.name || r.day || r.label, revenue: r.value || r.amount || r.revenue || r.total || 0 }));
          if (Array.isArray(data?.dailyRevenue) && data.dailyRevenue.length) {
            return { revenue: mapDateArray(data.dailyRevenue), channel: data.channels || [] };
          }
          if (Array.isArray(data?.revenueByDay) && data.revenueByDay.length) {
            return { revenue: mapDateArray(data.revenueByDay), channel: data.channels || [] };
          }

          // 3) derive from bookings list (sum totalAmount by day)
          if (Array.isArray(data?.bookings) && data.bookings.length) {
            const byDay: Record<string, number> = {};
            data.bookings.forEach((b: any) => {
              const dt = new Date(b.thoi_gian_nhan || b.created_at || b.date);
              const key = `${dt.getDate()}/${dt.getMonth() + 1}`;
              const amt = Number(b.tong_tien || b.total || b.amount || 0) || 0;
              byDay[key] = (byDay[key] || 0) + amt;
            });
            const revenue = Object.keys(byDay).sort().map(k => ({ name: k, revenue: byDay[k] }));
            return { revenue, channel: data.channels || [] };
          }

          // 4) revenueSeries / series
          if (Array.isArray(data?.revenueSeries) && data.revenueSeries.length) {
            return { revenue: mapDateArray(data.revenueSeries), channel: data.channels || [] };
          }

          return { revenue: [], channel: [] };
        };

        const charts = normalizeCharts(statsResult.data || {});

        setStats({
          success: true,
          stats: {
            revenue: { 
              value: statsResult.data.totalRevenue,
              change: 15 // Mock
            },
            bookings: { 
              value: statsResult.data.totalBookings,
              change: 8 // Mock
            },
            roomsInUse: {
              current: statsResult.data.occupiedRooms,
              total: statsResult.data.totalRooms,
              percentage: statsResult.data.occupancyRate
            },
            guests: { 
              value: statsResult.data.totalCustomers,
              change: 12 // Mock
            }
          },
          // charts derived or returned by backend
          charts,
          recentBookings
        });
      } else {
        setError(statsResult.error || bookingsResult.error || 'Không thể tải dữ liệu');
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeFilter]);

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'confirmed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    const labels: { [key: string]: string } = {
      'confirmed': 'Đã xác nhận',
      'pending': 'Chờ xác nhận',
      'cancelled': 'Đã hủy',
      'completed': 'Hoàn thành'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
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
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const displayStats = stats?.stats || {
    revenue: { value: 0, change: 0 },
    bookings: { value: 0, change: 0 },
    roomsInUse: { current: 0, total: 0, percentage: 0 },
    guests: { value: 0, change: 0 }
  };

  // charts removed; backend-only mode
  const revenueChart = stats?.charts?.revenue || [];
  const channelData = stats?.charts?.channel || [];
  const effectiveRevenueChart: any[] = revenueChart;
  const effectiveChannelData: any[] = channelData;
  const recentBookings = stats?.recentBookings || [];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-gray-900">Dashboard</h1>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setShowRaw((s: boolean) => !s)}
            className="ml-3 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50"
          >
            {showRaw ? 'Ẩn raw' : 'Xem raw'}
          </button>
        </div>
        
        {showRaw && rawStats && (
          <div className="mt-4 p-3 bg-gray-50 rounded border text-sm overflow-auto max-h-64">
            <pre className="whitespace-pre-wrap">{JSON.stringify(rawStats, null, 2)}</pre>
          </div>
        )}
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={timeFilter}
            onChange={(e: any) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày</option>
            <option value="month">Tháng này</option>
            <option value="lastmonth">Tháng trước</option>
          </select>
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
            <div className={`flex items-center space-x-1 text-sm ${
              displayStats.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {displayStats.revenue.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(displayStats.revenue.change)}%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Tổng doanh thu</p>
          <p className="text-2xl text-gray-900">{displayStats.revenue.value.toLocaleString('vi-VN')}đ</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              displayStats.bookings.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {displayStats.bookings.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(displayStats.bookings.change)}%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Tổng số đơn đặt</p>
          <p className="text-2xl text-gray-900">{displayStats.bookings.value} đơn</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Phòng sử dụng</p>
          <p className="text-2xl text-gray-900">
            {displayStats.roomsInUse.current} / {displayStats.roomsInUse.total}
            <span className="text-base text-gray-600 ml-2">({displayStats.roomsInUse.percentage}%)</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              displayStats.guests.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {displayStats.guests.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(displayStats.guests.change)}%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Tổng số khách lưu trú</p>
          <p className="text-2xl text-gray-900">{displayStats.guests.value} khách</p>
        </div>
      </div>

      {/* Charts removed per user request */}

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-gray-900 mb-4">Đơn đặt gần nhất</h2>
        {recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Mã đơn</th>
                  <th className="text-left py-3 px-4 text-gray-700">Khách hàng</th>
                  <th className="text-left py-3 px-4 text-gray-700">Phòng</th>
                  <th className="text-left py-3 px-4 text-gray-700">Ngày nhận - trả</th>
                  <th className="text-left py-3 px-4 text-gray-700">Trạng thái</th>
                  <th className="text-right py-3 px-4 text-gray-700">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking: any) => (
                  <tr key={booking.code} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{booking.code}</td>
                    <td className="py-3 px-4 text-gray-900">{booking.customerName}</td>
                    <td className="py-3 px-4 text-gray-900">{booking.roomNumber}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {booking.checkIn} - {booking.checkOut}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(booking.bookingStatus)}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {booking.totalAmount?.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có đơn đặt phòng nào</p>
            <p className="text-sm mt-2">Hãy vào <strong>/setup</strong> để tạo dữ liệu mẫu</p>
          </div>
        )}
      </div>
    </div>
  );
}
