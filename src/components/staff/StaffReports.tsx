import { useState, useEffect } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Download, Calendar, TrendingUp, Home, CheckCircle, XCircle, Users, BarChart3 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

// Import cấu hình Supabase của bạn
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Cấu hình font cho pdfMake
pdfMake.vfs = pdfFonts.vfs;

// --- MOCK DATA & INTERFACES ---

interface ReceptionEvent {
  time: string;
  type: string;
  code: string;
  customer: string;
  room: string;
  note: string;
}

const mockReceptionEvents: ReceptionEvent[] = [
  { time: '08:15', type: 'Tạo đơn đặt phòng', code: 'LALA-20251121-5487', customer: 'Nguyễn An', room: '101', note: '' },
  { time: '09:00', type: 'Check-in', code: 'LALA-20251121-5487', customer: 'Nguyễn An', room: '101', note: 'Nhận phòng đúng giờ' },
  { time: '10:20', type: 'Hủy đơn', code: 'LALA-20251121-7890', customer: 'Hoàng Tú Kiều', room: '', note: 'Khách đổi lịch' },
  { time: '11:00', type: 'Check-out', code: 'LALA-20251121-5487', customer: 'Nguyễn An', room: '101', note: 'Trả phòng sớm' },
];

interface DailyRoomStat {
  date: string;
  emptyRooms: number;
  checkouts: number;
  checkins: number;
  occupied: number;
  occupancy: number;
}

// --- COMPONENT CHÍNH ---

