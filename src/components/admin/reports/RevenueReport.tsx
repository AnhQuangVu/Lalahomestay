import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportData {
  totalRevenue: number;
  totalDeposit: number;
  averageBookingValue: number;
  averageNightlyRate: number;
  growthRate: number;
  totalNights: number;
  dailyRevenue: Array<{ date: string; revenue: number; bookings: number; }>;
  topRooms: Array<{ name: string; bookings: number; revenue: number; }>;
}

interface RevenueReportProps {
  reportData: ReportData;
  formatCurrency: (amount: number) => string;
}

export default function RevenueReport({ reportData, formatCurrency }: RevenueReportProps) {
  return (
    <div className="space-y-6">
      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            {reportData.growthRate > 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
          </div>
          <p className="text-sm text-green-700 mb-1">Tổng doanh thu</p>
          <p className="text-3xl text-green-900 mb-1">{formatCurrency(reportData.totalRevenue)}</p>
          <p className={`text-sm flex items-center ${reportData.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {reportData.growthRate > 0 ? '+' : ''}{reportData.growthRate.toFixed(1)}% so với kỳ trước
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-blue-700 mb-1">Tiền cọc CSVC</p>
          <p className="text-3xl text-blue-900 mb-1">{formatCurrency(reportData.totalDeposit)}</p>
          <p className="text-sm text-blue-600">Tổng tiền cọc thu được</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-purple-700 mb-1">Giá trị TB/đơn</p>
          <p className="text-3xl text-purple-900 mb-1">{formatCurrency(reportData.averageBookingValue)}</p>
          <p className="text-sm text-purple-600">Doanh thu trung bình mỗi đơn</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-orange-700 mb-1">Giá TB/đêm</p>
          <p className="text-3xl text-orange-900 mb-1">{formatCurrency(reportData.averageNightlyRate)}</p>
          <p className="text-sm text-orange-600">Tổng {reportData.totalNights} đêm</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900">Xu hướng doanh thu</h3>
            <p className="text-sm text-gray-600 mt-1">Biểu đồ doanh thu theo thời gian</p>
          </div>
          <DollarSign className="w-6 h-6 text-gray-400" />
        </div>
        {reportData.dailyRevenue && reportData.dailyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={reportData.dailyRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Ngày: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Doanh thu"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Không có dữ liệu
          </div>
        )}
      </div>

      {/* Revenue by Room
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900">Doanh thu theo phòng</h3>
            <p className="text-sm text-gray-600 mt-1">Top phòng mang lại doanh thu cao nhất</p>
          </div>
        </div>
        {reportData.topRooms && reportData.topRooms.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.topRooms} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill="#10b981" 
                name="Doanh thu"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Không có dữ liệu
          </div>
        )}
      </div> */}

      {/* Revenue Details Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-900 mb-4">Chi tiết doanh thu theo phòng</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Thứ hạng</th>
                <th className="text-left py-3 px-4 text-gray-700">Tên phòng</th>
                <th className="text-right py-3 px-4 text-gray-700">Số lượt đặt</th>
                <th className="text-right py-3 px-4 text-gray-700">Doanh thu</th>
                <th className="text-right py-3 px-4 text-gray-700">TB/lượt</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topRooms && reportData.topRooms.map((room, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{room.name}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{room.bookings}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(room.revenue)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(room.bookings > 0 ? room.revenue / room.bookings : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
