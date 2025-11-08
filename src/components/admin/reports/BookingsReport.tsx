import { 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  PieChart as PieChartIcon
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportData {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  checkedInBookings: number;
  checkedOutBookings: number;
  cancelRate: number;
  dailyRevenue: Array<{ date: string; revenue: number; bookings: number; }>;
  bookingStatus: Array<{ status: string; count: number; }>;
  bookingSources: Array<{ source: string; count: number; }>;
}

interface BookingsReportProps {
  reportData: ReportData;
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function BookingsReport({ reportData, formatCurrency }: BookingsReportProps) {
  return (
    <div className="space-y-6">
      {/* Booking Status KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-blue-500" />
            <p className="text-sm text-gray-600">Tổng số</p>
          </div>
          <p className="text-3xl text-gray-900 mb-1">{reportData.totalBookings}</p>
          <p className="text-sm text-gray-600">Tất cả đặt phòng</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <p className="text-sm text-gray-600">Đã xác nhận</p>
          </div>
          <p className="text-3xl text-gray-900 mb-1">{reportData.confirmedBookings}</p>
          <p className="text-sm text-gray-600">
            {((reportData.confirmedBookings / reportData.totalBookings) * 100 || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-purple-500" />
            <p className="text-sm text-gray-600">Đang ở</p>
          </div>
          <p className="text-3xl text-gray-900 mb-1">{reportData.checkedInBookings}</p>
          <p className="text-sm text-gray-600">
            {((reportData.checkedInBookings / reportData.totalBookings) * 100 || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-orange-500" />
            <p className="text-sm text-gray-600">Đã hoàn thành</p>
          </div>
          <p className="text-3xl text-gray-900 mb-1">{reportData.checkedOutBookings}</p>
          <p className="text-sm text-gray-600">
            {((reportData.checkedOutBookings / reportData.totalBookings) * 100 || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-gray-600">Đã hủy</p>
          </div>
          <p className="text-3xl text-gray-900 mb-1">{reportData.cancelledBookings}</p>
          <p className="text-sm text-red-600">
            {reportData.cancelRate.toFixed(1)}% tỷ lệ hủy
          </p>
        </div>
      </div>

      {/* Bookings Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900">Xu hướng đặt phòng</h3>
            <p className="text-sm text-gray-600 mt-1">Số lượng đặt phòng theo thời gian</p>
          </div>
          <Activity className="w-6 h-6 text-gray-400" />
        </div>
        {reportData.dailyRevenue && reportData.dailyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `Ngày: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="#3b82f6" 
                name="Số đặt phòng"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Không có dữ liệu
          </div>
        )}
      </div>

      {/* Status and Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900">Phân bố trạng thái</h3>
              <p className="text-sm text-gray-600 mt-1">Tỷ lệ các trạng thái đặt phòng</p>
            </div>
            <PieChartIcon className="w-6 h-6 text-gray-400" />
          </div>
          {reportData.bookingStatus && reportData.bookingStatus.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.bookingStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${((entry.count / reportData.totalBookings) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData.bookingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4 lg:mt-0 lg:ml-4">
                {reportData.bookingStatus.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{item.status}: {item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Booking Sources */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900">Nguồn đặt phòng</h3>
              <p className="text-sm text-gray-600 mt-1">Phân bổ theo kênh đặt phòng</p>
            </div>
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          {reportData.bookingSources && reportData.bookingSources.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.bookingSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${((entry.count / reportData.totalBookings) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData.bookingSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4 lg:mt-0 lg:ml-4">
                {reportData.bookingSources.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{item.source}: {item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-900 mb-6">Chỉ số hiệu suất</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Tỷ lệ xác nhận</p>
            <p className="text-3xl text-gray-900">
              {((reportData.confirmedBookings / reportData.totalBookings) * 100 || 0).toFixed(1)}%
            </p>
          </div>

          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Tỷ lệ hoàn thành</p>
            <p className="text-3xl text-gray-900">
              {((reportData.checkedOutBookings / reportData.totalBookings) * 100 || 0).toFixed(1)}%
            </p>
          </div>

          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Tỷ lệ hủy</p>
            <p className="text-3xl text-gray-900">{reportData.cancelRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
