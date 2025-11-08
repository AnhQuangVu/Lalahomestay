import { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface DailyRoomStat {
  date: string;
  emptyRooms: number;
  checkouts: number;
  checkins: number;
  occupied: number;
  occupancy: number;
}

export default function StaffReports() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<DailyRoomStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/staff/room-report?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Error fetching room report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Try to export as real .xlsx using SheetJS (xlsx). If not available, fall back to CSV.
    (async () => {
      try {
        const XLSX = await import('xlsx');

        const exportTime = new Date().toLocaleString('vi-VN');
        const wsData = [
          ['Thời gian xuất', exportTime],
          [],
          ['Ngày', 'Phòng trống', 'Dự kiến trả', 'Dự kiến nhận', 'Đang sử dụng', 'Công suất (%)'],
          ...reportData.map((r: any) => [r.date, r.emptyRooms, r.checkouts, r.checkins, r.occupied, r.occupancy])
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bao-cao-phong-${startDate}-${endDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.warn('XLSX export failed or xlsx lib not found, falling back to CSV.', err);
        // Fallback to CSV
        const exportTime = new Date().toLocaleString('vi-VN');
        const headers = ['Ngày', 'Phòng trống', 'Dự kiến trả', 'Dự kiến nhận', 'Đang sử dụng', 'Công suất (%)'];
        const rows = reportData.map((row: any) => [
          row.date,
          row.emptyRooms,
          row.checkouts,
          row.checkins,
          row.occupied,
          row.occupancy
        ]);
        // Prepend export time and a blank line
        const csvRows: any[] = [["Thời gian xuất", exportTime], [], headers, ...rows];
        const csv = csvRows.map((row: any) => row.map(String).map((cell: any) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bao-cao-phong-${startDate}-${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    })();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-gray-900">Báo cáo công suất phòng</h1>
        <button
          onClick={handleExport}
          disabled={reportData.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>Xuất Excel</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={fetchReportData}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Xem báo cáo
            </button>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          {reportData.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Ngày</th>
                  <th className="text-right py-3 px-4 text-gray-700">Phòng trống</th>
                  <th className="text-right py-3 px-4 text-gray-700">Dự kiến trả</th>
                  <th className="text-right py-3 px-4 text-gray-700">Dự kiến nhận</th>
                  <th className="text-right py-3 px-4 text-gray-700">Đang sử dụng</th>
                  <th className="text-right py-3 px-4 text-gray-700">Công suất (%)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{row.date}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{row.emptyRooms}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{row.checkouts}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{row.checkins}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{row.occupied}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded text-sm ${
                        row.occupancy >= 80 ? 'bg-green-100 text-green-800' :
                        row.occupancy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {row.occupancy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Không có dữ liệu trong khoảng thời gian này
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
