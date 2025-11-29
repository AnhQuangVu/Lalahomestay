import { useState } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Download, Calendar, TrendingUp, Home, CheckCircle, XCircle, Users, BarChart3 } from 'lucide-react';
import { format, subDays, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

import { projectId, publicAnonKey } from '../../utils/supabase/info';

// @ts-ignore
pdfMake.vfs = pdfFonts.vfs;

// --- INTERFACES ---
interface ReceptionEvent {
  time: string;
  type: string;
  code: string;
  customer: string;
  room: string;
  note: string;
  timestamp: number;
}

interface DailyRoomStat {
  date: string;
  emptyRooms: number;
  checkouts: number;
  checkins: number;
  occupied: number;
  occupancy: number;
}

// --- STYLES OBJECT (CSS IN JS) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#374151',
  },
  headerTitle: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  headerSubtitle: {
    color: '#4b5563',
    marginBottom: '32px',
  },
  controlCard: {
    background: 'linear-gradient(to bottom right, #a855f7, #9333ea)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  controlRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'flex-end',
  },
  inputGroup: {
    flex: '1',
    minWidth: '200px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#f3e8ff',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #d8b4fe',
    outline: 'none',
    fontSize: '16px',
    fontWeight: '500',
    color: '#111827',
    boxSizing: 'border-box', // Quan trọng để padding không làm vỡ layout
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  buttonGreen: {
    backgroundColor: '#16a34a',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', // Responsive grid
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    borderRadius: '12px',
    padding: '24px',
    color: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiBox: {
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f9fafb',
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#4b5563',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    color: '#111827',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  footer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '2px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#4b5563',
  },
};

export default function StaffReports() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<DailyRoomStat[]>([]);
  const [events, setEvents] = useState<ReceptionEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // --- LOGIC FETCH DATA (Giữ nguyên) ---
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${publicAnonKey}` };
      const [reportResponse, bookingResponse] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/staff/room-report?start_date=${startDate}&end_date=${endDate}`, { headers }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/dat-phong?start_date=${startDate}&end_date=${endDate}`, { headers })
      ]);

      const reportResult = await reportResponse.json();
      const bookingResult = await bookingResponse.json();

      if (reportResult.success) setReportData(reportResult.data);
      if (bookingResult.success) processBookingEvents(bookingResult.data);
      else setEvents([]);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const processBookingEvents = (bookings: any[]) => {
    const generatedEvents: ReceptionEvent[] = [];
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);

    bookings.forEach((booking: any) => {
      const checkInDate = new Date(booking.thoi_gian_nhan);
      const checkOutDate = new Date(booking.thoi_gian_tra);
      const createdDate = new Date(booking.created_at || booking.thoi_gian_nhan);

      // Logic tạo event (Giữ nguyên logic cũ của bạn)
      if (isWithinInterval(createdDate, { start, end })) {
        generatedEvents.push({
          time: format(createdDate, 'HH:mm dd/MM'),
          type: 'Tạo đơn mới', code: booking.ma_dat,
          customer: booking.khach_hang?.ho_ten || 'Khách lẻ',
          room: booking.phong?.ma_phong || '-', note: `Kênh: ${booking.kenh_dat}`,
          timestamp: createdDate.getTime()
        });
      }
      if (booking.trang_thai !== 'da_huy' && isWithinInterval(checkInDate, { start, end })) {
        generatedEvents.push({
          time: format(checkInDate, 'HH:mm dd/MM'),
          type: 'Check-in', code: booking.ma_dat,
          customer: booking.khach_hang?.ho_ten || 'Khách lẻ',
          room: booking.phong?.ma_phong || '-',
          note: ['da_nhan_phong', 'dang_o'].includes(booking.trang_thai) ? 'Đã nhận phòng' : 'Dự kiến',
          timestamp: checkInDate.getTime()
        });
      }
      if (booking.trang_thai !== 'da_huy' && isWithinInterval(checkOutDate, { start, end })) {
        generatedEvents.push({
          time: format(checkOutDate, 'HH:mm dd/MM'),
          type: 'Check-out', code: booking.ma_dat,
          customer: booking.khach_hang?.ho_ten || 'Khách lẻ',
          room: booking.phong?.ma_phong || '-',
          note: ['da_tra_phong', 'checkout'].includes(booking.trang_thai) ? 'Đã trả phòng' : 'Dự kiến',
          timestamp: checkOutDate.getTime()
        });
      }
      if (booking.trang_thai === 'da_huy' && isWithinInterval(createdDate, { start, end })) {
        generatedEvents.push({
          time: format(createdDate, 'HH:mm dd/MM'),
          type: 'Hủy đơn', code: booking.ma_dat,
          customer: booking.khach_hang?.ho_ten || 'Khách lẻ',
          room: booking.phong?.ma_phong || '-', note: booking.ghi_chu || 'Khách hủy',
          timestamp: createdDate.getTime()
        });
      }
    });
    generatedEvents.sort((a, b) => b.timestamp - a.timestamp);
    setEvents(generatedEvents);
  };

  // --- KPI ---
  const kpiCreated = events.filter(e => e.type.includes('Tạo đơn')).length;
  const kpiCheckin = events.filter(e => e.type.includes('Check-in')).length;
  const kpiCheckout = events.filter(e => e.type.includes('Check-out')).length;
  const kpiCancel = events.filter(e => e.type.includes('Hủy')).length;

  // --- EXPORT FUNCTIONS (Logic giữ nguyên) ---
  const handleExportExcel = async () => {
    if (reportData.length === 0) return toast.error('Không có dữ liệu');
    try {
      const mod = await import('xlsx');
      const XLSX = (mod && ((mod as any).default || mod)) as any;
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `CongSuat-${startDate}.xlsx`);
      toast.success('Xuất Excel thành công!');
    } catch (err) { toast.error('Lỗi xuất Excel'); }
  };

  const handleExportPDFLeTan = () => {
    if (events.length === 0) return toast.error('Không có dữ liệu');
    const exportTime = new Date().toLocaleString('vi-VN');
    const hour = new Date().getHours();
    let caTruc = hour >= 6 && hour < 14 ? 'Ca sáng' : hour >= 14 && hour < 22 ? 'Ca chiều' : 'Ca tối';
    let timeRange = caTruc === 'Ca sáng' ? '06:00 - 14:00' : caTruc === 'Ca chiều' ? '14:00 - 22:00' : '22:00 - 06:00';
    
    // PDF Definition (Đã cập nhật theo yêu cầu trước)
    const docDefinition = {
      content: [
        { text: 'BÁO CÁO HOẠT ĐỘNG LỄ TÂN TRONG CA', style: 'header' },
        {
          columns: [
            { width: '50%', text: [{ text: 'Ca trực: ', bold: true }, caTruc, '\n', { text: 'Thời gian: ', bold: true }, `từ ${timeRange.split(' - ')[0]} đến ${timeRange.split(' - ')[1]}`] },
            { width: '50%', text: [{ text: 'Nhân viên: ', bold: true }, 'Nguyễn Văn A', '\n', { text: 'Ngày xuất: ', bold: true }, exportTime], alignment: 'right' }
          ], margin: [0, 0, 0, 20]
        },
        { text: 'CHI TIẾT HOẠT ĐỘNG', style: 'sectionHeader' },
        {
          table: {
            headerRows: 1,
            widths: [25, 60, 70, 85, '*', 35, '*'],
            body: [
              [{ text: 'STT', style: 'tableHeader' }, { text: 'Thời gian', style: 'tableHeader' }, { text: 'Hoạt động', style: 'tableHeader' }, { text: 'Mã đơn', style: 'tableHeader' }, { text: 'Tên khách', style: 'tableHeader' }, { text: 'Phòng', style: 'tableHeader' }, { text: 'Ghi chú', style: 'tableHeader' }],
              ...events.map((e, idx) => [
                { text: idx + 1, alignment: 'center' }, { text: e.time, alignment: 'center' }, e.type, { text: e.code, style: 'code' }, e.customer, { text: e.room || '-', alignment: 'center' }, { text: e.note || '-', fontSize: 9 }
              ])
            ]
          },
          layout: { fillColor: (i: number) => (i === 0 ? '#eeeeee' : null) }
        },
        { text: '\n' },
        {
          table: {
            widths: [200, '*'],
            body: [
              [{ text: 'TỔNG KẾT CUỐI CA', colSpan: 2, style: 'sectionHeader', alignment: 'center' }, {}],
              ['Tổng số hoạt động', { text: events.length, bold: true }],
              ['Số đơn tạo mới', { text: kpiCreated, color: 'blue' }],
              ['Số check-in', { text: kpiCheckin, color: 'green' }],
              ['Số check-out', { text: kpiCheckout, color: 'orange' }],
              ['Số đơn hủy', { text: kpiCancel, color: 'red' }]
            ]
          }
        },
        { text: '\n\n' },
        { text: 'Chữ ký nhân viên                                      Chữ ký quản lý', alignment: 'center', bold: true, margin: [0, 20, 0, 0] },
        { text: '\n\n\n' },
        { text: '(Ký và ghi rõ họ tên)                               (Ký và ghi rõ họ tên)', alignment: 'center', italics: true, fontSize: 9 }
      ],
      styles: {
        header: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
        sectionHeader: { fontSize: 11, bold: true, margin: [0, 10, 0, 5] },
        tableHeader: { bold: true, fontSize: 9, alignment: 'center' },
        code: { fontFamily: 'monospace', fontSize: 9, color: '#2980b9' }
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 }
    };
    // @ts-ignore
    pdfMake.createPdf(docDefinition).download(`BaoCaoLeTan-${caTruc}-${startDate}.pdf`);
  };

  // --- RENDER ---
  return (
    <div style={styles.container}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={styles.headerTitle}>📈 Báo cáo công suất & Lễ tân</h1>
        <p style={styles.headerSubtitle}>Theo dõi tình hình sử dụng phòng và hoạt động trong ca</p>
      </div>

      {/* Control Bar */}
      <div style={styles.controlCard}>
        <div style={styles.controlRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><Calendar size={16} style={{ marginRight: '8px' }} /> Từ ngày</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}><Calendar size={16} style={{ marginRight: '8px' }} /> Đến ngày</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.input} />
          </div>
          <div>
            <button onClick={fetchReportData} style={styles.buttonPrimary} disabled={loading}>
              <BarChart3 size={20} />
              {loading ? 'Đang tải...' : 'Xem báo cáo'}
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
          <div style={styles.gridContainer}>
            <div style={{ ...styles.card, background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><Home size={32} opacity={0.8} /><BarChart3 size={24} /></div>
              <div><p style={{ margin: 0, opacity: 0.9 }}>Phòng trống</p><p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0' }}>{totalEmpty}</p></div>
            </div>
            <div style={{ ...styles.card, background: 'linear-gradient(to bottom right, #ef4444, #dc2626)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><XCircle size={32} opacity={0.8} /><span style={{fontSize: '20px', fontWeight: 'bold'}}>{totalCheckouts}</span></div>
              <div><p style={{ margin: 0, opacity: 0.9 }}>Dự kiến trả</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0' }}>{(totalCheckouts/reportData.length).toFixed(1)}/ngày</p></div>
            </div>
            <div style={{ ...styles.card, background: 'linear-gradient(to bottom right, #22c55e, #16a34a)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><CheckCircle size={32} opacity={0.8} /><span style={{fontSize: '20px', fontWeight: 'bold'}}>{totalCheckins}</span></div>
              <div><p style={{ margin: 0, opacity: 0.9 }}>Dự kiến nhận</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0' }}>{(totalCheckins/reportData.length).toFixed(1)}/ngày</p></div>
            </div>
            <div style={{ ...styles.card, background: 'linear-gradient(to bottom right, #f97316, #ea580c)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><Users size={32} opacity={0.8} /><TrendingUp size={24} /></div>
              <div><p style={{ margin: 0, opacity: 0.9 }}>Đang sử dụng</p><p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0' }}>{totalOccupied}</p></div>
            </div>
            <div style={{ ...styles.card, background: 'linear-gradient(to bottom right, #10b981, #059669)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><BarChart3 size={32} opacity={0.8} /><span style={{fontSize: '20px', fontWeight: 'bold'}}>{reportData.length} ngày</span></div>
              <div><p style={{ margin: 0, opacity: 0.9 }}>Công suất TB</p><p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0' }}>{avgOccupancy}%</p></div>
            </div>
          </div>
        );
      })()}

      {/* --- SECTION: BÁO CÁO LỄ TÂN (Events) --- */}
      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>HOẠT ĐỘNG LỄ TÂN</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Danh sách check-in, check-out và tạo đơn trong khoảng thời gian này</p>
          </div>
          <button onClick={handleExportPDFLeTan} disabled={events.length === 0} style={styles.buttonPrimary}>
            <Download size={16} /> Xuất PDF Lễ tân
          </button>
        </div>

        {/* KPI Events Grid */}
        <div style={styles.kpiRow}>
          <div style={{ ...styles.kpiBox, backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>{kpiCreated}</span>
            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>ĐƠN MỚI</span>
          </div>
          <div style={{ ...styles.kpiBox, backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>{kpiCheckin}</span>
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>CHECK-IN</span>
          </div>
          <div style={{ ...styles.kpiBox, backgroundColor: '#fff7ed', borderColor: '#ffedd5' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#c2410c' }}>{kpiCheckout}</span>
            <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600' }}>CHECK-OUT</span>
          </div>
          <div style={{ ...styles.kpiBox, backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#b91c1c' }}>{kpiCancel}</span>
            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>ĐƠN HỦY</span>
          </div>
        </div>

        {/* Table Events */}
        <div style={{ ...styles.tableContainer, maxHeight: '500px', overflowY: 'auto' }}>
          {events.length > 0 ? (
            <table style={styles.table}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={styles.th}>Thời gian</th>
                  <th style={styles.th}>Hoạt động</th>
                  <th style={styles.th}>Mã đơn</th>
                  <th style={styles.th}>Khách hàng</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Phòng</th>
                  <th style={styles.th}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={styles.td}>{e.time}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: e.type.includes('Check-in') ? '#dcfce7' : e.type.includes('Check-out') ? '#ffedd5' : e.type.includes('Hủy') ? '#fee2e2' : '#dbeafe',
                        color: e.type.includes('Check-in') ? '#166534' : e.type.includes('Check-out') ? '#9a3412' : e.type.includes('Hủy') ? '#991b1b' : '#1e40af'
                      }}>
                        {e.type}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2563eb' }}>{e.code}</td>
                    <td style={{ ...styles.td, fontWeight: '500' }}>{e.customer}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{e.room}</td>
                    <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Chưa có hoạt động nào.</div>
          )}
        </div>
      </div>

      {/* --- SECTION: BẢNG CÔNG SUẤT CHI TIẾT --- */}
      <div style={styles.sectionCard}>
        <h2 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>CHI TIẾT CÔNG SUẤT THEO NGÀY</h2>
        <div style={styles.tableContainer}>
          {reportData.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ngày</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Phòng trống</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Check-out</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Check-in</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Đang ở</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Công suất</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ ...styles.td, fontWeight: '500' }}>{row.date}</td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#2563eb', fontWeight: 'bold' }}>{row.emptyRooms}</td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#dc2626' }}>{row.checkouts}</td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#16a34a' }}>{row.checkins}</td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#ea580c', fontWeight: 'bold' }}>{row.occupied}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: row.occupancy >= 80 ? '#dcfce7' : row.occupancy >= 50 ? '#fef9c3' : '#fee2e2',
                        color: row.occupancy >= 80 ? '#166534' : row.occupancy >= 50 ? '#854d0e' : '#991b1b'
                      }}>
                        {row.occupancy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu công suất.</div>
          )}
        </div>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleExportExcel} disabled={reportData.length === 0} style={styles.buttonGreen}>
            <Download size={16} /> Xuất Excel Công suất
          </button>
        </div>
      </div>

      {/* Footer */}
      {reportData.length > 0 && (
        <div style={styles.footer}>
          <div>
            <p><strong>Khoảng thời gian:</strong> {format(new Date(startDate), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(endDate), 'dd/MM/yyyy', { locale: vi })}</p>
            <p><strong>Tổng ngày:</strong> {reportData.length} ngày</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>Cơ sở:</strong> LaLa House Homestay</p>
            <p><strong>Xuất lúc:</strong> {format(new Date(), 'HH:mm:ss dd/MM/yyyy', { locale: vi })}</p>
          </div>
        </div>
      )}
    </div>
  );
}