import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// @ts-ignore
pdfMake.vfs = pdfFonts.vfs;

// --- Helper Functions ---
const formatCurrency = (val: any) => {
  const num = Number(val);
  return Number.isFinite(num) ? num.toLocaleString('vi-VN') + ' ₫' : '0 ₫';
};

const formatPercent = (val: any) => {
  const num = Number(val);
  return Number.isFinite(num) ? num.toFixed(1) + '%' : '0%';
};

// Tạo tiêu đề section đẹp mắt
const createSectionHeader = (text: string) => ({
  text: text.toUpperCase(),
  style: 'sectionHeader',
  margin: [0, 15, 0, 8]
});

// Tạo KPI Card (Hiển thị chỉ số dạng lưới)
const createKPIGrid = (items: { label: string; value: string | number; subtext?: string; color?: string }[]) => {
  return {
    columns: items.map(item => ({
      stack: [
        { text: item.label, style: 'kpiLabel' },
        { text: item.value, style: 'kpiValue', color: item.color || '#2c3e50' },
        item.subtext ? { text: item.subtext, style: 'kpiSubtext' } : {}
      ],
      style: 'kpiCard'
    })),
    columnGap: 10,
    margin: [0, 0, 0, 15]
  };
};

// Vẽ thanh biểu đồ đơn giản (Data Bar)
const drawProgressBar = (percent: number, color: string = '#3498db') => {
  const width = Math.min(Math.max(percent, 0), 100);
  return {
    canvas: [
      {
        type: 'rect',
        x: 0, y: 0, w: width * 1.5, h: 8, // Scale width cho dễ nhìn
        color: color
      }
    ]
  };
};

// --- Report Builders ---

// 1. REPORT TỔNG QUAN (Overview)
const buildOverviewContent = (data: any) => {
  const content: any[] = [];

  // KPI Chính
  content.push(createSectionHeader('Chỉ số kinh doanh chính'));
  content.push(createKPIGrid([
    { label: 'TỔNG DOANH THU', value: formatCurrency(data.totalRevenue), color: '#27ae60' },
    { label: 'TỔNG ĐẶT PHÒNG', value: data.totalBookings + ' lượt' },
    { label: 'KHÁCH HÀNG', value: data.totalCustomers + ' khách' },
    { label: 'TIỀN CỌC', value: formatCurrency(data.totalDeposit) }
  ]));

  // KPI Phụ (Hiệu suất)
  content.push(createSectionHeader('Hiệu suất vận hành'));
  const occRate = Number(data.occupancyRate || 0);
  const cancelRate = Number(data.cancelRate || 0);
  
  content.push({
    table: {
      widths: ['*', 'auto', 'auto', '*'],
      body: [
        [
          { text: 'Chỉ số', bold: true },
          { text: 'Giá trị', bold: true },
          { text: 'Biểu đồ', bold: true },
          { text: 'Đánh giá', bold: true }
        ],
        ['Tỷ lệ lấp đầy phòng', formatPercent(occRate), drawProgressBar(occRate, '#2980b9'), occRate > 60 ? 'Tốt' : 'Cần cải thiện'],
        ['Tỷ lệ hủy phòng', formatPercent(cancelRate), drawProgressBar(cancelRate, '#e74c3c'), cancelRate < 10 ? 'Tốt' : 'Cao'],
        ['Doanh thu TB/Đơn', formatCurrency(data.averageBookingValue), '', '-'],
        ['Doanh thu TB/Đêm', formatCurrency(data.averageNightlyRate), '', '-']
      ]
    },
    layout: 'lightHorizontalLines'
  });

  return content;
};

