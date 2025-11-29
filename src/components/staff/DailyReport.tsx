import { useState } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Download, Calendar, TrendingUp, DollarSign, Users, Clock, CreditCard, AlertCircle, CheckCircle, Home, LogIn, LogOut, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

// @ts-ignore
pdfMake.vfs = pdfFonts.vfs;

// --- INTERFACES ---
interface Transaction {
  code: string;
  time: string;
  customerName: string;
  room: string;
  revenue: number; // Doanh thu tổng
  received: number; // Thực thu
  deposit: number; // Cọc
  refund: number; // Hoàn
  debt: number; // Nợ
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

// --- STYLES OBJECT (Inline CSS) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#374151',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  headerSubtitle: {
    color: '#6b7280',
    marginBottom: '32px',
  },
  controlCard: {
    background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    flexWrap: 'wrap',
  },
  inputGroup: {
    flex: '1',
    minWidth: '200px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#dbeafe',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #93c5fd',
    outline: 'none',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e3a8a',
    backgroundColor: '#eff6ff',
  },
  buttonPrimary: {
    backgroundColor: 'white',
    color: '#2563eb',
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    height: '46px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  kpiCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  kpiIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  kpiLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginTop: '4px',
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f9fafb',
    padding: '12px 24px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#4b5563',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '16px 24px',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
    verticalAlign: 'middle',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
};

