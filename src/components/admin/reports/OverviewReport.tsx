import {
  TrendingUp,
  Users,
  DollarSign,
  Home,
  FileText,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportData {
  totalBookings: number;
  totalRevenue: number;
  totalDeposit: number;
  totalCustomers: number;
  newCustomers: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalNights: number;
  confirmedBookings: number;
  cancelledBookings: number;
  checkedInBookings: number;
  checkedOutBookings: number;
  cancelRate: number;
  averageBookingValue: number;
  averageNightlyRate: number;
  growthRate: number;
  dailyRevenue: Array<{ date: string; revenue: number; bookings: number; }>;
  topRooms: Array<{ name: string; bookings: number; revenue: number; }>;
  bookingSources: Array<{ source: string; count: number; }>;
  bookingStatus: Array<{ status: string; count: number; }>;
}

interface OverviewReportProps {
  reportData: ReportData;
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function OverviewReport({ reportData, formatCurrency }: OverviewReportProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng doanh thu</p>
              <p className="text-2xl text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {reportData.growthRate > 0 ? '+' : ''}{reportData.growthRate.toFixed(1)}% so với kỳ trước
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng đặt phòng</p>
              <p className="text-2xl text-gray-900">{reportData.totalBookings}</p>
              <p className="text-xs text-gray-600 mt-1">
                {reportData.confirmedBookings} đã xác nhận
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Công suất phòng</p>
              <p className="text-2xl text-gray-900">{reportData.occupancyRate}%</p>
              <p className="text-xs text-gray-600 mt-1">
                {reportData.occupiedRooms}/{reportData.totalRooms} phòng đang sử dụng
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng khách hàng</p>
              <p className="text-2xl text-gray-900">{reportData.totalCustomers}</p>
              <p className="text-xs text-green-600 mt-1">
                +{reportData.newCustomers} khách hàng mới
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Tiền cọc CSVC</p>
          <p className="text-xl text-gray-900">{formatCurrency(reportData.totalDeposit)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Số đêm đã bán</p>
          <p className="text-xl text-gray-900">{reportData.totalNights}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Giá TB/đêm</p>
          <p className="text-xl text-gray-900">{formatCurrency(reportData.averageNightlyRate)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Giá TB/đơn</p>
          <p className="text-xl text-gray-900">{formatCurrency(reportData.averageBookingValue)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Tỷ lệ hủy</p>
          <p className="text-xl text-gray-900">{reportData.cancelRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Doanh thu theo ngày</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          {reportData.dailyRevenue && reportData.dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  name="Doanh thu"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Bookings Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Số lượng đặt phòng theo ngày</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          {reportData.dailyRevenue && reportData.dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="bookings"
                  fill="#3b82f6"
                  name="Số đặt phòng"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Rooms */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Top phòng được đặt nhiều nhất</h3>
            <Home className="w-5 h-5 text-gray-400" />
          </div>
          {reportData.topRooms && reportData.topRooms.length > 0 ? (
            <div className="space-y-3">
              {reportData.topRooms.slice(0, 5).map((room, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-gray-900">{room.name}</p>
                      <p className="text-xs text-gray-600">{room.bookings} đặt phòng</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-900">{formatCurrency(room.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Booking Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Trạng thái đặt phòng</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          {reportData.bookingStatus && reportData.bookingStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={reportData.bookingStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.bookingStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Booking Sources */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Nguồn đặt phòng</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          {reportData.bookingSources && reportData.bookingSources.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={reportData.bookingSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.source}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.bookingSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-900 mb-4">Chi tiết thống kê</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">Đã xác nhận</p>
            <p className="text-2xl text-gray-900">{reportData.confirmedBookings}</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Đã nhận phòng</p>
            <p className="text-2xl text-gray-900">{reportData.checkedInBookings}</p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600">Đã trả phòng</p>
            <p className="text-2xl text-gray-900">{reportData.checkedOutBookings}</p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-sm text-gray-600">Đã hủy</p>
            <p className="text-2xl text-gray-900">{reportData.cancelledBookings}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