// 2. REPORT DOANH THU (Revenue)
const buildRevenueContent = (data: any) => {
  const content: any[] = [];
  
  // Tổng quan doanh thu
  content.push(createSectionHeader('Phân tích tài chính'));
  content.push(createKPIGrid([
    { label: 'DOANH THU TỔNG', value: formatCurrency(data.totalRevenue), color: '#27ae60' },
    { label: 'TB MỖI ĐÊM', value: formatCurrency(data.averageNightlyRate) },
    { label: 'TĂNG TRƯỞNG', value: formatPercent(data.growthRate), color: data.growthRate >= 0 ? 'green' : 'red' },
    { label: 'TỔNG SỐ ĐÊM', value: data.totalNights }
  ]));

  // Chi tiết theo ngày
  content.push(createSectionHeader('Chi tiết doanh thu theo ngày'));
  const dailyRows = (data.dailyRevenue || []).map((d: any) => [
    d.date,
    { text: formatCurrency(d.revenue), alignment: 'right' },
    { text: d.bookings, alignment: 'center' },
    { text: formatCurrency(d.bookings ? Math.round(d.revenue/d.bookings) : 0), alignment: 'right' }
  ]);

  content.push({
    table: {
      headerRows: 1,
      widths: ['auto', '*', 'auto', '*'],
      body: [
        ['Ngày', 'Doanh thu', 'Số booking', 'TB/Booking'].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0' })),
        ...dailyRows,
        // Dòng tổng kết
        [
            { text: 'TỔNG CỘNG', bold: true }, 
            { text: formatCurrency(data.totalRevenue), bold: true, alignment: 'right' },
            { text: data.totalBookings, bold: true, alignment: 'center' }, 
            ''
        ]
      ]
    },
    layout: 'lightHorizontalLines'
  });

  return content;
};

// 3. REPORT PHÒNG (Rooms)
const buildRoomsContent = (data: any) => {
    const content: any[] = [];

    // KPI Phòng
    content.push(createSectionHeader('Tổng quan phòng'));
    content.push(createKPIGrid([
        { label: 'TỔNG SỐ PHÒNG', value: data.totalRooms },
        { label: 'ĐANG SỬ DỤNG', value: data.occupiedRooms, color: '#e67e22' },
        { label: 'PHÒNG TRỐNG', value: data.availableRooms, color: '#27ae60' },
        { label: 'CÔNG SUẤT', value: formatPercent(data.occupancyRate) }
    ]));

    // Top Phòng
    content.push(createSectionHeader('Xếp hạng hiệu quả phòng'));
    const roomRows = (data.topRooms || []).map((r: any, idx: number) => {
        let medal = '';
        if (idx === 0) medal = '🥇 ';
        if (idx === 1) medal = '🥈 ';
        if (idx === 2) medal = '🥉 ';
        
        return [
            medal + r.name,
            { text: r.bookings, alignment: 'center' },
            { text: formatCurrency(r.revenue), alignment: 'right', color: '#27ae60', bold: true },
            drawProgressBar((r.revenue / (data.totalRevenue || 1)) * 100, '#2ecc71') // Thanh % doanh thu đóng góp
        ];
    });

    content.push({
        table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 100],
            body: [
                ['Tên phòng', 'Số lượt đặt', 'Doanh thu', 'Tỷ trọng'].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0' })),
                ...roomRows
            ]
        },
        layout: 'lightHorizontalLines'
    });

    return content;
}

// 4. REPORT KHÁCH HÀNG (Customers)
const buildCustomersContent = (data: any) => {
    const content: any[] = [];
    
    // KPI
    const newRate = data.totalCustomers ? (data.newCustomers / data.totalCustomers) * 100 : 0;
    content.push(createSectionHeader('Phân tích khách hàng'));
    content.push(createKPIGrid([
        { label: 'TỔNG KHÁCH', value: data.totalCustomers },
        { label: 'KHÁCH MỚI', value: data.newCustomers, subtext: `(${formatPercent(newRate)})` },
        { label: 'KHÁCH CŨ', value: data.totalCustomers - data.newCustomers },
        { label: 'DOANH THU/KHÁCH', value: formatCurrency(data.totalCustomers ? Math.round(data.totalRevenue/data.totalCustomers) : 0) }
    ]));

    // Nguồn khách
    content.push(createSectionHeader('Nguồn đặt phòng'));
    const totalSources = (data.bookingSources || []).reduce((sum:any, s:any) => sum + s.count, 0);
    
    const sourceRows = (data.bookingSources || []).map((s: any) => {
        const percent = totalSources ? (s.count / totalSources) * 100 : 0;
        return [
            s.source,
            { text: s.count, alignment: 'center' },
            { text: formatPercent(percent), alignment: 'right' },
            drawProgressBar(percent, '#9b59b6')
        ];
    });

    content.push({
        table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 150],
            body: [
                ['Kênh đặt phòng', 'Số lượng', 'Tỷ lệ', 'Biểu đồ'].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0' })),
                ...sourceRows
            ]
        },
        layout: 'lightHorizontalLines'
    });

    return content;
}