export default function StaffReports() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<DailyRoomStat[]>([]);
  const [loading, setLoading] = useState(false);

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
      toast.error('Có lỗi khi tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (reportData.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    toast.info('Đang tạo file Excel...');

    try {
      const mod = await import('xlsx');
      const XLSX = (mod && ((mod as any).default || mod)) as any;

      const wb = XLSX.utils.book_new();
      const exportTime = new Date().toLocaleString('vi-VN');

      // Tính tổng
      const totalEmpty = reportData.reduce((sum, r) => sum + r.emptyRooms, 0);
      const totalCheckouts = reportData.reduce((sum, r) => sum + r.checkouts, 0);
      const totalCheckins = reportData.reduce((sum, r) => sum + r.checkins, 0);
      const totalOccupied = reportData.reduce((sum, r) => sum + r.occupied, 0);
      const avgOccupancy = (reportData.reduce((sum, r) => sum + r.occupancy, 0) / reportData.length).toFixed(1);

      // Sheet 1: Tổng quan
      const summaryData: any[][] = [
        ['LALA HOUSE - BÁO CÁO CÔNG SUẤT PHÒNG'],
        [`Từ ngày: ${format(new Date(startDate), 'dd/MM/yyyy', { locale: vi })} đến ${format(new Date(endDate), 'dd/MM/yyyy', { locale: vi })}`],
        [`Thời gian xuất: ${exportTime}`],
        [],
        ['CHỈ SỐ TỔNG HỢP', '', '', ''],
        ['Chỉ số', 'Giá trị', 'Đơn vị', 'Ghi chú'],
        ['Tổng ngày báo cáo', reportData.length, 'ngày', `${format(new Date(startDate), 'dd/MM', { locale: vi })} - ${format(new Date(endDate), 'dd/MM', { locale: vi })}`],
        ['Tổng phòng trống', totalEmpty, 'phòng', 'Cộng dồn các ngày'],
        ['Tổng dự kiến trả', totalCheckouts, 'lượt', 'Check-out dự kiến'],
        ['Tổng dự kiến nhận', totalCheckins, 'lượt', 'Check-in dự kiến'],
        ['Tổng đang sử dụng', totalOccupied, 'phòng', 'Cộng dồn các ngày'],
        ['Công suất TB', avgOccupancy, '%', 'Trung bình trong kỳ'],
        [],
        ['ĐÁNH GIÁ HIỆU SUẤT', '', '', ''],
        ['Tiêu chí', 'Giá trị', 'Đánh giá', ''],
        ['Công suất trung bình', avgOccupancy + '%',
          parseFloat(avgOccupancy) >= 80 ? '✓ Rất tốt' :
            parseFloat(avgOccupancy) >= 60 ? '✓ Tốt' :
              parseFloat(avgOccupancy) >= 40 ? '⚠️ Trung bình' : '✗ Cần cải thiện', ''],
        ['Ngày công suất cao nhất',
          reportData.reduce((max, r) => r.occupancy > max.occupancy ? r : max).date,
          reportData.reduce((max, r) => r.occupancy > max.occupancy ? r : max).occupancy + '%', '🏆 Best day'],
        ['Ngày công suất thấp nhất',
          reportData.reduce((min, r) => r.occupancy < min.occupancy ? r : min).date,
          reportData.reduce((min, r) => r.occupancy < min.occupancy ? r : min).occupancy + '%', '⚠️ Need attention'],
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 30 }];
      wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
        { s: { r: 13, c: 0 }, e: { r: 13, c: 3 } },
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng quan');

      // Sheet 2: Chi tiết theo ngày
      const detailData: any[][] = [
        ['CHI TIẾT CÔNG SUẤT THEO NGÀY'],
        [`Từ ${format(new Date(startDate), 'dd/MM/yyyy', { locale: vi })} đến ${format(new Date(endDate), 'dd/MM/yyyy', { locale: vi })}`],
        [],
        ['Ngày', 'Phòng trống', 'Dự kiến trả', 'Dự kiến nhận', 'Đang sử dụng', 'Công suất (%)', 'Đánh giá'],
        ...reportData.map((r: any) => [
          r.date,
          r.emptyRooms,
          r.checkouts,
          r.checkins,
          r.occupied,
          r.occupancy,
          r.occupancy >= 80 ? '✓ Cao' : r.occupancy >= 60 ? '✓ Tốt' : r.occupancy >= 40 ? '⚠️ TB' : '✗ Thấp'
        ]),
        [],
        ['TỔNG / TRUNG BÌNH', totalEmpty, totalCheckouts, totalCheckins, totalOccupied, avgOccupancy, '']
      ];

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      wsDetail['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];
      wsDetail['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi tiết theo ngày');

      // Export
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-cong-suat-phong-${startDate}-${endDate}.xlsx`;
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

  // KPI lễ tân
  const events = mockReceptionEvents; 
  const kpiCreated = events.filter(e => e.type.toLowerCase().includes('tạo đơn')).length;
  const kpiCheckin = events.filter(e => e.type.toLowerCase().includes('check-in')).length;
  const kpiCheckout = events.filter(e => e.type.toLowerCase().includes('check-out')).length;
  const kpiCancel = events.filter(e => e.type.toLowerCase().includes('hủy')).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header với gradient */}
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 Báo cáo công suất phòng</h1>
          <p className="text-gray-600">Theo dõi tình hình sử dụng phòng theo thời gian</p>
        </div>
      </div>

      {/* Date Range Card + Nút Xem báo cáo */}
      <div className="rounded-xl shadow-lg p-6 mb-6 text-white" style={{ background: 'linear-gradient(to bottom right, rgb(168, 85, 247), rgb(147, 51, 234))' }}>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-purple-100 mb-2 font-medium">
              <Calendar className="w-4 h-4 inline mr-2" />
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none text-gray-900 font-medium"
            />
          </div>

          <div className="flex-1">
            <label className="block text-purple-100 mb-2 font-medium">
              <Calendar className="w-4 h-4 inline mr-2" />
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none text-gray-900 font-medium"
            />
          </div>

          <div className="flex-shrink-0 mt-4 md:mt-0">
            <button
              onClick={fetchReportData}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all font-semibold flex items-center gap-2"
              disabled={loading}
            >
              <BarChart3 className="w-5 h-5" />
              Xem báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData.length > 0 && (() => {
        const totalEmpty = reportData.reduce((sum, r) => sum + r.emptyRooms, 0);
        const totalCheckouts = reportData.reduce((sum, r) => sum + r.checkouts, 0);
        const totalCheckins = reportData.reduce((sum, r) => sum + r.checkins, 0);
        const totalOccupied = reportData.reduce((sum, r) => sum + r.occupied, 0);
        const avgOccupancy = (reportData.reduce((sum, r) => sum + r.occupancy, 0) / reportData.length).toFixed(1);

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(59, 130, 246), rgb(37, 99, 235))' }}>
              <div className="flex items-center justify-between mb-3">
                <Home className="w-8 h-8 opacity-80" />
                <BarChart3 className="w-6 h-6" />
              </div>
              <p className="text-blue-100 text-sm mb-1">Phòng trống</p>
              <p className="text-2xl font-bold">{totalEmpty}</p>
              <p className="text-xs text-blue-100 mt-1">Tổng trong kỳ</p>
            </div>

            <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(239, 68, 68), rgb(220, 38, 38))' }}>
              <div className="flex items-center justify-between mb-3">
                <XCircle className="w-8 h-8 opacity-80" />
                <span className="text-xl font-bold">{totalCheckouts}</span>
              </div>
              <p className="text-red-100 text-sm mb-1">Dự kiến trả</p>
              <p className="text-2xl font-bold">{(totalCheckouts / reportData.length).toFixed(1)}</p>
              <p className="text-xs text-red-100 mt-1">TB/ngày</p>
            </div>

            <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(34, 197, 94), rgb(22, 163, 74))' }}>
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-8 h-8 opacity-80" />
                <span className="text-xl font-bold">{totalCheckins}</span>
              </div>
              <p className="text-green-100 text-sm mb-1">Dự kiến nhận</p>
              <p className="text-2xl font-bold">{(totalCheckins / reportData.length).toFixed(1)}</p>
              <p className="text-xs text-green-100 mt-1">TB/ngày</p>
            </div>

            <div className="rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to bottom right, rgb(249, 115, 22), rgb(234, 88, 12))' }}>
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-orange-100 text-sm mb-1">Đang sử dụng</p>
              <p className="text-2xl font-bold">{totalOccupied}</p>
              <p className="text-xs text-orange-100 mt-1">Tổng trong kỳ</p>
            </div>

            <div className={`rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform`} style={{
              background: parseFloat(avgOccupancy) >= 80
                ? 'linear-gradient(to bottom right, rgb(16, 185, 129), rgb(5, 150, 105))'
                : parseFloat(avgOccupancy) >= 60
                  ? 'linear-gradient(to bottom right, rgb(234, 179, 8), rgb(202, 138, 4))'
                  : 'linear-gradient(to bottom right, rgb(239, 68, 68), rgb(220, 38, 38))'
            }}>
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">{reportData.length}</span>
              </div>
              <p className="text-white/90 text-sm mb-1">Công suất TB</p>
              <p className="text-3xl font-bold">{avgOccupancy}%</p>
              <p className="text-xs text-white/80 mt-1">
                {parseFloat(avgOccupancy) >= 80 ? '✓ Rất tốt' :
                  parseFloat(avgOccupancy) >= 60 ? '✓ Tốt' : '⚠️ Cần cải thiện'}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Báo cáo hoạt động lễ tân trong ca */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">BÁO CÁO HOẠT ĐỘNG LỄ TÂN TRONG CA</h2>
        <p className="text-gray-600 mb-4">Ca trực: Ca sáng | Thời gian: 06:00 - 14:00 | Nhân viên: Nguyễn Văn A</p>
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{kpiCreated}</div>
            <div className="text-sm text-blue-600">Đơn đã tạo</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{kpiCheckin}</div>
            <div className="text-sm text-green-600">Khách check-in</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">{kpiCheckout}</div>
            <div className="text-sm text-orange-600">Khách check-out</div>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{kpiCancel}</div>
            <div className="text-sm text-red-600">Đơn hủy</div>
          </div>
        </div>
        {/* Bảng hoạt động */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="py-3 px-2 text-gray-700 font-semibold">STT</th>
                <th className="py-3 px-2 text-gray-700 font-semibold">Thời gian</th>
                <th className="py-3 px-2 text-gray-700 font-semibold">Hoạt động</th>
                <th className="py-3 px-2 text-gray-700 font-semibold">Mã đơn</th>
                <th className="py-3 px-2 text-gray-700 font-semibold">Tên khách hàng</th>
                <th className="py-3 px-2 text-gray-700 font-semibold">Phòng</th>
                <th className="py-3 px-2 text-gray-700 font-semibold">Ghi chú / Diễn giải</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {events.map((e, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                  <td className="py-2 px-2 text-center">{idx + 1}</td>
                  <td className="py-2 px-2">{e.time}</td>
                  <td className="py-2 px-2">{e.type}</td>
                  <td className="py-2 px-2 font-mono text-blue-700">{e.code}</td>
                  <td className="py-2 px-2">{e.customer}</td>
                  <td className="py-2 px-2">{e.room || '-'}</td>
                  <td className="py-2 px-2 text-xs max-w-xs truncate">{e.note || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 font-bold">
              <tr>
                <td colSpan={7} className="py-3 px-2 text-gray-900">Tổng số hoạt động: {events.length} | Đơn tạo mới: {kpiCreated} | Check-in: {kpiCheckin} | Check-out: {kpiCheckout} | Đơn hủy: {kpiCancel}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Nút xuất PDF */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => {
              if (events.length === 0) {
                toast.error('Không có dữ liệu để xuất PDF');
                return;
              }
              const exportTime = new Date().toLocaleString('vi-VN');
              const hour = new Date().getHours();
              let caTruc = '';
              if (hour >= 6 && hour < 14) caTruc = 'Ca sáng';
              else if (hour >= 14 && hour < 22) caTruc = 'Ca chiều';
              else caTruc = 'Ca tối';
              const nhanVien = 'Nguyễn Văn A';
              const timeRange = caTruc === 'Ca sáng' ? '06:00 - 14:00' : caTruc === 'Ca chiều' ? '14:00 - 22:00' : '22:00 - 06:00';
              
              const tableBody = [
                ['STT', 'Thời gian', 'Hoạt động', 'Mã đơn', 'Tên khách hàng', 'Phòng', 'Ghi chú / Diễn giải'].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0' })),
                ...events.map((e, idx) => [
                  idx + 1,
                  e.time,
                  e.type,
                  e.code,
                  e.customer,
                  e.room || '-',
                  e.note || '-'
                ])
              ];
              
              const summaryRows = [
                ['Tổng số hoạt động', events.length],
                ['Số đơn tạo mới', kpiCreated],
                ['Số check-in', kpiCheckin],
                ['Số check-out', kpiCheckout],
                ['Số đơn hủy', kpiCancel]
              ];
              
              const docDefinition = {
                content: [
                  { text: 'BÁO CÁO HOẠT ĐỘNG LỄ TÂN TRONG CA', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
                  { text: `Ca trực: ${caTruc} | Thời gian: ${timeRange} | Nhân viên: ${nhanVien}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },
                  { text: `Thời gian xuất: ${exportTime}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },
                  { text: 'BẢNG HOẠT ĐỘNG TRONG CA', style: 'sectionHeader', margin: [0, 10, 0, 6] },
                  {
                    table: {
                      headerRows: 1,
                      widths: [30, 50, 80, 80, 80, 40, 100],
                      body: tableBody
                    },
                    layout: 'lightHorizontalLines',
                    fontSize: 9
                  },
                  { text: 'TỔNG KẾT CUỐI BÁO CÁO', style: 'sectionHeader', margin: [0, 10, 0, 6] },
                  {
                    table: {
                      widths: ['*', '*'],
                      body: summaryRows
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 10]
                  },
                  { text: '\nBáo cáo được tạo tự động từ hệ thống quản lý Lala House.', style: 'footer', alignment: 'center', color: '#7f8c8d', fontSize: 9 }
                ],
                styles: {
                  header: { fontSize: 16, bold: true, color: '#2c3e50' },
                  subheader: { fontSize: 11, color: '#555' },
                  sectionHeader: { fontSize: 12, bold: true, color: '#34495e', decoration: 'underline', decorationStyle: 'dotted' },
                  footer: { fontSize: 9, color: '#7f8c8d', italics: true }
                },
                defaultStyle: {
                  font: 'Roboto',
                  fontSize: 10
                }
              };
              pdfMake.createPdf(docDefinition).download(`BaoCaoLeTan-${caTruc}-${exportTime.replace(/\D/g, '')}.pdf`);
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Xuất PDF lễ tân</span>
          </button>
        </div>
      </div>

      {/* Header cho bảng chi tiết */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Chi tiết công suất theo ngày</h2>
        <p className="text-gray-600">
          Từ {format(new Date(startDate), 'dd/MM/yyyy', { locale: vi })} đến {format(new Date(endDate), 'dd/MM/yyyy', { locale: vi })}
        </p>
      </div>

      {/* Report Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        {reportData.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="text-left py-4 px-4 text-gray-700 font-semibold">Ngày</th>
                <th className="text-center py-4 px-4 text-gray-700 font-semibold">
                  <Home className="w-4 h-4 inline mr-1" />
                  Phòng trống
                </th>
                <th className="text-center py-4 px-4 text-gray-700 font-semibold">
                  <XCircle className="w-4 h-4 inline mr-1" />
                  Dự kiến trả
                </th>
                <th className="text-center py-4 px-4 text-gray-700 font-semibold">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Dự kiến nhận
                </th>
                <th className="text-center py-4 px-4 text-gray-700 font-semibold">
                  <Users className="w-4 h-4 inline mr-1" />
                  Đang sử dụng
                </th>
                <th className="text-center py-4 px-4 text-gray-700 font-semibold">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Công suất
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reportData.map((row, index) => (
                <tr key={index} className="hover:bg-purple-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">{row.date}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-lg font-bold">
                      {row.emptyRooms}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-red-100 text-red-700 rounded-lg font-bold">
                      {row.checkouts}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-green-100 text-green-700 rounded-lg font-bold">
                      {row.checkins}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-700 rounded-lg font-bold">
                      {row.occupied}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold ${row.occupancy >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      row.occupancy >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        row.occupancy >= 40 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                      }`}>
                      {row.occupancy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 font-bold">
              <tr>
                <td className="py-4 px-4 text-gray-900">TỔNG / TRUNG BÌNH</td>
                <td className="py-4 px-4 text-center text-blue-600">
                  {reportData.reduce((sum, r) => sum + r.emptyRooms, 0)}
                </td>
                <td className="py-4 px-4 text-center text-red-600">
                  {reportData.reduce((sum, r) => sum + r.checkouts, 0)}
                </td>
                <td className="py-4 px-4 text-center text-green-600">
                  {reportData.reduce((sum, r) => sum + r.checkins, 0)}
                </td>
                <td className="py-4 px-4 text-center text-orange-600">
                  {reportData.reduce((sum, r) => sum + r.occupied, 0)}
                </td>
                <td className="py-4 px-4 text-center text-purple-600 text-lg">
                  {(reportData.reduce((sum, r) => sum + r.occupancy, 0) / reportData.length).toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Không có dữ liệu trong khoảng thời gian này</p>
            <p className="text-gray-400 text-sm mt-2">Chọn khoảng thời gian khác để xem báo cáo</p>
          </div>
        )}
      </div>

      {/* Footer Actions (Xuất Excel & PDF Công suất) */}
      {reportData.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center justify-between text-sm mb-6">
            <div className="space-y-1">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Khoảng thời gian:</span> {format(new Date(startDate), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(endDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Tổng ngày:</span> {reportData.length} ngày
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Cơ sở:</span> LaLa House Homestay
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Thời gian tạo:</span> {format(new Date(), 'HH:mm:ss', { locale: vi })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={handleExport}
              disabled={reportData.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Xuất Excel</span>
            </button>
            <button
              onClick={() => {
                if (reportData.length === 0) {
                  toast.error('Không có dữ liệu để xuất PDF');
                  return;
                }
                const exportTime = new Date().toLocaleString('vi-VN');
                const docDefinition = {
                  content: [
                    { text: 'LALA HOUSE - BÁO CÁO CÔNG SUẤT PHÒNG', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
                    { text: `Từ ngày: ${format(new Date(startDate), 'dd/MM/yyyy', { locale: vi })} đến ${format(new Date(endDate), 'dd/MM/yyyy', { locale: vi })}`, style: 'subheader', alignment: 'center' },
                    { text: `Thời gian xuất: ${exportTime}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },
                    { text: 'CHI TIẾT CÔNG SUẤT THEO NGÀY', style: 'sectionHeader', margin: [0, 10, 0, 6] },
                    {
                      table: {
                        headerRows: 1,
                        widths: [60, 60, 60, 60, 60, 60, 60],
                        body: [
                          ['Ngày', 'Phòng trống', 'Dự kiến trả', 'Dự kiến nhận', 'Đang sử dụng', 'Công suất (%)', 'Đánh giá'].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0' })),
                          ...reportData.map(r => [
                            r.date,
                            r.emptyRooms,
                            r.checkouts,
                            r.checkins,
                            r.occupied,
                            r.occupancy + '%',
                            r.occupancy >= 80 ? '✓ Cao' : r.occupancy >= 60 ? '✓ Tốt' : r.occupancy >= 40 ? '⚠️ TB' : '✗ Thấp'
                          ]),
                          [
                            { text: 'TỔNG / TB', bold: true },
                            reportData.reduce((sum, r) => sum + r.emptyRooms, 0),
                            reportData.reduce((sum, r) => sum + r.checkouts, 0),
                            reportData.reduce((sum, r) => sum + r.checkins, 0),
                            reportData.reduce((sum, r) => sum + r.occupied, 0),
                            (reportData.reduce((sum, r) => sum + r.occupancy, 0) / reportData.length).toFixed(1) + '%',
                            ''
                          ]
                        ]
                      },
                      layout: 'lightHorizontalLines',
                      fontSize: 9
                    },
                    { text: '\nBáo cáo được tạo tự động từ hệ thống quản lý Lala House.', style: 'footer', alignment: 'center', color: '#7f8c8d', fontSize: 9 }
                  ],
                  styles: {
                    header: { fontSize: 16, bold: true, color: '#2c3e50' },
                    subheader: { fontSize: 11, color: '#555' },
                    sectionHeader: { fontSize: 12, bold: true, color: '#34495e', decoration: 'underline', decorationStyle: 'dotted' },
                    footer: { fontSize: 9, color: '#7f8c8d', italics: true }
                  },
                  defaultStyle: {
                    font: 'Roboto',
                    fontSize: 10
                  }
                };
                pdfMake.createPdf(docDefinition).download(`BaoCaoCongSuatPhong-${startDate}-${endDate}.pdf`);
              }}
              disabled={reportData.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Xuất PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}