export default function DailyReport() {
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // --- API ---
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
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER: Xác định hoạt động ---
  const getActivityName = (t: Transaction) => {
    const noteLower = (t.note || '').toLowerCase();
    if (noteLower.includes('check-in') || (t.deposit > 0 && t.revenue === 0)) return 'Check-in';
    if (noteLower.includes('check-out') || (t.revenue > 0)) return 'Check-out';
    if (noteLower.includes('hủy')) return 'Hủy đơn';
    if (t.deposit > 0) return 'Thu cọc';
    if (t.code.startsWith('TAO')) return 'Tạo đơn'; // Giả sử mã tạo đơn
    return 'Thanh toán';
  };

  const getActivityColor = (activity: string) => {
    if (activity === 'Check-in') return { bg: '#dcfce7', text: '#166534' }; // Green
    if (activity === 'Check-out') return { bg: '#ffedd5', text: '#9a3412' }; // Orange
    if (activity === 'Hủy đơn') return { bg: '#fee2e2', text: '#991b1b' }; // Red
    return { bg: '#eff6ff', text: '#1e40af' }; // Blue
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';

  // --- LOGIC TÍNH TOÁN KPI ---
  const transactions = reportData?.transactions || [];
  const summary = reportData?.summary || { totalReceived: 0 };

  const totalOrders = transactions.length;
  const totalCheckin = transactions.filter(t => getActivityName(t) === 'Check-in').length;
  const totalCheckout = transactions.filter(t => getActivityName(t) === 'Check-out').length;
  const totalCancel = transactions.filter(t => getActivityName(t) === 'Hủy đơn').length;
  
  const totalMoneyToday = summary.totalReceived;

  const TOTAL_ROOMS = 20; 
  const roomsOccupied = totalCheckin; // Logic tạm thời
  const roomsEmpty = TOTAL_ROOMS - roomsOccupied;

  // --- PDF EXPORT ---
  const handleExportPDF = () => {
    if (!reportData || transactions.length === 0) {
      toast.error('Không có dữ liệu để xuất PDF');
      return;
    }

    const exportTime = new Date().toLocaleString('vi-VN');
    const reportDateFormatted = format(new Date(reportDate), 'dd/MM/yyyy', { locale: vi });
    const hour = new Date().getHours();
    
    // Xác định Ca trực
    let caTruc = '';
    if (hour >= 6 && hour < 14) caTruc = 'Ca Sáng (06:00 - 14:00)';
    else if (hour >= 14 && hour < 22) caTruc = 'Ca Chiều (14:00 - 22:00)';
    else caTruc = 'Ca Tối (22:00 - 06:00)';

    const nhanVien = 'Nguyễn Văn A'; // Có thể lấy từ User Context

    // Bảng chi tiết (Body)
    const tableBody = [
      [
        { text: 'STT', style: 'tableHeader' },
        { text: 'Mã đơn', style: 'tableHeader' },
        { text: 'Khách hàng', style: 'tableHeader' },
        { text: 'Phòng', style: 'tableHeader' },
        { text: 'Hoạt động', style: 'tableHeader' },
        { text: 'Thời gian', style: 'tableHeader' },
        { text: 'Số tiền thu', style: 'tableHeader', alignment: 'right' },
        { text: 'Ghi chú', style: 'tableHeader' }
      ],
      ...transactions.map((t, idx) => [
        { text: idx + 1, alignment: 'center', fontSize: 9 },
        { text: t.code, color: '#2563eb', fontSize: 9, bold: true },
        { text: t.customerName, fontSize: 9 },
        { text: t.room, alignment: 'center', fontSize: 9 },
        { text: getActivityName(t), fontSize: 9, alignment: 'center' },
        { text: t.time, alignment: 'center', fontSize: 9 },
        { text: formatCurrency(t.received), alignment: 'right', bold: true, fontSize: 9 },
        { text: t.note || '', fontSize: 9, color: '#555' }
      ])
    ];

    // Bảng tổng kết (Summary)
    const summaryRows = [
      ['Tổng số đơn trong ngày', { text: totalOrders, bold: true, alignment: 'right' }],
      ['Tổng khách đến', { text: totalCheckin, color: 'green', bold: true, alignment: 'right' }],
      ['Tổng khách trả phòng', { text: totalCheckout, color: 'orange', bold: true, alignment: 'right' }],
      ['Tổng đơn hủy', { text: totalCancel, color: 'red', bold: true, alignment: 'right' }],
      ['Tổng doanh thu thu trực tiếp trong ngày', { text: formatCurrency(totalMoneyToday), bold: true, color: '#2563eb', alignment: 'right' }],
      ['Tiền tồn cuối ca (Thu trực tiếp)', { text: formatCurrency(totalMoneyToday), bold: true, alignment: 'right' }],
      ['Tình trạng phòng cuối ngày', { text: `${roomsOccupied} đang ở / ${roomsEmpty} trống`, alignment: 'right' }]
    ];

    const docDefinition = {
      content: [
        // --- HEADER ---
        { text: 'BÁO CÁO CUỐI NGÀY – GIAO CA', style: 'header' },
        
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Ngày: ', bold: true }, reportDateFormatted, '\n',
                { text: 'Ca trực: ', bold: true }, caTruc, '\n',
                { text: 'Lễ tân: ', bold: true }, nhanVien
              ]
            },
            {
              width: 'auto',
              text: `Xuất lúc: ${exportTime}`, style: 'small', alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // --- TABLE ---
        { text: 'CHI TIẾT GIAO DỊCH', style: 'sectionHeader' },
        {
          table: {
            headerRows: 1,
            // Widths: STT, Mã, Khách, Phòng, HĐ, Giờ, Tiền, Ghi chú
            widths: [25, 70, 80, 40, 60, 50, 70, '*'],
            body: tableBody
          },
          layout: {
            fillColor: function (rowIndex: number) { return (rowIndex === 0) ? '#f3f4f6' : null; },
            hLineWidth: function (i: number, node: any) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
            vLineWidth: function () { return 0; },
            hLineColor: function () { return '#d1d5db'; }
          }
        },

        // --- SUMMARY ---
        { text: '\n' },
        {
          table: {
            widths: [250, '*'], // Cột tiêu đề rộng 250, còn lại fill hết
            body: [
              [{ text: 'TỔNG KẾT CUỐI BÁO CÁO', colSpan: 2, style: 'sectionHeader', alignment: 'center', border: [false, false, false, false] }, {}],
              ...summaryRows
            ]
          },
          layout: 'lightHorizontalLines'
        },

        // --- SIGNATURE ---
        { text: '\n\n\n' },
        {
          columns: [
            { text: 'Người lập biểu', alignment: 'center', bold: true },
            { text: 'Người nhận bàn giao', alignment: 'center', bold: true },
            { text: 'Quản lý xác nhận', alignment: 'center', bold: true }
          ]
        },
        { text: '\n\n', fontSize: 8 }
      ],
      styles: {
        header: { fontSize: 18, bold: true, color: '#111827', alignment: 'center', margin: [0, 0, 0, 15] },
        sectionHeader: { fontSize: 12, bold: true, color: '#374151', margin: [0, 5, 0, 5], decoration: 'underline' },
        tableHeader: { fontSize: 9, bold: true, color: '#374151', alignment: 'center' },
        small: { fontSize: 9, color: '#6b7280', italics: true }
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 }
    };

    // @ts-ignore
    pdfMake.createPdf(docDefinition).download(`BaoCaoGiaoCa-${reportDate}.pdf`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Đang tải báo cáo...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={styles.headerTitle}>📊 Báo cáo cuối ngày</h1>
        <p style={styles.headerSubtitle}>Tổng hợp giao dịch, hoạt động và chốt ca làm việc</p>
      </div>

      {/* CONTROL BAR */}
      <div style={styles.controlCard}>
        <div style={styles.inputGroup}>
          <label style={styles.label}><Calendar size={16} style={{ display: 'inline', marginRight: '5px' }} /> Chọn ngày báo cáo</label>
          <input 
            type="date" 
            value={reportDate} 
            onChange={(e) => setReportDate(e.target.value)} 
            style={styles.input} 
          />
        </div>
        <button onClick={fetchReportData} style={styles.buttonPrimary}>
          <Clock size={18} /> Xem báo cáo
        </button>
      </div>

      {/* KPI GRID (7 Metrics) */}
      <div style={styles.kpiGrid}>
        <KPICard title="Tổng đơn xử lý" value={totalOrders} icon={<TrendingUp color="#2563eb" />} color="blue" />
        <KPICard title="Khách check-in" value={totalCheckin} icon={<LogIn color="#16a34a" />} color="green" />
        <KPICard title="Khách check-out" value={totalCheckout} icon={<LogOut color="#ea580c" />} color="orange" />
        <KPICard title="Đơn hủy" value={totalCancel} icon={<XCircle color="#dc2626" />} color="red" />
        
        <KPICard title="Tổng tiền thu" value={formatCurrency(totalMoneyToday)} icon={<DollarSign color="#2563eb" />} color="blue" isWide />
        <KPICard title="Phòng đang ở" value={roomsOccupied} icon={<Home color="#ca8a04" />} color="yellow" />
        <KPICard title="Phòng trống" value={roomsEmpty} icon={<CheckCircle color="#059669" />} color="emerald" />
      </div>

      {/* DETAIL TABLE */}
      {transactions.length > 0 && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Chi tiết giao dịch trong ngày</h3>
            <button 
              onClick={handleExportPDF} 
              style={{ ...styles.exportBtn, backgroundColor: '#2563eb', color: 'white' }}
            >
              <Download size={16} /> Xuất PDF Giao Ca
            </button>
          </div>
          
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Mã đơn</th>
                  <th style={styles.th}>Khách hàng</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Phòng</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Hoạt động</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Thời gian</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Số tiền thu</th>
                  <th style={styles.th}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => {
                  const activity = getActivityName(t);
                  const actStyle = getActivityColor(activity);
                  return (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2563eb', fontWeight: '500' }}>{t.code}</td>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{t.customerName}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{t.room}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{ ...styles.badge, backgroundColor: actStyle.bg, color: actStyle.text }}>
                          {activity}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center', color: '#6b7280' }}>{t.time}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                        {formatCurrency(t.received)}
                      </td>
                      <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.note || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>TỔNG CỘNG:</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#2563eb' }}>{formatCurrency(totalMoneyToday)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && transactions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <Calendar size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '18px', color: '#374151', fontWeight: '500' }}>Chưa có dữ liệu cho ngày này</p>
          <p style={{ color: '#6b7280' }}>Vui lòng chọn ngày khác hoặc bắt đầu tạo giao dịch mới.</p>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: KPI CARD ---
const KPICard = ({ title, value, icon, color, isWide }: any) => {
  const bgColors: any = { blue: '#eff6ff', green: '#f0fdf4', orange: '#fff7ed', red: '#fef2f2', yellow: '#fefce8', emerald: '#ecfdf5' };
  
  return (
    <div style={{ 
      ...styles.kpiCard, 
      gridColumn: isWide ? 'span 2' : 'span 1',
      borderLeft: `4px solid ${color === 'blue' ? '#2563eb' : color === 'green' ? '#16a34a' : color === 'red' ? '#dc2626' : color === 'yellow' ? '#ca8a04' : '#059669'}` 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={styles.kpiLabel}>{title}</span>
          <div style={styles.kpiValue}>{value}</div>
        </div>
        <div style={{ ...styles.kpiIconBox, backgroundColor: bgColors[color] || '#f3f4f6' }}>
          {icon}
        </div>
      </div>
    </div>
  );
};