// 5. REPORT BOOKINGS (Đặt phòng)
const buildBookingsContent = (data: any) => {
    const content: any[] = [];
    
    // KPI
    content.push(createSectionHeader('Tổng quan đặt phòng'));
    content.push(createKPIGrid([
        { label: 'TỔNG BOOKING', value: data.totalBookings },
        { label: 'ĐÃ CHECK-IN', value: data.checkedInBookings },
        { label: 'ĐÃ CHECK-OUT', value: data.checkedOutBookings },
        { label: 'ĐÃ HỦY', value: data.cancelledBookings, color: '#c0392b' }
    ]));

    // Trạng thái chi tiết
    content.push(createSectionHeader('Phân bổ trạng thái'));
    const statusRows = (data.bookingStatus || []).map((s: any) => {
        const percent = data.totalBookings ? (s.count / data.totalBookings) * 100 : 0;
        return [
            s.status,
            { text: s.count, alignment: 'center' },
            formatPercent(percent),
            drawProgressBar(percent, '#f1c40f')
        ];
    });

    content.push({
        table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 150],
            body: [
                ['Trạng thái', 'Số lượng', 'Tỷ lệ', 'Biểu đồ'].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0' })),
                ...statusRows
            ]
        },
        layout: 'lightHorizontalLines'
    });
    
    return content;
}

// --- MAIN EXPORT FUNCTION ---

export const exportReportPDF = ({ reportData, reportType, startDate, endDate }: any) => {
  const exportTime = new Date().toLocaleString('vi-VN');

  // Xác định nội dung dựa trên reportType
  let bodyContent: any[] = [];
  let title = '';

  switch (reportType) {
    case 'overview':
        title = 'BÁO CÁO TỔNG QUAN';
        bodyContent = buildOverviewContent(reportData);
        break;
    case 'revenue':
        title = 'BÁO CÁO DOANH THU';
        bodyContent = buildRevenueContent(reportData);
        break;
    case 'bookings':
        title = 'BÁO CÁO ĐẶT PHÒNG';
        bodyContent = buildBookingsContent(reportData);
        break;
    case 'rooms':
        title = 'BÁO CÁO HIỆU SUẤT PHÒNG';
        bodyContent = buildRoomsContent(reportData);
        break;
    case 'customers':
        title = 'BÁO CÁO KHÁCH HÀNG';
        bodyContent = buildCustomersContent(reportData);
        break;
    default:
        title = 'BÁO CÁO';
        bodyContent = buildOverviewContent(reportData);
  }

  const docDefinition = {
    content: [
      // HEADER CHUNG
      { text: 'LALA HOUSE MANAGER', style: 'brand', alignment: 'center', margin: [0, 0, 0, 2] },
      { text: title, style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
      {
        columns: [
          { width: '*', text: `Kỳ báo cáo: ${startDate} - ${endDate}`, style: 'meta' },
          { width: 'auto', text: `Xuất lúc: ${exportTime}`, style: 'meta', alignment: 'right' }
        ],
        margin: [0, 0, 0, 20]
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }] },
      
      // NỘI DUNG CHÍNH (Đã build ở trên)
      ...bodyContent,
      
      // FOOTER
      { text: '\n\n' },
      { text: 'Báo cáo được tạo tự động từ hệ thống quản lý Lala House.', style: 'footer', alignment: 'center', color: '#7f8c8d', fontSize: 9 }
    ],
    
    // STYLE DEFINITIONS
    styles: {
      brand: { fontSize: 10, color: '#7f8c8d', letterSpacing: 1 },
      header: { fontSize: 18, bold: true, color: '#2c3e50' },
      sectionHeader: { fontSize: 12, bold: true, color: '#34495e', decoration: 'underline', decorationStyle: 'dotted' },
      meta: { fontSize: 10, color: '#555' },
      kpiCard: { fontSize: 10, alignment: 'center', margin: [0, 5, 0, 5] },
      kpiLabel: { fontSize: 9, color: '#7f8c8d', bold: true },
      kpiValue: { fontSize: 14, bold: true, margin: [0, 2, 0, 2] },
      kpiSubtext: { fontSize: 8, color: '#95a5a6', italics: true },
      tableHeader: { bold: true, fontSize: 10, color: 'black' }
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10
    }
  };

  // @ts-ignore
  pdfMake.createPdf(docDefinition).download(`BaoCao-${reportType}-${startDate}.pdf`);
};