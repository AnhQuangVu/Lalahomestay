import { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import {
  UserCheck, LogOut, Sparkles,
  FileText, User, Plus, X,
  CreditCard, MapPin, Phone, StickyNote, AlertCircle,
  Home, CheckCircle, XCircle, TrendingUp, BarChart3, PieChart as PieChartIcon,
  Edit, Save
} from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { differenceInHours } from 'date-fns';
import { format } from 'date-fns'; // Đã thêm import format
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// --- CONFIG ---
const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount || 0);

// --- INTERFACES ---
interface Room {
  id: string; number: string; concept: string; location: string;
  status: 'available' | 'occupied' | 'checkout-soon' | 'checkin-soon' | 'overdue' | 'maintenance';
  cleanStatus: 'clean' | 'dirty' | 'cleaning';
  price2h: number; priceNight: number;
  currentBooking?: {
    code: string; customerName: string; checkIn: string; checkOut: string;
    source: string; note: string; totalPrice: number; deposit: number;
  };
}

interface ReportData {
  totalRooms: number; occupiedRooms: number; availableRooms: number;
  occupancyRate: number; totalNights: number;
  topRooms: Array<{ name: string; bookings: number; revenue: number; }>;
  roomUsageDetails: Array<{
    branch: string; room: string; type: string;
    usedDays: number; availableDays: number; occupancy: number; bookings: number;
    originalRoom: Room;
  }>;
}

