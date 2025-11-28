import { 
  Home,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RoomUsageDetail {
  branch: string;
  room: string;
  type: string;
  usedDays: number;
  availableDays: number;
  occupancy: number;
  bookings: number;
}

interface ReportData {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalNights: number;
  topRooms: Array<{ name: string; bookings: number; revenue: number; }>;
  roomUsageDetails?: RoomUsageDetail[];
}

interface RoomsReportProps {
  reportData: ReportData;
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function RoomsReport({ reportData, formatCurrency }: RoomsReportProps) {
  const occupancyData = [
    { name: 'Đang sử dụng', value: reportData.occupiedRooms, color: '#8b5cf6' },
    { name: 'Còn trống', value: reportData.availableRooms, color: '#e5e7eb' }
  ];

  return (
    <div className="space-y-6">
      {/* Room Status KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-purple-700 mb-1">Tổng số phòng</p>
          <p className="text-3xl text-purple-900 mb-1">{reportData.totalRooms}</p>
          <p className="text-sm text-purple-600">Phòng trong hệ thống</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-green-700 mb-1">Đang sử dụng</p>
          <p className="text-3xl text-green-900 mb-1">{reportData.occupiedRooms}</p>
          <p className="text-sm text-green-600">
            {((reportData.occupiedRooms / reportData.totalRooms) * 100 || 0).toFixed(1)}% phòng
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-1">Còn trống</p>
          <p className="text-3xl text-gray-900 mb-1">{reportData.availableRooms}</p>
          <p className="text-sm text-gray-600">
            {((reportData.availableRooms / reportData.totalRooms) * 100 || 0).toFixed(1)}% phòng
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-blue-700 mb-1">Công suất phòng</p>
          <p className="text-3xl text-blue-900 mb-1">{reportData.occupancyRate}%</p>
          <p className="text-sm text-blue-600">{reportData.totalNights} đêm đã bán</p>
        </div>
      </div>

      {/* Occupancy Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900">Tình trạng sử dụng phòng</h3>
              <p className="text-sm text-gray-600 mt-1">Biểu đồ tỷ lệ phòng</p>
            </div>
            <Home className="w-6 h-6 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }} />
              <span className="text-sm text-gray-700">Đang sử dụng</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-sm text-gray-700">Còn trống</span>
            </div>
          </div>
        </div>

        {/* Occupancy Meter */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900">Chỉ số công suất</h3>
              <p className="text-sm text-gray-600 mt-1">Hiệu suất sử dụng phòng</p>
            </div>
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#8b5cf6"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(reportData.occupancyRate / 100) * 502.4} 502.4`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl text-gray-900">{reportData.occupancyRate}%</p>
                    <p className="text-sm text-gray-600 mt-1">Công suất</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-purple-700">Đang sử dụng</p>
                  <p className="text-2xl text-purple-900">{reportData.occupiedRooms}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Còn trống</p>
                  <p className="text-2xl text-gray-900">{reportData.availableRooms}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Rooms */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900">Hiệu suất theo phòng</h3>
            <p className="text-sm text-gray-600 mt-1">Số lượng đặt phòng theo từng phòng</p>
          </div>
          <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>
        {reportData.topRooms && reportData.topRooms.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.topRooms}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Doanh thu') return formatCurrency(value);
                  return value;
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="bookings" 
                fill="#3b82f6" 
                name="Số lượt đặt"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                yAxisId="right"
                dataKey="revenue" 
                fill="#10b981" 
                name="Doanh thu"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Không có dữ liệu
          </div>
        )}
      </div>

      {/* Room Usage Details Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-900 mb-4">Bảng chi tiết hiệu suất phòng</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Cơ sở</th>
                <th className="text-left py-3 px-4 text-gray-700">Phòng / Loại phòng</th>
                <th className="text-center py-3 px-4 text-gray-700">Số ngày sử dụng</th>
                <th className="text-center py-3 px-4 text-gray-700">Số ngày khả dụng</th>
                <th className="text-center py-3 px-4 text-gray-700">Công suất (%)</th>
                <th className="text-center py-3 px-4 text-gray-700">Số lượt đặt</th>
              </tr>
            </thead>
            <tbody>
              {reportData.roomUsageDetails && reportData.roomUsageDetails.map((room, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{room.branch}</td>
                  <td className="py-3 px-4 text-gray-900">{room.room} {room.type ? `(${room.type})` : ''}</td>
                  <td className="py-3 px-4 text-center">{room.usedDays}</td>
                  <td className="py-3 px-4 text-center">{room.availableDays}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span>{room.occupancy}%</span>
                      <div className="w-24 h-2 bg-gray-200 rounded mt-1">
                        <div
                          className="h-2 rounded bg-purple-500"
                          style={{ width: `${room.occupancy}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{room.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
