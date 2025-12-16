import { DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- INTERFACES ---
export interface RevenueOrder {
  branch?: string;      // Cơ sở
  code: string;        // Mã đơn
  customer: string;    // Khách hàng
  room: string;        // Phòng
  checkin: string;     // Vào
  checkout: string;    // Ra
  total: number;       // Tổng tiền
}

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  // Dữ liệu cho biểu đồ
  dailyRevenue: Array<{ date: string; revenue: number; bookings: number; }>;
  // Dữ liệu cho bảng chi tiết
  orders?: RevenueOrder[]; 
  
  // Các trường khác
  totalDeposit?: number;
  averageNightlyRate?: number;
  growthRate?: number;
  totalNights?: number;
  topRooms?: any[];
}

interface RevenueReportProps {
  reportData: ReportData;
  formatCurrency: (amount: number) => string;
}

export default function RevenueReport({ reportData, formatCurrency }: RevenueReportProps) {
  // Hàm format ngày ngắn gọn (dd/MM)
  const formatDateShort = (dateString: any) => {
    if (!dateString && dateString !== 0) return '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    // If already in dd/MM or dd/MM/yyyy
    if (typeof dateString === 'string') {
      const s = dateString.trim();
      const ddmm = /^\d{1,2}\/\d{1,2}$/;
      const ddmmyyyy = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
      if (ddmmyyyy.test(s)) {
        const parts = s.split('/');
        let year = parts[2]; if (year.length === 2) year = '20' + year;
        return `${pad(Number(parts[0]))}/${pad(Number(parts[1]))}/${year}`;
      }
      if (ddmm.test(s)) {
        const parts = s.split('/');
        const year = new Date().getFullYear();
        return `${pad(Number(parts[0]))}/${pad(Number(parts[1]))}/${year}`;
      }
    }

    // If it's a numeric timestamp
    if (typeof dateString === 'number' || (typeof dateString === 'string' && /^\d+$/.test(String(dateString).trim()))) {
      const d = new Date(Number(dateString));
      if (!isNaN(d.getTime())) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    // Try ISO / parseable strings
    try {
      const d = new Date(String(dateString));
      if (!isNaN(d.getTime())) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch { /* fallthrough */ }

    // Fallback: show raw non-empty string so user can inspect
    if (typeof dateString === 'string' && dateString.trim().length > 0) return dateString.trim();
    return '-';
  };

  // Dữ liệu cho bảng (fallback mảng rỗng nếu null)
  const orders = reportData.orders || [];
  // Dữ liệu cho biểu đồ
  const chartData = reportData.dailyRevenue || [];

  return (
    <div className="space-y-8">
      
      {/* 1. BIỂU ĐỒ XU HƯỚNG DOANH THU (GIỮ LẠI THEO YÊU CẦU) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Xu hướng doanh thu</h3>
            <p className="text-sm text-gray-500 mt-1">Biểu đồ biến động doanh thu theo ngày</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <DollarSign size={20} />
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12, fill: '#6b7280'}} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{fontSize: 12, fill: '#6b7280'}} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value/1000}k`}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Ngày: ${label}`}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Legend verticalAlign="top" height={36}/>
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Doanh thu"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
            Chưa có dữ liệu biểu đồ
          </div>
        )}
      </div>

      {/* 2. BẢNG CHI TIẾT (GIỐNG PDF) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-xl font-bold text-gray-800 uppercase border-l-4 border-blue-600 pl-3">
            DANH SÁCH CHI TIẾT CÁC ĐƠN TRONG KỲ
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-700 w-12">STT</th>
                <th className="border border-gray-300 px-3 py-3 text-left font-bold text-gray-700">Cơ sở</th>
                <th className="border border-gray-300 px-3 py-3 text-left font-bold text-gray-700">Mã đơn</th>
                <th className="border border-gray-300 px-3 py-3 text-left font-bold text-gray-700">Khách hàng</th>
                <th className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-700 w-16">Phòng</th>
                <th className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-700 w-20">Vào</th>
                <th className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-700 w-20">Ra</th>
                <th className="border border-gray-300 px-3 py-3 text-right font-bold text-gray-700 w-32">Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-800">
                      <div className="whitespace-pre-line leading-tight">{order.branch || 'LaLa House'}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-mono text-blue-700 text-xs font-bold">
                      {order.code}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-800">
                      {order.customer}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-gray-50 text-gray-700">
                      {order.room}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">
                      {formatDateShort(order.checkin)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">
                      {formatDateShort(order.checkout)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="border border-gray-300 px-4 py-12 text-center text-gray-400 italic">
                    Chưa có dữ liệu đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. TỔNG KẾT (Footer Table) */}
        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-md">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 text-right">Tổng kết doanh thu</h4>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50 w-1/2">Tổng số đơn</td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-bold text-gray-800">
                    {reportData.totalBookings}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50">Tổng doanh thu</td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-bold text-lg text-blue-700">
                    {formatCurrency(reportData.totalRevenue)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50">TB/đơn</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-gray-600">
                    {formatCurrency(reportData.averageBookingValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}