// --- STYLES OBJECT ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#1f2937',
    paddingBottom: '80px',
  },
  // Header
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
  
  // Filter
  filterContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' },
  filterBtn: {
    padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
    border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s',
  },

  // Grid
  gridRooms: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  
  // Room Card
  roomCard: {
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '190px',
    position: 'relative',
    backgroundColor: 'white',
  },
  roomHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  roomNumber: { fontSize: '20px', fontWeight: '800', color: '#111827', lineHeight: 1 },
  roomConcept: { fontSize: '12px', fontWeight: '500', color: '#6b7280', marginTop: '4px' },
  roomBadge: {
    padding: '2px 8px', borderRadius: '99px', fontSize: '10px',
    fontWeight: '700', textTransform: 'uppercase', border: '1px solid rgba(0,0,0,0.05)',
    backgroundColor: 'white',
  },
  roomBody: { padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  roomFooterLine: { height: '4px', width: '100%' },

  // Report Section
  reportSection: { marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: {
    borderRadius: '12px', padding: '24px', border: '1px solid',
    background: 'linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))',
  },
  chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' },
  chartCard: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  
  // Table
  tableCard: { backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  tableHeader: { padding: '24px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableContainer: { overflowX: 'auto', maxHeight: '500px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '12px 24px', textAlign: 'left', fontWeight: 'bold', color: '#4b5563', fontSize: '12px', textTransform: 'uppercase', backgroundColor: '#f3f4f6', position: 'sticky', top: 0 },
  td: { padding: '12px 24px', borderBottom: '1px solid #f3f4f6', color: '#374151' },

  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50, padding: '16px',
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden',
  },
  modalHeader: { padding: '16px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  
  // Form Elements
  input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' },
  label: { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
  btnAction: {
    width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 'bold',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'background-color 0.2s',
  },
};

// --- SUB-COMPONENT: BÁO CÁO ---
const RoomsReportSection = ({ reportData, onRowClick }: { reportData: ReportData, onRowClick: (room: Room) => void }) => {
  const occupancyData = [
    { name: 'Đang sử dụng', value: reportData.occupiedRooms, color: '#8b5cf6' },
    { name: 'Còn trống', value: reportData.availableRooms, color: '#e5e7eb' }
  ];

  return (
    <div style={styles.reportSection}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <BarChart3 size={24} color="#374151" />
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Báo cáo hiệu suất & Thống kê</h2>
      </div>

      {/* 1. KPIs */}
      <div style={styles.kpiGrid}>
        {/* Purple Card */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home color="white" size={24} /></div>
          </div>
          <p style={{ fontSize: '14px', color: '#7e22ce' }}>Tổng số phòng</p>
          <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#581c87' }}>{reportData.totalRooms}</p>
        </div>
        {/* Green Card */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle color="white" size={24} /></div>
          </div>
          <p style={{ fontSize: '14px', color: '#15803d' }}>Đang sử dụng</p>
          <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#14532d' }}>{reportData.occupiedRooms}</p>
        </div>
        {/* Gray Card */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle color="white" size={24} /></div>
          </div>
          <p style={{ fontSize: '14px', color: '#374151' }}>Còn trống</p>
          <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>{reportData.availableRooms}</p>
        </div>
        {/* Blue Card */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp color="white" size={24} /></div>
          </div>
          <p style={{ fontSize: '14px', color: '#1d4ed8' }}>Công suất</p>
          <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#1e3a8a' }}>{reportData.occupancyRate}%</p>
        </div>
      </div>

      {/* 2. Charts */}
      <div style={styles.chartGrid}>
        <div style={styles.chartCard}>
          <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><PieChartIcon size={20} color="#9ca3af"/> Tỷ lệ lấp đầy</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={20} color="#9ca3af"/> Hiệu suất doanh thu (Top 5)</h3>
          {reportData.topRooms.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topRooms} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Doanh thu" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Chưa có dữ liệu doanh thu</div>}
        </div>
      </div>

      {/* 3. Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Chi tiết trạng thái phòng</h3>
            <span style={{ fontSize: '12px', color: '#6b7280', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>Real-time</span>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Cơ sở / Phòng</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Trạng thái</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Công suất</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Đơn hiện tại</th>
              </tr>
            </thead>
            <tbody>
              {reportData.roomUsageDetails.map((room, idx) => (
                <tr 
                    key={idx} 
                    onClick={() => onRowClick(room.originalRoom)} 
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#f9fafb'}
                >
                  <td style={styles.td}>
                      <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{room.room}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{room.branch} - {room.type}</div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                      {room.occupancy === 100 ? 
                        <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '12px', fontWeight: '500', backgroundColor: '#dbeafe', color: '#1e40af' }}>Đang dùng</span> : 
                        (room.occupancy === 50 ? <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '12px', fontWeight: '500', backgroundColor: '#ffedd5', color: '#9a3412' }}>Sắp đến</span> : 
                        <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '12px', fontWeight: '500', backgroundColor: '#dcfce7', color: '#166534' }}>Trống</span>)
                      }
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>{room.occupancy}%</span>
                      <div style={{ width: '64px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', borderRadius: '99px', width: `${room.occupancy}%`,
                            backgroundColor: room.occupancy === 100 ? '#3b82f6' : (room.occupancy === 50 ? '#fb923c' : '#22c55e') 
                          }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: '500' }}>{room.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function StaffDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ number: '', concept: '', price2h: 0, priceNight: 0 });
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 15000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      setInfoForm({
        number: selectedRoom.number,
        concept: selectedRoom.concept,
        price2h: selectedRoom.price2h,
        priceNight: selectedRoom.priceNight
      });
      setIsEditingInfo(false);
    }
  }, [selectedRoom]);

  const loadRooms = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }),
        fetch(`${API_URL}/dat-phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } })
      ]);
      const [roomsData, bookingsData] = await Promise.all([roomsRes.json(), bookingsRes.json()]);

      if (!roomsData.success) { setRooms([]); return; }

      const roomsFromApi = roomsData.data || [];
      const bookingsFromApi = bookingsData.success ? (bookingsData.data || []) : [];
      const activeRooms = roomsFromApi.filter((r: any) => r.trang_thai !== 'dinh_chi');

      const mapped: Room[] = activeRooms.map((r: any) => {
        const now = new Date();
        const currentBooking = bookingsFromApi.find((b: any) => {
          if (!b || !b.id_phong || b.id_phong !== r.id) return false;
          if (['da_huy', 'da_tra', 'checkout'].includes(b.trang_thai)) return false;
          if (b.trang_thai === 'dang_o' || b.trang_thai === 'dang_dung') return true;
          const start = new Date(b.thoi_gian_nhan);
          const end = new Date(b.thoi_gian_tra);
          return now <= end && (now >= start || differenceInHours(start, now) <= 24);
        });

        const statusMap: any = { 'trong': 'available', 'dang_dung': 'occupied', 'sap_nhan': 'checkin-soon', 'sap_tra': 'checkout-soon', 'bao_tri': 'maintenance' };
        const cleanMap: any = { 'sach': 'clean', 'dang_don': 'cleaning', 'chua_don': 'dirty' };
        let derivedStatus = statusMap[r.trang_thai] || 'available';
        
        if (currentBooking) {
             const checkIn = new Date(currentBooking.thoi_gian_nhan);
             const checkOut = new Date(currentBooking.thoi_gian_tra);
             if (r.trang_thai === 'bao_tri') {
                 derivedStatus = 'maintenance';
             } else if (now >= checkIn && now <= checkOut) {
                 derivedStatus = 'occupied';
                 if (differenceInHours(checkOut, now) < 1) derivedStatus = 'checkout-soon';
             } else if (now < checkIn && differenceInHours(checkIn, now) <= 24) {
                 derivedStatus = 'checkin-soon';
             }
        }

        return {
          id: r.id, number: r.ma_phong, concept: r.loai_phong?.ten_loai || '', location: r.loai_phong?.co_so?.ten_co_so || '',
          status: derivedStatus, cleanStatus: cleanMap[r.tinh_trang_vesinh] || 'clean',
          price2h: r.loai_phong?.gia_gio || 0, priceNight: r.loai_phong?.gia_dem || 0,
          currentBooking: currentBooking ? {
            code: currentBooking.ma_dat, customerName: currentBooking.khach_hang?.ho_ten || currentBooking.ho_ten || 'Khách vãng lai',
            checkIn: currentBooking.thoi_gian_nhan, checkOut: currentBooking.thoi_gian_tra,
            source: currentBooking.kenh_dat || 'Khác', note: currentBooking.ghi_chu || '',
            totalPrice: currentBooking.tong_tien || 0, deposit: currentBooking.tien_coc || 0
          } : undefined
        } as Room;
      });
      setRooms(mapped);
    } catch (error) { console.error(error); setRooms([]); } finally { setLoading(false); }
  };

  const reportData: ReportData = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => ['occupied', 'checkout-soon'].includes(r.status)).length;
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    const roomUsageDetails = rooms.map(r => {
        const isOccupied = ['occupied', 'checkout-soon'].includes(r.status);
        return {
            branch: r.location, room: r.number, type: r.concept,
            usedDays: isOccupied ? 1 : 0, availableDays: 1,
            occupancy: isOccupied ? 100 : (r.status === 'checkin-soon' ? 50 : 0),
            bookings: r.currentBooking ? 1 : 0,
            originalRoom: r
        };
    });
    const topRooms = rooms.filter(r => r.currentBooking).map(r => ({
            name: r.number, bookings: 1, revenue: r.currentBooking?.totalPrice || 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
        totalRooms, occupiedRooms, availableRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        totalNights: occupiedRooms, topRooms, roomUsageDetails
    };
  }, [rooms]);

  const updateRoomStatusApi = async (roomId: string, status: string, cleanStatus: string) => {
    const statusMap: any = { 'available': 'trong', 'occupied': 'dang_dung', 'checkout-soon': 'sap_tra', 'checkin-soon': 'sap_nhan', 'maintenance': 'bao_tri' };
    const cleanMap: any = { 'clean': 'sach', 'cleaning': 'dang_don', 'dirty': 'chua_don' };
    await fetch(`${API_URL}/phong/${roomId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ trang_thai: statusMap[status] || 'trong', tinh_trang_vesinh: cleanMap[cleanStatus] || 'sach' })
    });
  };

  const handleUpdateRoomInfo = async () => {
    if (!selectedRoom) return;
    const toastId = toast.loading('Đang cập nhật thông tin...');
    try {
        setActionLoading(true);
        await fetch(`${API_URL}/phong/${selectedRoom.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
            body: JSON.stringify({
                ma_phong: infoForm.number,
            })
        });
        toast.success('Đã cập nhật thông tin phòng!', { id: toastId });
        setIsEditingInfo(false);
        loadRooms(); 
        setSelectedRoom(prev => prev ? ({...prev, number: infoForm.number, concept: infoForm.concept}) : null);
    } catch (e) {
        toast.error('Lỗi cập nhật', { id: toastId });
    } finally {
        setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedRoom?.currentBooking) return;
    if (!window.confirm(`Xác nhận trả phòng cho khách ${selectedRoom.currentBooking.customerName}?`)) return;
    const toastId = toast.loading('Đang xử lý...');
    try {
      setActionLoading(true);
      const bookingRes = await fetch(`${API_URL}/dat-phong/ma/${selectedRoom.currentBooking.code}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      const bookingData = await bookingRes.json();
      if (bookingData.success) {
        await Promise.all([
          fetch(`${API_URL}/dat-phong/${bookingData.data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` }, body: JSON.stringify({ trang_thai: 'da_tra', thoi_gian_tra_thuc_te: new Date().toISOString() }) }),
          updateRoomStatusApi(selectedRoom.id, 'available', 'dirty')
        ]);
        toast.success('Trả phòng thành công!', { id: toastId }); setSelectedRoom(null); loadRooms();
      } else { toast.error('Lỗi tìm đơn', { id: toastId }); }
    } catch (e) { toast.error('Lỗi hệ thống', { id: toastId }); } finally { setActionLoading(false); }
  };

  const handleCleanRoom = async () => { if (!selectedRoom) return; try { setActionLoading(true); await updateRoomStatusApi(selectedRoom.id, 'available', 'clean'); toast.success('Đã dọn xong!'); setSelectedRoom(null); loadRooms(); } catch { toast.error('Lỗi'); } finally { setActionLoading(false); } };
  const handleCheckIn = async () => { if (!selectedRoom) return; try { setActionLoading(true); await updateRoomStatusApi(selectedRoom.id, 'occupied', selectedRoom.cleanStatus); toast.success('Đã nhận phòng!'); setSelectedRoom(null); loadRooms(); } catch { toast.error('Lỗi'); } finally { setActionLoading(false); } };
  const handleShowDetail = async () => { if (!selectedRoom?.currentBooking) return; try { const res = await fetch(`${API_URL}/dat-phong/ma/${selectedRoom.currentBooking.code}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }); const data = await res.json(); if (data.success) setBookingDetail(data.data); } catch { toast.error('Lỗi'); } };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: 'Đang ở' };
      case 'available': return { bg: '#ffffff', border: '#bbf7d0', text: '#15803d', label: 'Trống' };
      case 'checkin-soon': return { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', label: 'Sắp nhận' };
      case 'checkout-soon': return { bg: '#fefce8', border: '#fef08a', text: '#a16207', label: 'Sắp trả' };
      case 'maintenance': return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563', label: 'Bảo trì' };
      default: return { bg: '#fff', border: '#e5e7eb', text: '#000', label: 'Unknown' };
    }
  };
  const filteredRooms = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', padding: '80px'}}><div style={{width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div></div>;

  return (
    <div style={styles.container}>
      <Toaster position="top-right" richColors closeButton />

      {/* HEADER */}
      <div style={styles.pageHeader}>
        <div>
            <h1 style={styles.pageTitle}>Lịch đặt phòng</h1>
            <p style={styles.pageSubtitle}>Quản lý tình trạng phòng và đơn đặt</p>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div style={styles.filterContainer}>
          {[ 
            { val: 'all', label: 'Tất cả', bg: '#1f2937' }, 
            { val: 'available', label: 'Phòng Trống', bg: '#16a34a' }, 
            { val: 'occupied', label: 'Đang ở', bg: '#2563eb' }, 
            { val: 'checkin-soon', label: 'Sắp nhận', bg: '#f97316' }, 
            { val: 'checkout-soon', label: 'Sắp trả', bg: '#eab308' }, 
            { val: 'maintenance', label: 'Bảo trì', bg: '#6b7280' } 
          ].map(btn => (
              <button 
                key={btn.val} 
                onClick={() => setFilter(btn.val)} 
                style={{
                    ...styles.filterBtn,
                    backgroundColor: filter === btn.val ? btn.bg : 'white',
                    color: filter === btn.val ? 'white' : '#4b5563',
                    borderColor: filter === btn.val ? 'transparent' : '#e5e7eb',
                    boxShadow: filter !== btn.val ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {btn.label}
              </button>
          ))}
      </div>

      {/* GRID ROOMS */}
      <div style={styles.gridRooms}>
          {filteredRooms.map(room => {
          const conf = getStatusColor(room.status);
          const isOccupied = ['occupied', 'checkout-soon'].includes(room.status);
          const isCheckin = room.status === 'checkin-soon';

          return (
              <div 
                key={room.id} 
                onClick={() => { setSelectedRoom(room); setIsEditingInfo(false); }} 
                style={{ ...styles.roomCard, backgroundColor: conf.bg, border: `1px solid ${conf.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
              
              {/* CARD HEADER */}
              <div style={{ ...styles.roomHeader, borderColor: conf.border }}>
                  <div><h3 style={styles.roomNumber}>{room.number}</h3><p style={styles.roomConcept}>{room.concept}</p></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ ...styles.roomBadge, color: conf.text }}>{conf.label}</span>
                      {room.currentBooking && <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', marginTop: '4px', textTransform: 'uppercase' }}>{room.currentBooking.source === 'facebook' ? 'FB' : room.currentBooking.source}</span>}
                  </div>
              </div>

              {/* CARD BODY */}
              <div style={styles.roomBody}>
                  {(isOccupied || isCheckin) && room.currentBooking ? (
                  <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <User size={16} color="#6b7280"/>
                          <span style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.currentBooking.customerName}</span>
                          {room.currentBooking.note && <StickyNote size={14} color="#f59e0b" style={{ marginLeft: 'auto' }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563', marginBottom: '12px', backgroundColor: 'rgba(255,255,255,0.6)', padding: '8px', borderRadius: '8px' }}>
                          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af' }}>Đến</div><div style={{ fontWeight: 'bold' }}>{format(new Date(room.currentBooking.checkIn), 'HH:mm dd/MM')}</div></div>
                          <div style={{ color: '#d1d5db' }}>➜</div>
                          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af' }}>Đi</div><div style={{ fontWeight: 'bold' }}>{format(new Date(room.currentBooking.checkOut), 'HH:mm dd/MM')}</div></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '600' }}><CreditCard size={12}/> {room.currentBooking.deposit > 0 ? `Cọc: ${formatCurrency(room.currentBooking.deposit)}` : 'Chưa cọc'}</div>
                          <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{formatCurrency(room.currentBooking.totalPrice)}</div>
                      </div>
                  </>
                  ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', borderBottom: '1px dashed #e5e7eb', paddingBottom: '4px' }}><span>2h đầu</span><span style={{ fontWeight: 'bold', color: '#374151' }}>{formatCurrency(room.price2h)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}><span>Qua đêm</span><span style={{ fontWeight: 'bold', color: '#374151' }}>{formatCurrency(room.priceNight)}</span></div>
                      {room.cleanStatus === 'dirty' && <div style={{ marginTop: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Sparkles size={12}/> Cần dọn dẹp</div>}
                  </div>
                  )}
              </div>
              {/* Color Strip */}
              <div style={{ height: '4px', width: '100%', backgroundColor: room.cleanStatus === 'dirty' ? '#ef4444' : (isOccupied ? '#3b82f6' : (isCheckin ? '#f97316' : '#22c55e')) }}></div>
              </div>
          );
          })}
      </div>

      {/* --- REPORT SECTION --- */}
      <RoomsReportSection reportData={reportData} onRowClick={(r) => { setSelectedRoom(r); setIsEditingInfo(false); }} />

      {/* MODAL ROOM DETAIL */}
      {selectedRoom && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              {isEditingInfo ? (
                  <div style={{ width: '100%', marginRight: '16px' }}>
                      <input 
                        type="text" value={infoForm.number} 
                        onChange={(e) => setInfoForm({...infoForm, number: e.target.value})}
                        style={{ ...styles.input, fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }} placeholder="Số phòng"
                      />
                      <input 
                        type="text" value={infoForm.concept} 
                        onChange={(e) => setInfoForm({...infoForm, concept: e.target.value})}
                        style={styles.input} placeholder="Loại phòng"
                      />
                  </div>
              ) : (
                  <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Phòng {selectedRoom.number}</h2>
                        <button onClick={() => setIsEditingInfo(true)} style={{ padding: '6px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9ca3af' }}><Edit size={14}/></button>
                      </div>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>{selectedRoom.concept} • {selectedRoom.location}</p>
                  </div>
              )}
              <button onClick={() => setSelectedRoom(null)} style={{ padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
            </div>

            {/* Modal Body */}
            <div style={styles.modalBody}>
                {isEditingInfo && (
                    <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '12px', border: '1px solid #fef08a' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#a16207', marginBottom: '12px', margin: 0 }}>Cập nhật thông tin</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div><label style={styles.label}>Giá 2h</label><input type="number" value={infoForm.price2h} onChange={(e) => setInfoForm({...infoForm, price2h: parseInt(e.target.value)})} style={styles.input}/></div>
                            <div><label style={styles.label}>Giá đêm</label><input type="number" value={infoForm.priceNight} onChange={(e) => setInfoForm({...infoForm, priceNight: parseInt(e.target.value)})} style={styles.input}/></div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleUpdateRoomInfo} disabled={actionLoading} style={{ ...styles.btnAction, flex: 1, backgroundColor: '#ca8a04', color: 'white' }}><Save size={14}/> Lưu</button>
                            <button onClick={() => setIsEditingInfo(false)} style={{ ...styles.btnAction, flex: 1, backgroundColor: 'white', color: '#4b5563', border: '1px solid #d1d5db' }}>Hủy</button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid', textAlign: 'center', backgroundColor: selectedRoom.cleanStatus === 'clean' ? '#f0fdf4' : '#fef2f2', borderColor: selectedRoom.cleanStatus === 'clean' ? '#dcfce7' : '#fee2e2', color: selectedRoom.cleanStatus === 'clean' ? '#15803d' : '#b91c1c' }}>
                        <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.7, margin: '0 0 4px 0' }}>Vệ sinh</p>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{selectedRoom.cleanStatus === 'clean' ? 'Sạch sẽ' : 'Cần dọn'}</p>
                    </div>
                    <div style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid', textAlign: 'center', backgroundColor: getStatusColor(selectedRoom.status).bg, borderColor: getStatusColor(selectedRoom.status).border, color: getStatusColor(selectedRoom.status).text }}>
                        <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.7, margin: '0 0 4px 0' }}>Trạng thái</p>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{getStatusColor(selectedRoom.status).label}</p>
                    </div>
                </div>

                {selectedRoom.currentBooking && (
                    <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px', border: '1px solid #dbeafe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><User size={20}/></div>
                            <div><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Khách hàng</p><p style={{ fontWeight: 'bold', color: '#111827', fontSize: '18px', margin: 0 }}>{selectedRoom.currentBooking.customerName}</p></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '12px', borderTop: '1px solid #dbeafe' }}>
                            <div><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Check-in</p><p style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px', margin: 0 }}>{format(new Date(selectedRoom.currentBooking.checkIn), 'HH:mm dd/MM')}</p></div>
                            <div><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Check-out</p><p style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px', margin: 0 }}>{format(new Date(selectedRoom.currentBooking.checkOut), 'HH:mm dd/MM')}</p></div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedRoom.cleanStatus === 'dirty' && selectedRoom.status === 'available' && <button onClick={handleCleanRoom} style={{ ...styles.btnAction, backgroundColor: '#16a34a', color: 'white' }}><Sparkles size={18}/> Xác nhận dọn xong</button>}
                    
                    {/* BUTTONS: Check-out and View Detail */}
                    {['occupied', 'checkout-soon'].includes(selectedRoom.status) && (
                        <>
                            <button onClick={handleCheckout} style={{ ...styles.btnAction, backgroundColor: '#ea580c', color: 'white' }}><LogOut size={18}/> Trả phòng</button>
                            <button onClick={handleShowDetail} style={{ ...styles.btnAction, backgroundColor: 'white', color: '#374151', border: '1px solid #e5e7eb' }}><FileText size={18}/> Xem chi tiết đơn</button>
                        </>
                    )}

                    {selectedRoom.status === 'checkin-soon' && <button onClick={handleCheckIn} style={{ ...styles.btnAction, backgroundColor: '#0d9488', color: 'white' }}><UserCheck size={18}/> Khách nhận phòng</button>}
                    {selectedRoom.status === 'available' && selectedRoom.cleanStatus === 'clean' && <button onClick={() => setShowBookingForm(true)} style={{ ...styles.btnAction, backgroundColor: '#2563eb', color: 'white' }}><Plus size={18}/> Tạo đơn mới</button>}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BOOKING DETAIL */}
      {bookingDetail && (
        <div style={{ ...styles.modalOverlay, zIndex: 60 }}>
            <div style={{ ...styles.modalContent, overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#1f2937', padding: '20px', color: 'white' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><FileText size={18}/> Chi tiết đơn đặt</h3>
                    <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', fontFamily: 'monospace' }}>#{bookingDetail.ma_dat}</p>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}><User size={20}/></div>
                        <div><p style={{ fontWeight: 'bold', color: '#111827', margin: 0 }}>{bookingDetail.khach_hang?.ho_ten || bookingDetail.ho_ten}</p><p style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}><Phone size={12}/> {bookingDetail.khach_hang?.sdt || bookingDetail.sdt}</p></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px 0', borderTop: '1px dashed #e5e7eb', borderBottom: '1px dashed #e5e7eb', fontSize: '14px', marginBottom: '20px' }}>
                        <div><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#9ca3af', margin: 0 }}>Phòng</p><div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {bookingDetail.phong?.ma_phong || selectedRoom?.number}</div></div>
                        <div><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#9ca3af', margin: 0 }}>Trạng thái</p><span style={{ color: '#2563eb', fontWeight: 'bold', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>{bookingDetail.trang_thai}</span></div>
                        <div><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#9ca3af', margin: 0 }}>Check-in</p><div style={{ fontWeight: '600' }}>{format(new Date(bookingDetail.thoi_gian_nhan), 'HH:mm dd/MM')}</div></div>
                        <div><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#9ca3af', margin: 0 }}>Check-out</p><div style={{ fontWeight: '600' }}>{format(new Date(bookingDetail.thoi_gian_tra), 'HH:mm dd/MM')}</div></div>
                    </div>
                    <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', marginBottom: '8px' }}><span>Tổng tiền</span><span style={{ fontWeight: 'bold', color: '#111827' }}>{formatCurrency(bookingDetail.tong_tien || 0)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}><span>Đã cọc</span><span style={{ fontWeight: 'bold', color: '#16a34a' }}>{formatCurrency(bookingDetail.tien_coc || 0)}</span></div>
                    </div>
                    {bookingDetail.ghi_chu && <div style={{ marginBottom: '20px' }}><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#9ca3af', margin: 0 }}>Ghi chú</p><p style={{ fontSize: '14px', color: '#4b5563', fontStyle: 'italic', display: 'flex', gap: '4px', margin: 0 }}><StickyNote size={14}/> {bookingDetail.ghi_chu}</p></div>}
                    <button onClick={() => setBookingDetail(null)} style={{ ...styles.btnAction, backgroundColor: '#f3f4f6', color: '#374151' }}>Đóng</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL CREATE BOOKING PLACEHOLDER */}
      {showBookingForm && (
        <div style={{ ...styles.modalOverlay, zIndex: 60 }}>
            <div style={{ ...styles.modalContent, padding: '24px', textAlign: 'center' }}>
                <AlertCircle size={48} color="#3b82f6" style={{ margin: '0 auto 16px auto' }}/>
                <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px', margin: 0 }}>Tạo đơn mới</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Vui lòng chuyển sang trang "Tạo Booking" trên thanh menu để thực hiện thao tác này.</p>
                <button onClick={() => setShowBookingForm(false)} style={{ ...styles.btnAction, backgroundColor: '#f3f4f6', color: '#374151' }}>Đóng</button>
            </div>
        </div>
      )}
    </div>
  );
}