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

      // build per-type sheets với styling
      const pushSheet = (name: string, aoa: Array<Array<string | number>>, options?: any) => {
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Set column widths
        const colWidths = options?.colWidths || [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
        ws['!cols'] = colWidths;

        // Merge cells for headers if specified
        if (options?.merges) {
          ws['!merges'] = options.merges;
        }

        XLSX.utils.book_append_sheet(wb, ws, name);
      };

      const formatCurrencyForExcel = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
      };

      if (type === 'overview') {
        const rows: Array<Array<string | number>> = [];

        // Header section
        rows.push(['LALA HOUSE - BÁO CÁO TỔNG QUAN']);
        rows.push([`Kỳ báo cáo: ${startDate} đến ${endDate}`]);
        rows.push([`Thời gian xuất: ${exportTime}`]);
        rows.push([]);

        // KPIs Summary với format đẹp
        rows.push(['CHỈ SỐ KINH DOANH CHÍNH', '', '', '']);
        rows.push(['Chỉ số', 'Giá trị', 'Đơn vị', 'Ghi chú']);
        rows.push(['Tổng doanh thu', reportData.totalRevenue, '₫', formatCurrencyForExcel(reportData.totalRevenue)]);
        rows.push(['Tổng đặt phòng', reportData.totalBookings, 'booking', '']);
        rows.push(['Tổng khách hàng', reportData.totalCustomers, 'khách', '']);
        rows.push(['Khách hàng mới', reportData.newCustomers, 'khách', '']);
        rows.push(['Tiền cọc CSVC', reportData.totalDeposit, '₫', formatCurrencyForExcel(reportData.totalDeposit)]);
        rows.push([]);

        // Phòng
        rows.push(['THỐNG KÊ PHÒNG', '', '', '']);
        rows.push(['Chỉ số', 'Giá trị', 'Phần trăm', '']);
        rows.push(['Tổng số phòng', reportData.totalRooms, '100%', '']);
        rows.push(['Phòng đang sử dụng', reportData.occupiedRooms, `${reportData.occupancyRate}%`, '']);
        rows.push(['Phòng trống', reportData.availableRooms, `${100 - reportData.occupancyRate}%`, '']);
        rows.push([]);

        // Đặt phòng
        rows.push(['CHI TIẾT ĐẶT PHÒNG', '', '', '']);
        rows.push(['Loại', 'Số lượng', 'Tỷ lệ', '']);
        rows.push(['Đã xác nhận', reportData.confirmedBookings, `${((reportData.confirmedBookings / reportData.totalBookings) * 100).toFixed(1)}%`, '']);
        rows.push(['Đã nhận phòng', reportData.checkedInBookings, `${((reportData.checkedInBookings / reportData.totalBookings) * 100).toFixed(1)}%`, '']);
        rows.push(['Đã trả phòng', reportData.checkedOutBookings, `${((reportData.checkedOutBookings / reportData.totalBookings) * 100).toFixed(1)}%`, '']);
        rows.push(['Đã hủy', reportData.cancelledBookings, `${reportData.cancelRate.toFixed(1)}%`, '']);
        rows.push([]);

        // Doanh thu
        rows.push(['PHÂN TÍCH DOANH THU', '', '', '']);
        rows.push(['Chỉ số', 'Giá trị (₫)', '', '']);
        rows.push(['Doanh thu TB/booking', reportData.averageBookingValue, '', formatCurrencyForExcel(reportData.averageBookingValue)]);
        rows.push(['Doanh thu TB/đêm', reportData.averageNightlyRate, '', formatCurrencyForExcel(reportData.averageNightlyRate)]);
        rows.push(['Tổng số đêm', reportData.totalNights, 'đêm', '']);

        pushSheet('Tổng quan', rows, {
          colWidths: [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 30 }],
          merges: [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Date range
            { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // KPIs header
            { s: { r: 13, c: 0 }, e: { r: 13, c: 3 } }, // Phòng header
            { s: { r: 18, c: 0 }, e: { r: 18, c: 3 } }, // Đặt phòng header
            { s: { r: 24, c: 0 }, e: { r: 24, c: 3 } }  // Doanh thu header
          ]
        });
      }

      if (type === 'revenue') {
        const rows: Array<Array<string | number>> = [];

        // Header
        rows.push(['LALA HOUSE - BÁO CÁO DOANH THU']);
        rows.push([`Kỳ báo cáo: ${startDate} đến ${endDate}`]);
        rows.push([`Thời gian xuất: ${exportTime}`]);
        rows.push([]);

        // Tổng quan doanh thu
        rows.push(['TỔNG QUAN DOANH THU', '', '', '']);
        rows.push(['Chỉ số', 'Giá trị', '', 'Định dạng']);
        rows.push(['Tổng doanh thu', reportData.totalRevenue, '', formatCurrencyForExcel(reportData.totalRevenue)]);
        rows.push(['Doanh thu TB/booking', reportData.averageBookingValue, '', formatCurrencyForExcel(reportData.averageBookingValue)]);
        rows.push(['Doanh thu TB/đêm', reportData.averageNightlyRate, '', formatCurrencyForExcel(reportData.averageNightlyRate)]);
        rows.push(['Tỷ lệ tăng trưởng', reportData.growthRate, '%', '']);
        rows.push(['Tổng số booking', reportData.totalBookings, 'booking', '']);
        rows.push(['Tổng số đêm', reportData.totalNights, 'đêm', '']);
        rows.push([]);

        // Doanh thu theo ngày
        rows.push(['DOANH THU THEO NGÀY', '', '', '']);
        rows.push(['Ngày', 'Doanh thu (₫)', 'Số booking', 'Doanh thu TB']);

        let totalDaily = 0;
        let totalBookingsDaily = 0;

        (reportData.dailyRevenue || []).forEach((d: any) => {
          totalDaily += d.revenue;
          totalBookingsDaily += d.bookings;
          const avgDaily = d.bookings > 0 ? Math.round(d.revenue / d.bookings) : 0;
          rows.push([
            d.date,
            d.revenue,
            d.bookings,
            formatCurrencyForExcel(avgDaily)
          ]);
        });

        // Tổng cộng
        rows.push([]);
        rows.push(['TỔNG CỘNG', totalDaily, totalBookingsDaily, formatCurrencyForExcel(Math.round(totalDaily / totalBookingsDaily))]);

        pushSheet('Doanh thu', rows, {
          colWidths: [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }],
          merges: [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
            { s: { r: 13, c: 0 }, e: { r: 13, c: 3 } }
          ]
        });
      }

      if (type === 'bookings') {
        const rows: Array<Array<string | number>> = [];

        // Header
        rows.push(['LALA HOUSE - BÁO CÁO ĐẶT PHÒNG']);
        rows.push([`Kỳ báo cáo: ${startDate} đến ${endDate}`]);
        rows.push([`Thời gian xuất: ${exportTime}`]);
        rows.push([]);

        // Tổng quan
        rows.push(['TỔNG QUAN ĐẶT PHÒNG', '', '', '']);
        rows.push(['Chỉ số', 'Số lượng', 'Tỷ lệ (%)', '']);
        rows.push(['Tổng đặt phòng', reportData.totalBookings, '100.0', '']);
        rows.push(['Đã xác nhận', reportData.confirmedBookings, ((reportData.confirmedBookings / reportData.totalBookings) * 100).toFixed(1), '']);
        rows.push(['Đã nhận phòng', reportData.checkedInBookings, ((reportData.checkedInBookings / reportData.totalBookings) * 100).toFixed(1), '']);
        rows.push(['Đã trả phòng', reportData.checkedOutBookings, ((reportData.checkedOutBookings / reportData.totalBookings) * 100).toFixed(1), '']);
        rows.push(['Đã hủy', reportData.cancelledBookings, reportData.cancelRate.toFixed(1), '⚠️ Tỷ lệ hủy']);
        rows.push([]);

        // Trạng thái chi tiết
        rows.push(['PHÂN BỔ THEO TRẠNG THÁI', '', '', '']);
        rows.push(['Trạng thái', 'Số lượng', 'Tỷ lệ (%)', 'Biểu đồ']);

        (reportData.bookingStatus || []).forEach((s: any) => {
          const percentage = ((s.count / reportData.totalBookings) * 100).toFixed(1);
          const barChart = '█'.repeat(Math.round(s.count / reportData.totalBookings * 20));
          rows.push([s.status, s.count, percentage, barChart]);
        });

        rows.push([]);

        // Hiệu suất
        rows.push(['ĐÁNH GIÁ HIỆU SUẤT', '', '', '']);
        rows.push(['Tiêu chí', 'Giá trị', 'Đánh giá', '']);
        rows.push(['Tỷ lệ hủy', reportData.cancelRate.toFixed(1) + '%', reportData.cancelRate < 10 ? '✓ Tốt' : reportData.cancelRate < 20 ? '⚠️ Trung bình' : '✗ Cần cải thiện', '']);
        rows.push(['Tỷ lệ xác nhận', ((reportData.confirmedBookings / reportData.totalBookings) * 100).toFixed(1) + '%', '✓ Tracking', '']);
        rows.push(['Tỷ lệ hoàn thành', ((reportData.checkedOutBookings / reportData.totalBookings) * 100).toFixed(1) + '%', '✓ Tracking', '']);

        pushSheet('Đặt phòng', rows, {
          colWidths: [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }],
          merges: [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
            { s: { r: 12, c: 0 }, e: { r: 12, c: 3 } },
            { s: { r: 12 + (reportData.bookingStatus?.length || 0) + 2, c: 0 }, e: { r: 12 + (reportData.bookingStatus?.length || 0) + 2, c: 3 } }
          ]
        });
      }

      if (type === 'rooms') {
        const rows: Array<Array<string | number>> = [];

        // Header
        rows.push(['LALA HOUSE - BÁO CÁO PHÒNG']);
        rows.push([`Kỳ báo cáo: ${startDate} đến ${endDate}`]);
        rows.push([`Thời gian xuất: ${exportTime}`]);
        rows.push([]);

        // Tổng quan phòng
        rows.push(['TỔNG QUAN PHÒNG', '', '', '']);
        rows.push(['Chỉ số', 'Số lượng', 'Tỷ lệ (%)', 'Trạng thái']);
        rows.push(['Tổng số phòng', reportData.totalRooms, '100.0', '📊 Tổng']);
        rows.push(['Phòng đang sử dụng', reportData.occupiedRooms, reportData.occupancyRate, '🔴 Đang dùng']);
        rows.push(['Phòng trống', reportData.availableRooms, (100 - reportData.occupancyRate).toFixed(1), '🟢 Trống']);
        rows.push([]);

        // Đánh giá tỷ lệ sử dụng
        rows.push(['ĐÁNH GIÁ TỶ LỆ SỬ DỤNG', '', '', '']);
        rows.push(['Tiêu chí', 'Giá trị', 'Đánh giá', '']);
        const occupancyStatus = reportData.occupancyRate >= 80 ? '✓ Rất tốt' :
          reportData.occupancyRate >= 60 ? '✓ Tốt' :
            reportData.occupancyRate >= 40 ? '⚠️ Trung bình' : '✗ Cần cải thiện';
        rows.push(['Tỷ lệ sử dụng phòng', reportData.occupancyRate + '%', occupancyStatus, '']);
        rows.push(['Tổng số đêm', reportData.totalNights, 'đêm', '']);
        rows.push(['Đêm TB/phòng', (reportData.totalNights / reportData.totalRooms).toFixed(1), 'đêm', '']);
        rows.push([]);

        // Top phòng
        rows.push(['TOP PHÒNG DOANH THU CAO', '', '', '']);
        rows.push(['Phòng', 'Số lượt đặt', 'Doanh thu (₫)', 'Doanh thu TB/lượt']);

        (reportData.topRooms || []).forEach((r: any, index: number) => {
          const avgPerBooking = r.bookings > 0 ? Math.round(r.revenue / r.bookings) : 0;
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
          rows.push([
            medal + ' ' + r.name,
            r.bookings,
            r.revenue,
            formatCurrencyForExcel(avgPerBooking)
          ]);
        });

        pushSheet('Phòng', rows, {
          colWidths: [{ wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 25 }],
          merges: [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
            { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
            { s: { r: 15, c: 0 }, e: { r: 15, c: 3 } }
          ]
        });
      }

      if (type === 'customers') {
        const rows: Array<Array<string | number>> = [];

        // Header
        rows.push(['LALA HOUSE - BÁO CÁO KHÁCH HÀNG']);
        rows.push([`Kỳ báo cáo: ${startDate} đến ${endDate}`]);
        rows.push([`Thời gian xuất: ${exportTime}`]);
        rows.push([]);

        // Tổng quan khách hàng
        rows.push(['TỔNG QUAN KHÁCH HÀNG', '', '', '']);
        rows.push(['Chỉ số', 'Số lượng', 'Tỷ lệ (%)', 'Ghi chú']);
        rows.push(['Tổng khách hàng', reportData.totalCustomers, '100.0', 'Tổng cộng']);
        rows.push(['Khách hàng mới', reportData.newCustomers, ((reportData.newCustomers / reportData.totalCustomers) * 100).toFixed(1), '🆕 Trong kỳ này']);
        rows.push(['Khách hàng cũ', reportData.totalCustomers - reportData.newCustomers, (((reportData.totalCustomers - reportData.newCustomers) / reportData.totalCustomers) * 100).toFixed(1), '🔄 Quay lại']);
        rows.push([]);

        // Phân tích tăng trưởng
        rows.push(['PHÂN TÍCH TĂNG TRƯỞNG', '', '', '']);
        rows.push(['Tiêu chí', 'Giá trị', 'Đánh giá', '']);
        const newCustomerRate = (reportData.newCustomers / reportData.totalCustomers) * 100;
        const growthStatus = newCustomerRate >= 30 ? '✓ Tăng trưởng tốt' :
          newCustomerRate >= 15 ? '✓ Ổn định' : '⚠️ Cần chú ý';
        rows.push(['Tỷ lệ khách mới', newCustomerRate.toFixed(1) + '%', growthStatus, '']);
        rows.push(['Booking TB/khách', (reportData.totalBookings / reportData.totalCustomers).toFixed(1), 'booking', '']);
        rows.push(['Doanh thu TB/khách', Math.round(reportData.totalRevenue / reportData.totalCustomers), formatCurrencyForExcel(Math.round(reportData.totalRevenue / reportData.totalCustomers)), '']);
        rows.push([]);

        // Nguồn đặt phòng
        rows.push(['NGUỒN ĐẶT PHÒNG', '', '', '']);
        rows.push(['Kênh', 'Số lượng', 'Tỷ lệ (%)', 'Biểu đồ']);

        const totalSources = (reportData.bookingSources || []).reduce((sum: number, s: any) => sum + s.count, 0);
        (reportData.bookingSources || []).forEach((s: any) => {
          const percentage = totalSources > 0 ? ((s.count / totalSources) * 100).toFixed(1) : '0.0';
          const barChart = '█'.repeat(Math.round((s.count / totalSources) * 20));
          rows.push([s.source, s.count, percentage, barChart]);
        });

        rows.push([]);
        rows.push(['TỔNG CỘNG', totalSources, '100.0', '']);

        pushSheet('Khách hàng', rows, {
          colWidths: [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 30 }],
          merges: [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
            { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
            { s: { r: 15, c: 0 }, e: { r: 15, c: 3 } }
          ]
        });
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
