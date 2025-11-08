import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Calendar
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import OverviewReport from './reports/OverviewReport';
import RevenueReport from './reports/RevenueReport';
import BookingsReport from './reports/BookingsReport';
import RoomsReport from './reports/RoomsReport';
import CustomersReport from './reports/CustomersReport';

interface ReportData {
  // Tổng quan
  totalBookings: number;
  totalRevenue: number;
  totalDeposit: number;
  totalCustomers: number;
  newCustomers: number;
  
  // Phòng
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalNights: number;
  
  // Đặt phòng
  confirmedBookings: number;
  cancelledBookings: number;
  checkedInBookings: number;
  checkedOutBookings: number;
  cancelRate: number;
  
  // Doanh thu
  averageBookingValue: number;
  averageNightlyRate: number;
  growthRate: number;
  
  // Chi tiết theo thời gian
  dailyRevenue: Array<{ date: string; revenue: number; bookings: number; }>;
  
  // Top phòng
  topRooms: Array<{ name: string; bookings: number; revenue: number; }>;
  
  // Nguồn đặt phòng
  bookingSources: Array<{ source: string; count: number; }>;
  
  // Trạng thái đặt phòng
  bookingStatus: Array<{ status: string; count: number; }>;
}

export default function Reports() {
  const [reportType, setReportType] = useState('overview');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/admin/reports?start_date=${startDate}&end_date=${endDate}`,
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
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: generate a simple CSV from current reportData (fallback when server export not ready)
  const generateCsvFromReportData = (data: ReportData) => {
    // Build sections: include export time, summary, rooms, bookings, dailyRevenue, topRooms
    const exportTime = new Date().toLocaleString('vi-VN');
    const lines: string[] = [];
    lines.push(`Thời gian xuất: ${exportTime}`);
    lines.push('');
    lines.push('BÁO CÁO - LALA HOUSE');
    lines.push(`Từ: ${startDate}  Đến: ${endDate}`);
    lines.push('');

    // Summary KPIs
    lines.push('--- Tổng quan ---');
    lines.push(`Tổng doanh thu,${data.totalRevenue}`);
    lines.push(`Tổng đặt phòng,${data.totalBookings}`);
    lines.push(`Tổng khách hàng,${data.totalCustomers}`);
    lines.push(`Tiền cọc,${data.totalDeposit}`);
    lines.push('');

    // Rooms
    lines.push('--- Phòng ---');
    lines.push('Tổng phòng,Phòng đang sử dụng,Phòng trống,Tỉ lệ sử dụng (%)');
    lines.push(`${data.totalRooms},${data.occupiedRooms},${data.availableRooms},${data.occupancyRate}`);
    lines.push('');

    // Daily revenue
    lines.push('--- Doanh thu theo ngày ---');
    lines.push('Ngày,Doanh thu,Số đặt phòng');
    (data.dailyRevenue || []).forEach(d => {
      lines.push(`${d.date},${d.revenue},${d.bookings}`);
    });
    lines.push('');

    // Top rooms
    lines.push('--- Top phòng ---');
    lines.push('Phòng,Số lượt đặt,Doanh thu');
    (data.topRooms || []).forEach(r => {
      lines.push(`${r.name},${r.bookings},${r.revenue}`);
    });
    lines.push('');

    // Booking status
    lines.push('--- Trạng thái đặt phòng ---');
    lines.push('Trạng thái,Số lượng');
    (data.bookingStatus || []).forEach(s => lines.push(`${s.status},${s.count}`));

    return lines.join('\r\n');
  };

  // Client-side Excel export using SheetJS (xlsx)
  // Requires: npm install xlsx
  const exportExcelClient = async (type: string = reportType) => {
    if (!reportData) {
      alert('Không có dữ liệu để xuất. Vui lòng tải báo cáo trước.');
      return;
    }

    try {
  // dynamic import can return the module object or the default export depending on bundler
  const mod = await import('xlsx');
  // prefer default if present, otherwise use module namespace
  const XLSX = (mod && ((mod as any).default || mod)) as any;

  const wb = XLSX.utils.book_new();
  const exportTime = new Date().toLocaleString('vi-VN');

      // build per-type sheets
      const pushSheet = (name: string, aoa: Array<Array<string | number>>) => {
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, name);
      };

      if (type === 'overview') {
        const rows: Array<Array<string | number>> = [];
        rows.push(['Thời gian xuất', exportTime]);
        rows.push([]);
        rows.push(['BÁO CÁO - TỔNG QUAN']);
        rows.push([`Từ: ${startDate}`, `Đến: ${endDate}`]);
        rows.push([]);
        rows.push(['KPIs', 'Giá trị']);
        rows.push(['Tổng doanh thu', reportData.totalRevenue]);
        rows.push(['Tổng đặt phòng', reportData.totalBookings]);
        rows.push(['Tổng khách hàng', reportData.totalCustomers]);
        rows.push(['Tiền cọc', reportData.totalDeposit]);
        rows.push(['Khách mới', reportData.newCustomers]);
        pushSheet('Overview', rows);
      }

      if (type === 'revenue') {
        const rows: Array<Array<string | number>> = [];
        rows.push(['Thời gian xuất', exportTime]);
        rows.push([]);
        rows.push(['BÁO CÁO - DOANH THU']);
        rows.push([`Từ: ${startDate}`, `Đến: ${endDate}`]);
        rows.push([]);
        rows.push(['Ngày', 'Doanh thu', 'Số đặt phòng']);
        (reportData.dailyRevenue || []).forEach((d: any) => rows.push([d.date, d.revenue, d.bookings]));
        rows.push([]);
        rows.push(['Chỉ số', 'Giá trị']);
        rows.push(['Doanh thu trung bình/booking', reportData.averageBookingValue]);
        rows.push(['Doanh thu trung bình/đêm', reportData.averageNightlyRate]);
        rows.push(['Tăng trưởng', reportData.growthRate]);
        pushSheet('Revenue', rows);
      }

      if (type === 'bookings') {
        const rows: Array<Array<string | number>> = [];
        rows.push(['Thời gian xuất', exportTime]);
        rows.push([]);
        rows.push(['BÁO CÁO - ĐẶT PHÒNG']);
        rows.push([`Từ: ${startDate}`, `Đến: ${endDate}`]);
        rows.push([]);
        rows.push(['Trạng thái', 'Số lượng']);
        (reportData.bookingStatus || []).forEach((s: any) => rows.push([s.status, s.count]));
        rows.push([]);
        rows.push(['Loại', 'Giá trị']);
        rows.push(['Đã xác nhận', reportData.confirmedBookings]);
        rows.push(['Đã hủy', reportData.cancelledBookings]);
        rows.push(['Đã check-in', reportData.checkedInBookings]);
        rows.push(['Đã check-out', reportData.checkedOutBookings]);
        pushSheet('Bookings', rows);
      }

      if (type === 'rooms') {
        const rows: Array<Array<string | number>> = [];
        rows.push(['Thời gian xuất', exportTime]);
        rows.push([]);
        rows.push(['BÁO CÁO - PHÒNG']);
        rows.push([`Từ: ${startDate}`, `Đến: ${endDate}`]);
        rows.push([]);
        rows.push(['Tổng phòng', 'Phòng đang sử dụng', 'Phòng trống', 'Tỷ lệ sử dụng (%)']);
        rows.push([reportData.totalRooms, reportData.occupiedRooms, reportData.availableRooms, reportData.occupancyRate]);
        rows.push([]);
        rows.push(['Top phòng', 'Số lượt đặt', 'Doanh thu']);
        (reportData.topRooms || []).forEach((r: any) => rows.push([r.name, r.bookings, r.revenue]));
        pushSheet('Rooms', rows);
      }

      if (type === 'customers') {
        const rows: Array<Array<string | number>> = [];
        rows.push(['Thời gian xuất', exportTime]);
        rows.push([]);
        rows.push(['BÁO CÁO - KHÁCH HÀNG']);
        rows.push([`Từ: ${startDate}`, `Đến: ${endDate}`]);
        rows.push([]);
        rows.push(['Tổng khách hàng', reportData.totalCustomers]);
        rows.push(['Khách mới', reportData.newCustomers]);
        rows.push([]);
        rows.push(['Nguồn đặt phòng', 'Số lượng']);
        (reportData.bookingSources || []).forEach((s: any) => rows.push([s.source, s.count]));
        pushSheet('Customers', rows);
      }

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = `bao-cao-${startDate}-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlObj);
      (window as any).__exportDebug = (window as any).__exportDebug || {};
      (window as any).__exportDebug.last = (window as any).__exportDebug.last || {};
      (window as any).__exportDebug.last.clientExport = { method: 'sheetjs', timestamp: new Date().toISOString() };
    } catch (err) {
      console.error('Client Excel export failed:', err);
      alert('Xuất Excel trên client thất bại. Hãy chắc đã cài `xlsx` hoặc thử lại.');
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    // Non-destructive verbose debug: logs status, headers, first bytes and saves preview
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/admin/reports/export?format=${format}&start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      // Prepare debug container on window so user can inspect in Console
      (window as any).__exportDebug = (window as any).__exportDebug || {};

      const status = response.status;
      const contentType = response.headers.get('content-type') || '';
      const contentDisp = response.headers.get('content-disposition') || '';

      console.log('[EXPORT DEBUG] url:', url);
      console.log('[EXPORT DEBUG] status:', status);
      console.log('[EXPORT DEBUG] content-type:', contentType);
      console.log('[EXPORT DEBUG] content-disposition:', contentDisp);

      (window as any).__exportDebug.last = {
        url,
        status,
        contentType,
        contentDisp,
        timestamp: new Date().toISOString(),
      };

      if (!response.ok) {
        // try to get text body for debugging
        const txt = await response.text().catch(() => '<<no body>>');
        console.error('[EXPORT DEBUG] server returned non-OK:', status, txt);
        (window as any).__exportDebug.last.errorBody = txt;
        alert(`Server trả lỗi ${status}. Xem console (window.__exportDebug).`);
        return;
      }

      // If server returns JSON (e.g. status/info message or base64 payload), handle it first
      const respContentType = contentType.toLowerCase();
      if (respContentType.includes('application/json')) {
        const json = await response.json().catch(() => null);
        console.log('[EXPORT DEBUG] json response:', json);
        (window as any).__exportDebug.last.json = json;
        // If server intentionally returns a message (e.g. feature in development), show it
        if (json && (json.message || json.note)) {
          const msg = [json.message, json.note].filter(Boolean).join(' - ');
          // Show server message
          alert(`Server message: ${msg}`);
          // Offer CSV fallback if we have client-side data
          if (reportData) {
            const ok = confirm('Server chưa trả file .xlsx. Bạn muốn xuất nhanh ra CSV từ dữ liệu hiện tại?');
            if (ok) {
              try {
                const csv = generateCsvFromReportData(reportData);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const urlObj = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = urlObj;
                a.download = `bao-cao-fallback-${startDate}-${endDate}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(urlObj);
                (window as any).__exportDebug.last.fallback = { method: 'csv', size: csv.length };
              } catch (e) {
                console.error('[EXPORT DEBUG] CSV fallback failed:', e);
                alert('Không thể xuất CSV. Xem console.');
              }
            }
          }
        }
        // If server returned base64 file inside JSON, try to find it
        const base64 = json?.file || json?.data || json?.base64 || null;
        if (typeof base64 === 'string') {
          try {
            const cleaned = base64.replace(/^data:.*;base64,/, '');
            const binary = atob(cleaned);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            const first4hex = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
            (window as any).__exportDebug.last.first4hex = first4hex;
            (window as any).__exportDebug.last.size = bytes.length;
            // Only proceed to download if signature looks like zip for xlsx
            if (format === 'excel' && first4hex !== '50 4b 03 04') {
              alert('Server trả base64 nhưng nội dung không phải XLSX. Xem console.');
              return;
            }
            const buf = bytes.buffer;
            const mime = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
            const blob = new Blob([buf], { type: mime });
            const urlObj = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlObj;
            a.download = `bao-cao-${format}-${startDate}-${endDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(urlObj);
            (window as any).__exportDebug.last.downloaded = true;
          } catch (e) {
            console.error('[EXPORT DEBUG] Error decoding base64 JSON file:', e);
            alert('Không thể decode file base64. Xem console.');
          }
        }
        return;
      }

      // Clone response so we can read both arrayBuffer and text if needed
      const respClone = response.clone();
      const arrayBuffer = await response.arrayBuffer();
      const u8 = new Uint8Array(arrayBuffer);
      const size = u8.length;
      const first4hex = Array.from(u8.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');

      // Save low-level debug info to window for user inspection
      (window as any).__exportDebug.last.size = size;
      (window as any).__exportDebug.last.first4hex = first4hex;

      // If first bytes are not PK.. (xlsx is zip) then grab a text preview to see HTML/JSON
      if (format === 'excel' && first4hex !== '50 4b 03 04') {
        const previewText = await respClone.text().catch(() => '<<cannot decode preview>>');
        const previewSnippet = previewText.slice(0, 2000);
        console.error('[EXPORT DEBUG] Unexpected first4hex:', first4hex, 'preview snippet:', previewSnippet);
        (window as any).__exportDebug.last.preview = previewSnippet;
        alert('File trả về có vẻ không phải XLSX (xem console: window.__exportDebug.last.preview)');
        return;
      }

      // Create blob and force download (preserve existing behavior)
      const filenameMatch = contentDisp ? (contentDisp.match(/filename="?([^\"]+)"?/) || []) : [];
      const filename = filenameMatch[1] || `bao-cao-${format}-${startDate}-${endDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      const mime = contentType || (format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
      const blob = new Blob([arrayBuffer], { type: mime });
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlObj);
      console.log('[EXPORT DEBUG] downloaded file', filename, 'size', size, 'first4hex', first4hex);
      (window as any).__exportDebug.last.downloaded = { filename, size, first4hex };
    } catch (error) {
      console.error('[EXPORT DEBUG] Export error:', error);
      (window as any).__exportDebug.last.exception = String(error);
      alert('Lỗi khi xuất báo cáo. Xem console (window.__exportDebug).');
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const renderReport = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'overview':
        return <OverviewReport reportData={reportData} formatCurrency={formatCurrency} />;
      case 'revenue':
        return <RevenueReport reportData={reportData} formatCurrency={formatCurrency} />;
      case 'bookings':
        return <BookingsReport reportData={reportData} formatCurrency={formatCurrency} />;
      case 'rooms':
        return <RoomsReport reportData={reportData} formatCurrency={formatCurrency} />;
      case 'customers':
        return <CustomersReport reportData={reportData} formatCurrency={formatCurrency} />;
      default:
        return <OverviewReport reportData={reportData} formatCurrency={formatCurrency} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu báo cáo...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Không có dữ liệu báo cáo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900">Báo cáo - Thống kê</h1>
        
        {/* Export Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => exportExcelClient()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Loại báo cáo</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="overview">Tổng quan</option>
              <option value="revenue">Doanh thu</option>
              <option value="bookings">Đặt phòng</option>
              <option value="rooms">Phòng</option>
              <option value="customers">Khách hàng</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={fetchReportData}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Xem báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Render the selected report type */}
      {renderReport()}
    </div>
  );
}
