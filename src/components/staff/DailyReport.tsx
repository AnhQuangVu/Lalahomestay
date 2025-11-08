import { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Transaction {
  code: string;
  time: string;
  customerName: string;
  room: string;
  revenue: number;
  received: number;
  deposit: number;
  refund: number;
  debt: number;
  note: string;
}

interface DailyReportData {
  transactions: Transaction[];
  summary: {
    totalRevenue: number;
    totalReceived: number;
    totalDeposit: number;
    totalRefund: number;
    totalDebt: number;
  };
}

export default function DailyReport() {
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [reportDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/staff/daily-report?report_date=${reportDate}`,
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
      console.error('Error fetching daily report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;
    
    // Try export as .xlsx (SheetJS). Fallback to CSV if library not available or fails.
    (async () => {
      try {
        const XLSX = await import('xlsx');

        const exportTime = new Date().toLocaleString('vi-VN');
        const wsData: any[] = [
          ['Thời gian xuất', exportTime],
          [],
          ['Mã đơn', 'Thời gian', 'Khách hàng', 'Phòng', 'Doanh thu', 'Thực thu', 'Cọc', 'Hoàn cọc', 'Ghi nợ', 'Ghi chú'],
          ...reportData.transactions.map((t: any) => [
            t.code,
            t.time,
            t.customerName,
            t.room,
            t.revenue,
            t.received,
            t.deposit,
            t.refund,
            t.debt,
            t.note
          ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bao-cao-cuoi-ngay-${reportDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.warn('XLSX export failed, falling back to CSV', err);
        // CSV fallback with escaping and export time
        const exportTime = new Date().toLocaleString('vi-VN');
        const headers = ['Mã đơn', 'Thời gian', 'Khách hàng', 'Phòng', 'Doanh thu', 'Thực thu', 'Cọc', 'Hoàn cọc', 'Ghi nợ', 'Ghi chú'];
        const rows = reportData.transactions.map((t: any) => [
          t.code,
          t.time,
          t.customerName,
          t.room,
          t.revenue,
          t.received,
          t.deposit,
          t.refund,
          t.debt,
          t.note
        ]);
        const csvRows: any[] = [["Thời gian xuất", exportTime], [], headers, ...rows];
        const csv = csvRows
          .map((row: any) => row.map(String).map((cell: any) => `"${cell.replace(/"/g, '""') }"`).join(','))
          .join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bao-cao-cuoi-ngay-${reportDate}.csv`;
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

  const summary = reportData?.summary || { totalRevenue: 0, totalReceived: 0, totalDeposit: 0, totalRefund: 0, totalDebt: 0 };
  const transactions = reportData?.transactions || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-gray-900">Báo cáo cuối ngày</h1>
        <button
          onClick={handleExport}
          disabled={!reportData || transactions.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>Xuất CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Ngày báo cáo
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Tổng doanh thu</p>
            <p className="text-blue-600 text-xl">{summary.totalRevenue.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Thực thu</p>
            <p className="text-green-600 text-xl">{summary.totalReceived.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Tiền cọc</p>
            <p className="text-yellow-600 text-xl">{summary.totalDeposit.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Hoàn cọc</p>
            <p className="text-purple-600 text-xl">{summary.totalRefund.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Ghi nợ</p>
            <p className="text-red-600 text-xl">{summary.totalDebt.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          {transactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-700">Mã đơn</th>
                  <th className="text-left py-3 px-2 text-gray-700">Thời gian</th>
                  <th className="text-left py-3 px-2 text-gray-700">Khách hàng</th>
                  <th className="text-left py-3 px-2 text-gray-700">Phòng</th>
                  <th className="text-right py-3 px-2 text-gray-700">Doanh thu</th>
                  <th className="text-right py-3 px-2 text-gray-700">Thực thu</th>
                  <th className="text-right py-3 px-2 text-gray-700">Cọc</th>
                  <th className="text-right py-3 px-2 text-gray-700">Hoàn cọc</th>
                  <th className="text-right py-3 px-2 text-gray-700">Ghi nợ</th>
                  <th className="text-left py-3 px-2 text-gray-700">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-900">{transaction.code}</td>
                    <td className="py-3 px-2 text-gray-600">{transaction.time}</td>
                    <td className="py-3 px-2 text-gray-900">{transaction.customerName}</td>
                    <td className="py-3 px-2 text-gray-900">{transaction.room}</td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      {transaction.revenue.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      {transaction.received.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      {transaction.deposit.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      {transaction.refund.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      {transaction.debt > 0 ? (
                        <span className="text-red-600">{transaction.debt.toLocaleString('vi-VN')}đ</span>
                      ) : (
                        '0đ'
                      )}
                    </td>
                    <td className="py-3 px-2 text-gray-600 text-xs">{transaction.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Không có giao dịch nào trong ngày này
            </div>
          )}
        </div>

        {/* Report Info */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex justify-between">
            <div>
              <p>Ngày báo cáo: {format(new Date(reportDate), 'dd/MM/yyyy', { locale: vi })}</p>
              <p>Giờ lập báo cáo: {format(new Date(), 'HH:mm', { locale: vi })}</p>
            </div>
            <div className="text-right">
              <p>Cơ sở: LaLa House Homestay</p>
              <p>Người lập: Nhân viên lễ tân</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
