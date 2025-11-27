import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.vfs;

// --- Helper Functions ---

function safeMargin(arr: any) {
  if (!Array.isArray(arr)) return [0, 0, 0, 0];
  return arr.map(x => Number.isFinite(x) ? x : 0);
}

function safeWidths(arr: any[]) {
  return arr.map(x => (typeof x === 'number' || x === 'auto' || x === '*') ? x : '*');
}

function sanitizeCell(cell: any) {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'number') return Number.isFinite(cell) ? String(cell) : '0';
  if (typeof cell === 'string') return cell;
  if (cell instanceof Date) return cell.toLocaleDateString('vi-VN');
  if (typeof cell === 'object') {
    if (cell.text !== undefined) {
      cell.text = String(cell.text || '');
    }
    return cell;
  }
  return String(cell);
}

function formatCurrency(val: any) {
  const num = Number(val);
  return Number.isFinite(num) ? num.toLocaleString('vi-VN') + ' ₫' : '0 ₫';
}

function formatDate(dateString: string) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateString;
    }
}

function getReportTypeLabel(type: string) {
  switch (type) {
    case 'overview': return 'Tổng quan';
    case 'revenue': return 'Doanh thu';
    case 'bookings': return 'Danh sách Đặt phòng'; // Updated label
    case 'rooms': return 'Danh sách Phòng';
    case 'occupancy': return 'Công suất phòng';
    case 'customers': return 'Khách hàng';
    default: return type.toUpperCase();
  }
}

function translateStatus(status: string) {
    const map: any = {
        'cho_coc': 'Chờ cọc',
        'da_coc': 'Đã cọc',
        'da_nhan_phong': 'Đã nhận',
        'dang_o': 'Đang ở',
        'da_tra_phong': 'Đã trả',
        'da_tra': 'Đã trả',
        'da_tt': 'Đã thanh toán',
        'da_huy': 'Đã hủy',
        'huy': 'Hủy'
    };
    return map[status] || status;
}

// --- Table Builders ---

// 1. Bảng Doanh thu (Revenue)
function buildRevenueDetailTable(data: any) {
  const rows = [
    ['STT', 'Tên phòng', 'Số lượt đặt', 'Doanh thu', 'TB/lượt'].map(t => sanitizeCell({ text: t, bold: true, fillColor: '#eeeeee' }))
  ];

  // API reports thường trả về topRooms hoặc roomsRevenue
  const rooms = Array.isArray(data.topRooms) ? data.topRooms : (Array.isArray(data.rooms) ? data.rooms : []);
  
  if (rooms.length > 0) {
    rooms.forEach((room: any, idx: number) => {
      const bookings = Number(room.bookings || 0);
      const revenue = Number(room.revenue || 0);
      const avg = bookings > 0 ? Math.round(revenue / bookings) : 0;

      rows.push([
        idx + 1,
        room.name || room.roomName || 'Không tên',
        bookings,
        formatCurrency(revenue),
        formatCurrency(avg)
      ].map(c => sanitizeCell(c)));
    });
    
    // Tổng cộng
    const totalRev = rooms.reduce((acc: number, curr: any) => acc + (Number(curr.revenue) || 0), 0);
    const totalBook = rooms.reduce((acc: number, curr: any) => acc + (Number(curr.bookings) || 0), 0);
    
    rows.push([
        { text: 'Tổng cộng', bold: true, colSpan: 2 }, '',
        { text: totalBook, bold: true },
        { text: formatCurrency(totalRev), bold: true },
        ''
    ].map(c => sanitizeCell(c)));

  } else {
    rows.push(['-', 'Không có dữ liệu doanh thu', '-', '-', '-'].map(c => sanitizeCell(c)));
  }

  return rows;
}

