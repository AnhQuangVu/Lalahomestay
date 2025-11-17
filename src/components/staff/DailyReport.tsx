import { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, DollarSign, Users, Clock, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

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

  const handleExport = async () => {
    if (!reportData || transactions.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    toast.info('Đang tạo file Excel...');

    try {
      const mod = await import('xlsx');
      const XLSX = (mod && ((mod as any).default || mod)) as any;

      const wb = XLSX.utils.book_new();
      const exportTime = new Date().toLocaleString('vi-VN');
      const reportDateFormatted = format(new Date(reportDate), 'dd/MM/yyyy', { locale: vi });

      // Sheet 1: Tổng quan
      const summaryData: any[][] = [
        ['LALA HOUSE - BÁO CÁO CUỐI NGÀY'],
        [`Ngày báo cáo: ${reportDateFormatted}`],
        [`Thời gian xuất: ${exportTime}`],
        [],
        ['CHỈ SỐ TÀI CHÍNH', '', '', ''],
        ['Chỉ số', 'Giá trị (₫)', 'Định dạng', 'Ghi chú'],
        ['Tổng doanh thu', summary.totalRevenue, formatCurrency(summary.totalRevenue), 'Tổng tiền phòng'],
        ['Thực thu', summary.totalReceived, formatCurrency(summary.totalReceived), 'Tiền đã nhận'],
        ['Tiền cọc', summary.totalDeposit, formatCurrency(summary.totalDeposit), 'Cọc CSVC'],
        ['Hoàn cọc', summary.totalRefund, formatCurrency(summary.totalRefund), 'Đã hoàn trả'],
        ['Ghi nợ', summary.totalDebt, formatCurrency(summary.totalDebt), 'Chưa thu'],
        [],
        ['THỐNG KÊ GIAO DỊCH', '', '', ''],
        ['Tổng số giao dịch', transactions.length, '', ''],
        ['Giao dịch có nợ', transactions.filter(t => t.debt > 0).length, '', ''],
        ['Tỷ lệ thu đủ', `${((transactions.filter(t => t.debt === 0).length / transactions.length) * 100).toFixed(1)}%`, '', ''],
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 30 }];
      wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
        { s: { r: 12, c: 0 }, e: { r: 12, c: 3 } },
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng quan');

      // Sheet 2: Chi tiết giao dịch
      const transactionData: any[][] = [
        ['CHI TIẾT GIAO DỊCH TRONG NGÀY'],
        [`Ngày: ${reportDateFormatted}`],
        [],
        ['Mã đơn', 'Thời gian', 'Khách hàng', 'Phòng', 'Doanh thu', 'Thực thu', 'Cọc', 'Hoàn cọc', 'Ghi nợ', 'Ghi chú'],
        ...transactions.map((t: any) => [
          t.code,
          t.time,
          t.customerName,
          t.room,
          t.revenue,
          t.received,
          t.deposit,
          t.refund,
          t.debt,
          t.note || ''
        ]),
        [],
        ['TỔNG CỘNG', '', '', '', summary.totalRevenue, summary.totalReceived, summary.totalDeposit, summary.totalRefund, summary.totalDebt, '']
      ];

      const wsTransactions = XLSX.utils.aoa_to_sheet(transactionData);
      wsTransactions['!cols'] = [
        { wch: 15 }, // Mã đơn
        { wch: 18 }, // Thời gian
        { wch: 20 }, // Khách hàng
        { wch: 12 }, // Phòng
        { wch: 15 }, // Doanh thu
        { wch: 15 }, // Thực thu
        { wch: 12 }, // Cọc
        { wch: 12 }, // Hoàn cọc
        { wch: 12 }, // Ghi nợ
        { wch: 30 }  // Ghi chú
      ];
      wsTransactions['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      ];
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Chi tiết');

      // Export
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-cuoi-ngay-${reportDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Xuất Excel thành công!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Không thể xuất Excel. Vui lòng thử lại.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
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
    <div className="max-w-7xl mx-auto">
      {/* Header với gradient */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Báo cáo cuối ngày</h1>
            <p className="text-gray-600">Tổng hợp giao dịch và doanh thu trong ngày</p>
          </div>
          <button
            onClick={handleExport}
            disabled={!reportData || transactions.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Date Picker Card */}
      <div className="rounded-xl shadow-lg p-6 mb-6 text-white" style={{ background: 'linear-gradient(to bottom right, rgb(59, 130, 246), rgb(37, 99, 235))' }}>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-blue-100 mb-2 font-medium">
              <Calendar className="w-4 h-4 inline mr-2" />
              Chọn ngày báo cáo
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none text-gray-900 font-medium"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
            >
              Xem báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards với icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(59, 130, 246), rgb(37, 99, 235))' }}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{transactions.length}</span>
          </div>
          <p className="text-blue-100 text-sm mb-1">Tổng doanh thu</p>
          <p className="text-2xl font-bold">{summary.totalRevenue.toLocaleString('vi-VN')}₫</p>
        </div>

        <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(34, 197, 94), rgb(22, 163, 74))' }}>
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-green-100 text-sm mb-1">Thực thu</p>
          <p className="text-2xl font-bold">{summary.totalReceived.toLocaleString('vi-VN')}₫</p>
        </div>

        <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(234, 179, 8), rgb(202, 138, 4))' }}>
          <div className="flex items-center justify-between mb-3">
            <CreditCard className="w-8 h-8 opacity-80" />
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-yellow-100 text-sm mb-1">Tiền cọc</p>
          <p className="text-2xl font-bold">{summary.totalDeposit.toLocaleString('vi-VN')}₫</p>
        </div>

        <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(168, 85, 247), rgb(147, 51, 234))' }}>
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 opacity-80" />
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-purple-100 text-sm mb-1">Hoàn cọc</p>
          <p className="text-2xl font-bold">{summary.totalRefund.toLocaleString('vi-VN')}₫</p>
        </div>

        <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(239, 68, 68), rgb(220, 38, 38))' }}>
          <div className="flex items-center justify-between mb-3">
            <AlertCircle className="w-8 h-8 opacity-80" />
            <span className="text-xl font-bold">{transactions.filter(t => t.debt > 0).length}</span>
          </div>
          <p className="text-red-100 text-sm mb-1">Ghi nợ</p>
          <p className="text-2xl font-bold">{summary.totalDebt.toLocaleString('vi-VN')}₫</p>
        </div>
      </div>

      {/* Main Report Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chi tiết giao dịch</h2>
          <p className="text-gray-600">Danh sách tất cả giao dịch trong ngày {format(new Date(reportDate), 'dd/MM/yyyy', { locale: vi })}</p>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          {transactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">Mã đơn</th>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">Thời gian</th>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">Khách hàng</th>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">Phòng</th>
                  <th className="text-right py-4 px-4 text-gray-700 font-semibold">Doanh thu</th>
                  <th className="text-right py-4 px-4 text-gray-700 font-semibold">Thực thu</th>
                  <th className="text-right py-4 px-4 text-gray-700 font-semibold">Cọc</th>
                  <th className="text-right py-4 px-4 text-gray-700 font-semibold">Hoàn cọc</th>
                  <th className="text-right py-4 px-4 text-gray-700 font-semibold">Ghi nợ</th>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {transactions.map((transaction, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono font-medium text-blue-600">{transaction.code}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{transaction.time}</td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{transaction.customerName}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-900 font-medium">{transaction.room}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-blue-600">{transaction.revenue.toLocaleString('vi-VN')}₫</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-green-600">{transaction.received.toLocaleString('vi-VN')}₫</span>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-900">
                      {transaction.deposit.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="py-4 px-4 text-right text-gray-900">
                      {transaction.refund.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="py-4 px-4 text-right">
                      {transaction.debt > 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-semibold">
                          {transaction.debt.toLocaleString('vi-VN')}₫
                        </span>
                      ) : (
                        <span className="text-gray-400">0₫</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-xs max-w-xs truncate">{transaction.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 font-bold">
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-gray-900">TỔNG CỘNG</td>
                  <td className="py-4 px-4 text-right text-blue-600 text-lg">{summary.totalRevenue.toLocaleString('vi-VN')}₫</td>
                  <td className="py-4 px-4 text-right text-green-600 text-lg">{summary.totalReceived.toLocaleString('vi-VN')}₫</td>
                  <td className="py-4 px-4 text-right text-gray-900">{summary.totalDeposit.toLocaleString('vi-VN')}₫</td>
                  <td className="py-4 px-4 text-right text-gray-900">{summary.totalRefund.toLocaleString('vi-VN')}₫</td>
                  <td className="py-4 px-4 text-right text-red-600 text-lg">{summary.totalDebt.toLocaleString('vi-VN')}₫</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Không có giao dịch nào trong ngày này</p>
              <p className="text-gray-400 text-sm mt-2">Chọn ngày khác để xem báo cáo</p>
            </div>
          )}
        </div>

        {/* Report Info */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Ngày báo cáo:</span> {format(new Date(reportDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Giờ lập:</span> {format(new Date(), 'HH:mm:ss', { locale: vi })}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Cơ sở:</span> LaLa House Homestay
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Người lập:</span> Nhân viên lễ tân
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end mt-6">
            <button
              onClick={handleExport}
              disabled={!reportData || transactions.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
