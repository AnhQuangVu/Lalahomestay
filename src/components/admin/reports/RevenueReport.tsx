import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
      {/* Revenue KPIs - REMOVED AS REQUESTED
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        ... (KPI cards code) ...
      </div> 
      */}

      {/* Revenue Trend Chart - KEPT */}
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

      {/* Revenue Details Table - KEPT & UPDATED */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-900 mb-4">Chi tiết doanh thu theo phòng</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700 w-20">Thứ hạng</th>
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{room.name}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{room.bookings}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-bold">{formatCurrency(room.revenue)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(room.bookings > 0 ? Math.round(room.revenue / room.bookings) : 0)}
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