// 2. Bảng Đặt phòng (Bookings) - MỚI THÊM
function buildBookingDetailTable(data: any) {
    const rows = [
        ['STT', 'Mã Đặt', 'Khách hàng', 'Phòng', 'Ngày nhận', 'Ngày trả', 'Tổng tiền', 'Trạng thái']
        .map(t => sanitizeCell({ text: t, bold: true, fontSize: 9, fillColor: '#eeeeee' }))
    ];

    // Xử lý nếu data là mảng (từ /dat-phong) hoặc object chứa mảng (từ /reports)
    const list = Array.isArray(data) ? data : (Array.isArray(data.bookings) ? data.bookings : (Array.isArray(data.data) ? data.data : []));

    if (list.length === 0) {
        rows.push([{ text: 'Không có dữ liệu đặt phòng trong khoảng thời gian này', colSpan: 8, alignment: 'center' }, '', '', '', '', '', '', '']);
    } else {
        list.forEach((item: any, idx: number) => {
            // Lấy tên khách từ object khach_hang hoặc string phẳng
            const cusName = item.khach_hang?.ho_ten || item.customerName || 'Khách lẻ';
            // Lấy tên phòng
            const roomName = item.phong?.ma_phong || item.roomName || item.room || 'Chưa xếp';
            
            rows.push([
                idx + 1,
                { text: item.ma_dat || item.code || '', fontSize: 9 },
                { text: cusName, fontSize: 9 },
                { text: roomName, fontSize: 9 },
                { text: formatDate(item.thoi_gian_nhan || item.checkIn), fontSize: 9 },
                { text: formatDate(item.thoi_gian_tra || item.checkOut), fontSize: 9 },
                { text: formatCurrency(item.tong_tien || item.totalAmount || 0), fontSize: 9, alignment: 'right' },
                { text: translateStatus(item.trang_thai || item.status), fontSize: 9 }
            ].map(c => sanitizeCell(c)));
        });
    }
    return rows;
}

// 3. Bảng Khách hàng (Customers)
function buildCustomerDetailTable(data: any) {
  const rows = [
    ['STT', 'Họ tên', 'SĐT', 'Email', 'SL Đặt', 'Chi tiêu'].map(t => sanitizeCell({ text: t, bold: true, fillColor: '#eeeeee' }))
  ];
  
  const list = Array.isArray(data.customers) ? data.customers : (Array.isArray(data) ? data : []);
  
  if (list.length === 0) {
      rows.push(['-', 'Không có dữ liệu', '-', '-', '-', '-'].map(c => sanitizeCell(c)));
  } else {
    list.forEach((cus: any, idx: number) => {
      rows.push([
        idx + 1,
        cus.ho_ten || cus.name || '',
        cus.sdt || cus.phone || '',
        cus.email || '',
        cus.totalBookings || 0,
        formatCurrency(cus.totalSpent || 0)
      ].map(c => sanitizeCell(c)));
    });
  }
  return rows;
}

// 4. Bảng Công suất (Occupancy)
function buildOccupancyDetailTable(data: any) {
  const rows = [
    ['STT', 'Phòng', 'Ngày SD', 'Ngày KD', 'Công suất (%)'].map(t => sanitizeCell({ text: t, bold: true, fillColor: '#eeeeee' }))
  ];
  const list = Array.isArray(data.occupancyDetails) ? data.occupancyDetails : [];
  
  if (list.length === 0) {
     rows.push(['-', 'Không có dữ liệu', '-', '-', '-'].map(c => sanitizeCell(c)));
  } else {
    list.forEach((item: any, idx: number) => {
      rows.push([
        idx + 1,
        item.room || item.name || '',
        item.usedDays || 0,
        item.availableDays || 0,
        (item.occupancyRate || 0) + '%'
      ].map(c => sanitizeCell(c)));
    });
  }
  return rows;
}

// --- Main Export Function ---

