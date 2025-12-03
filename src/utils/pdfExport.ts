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

// 2. REPORT DOANH THU (Revenue) - ĐÃ XÓA PHÂN TÍCH, CHỈ CÒN DANH SÁCH
const buildRevenueContent = (data: any) => {
  const content: any[] = [];
  
  // Bảng chi tiết các đơn trong kỳ
  if (Array.isArray(data.orders) && data.orders.length > 0) {
    content.push(createSectionHeader('Danh sách chi tiết các đơn trong kỳ'));
    
    const orderRows = data.orders.map((order: any, idx: number) => {
      // Chỉ lấy ngày/tháng (dd/mm) cho gọn
      const shortCheckin = order.checkin ? order.checkin.substring(0, 5) : '-';
      const shortCheckout = order.checkout ? order.checkout.substring(0, 5) : '-';
      
      return [
        { text: idx + 1, alignment: 'center' },
        { text: order.branch || '-', alignment: 'left' },
        { text: order.code || '-', alignment: 'left' },
        { text: order.customer || 'Khách vãng lai', bold: true },
        { text: order.room || '-', alignment: 'center' },
        { text: shortCheckin, alignment: 'center' },
        { text: shortCheckout, alignment: 'center' },
        { text: formatCurrency(order.total), alignment: 'right' }
      ];
    });

    content.push({
      table: {
        headerRows: 1,
        dontBreakRows: true,
        // Căn chỉnh lại độ rộng cột cho đẹp trên khổ A4
        widths: [20, 60, 50, '*', 35, 35, 35, 65],
        body: [
          [
            'STT', 'Cơ sở', 'Mã đơn', 'Khách hàng', 'Phòng', 'Vào', 'Ra', 'Tổng tiền'
          ].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0', alignment: 'center', fontSize: 8 })),
          ...orderRows
        ]
      },
      layout: {
        hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#e0e0e0',
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
      fontSize: 8,
      margin: [0, 0, 0, 10]
    });
  } else {
    content.push({ text: 'Không có dữ liệu đơn hàng trong kỳ này.', italics: true, alignment: 'center', margin: [0, 20] });
  }

  // Tổng kết cuối report
  content.push(createSectionHeader('Tổng kết doanh thu'));
  content.push({
    table: {
      widths: ['*', '*'],
      body: [
        ['Tổng số đơn', data.totalBookings],
        ['Tổng doanh thu', formatCurrency(data.totalRevenue)],
        ['Doanh thu trung bình/đơn', formatCurrency(data.averageBookingValue)]
      ]
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 10]
  });

  return content;
};

// 3. REPORT PHÒNG (Rooms)
const buildRoomsContent = (data: any) => {
    const content: any[] = [];

    // Tiêu đề section
    content.push(createSectionHeader('BÁO CÁO CÔNG SUẤT PHÒNG'));

    // KPI tổng quan
    content.push(createKPIGrid([
      { label: 'TỔNG SỐ PHÒNG', value: data.totalRooms },
      { label: 'ĐANG SỬ DỤNG', value: data.occupiedRooms },
      { label: 'PHÒNG TRỐNG', value: data.availableRooms },
      { label: 'CÔNG SUẤT TB', value: formatPercent(data.occupancyRate) }
    ]));

    // Bảng chi tiết công suất phòng
    content.push(createSectionHeader('Bảng chi tiết công suất phòng'));
    const detailsRows = (data.roomUsageDetails || []).map((room: any, idx: number) => [
      idx + 1,
      room.branch || '-',
      `${room.room}${room.type ? ' (' + room.type + ')' : ''}`,
      room.usedDays,
      room.availableDays,
      { text: formatPercent(room.occupancy), alignment: 'center' },
      { stack: [
        { text: formatPercent(room.occupancy), alignment: 'center' },
        drawProgressBar(room.occupancy, '#8b5cf6')
      ], alignment: 'center' },
      room.bookings
    ]);
    content.push({
      table: {
        headerRows: 1,
        widths: [30, 60, 80, 50, 50, 50, 70, 50],
        body: [
          ['STT', 'Cơ sở', 'Phòng / Loại phòng', 'Số ngày sử dụng', 'Số ngày khả dụng', 'Công suất (%)', 'Thanh %', 'Số lượt đặt'].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0' })),
          ...detailsRows
        ]
      },
      layout: 'lightHorizontalLines',
      fontSize: 9
    });

    // Tổng kết cuối report
    content.push(createSectionHeader('Tổng kết công suất phòng'));
    // Công suất trung bình toàn cơ sở
    const avgOccupancy = data.roomUsageDetails && data.roomUsageDetails.length > 0
      ? (data.roomUsageDetails.reduce((sum: number, r: any) => sum + r.occupancy, 0) / data.roomUsageDetails.length)
      : 0;
    // Phòng cao nhất/thấp nhất
    let maxRoom = null, minRoom = null;
    if (data.roomUsageDetails && data.roomUsageDetails.length > 0) {
      maxRoom = data.roomUsageDetails.reduce((a: any, b: any) => (a.occupancy > b.occupancy ? a : b));
      minRoom = data.roomUsageDetails.reduce((a: any, b: any) => (a.occupancy < b.occupancy ? a : b));
    }
    // Tổng số phòng được sử dụng trong kỳ
    const usedRoomsCount = data.roomUsageDetails ? data.roomUsageDetails.filter((r: any) => r.usedDays > 0).length : 0;
    content.push({
      table: {
      widths: ['*', '*'],
      body: [
        ['Công suất trung bình toàn cơ sở', formatPercent(avgOccupancy)],
        ['Phòng/loại phòng có công suất cao nhất', maxRoom ? `${maxRoom.room}${maxRoom.type ? ' (' + maxRoom.type + ')' : ''} - ${formatPercent(maxRoom.occupancy)}` : '-'],
        ['Phòng/loại phòng có công suất thấp nhất', minRoom ? `${minRoom.room}${minRoom.type ? ' (' + minRoom.type + ')' : ''} - ${formatPercent(minRoom.occupancy)}` : '-'],
        ['Tổng số phòng được sử dụng trong kỳ', usedRoomsCount]
      ]
      },
      layout: 'lightHorizontalLines',
      margin: [0,0,0,10]
    });

    return content;
  }

// 4. REPORT KHÁCH HÀNG (Customers)
const buildCustomersContent = (data: any) => {
  const content: any[] = [];
  
  // --- TÍNH TOÁN DỮ LIỆU CÒN THIẾU TẠI FRONTEND ---
  const customerList = data.customersList || [];
  const topCustomerPeriod = customerList.length > 0 ? customerList[0] : null;
  const topCustomerOverall = customerList.length > 0 
    ? [...customerList].sort((a: any, b: any) => b.totalBookings - a.totalBookings)[0]
    : null;

  // KPI Header
  const newRate = data.totalCustomers ? (data.newCustomers / data.totalCustomers) * 100 : 0;
  content.push(createSectionHeader('Phân tích khách hàng'));
  content.push(createKPIGrid([
    { label: 'TỔNG KHÁCH', value: data.totalCustomers },
    { label: 'KHÁCH MỚI', value: data.newCustomers, subtext: `(${formatPercent(newRate)})` },
    { label: 'KHÁCH CŨ', value: data.totalCustomers - data.newCustomers },
    { label: 'DOANH THU/KHÁCH', value: formatCurrency(data.totalCustomers ? Math.round(data.totalRevenue/data.totalCustomers) : 0) }
  ]));

  // Bảng danh sách khách hàng chi tiết (Layout chuẩn A4)
  content.push(createSectionHeader('Danh sách khách hàng tiêu biểu trong kỳ'));
  
  // Chỉ lấy Top 50 khách để tránh file PDF quá nặng
  const displayList = customerList.slice(0, 50); 

  const customerRows = displayList.map((c: any, idx: number) => [
    idx + 1,
    { text: c.name || '-', bold: true }, // Tên
    c.phone || '-',                      // SĐT
    c.email || '-',                      // Email
    { text: c.bookingsInPeriod || 0, alignment: 'center' }, // Đặt trong kỳ
    { text: c.totalBookings || 0, alignment: 'center' },    // Tích lũy
    { text: c.lastStayDate || '-', alignment: 'center', fontSize: 9 } // Ngày check-in cuối
  ]);

  content.push({
    table: {
      headerRows: 1,
      // widths: [STT, Tên, SĐT, Email, Kỳ, Tổng, Ngày]
      widths: [25, '*', 75, 90, 50, 50, 65], 
      body: [
        [
          'STT', 'Tên khách hàng', 'Số điện thoại', 'Email', 'Đơn kỳ', 'Tổng đơn', 'Gần nhất'
        ].map(t => ({ text: t, bold: true, fillColor: '#f0f0f0', fontSize: 9 })),
        ...customerRows
      ]
    },
    layout: 'lightHorizontalLines',
    fontSize: 9
  });
  
  if (customerList.length > 50) {
    content.push({ text: `...và còn ${customerList.length - 50} khách hàng khác.`, italics: true, fontSize: 9, margin: [0, 5, 0, 0] });
  }

  // Tổng kết cuối report
  content.push(createSectionHeader('Tổng kết khách hàng'));
  content.push({
    table: {
      widths: ['*', '*'],
      body: [
        ['Tổng số khách trong kỳ', data.totalCustomers],
        ['Số khách mới', data.newCustomers],
        ['Số khách quay lại', data.totalCustomers - data.newCustomers],
        [
            'Khách đặt nhiều nhất trong kỳ', 
            topCustomerPeriod 
                ? `${topCustomerPeriod.name} (${topCustomerPeriod.bookingsInPeriod} lượt)` 
                : '-'
        ],
        [
            'Khách thân thiết nhất (Tích lũy)', 
            topCustomerOverall 
                ? `${topCustomerOverall.name} (${topCustomerOverall.totalBookings} lượt)` 
                : '-'
        ]
      ]
    },
    layout: 'lightHorizontalLines',
    margin: [0,0,0,10]
  });

  // Nguồn khách (Booking Sources)
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