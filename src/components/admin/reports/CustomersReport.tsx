import { 
  Users,
  UserPlus,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportData {
  totalCustomers: number;
  newCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  dailyRevenue: Array<{ date: string; revenue: number; bookings: number; }>;
}

interface CustomersReportProps {
  reportData: ReportData;
  formatCurrency: (amount: number) => string;
}

export default function CustomersReport({ reportData, formatCurrency }: CustomersReportProps) {
  const averageBookingsPerCustomer = reportData.totalCustomers > 0 
    ? (reportData.totalBookings / reportData.totalCustomers).toFixed(1) 
    : '0';
  
  const averageRevenuePerCustomer = reportData.totalCustomers > 0
    ? reportData.totalRevenue / reportData.totalCustomers
    : 0;

  const customerRetentionRate = reportData.totalCustomers > 0
    ? ((reportData.totalCustomers - reportData.newCustomers) / reportData.totalCustomers * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Customer KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-blue-700 mb-1">Tổng khách hàng</p>
          <p className="text-3xl text-blue-900 mb-1">{reportData.totalCustomers}</p>
          <p className="text-sm text-blue-600">Khách hàng đã đăng ký</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-green-700 mb-1">Khách hàng mới</p>
          <p className="text-3xl text-green-900 mb-1">{reportData.newCustomers}</p>
          <p className="text-sm text-green-600">
            {reportData.totalCustomers > 0 
              ? ((reportData.newCustomers / reportData.totalCustomers) * 100).toFixed(1) 
              : '0'}% tổng số
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-purple-700 mb-1">TB đặt phòng/khách</p>
          <p className="text-3xl text-purple-900 mb-1">{averageBookingsPerCustomer}</p>
          <p className="text-sm text-purple-600">Lượt đặt trung bình</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-orange-700 mb-1">Tỷ lệ giữ chân</p>
          <p className="text-3xl text-orange-900 mb-1">{customerRetentionRate}%</p>
          <p className="text-sm text-orange-600">Khách hàng quay lại</p>
        </div>
      </div>

      {/* Revenue per Customer */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900">Giá trị khách hàng</h3>
            <p className="text-sm text-gray-600 mt-1">Doanh thu trung bình mỗi khách hàng</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <p className="text-sm text-green-700 mb-2">Doanh thu TB/khách</p>
            <p className="text-3xl text-green-900 mb-2">{formatCurrency(averageRevenuePerCustomer)}</p>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Customer Lifetime Value</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <p className="text-sm text-blue-700 mb-2">Giá trị TB/đơn</p>
            <p className="text-3xl text-blue-900 mb-2">{formatCurrency(reportData.averageBookingValue)}</p>
            <div className="flex items-center text-sm text-blue-600">
              <Activity className="w-4 h-4 mr-1" />
              <span>Average Order Value</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <p className="text-sm text-purple-700 mb-2">Tổng doanh thu</p>
            <p className="text-3xl text-purple-900 mb-2">{formatCurrency(reportData.totalRevenue)}</p>
            <div className="flex items-center text-sm text-purple-600">
              <Users className="w-4 h-4 mr-1" />
              <span>Từ {reportData.totalCustomers} khách hàng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Growth Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900">Xu hướng tăng trưởng khách hàng</h3>
            <p className="text-sm text-gray-600 mt-1">Hoạt động đặt phòng theo thời gian</p>
          </div>
          <Activity className="w-6 h-6 text-gray-400" />
        </div>
        {reportData.dailyRevenue && reportData.dailyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Doanh thu') return formatCurrency(value);
                  return value;
                }}
                labelFormatter={(label) => `Ngày: ${label}`}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="bookings" 
                stroke="#3b82f6" 
                name="Số đặt phòng"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                name="Doanh thu"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Không có dữ liệu
          </div>
        )}
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900">Phân khúc khách hàng</h3>
              <p className="text-sm text-gray-600 mt-1">Khách mới vs Khách quay lại</p>
            </div>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Khách hàng mới</span>
                <span className="text-sm text-gray-900">{reportData.newCustomers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${reportData.totalCustomers > 0 ? (reportData.newCustomers / reportData.totalCustomers) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Khách hàng quay lại</span>
                <span className="text-sm text-gray-900">{reportData.totalCustomers - reportData.newCustomers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${customerRetentionRate}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 mb-1">Khách mới</p>
                <p className="text-2xl text-green-900">{reportData.newCustomers}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Quay lại</p>
                <p className="text-2xl text-blue-900">{reportData.totalCustomers - reportData.newCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Value Analysis */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900">Phân tích giá trị</h3>
              <p className="text-sm text-gray-600 mt-1">Chỉ số hiệu suất khách hàng</p>
            </div>
            <Award className="w-6 h-6 text-gray-400" />
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-700">Tỷ lệ chuyển đổi</span>
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl text-purple-900 mb-1">
                {reportData.totalCustomers > 0 
                  ? ((reportData.totalBookings / reportData.totalCustomers) * 100).toFixed(1) 
                  : '0'}%
              </p>
              <p className="text-xs text-purple-600">Tỷ lệ khách hàng đặt phòng</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-orange-700">Tần suất đặt phòng</span>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl text-orange-900 mb-1">{averageBookingsPerCustomer}</p>
              <p className="text-xs text-orange-600">Lượt đặt trung bình/khách</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700">Giá trị trung bình</span>
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl text-green-900 mb-1">{formatCurrency(averageRevenuePerCustomer)}</p>
              <p className="text-xs text-green-600">Doanh thu trung bình/khách</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-900 mb-6">Tổng kết chỉ số khách hàng</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700 mb-1">Tổng khách hàng</p>
            <p className="text-2xl text-blue-900">{reportData.totalCustomers}</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
            <UserPlus className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700 mb-1">Khách mới</p>
            <p className="text-2xl text-green-900">{reportData.newCustomers}</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
            <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-700 mb-1">Tổng đặt phòng</p>
            <p className="text-2xl text-purple-900">{reportData.totalBookings}</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
            <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-orange-700 mb-1">Giữ chân</p>
            <p className="text-2xl text-orange-900">{customerRetentionRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