export function exportReportPDF({ reportData, reportType, startDate, endDate }: { reportData: any, reportType: string, startDate: string, endDate: string }) {
  const exportTime = new Date().toLocaleString('vi-VN');
  
  // 1. Chuẩn hóa dữ liệu đầu vào (Quan trọng)
  // Nếu API trả về { success: true, data: [...] }, ta cần lấy phần .data
  let safeData = reportData || {};
  if (safeData.data && typeof safeData.data === 'object') {
      safeData = safeData.data;
  }

  // Debug để xem dữ liệu thực tế vào PDF là gì (bật F12 console browser)
  console.log('PDF Export Data Normalized:', safeData);

  let content: any[] = [
    { text: 'LALA HOUSE - BÁO CÁO', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
    {
      columns: [
        { width: '*', text: [{ text: 'Loại báo cáo: ', bold: true }, getReportTypeLabel(reportType)] },
        { width: 'auto', text: [{ text: 'Ngày xuất: ', bold: true }, exportTime], alignment: 'right' }
      ],
      margin: [0, 0, 0, 5]
    },
    {
      text: [{ text: 'Kỳ báo cáo: ', bold: true }, `${startDate} - ${endDate}`],
      margin: [0, 0, 0, 15]
    },
  ];

  // 2. Xác định cấu trúc bảng dựa trên reportType
  let tableBody: any[][] = [];
  let colWidths: any[] = [];
  let orientation: 'portrait' | 'landscape' = 'portrait'; // Mặc định dọc

  switch (reportType) {
      case 'revenue':
          tableBody = buildRevenueDetailTable(safeData);
          colWidths = ['auto', '*', 'auto', 'auto', 'auto']; // 5 cột
          break;
          
      case 'bookings':
      case 'dat-phong': // Handle cả trường hợp key là tiếng Việt nếu có
          orientation = 'landscape'; // Xoay ngang vì bảng này nhiều cột
          tableBody = buildBookingDetailTable(safeData);
          // STT, Mã, Khách, Phòng, Nhận, Trả, Tiền, Trạng thái
          colWidths = ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto']; 
          break;

      case 'occupancy':
          tableBody = buildOccupancyDetailTable(safeData);
          colWidths = ['auto', '*', 'auto', 'auto', 'auto'];
          break;

      case 'customers':
      case 'khach-hang':
          tableBody = buildCustomerDetailTable(safeData);
          colWidths = ['auto', '*', 'auto', 'auto', 'auto', 'auto'];
          break;
          
      case 'rooms':
          // Tận dụng bảng revenue nhưng chỉ hiển thị thông tin cơ bản nếu cần
          tableBody = buildRevenueDetailTable(safeData);
          colWidths = ['auto', '*', 'auto', 'auto', 'auto'];
          break;

      default:
          // Fallback cho Overview hoặc data lạ
          tableBody = [[sanitizeCell('Không có mẫu hiển thị cho loại báo cáo này')]];
          colWidths = ['*'];
          break;
  }

  // 3. Đẩy bảng vào content
  content.push({
    table: {
      headerRows: 1,
      widths: safeWidths(colWidths),
      body: tableBody
    },
    layout: {
      fillColor: function (rowIndex: number) { return rowIndex === 0 ? '#dddddd' : null; }, // Header màu xám
      hLineWidth: function (i: number, node: any) { return (i === 0 || i === node.table.body.length) ? 1 : 1; },
      vLineWidth: function (i: number, node: any) { return 0; }, // Bỏ kẻ dọc cho thoáng
      hLineColor: function (i: number, node: any) { return '#aaaaaa'; },
      paddingLeft: function(i: number) { return 4; },
      paddingRight: function(i: number) { return 4; },
      paddingTop: function(i: number) { return 4; },
      paddingBottom: function(i: number) { return 4; },
    }
  });

  // 4. Tổng hợp footer (nếu cần)
  if (reportType === 'revenue' && safeData.totalRevenue) {
       content.push({
           text: `Tổng doanh thu toàn kỳ: ${formatCurrency(safeData.totalRevenue)}`,
           bold: true,
           margin: [0, 10, 0, 0],
           alignment: 'right'
       });
  }

  const docDefinition = {
    pageOrientation: orientation,
    content,
    styles: {
      header: { fontSize: 18, bold: true, color: '#2c3e50' },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      tableHeader: { bold: true, fontSize: 10, color: 'black' }
    },
    defaultStyle: {
      font: 'Roboto', // Đảm bảo bạn đã import font Roboto cho tiếng Việt
      fontSize: 10
    }
  };

  // @ts-ignore
  pdfMake.createPdf(docDefinition).download(`BaoCao-${reportType}-${startDate}.pdf`);
}