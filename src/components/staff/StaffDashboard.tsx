import { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import {
  UserCheck, LogOut, Sparkles,
  FileText, User, Plus, X,
  CreditCard, MapPin, Phone, StickyNote, AlertCircle,
  Clock, Ban, Check, Image as ImageIcon,
  Home, CheckCircle, XCircle, TrendingUp
} from 'lucide-react';
import { differenceInMinutes, format, isValid, isFuture, isPast } from 'date-fns';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// --- CONFIG ---
const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount || 0);

// --- INTERFACES ---
interface Room {
  id: string; number: string; concept: string; location: string;
  status: 'available' | 'occupied' | 'checkout-soon' | 'checkin-soon' | 'overdue' | 'maintenance' | 'pending';
  cleanStatus: 'clean' | 'dirty' | 'cleaning';
  price2h: number; priceNight: number;
  currentBooking?: {
    id: string;
    code: string; customerName: string; checkIn: string; checkOut: string;
    source: string; note: string; totalPrice: number; deposit: number;
    status: string;
    cccdTruoc?: string; cccdSau?: string;
  };
}

// --- STYLES OBJECT ---
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '24px 16px', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#1f2937', paddingBottom: '80px' },
  
  // Header
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
  
  // Filter
  filterContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' },
  filterBtn: { padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s' },
  
  // Grid Rooms - Giảm kích thước min vì không có ảnh
  gridRooms: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  
  // Room Card Design (Text Only)
  roomCard: {
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '140px', // Giảm chiều cao tối thiểu
    position: 'relative',
    backgroundColor: 'white',
    border: '1px solid #f3f4f6',
  },
  
  roomTop: {
    padding: '16px 16px 8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
  },
  
  roomNumberLarge: { fontSize: '28px', fontWeight: '800', color: '#111827', lineHeight: 1 },
  roomConceptSmall: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' },

  roomContent: { padding: '0 16px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end' },
  
  infoRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4b5563' },
  priceTag: { backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' },
  
  statusBar: { padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600', borderTop: '1px solid #f3f4f6' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginRight: '6px' },

  // Modal Styles (Giữ nguyên)
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' },
  modalContent: { backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' },
  modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' },
  label: { display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '6px', fontWeight: '500' },
  btnAction: { width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' },
  
  cccdContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' },
  cccdBox: { height: '120px', width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', position: 'relative' },
  cccdImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cccdLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' },
  noCccd: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px', backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '8px' },
  
  paymentSection: { padding: '16px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' },
  confirmBtn: { flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', backgroundColor: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  rejectBtn: { flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  
  pendingBanner: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#ca8a04', color: 'white', fontSize: '10px', fontWeight: '800', textAlign: 'center', padding: '4px', zIndex: 10, letterSpacing: '0.5px' },
};

// --- MAIN COMPONENT ---
export default function StaffDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form States
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ number: '', concept: '', price2h: 0, priceNight: 0 });
  const [actionLoading, setActionLoading] = useState(false);
  
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ type: 'approve' | 'reject', bookingId: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- DATA FETCHING LOGIC ---
  const loadRooms = useCallback(async () => {
    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` }, signal: controller.signal }),
        fetch(`${API_URL}/dat-phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` }, signal: controller.signal })
      ]);

      if (!roomsRes.ok || !bookingsRes.ok) throw new Error('API Error');
      const [roomsData, bookingsData] = await Promise.all([roomsRes.json(), bookingsRes.json()]);

      if (!roomsData.success) { setRooms([]); return; }

      const roomsFromApi = roomsData.data || [];
      const bookingsFromApi = bookingsData.success ? (bookingsData.data || []) : [];
      const activeRooms = roomsFromApi.filter((r: any) => r.trang_thai !== 'dinh_chi');

      const mapped: Room[] = activeRooms.map((r: any) => {
        const now = new Date();
        const relevantBookings = bookingsFromApi.filter((b: any) => b.id_phong === r.id && !['da_huy', 'da_tra', 'checkout'].includes(b.trang_thai));
        
        let activeBooking = relevantBookings.find((b: any) => {
            if (!b.thoi_gian_nhan || !b.thoi_gian_tra) return false;
            const start = new Date(b.thoi_gian_nhan);
            const end = new Date(b.thoi_gian_tra);
            return isValid(start) && isValid(end) && now >= start && now <= end;
        });

        const futureBookings = relevantBookings.filter((b: any) => {
             if (!b.thoi_gian_nhan) return false;
             return new Date(b.thoi_gian_nhan) > now;
        }).sort((a: any, b: any) => new Date(a.thoi_gian_nhan).getTime() - new Date(b.thoi_gian_nhan).getTime());
        const nextBooking = futureBookings[0];

        let derivedStatus = 'available';
        let displayBooking = null;

        if (r.trang_thai === 'bao_tri') {
            derivedStatus = 'maintenance';
        } else if (activeBooking) {
            displayBooking = activeBooking;
            derivedStatus = 'occupied';
            const end = new Date(activeBooking.thoi_gian_tra);
            if (differenceInMinutes(end, now) <= 120 && differenceInMinutes(end, now) > -60) {
                derivedStatus = 'checkout-soon';
            }
        } else if (nextBooking) {
             const start = new Date(nextBooking.thoi_gian_nhan);
             const minutesUntilCheckin = differenceInMinutes(start, now);
             if (minutesUntilCheckin <= 1440 && minutesUntilCheckin >= 0) {
                 derivedStatus = 'checkin-soon';
                 displayBooking = nextBooking;
             }
             if (nextBooking.trang_thai === 'cho_coc' && derivedStatus === 'available') {
                 derivedStatus = 'pending';
                 displayBooking = nextBooking;
             }
        }

        if (derivedStatus === 'available' && !displayBooking) {
             const pendingBooking = relevantBookings.find((b: any) => b.trang_thai === 'cho_coc');
             if (pendingBooking) {
                 derivedStatus = 'pending';
                 displayBooking = pendingBooking;
             }
        }

        const cleanMap: any = { 'sach': 'clean', 'dang_don': 'cleaning', 'chua_don': 'dirty' };

        return {
          id: r.id, number: r.ma_phong, concept: r.loai_phong?.ten_loai || '', location: r.loai_phong?.co_so?.ten_co_so || '',
          status: derivedStatus as any, cleanStatus: cleanMap[r.tinh_trang_vesinh] || 'clean',
          price2h: r.loai_phong?.gia_gio || 0, priceNight: r.loai_phong?.gia_dem || 0,
          currentBooking: displayBooking ? {
            id: displayBooking.id,
            code: displayBooking.ma_dat, customerName: displayBooking.khach_hang?.ho_ten || 'Khách lẻ',
            checkIn: displayBooking.thoi_gian_nhan, checkOut: displayBooking.thoi_gian_tra,
            source: displayBooking.kenh_dat || 'Khác', note: displayBooking.ghi_chu || '',
            totalPrice: displayBooking.tong_tien || 0, deposit: displayBooking.tien_coc || 0,
            status: displayBooking.trang_thai,
            cccdTruoc: displayBooking.khach_hang?.cccd_mat_truoc,
            cccdSau: displayBooking.khach_hang?.cccd_mat_sau
          } : undefined
        };
      });
      setRooms(mapped);
    } catch (error: any) { 
        if (error.name !== 'AbortError') console.error("Load rooms error", error); 
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 15000);
    return () => { clearInterval(interval); if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [loadRooms]);

  useEffect(() => {
    if (selectedRoom) {
      setInfoForm({ number: selectedRoom.number, concept: selectedRoom.concept, price2h: selectedRoom.price2h, priceNight: selectedRoom.priceNight });
      setIsEditingInfo(false);
      if (selectedRoom.currentBooking) handleShowDetail(selectedRoom.currentBooking.code);
      else setBookingDetail(null);
    }
  }, [selectedRoom]);

  const updateRoomStatusApi = async (roomId: string, status: string, cleanStatus: string) => {
    const statusMap: any = { 'available': 'trong', 'occupied': 'dang_dung', 'checkout-soon': 'sap_tra', 'checkin-soon': 'sap_nhan', 'maintenance': 'bao_tri' };
    const cleanMap: any = { 'clean': 'sach', 'cleaning': 'dang_don', 'dirty': 'chua_don' };
    await fetch(`${API_URL}/phong/${roomId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ trang_thai: statusMap[status] || 'trong', tinh_trang_vesinh: cleanMap[cleanStatus] || 'sach' })
    });
  };

  const handleUpdateRoomInfo = async () => { /* ... */ };

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
  
  const handleShowDetail = async (bookingCode: string) => { try { const res = await fetch(`${API_URL}/dat-phong/ma/${bookingCode}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }); const data = await res.json(); if (data.success) setBookingDetail(data.data); } catch { } };

  const handleProcessBooking = async () => {
    if (!showConfirmDialog) return;
    const { type, bookingId } = showConfirmDialog;
    setActionLoading(true);
    try {
        const status = type === 'approve' ? 'da_coc' : 'da_huy';
        const noteUpdate = type === 'reject' ? (bookingDetail?.ghi_chu ? `${bookingDetail.ghi_chu} [Đã từ chối]` : '[Đã từ chối]') : undefined;
        const body: any = { trang_thai: status };
        if (noteUpdate) body.ghi_chu = noteUpdate;
        const response = await fetch(`${API_URL}/dat-phong/${bookingId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
            body: JSON.stringify(body)
        });
        const result = await response.json();
        if (result.success) {
            toast.success(type === 'approve' ? 'Đã xác nhận thanh toán!' : 'Đã từ chối đơn!');
            setShowConfirmDialog(null); setSelectedRoom(null); loadRooms(); 
        } else { toast.error('Lỗi: ' + result.error); }
    } catch { toast.error('Lỗi kết nối'); } finally { setActionLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: 'Đang ở' };
      case 'available': return { bg: '#ffffff', border: '#e5e7eb', text: '#374151', label: 'Trống' };
      case 'checkin-soon': return { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', label: 'Sắp nhận' };
      case 'checkout-soon': return { bg: '#fefce8', border: '#fef08a', text: '#a16207', label: 'Sắp trả' };
      case 'pending': return { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', label: 'Chưa thanh toán' };
      case 'maintenance': return { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280', label: 'Bảo trì' };
      default: return { bg: '#fff', border: '#e5e7eb', text: '#000', label: 'Unknown' };
    }
  };
  
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
            { val: 'available', label: 'Trống', bg: '#ffffff' }, 
            { val: 'occupied', label: 'Đang ở', bg: '#2563eb' }, 
            { val: 'pending', label: 'Chưa thanh toán', bg: '#d97706' }, 
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
                    boxShadow: filter !== btn.val ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    border: btn.val === 'available' && filter !== 'available' ? '1px solid #e5e7eb' : undefined
                }}
              >
                {btn.label}
              </button>
          ))}
      </div>

      {/* GRID ROOMS (TEXT ONLY) */}
      <div style={styles.gridRooms}>
          {rooms.map(room => {
          const conf = getStatusColor(room.status);
          const isOccupied = ['occupied', 'checkout-soon', 'pending', 'checkin-soon'].includes(room.status); 
          const isDimmed = filter !== 'all' && room.status !== filter; 

          return (
              <div 
                key={room.id} 
                onClick={() => { setSelectedRoom(room); setIsEditingInfo(false); }} 
                style={{ 
                    ...styles.roomCard, 
                    borderColor: room.status === 'pending' ? '#fcd34d' : '#f3f4f6',
                    opacity: isDimmed ? 0.3 : 1,
                    filter: isDimmed ? 'grayscale(0.8)' : 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = isDimmed ? 'none' : 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
              
              {room.status === 'pending' && <div style={styles.pendingBanner}>⚠ CHƯA THANH TOÁN</div>}

              {/* Header Card: Số phòng + Status */}
              <div style={styles.roomTop}>
                  <div>
                      <div style={styles.roomNumberLarge}>{room.number}</div>
                      <div style={styles.roomConceptSmall}>{room.concept}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                       <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '20px', backgroundColor: conf.bg, color: conf.text, border: `1px solid ${conf.border}` }}>
                          {conf.label}
                       </span>
                       {room.cleanStatus === 'dirty' && <div style={{marginTop: 6, fontSize: 11, color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent:'flex-end', gap: 4}}>
                           <Sparkles size={12}/> Dơ
                       </div>}
                  </div>
              </div>

              {/* Body Card: Thông tin khách hoặc Giá */}
              <div style={styles.roomContent}>
                  {(isOccupied && room.currentBooking) ? (
                    <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={14} color="#6b7280"/>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {room.currentBooking.customerName}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', fontSize: 11, color:'#6b7280', marginBottom: '8px' }}>
                            <span style={{backgroundColor:'#e5e7eb', padding:'2px 6px', borderRadius: 4}}>{room.currentBooking.source}</span>
                            {room.currentBooking.deposit > 0 && <span style={{backgroundColor:'#dcfce7', color:'#166534', padding:'2px 6px', borderRadius: 4}}>Đã cọc</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12, color: '#4b5563', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                            <Clock size={12} /> 
                            <span>{format(new Date(room.currentBooking.checkIn), 'HH:mm')} - {format(new Date(room.currentBooking.checkOut), 'HH:mm dd/MM')}</span>
                        </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap: 6, marginTop: 'auto' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize: 13, color: '#64748b' }}>
                            <span>2 giờ đầu</span>
                            <span style={{ fontWeight: '700', color: '#374151' }}>{formatCurrency(room.price2h)}</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize: 13, color: '#64748b' }}>
                            <span>Qua đêm</span>
                            <span style={{ fontWeight: '700', color: '#374151' }}>{formatCurrency(room.priceNight)}</span>
                        </div>
                    </div>
                  )}
                  
                  {/* Location Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                       <MapPin size={10} /> {room.location}
                  </div>
              </div>
            </div>
          );
          })}
      </div>

      {/* MODAL ROOM DETAIL */}
      {selectedRoom && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Phòng {selectedRoom.number}</h2>
                <button onClick={() => setSelectedRoom(null)} style={{ padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
            </div>

            <div style={styles.modalBody}>
                {/* Booking Info & CCCD */}
                {selectedRoom.currentBooking && (
                    <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', border: '1px solid #e5e7eb' }}><User size={20}/></div>
                            <div><p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Khách hàng</p><p style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px', margin: 0 }}>{selectedRoom.currentBooking.customerName}</p></div>
                        </div>

                        {/* Hiển thị CCCD */}
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>GIẤY TỜ TÙY THÂN</p>
                            <div style={styles.cccdContainer}>
                                {selectedRoom.currentBooking.cccdTruoc ? (
                                    <div style={styles.cccdBox} onClick={() => window.open(selectedRoom.currentBooking!.cccdTruoc, '_blank')}>
                                        <img src={selectedRoom.currentBooking.cccdTruoc} style={styles.cccdImg} alt="Trước"/>
                                        <div style={styles.cccdLabel}>Mặt trước</div>
                                    </div>
                                ) : <div style={styles.cccdBox}><div style={styles.noCccd}><ImageIcon size={20}/>Mặt trước</div></div>}
                                {selectedRoom.currentBooking.cccdSau ? (
                                    <div style={styles.cccdBox} onClick={() => window.open(selectedRoom.currentBooking!.cccdSau, '_blank')}>
                                        <img src={selectedRoom.currentBooking.cccdSau} style={styles.cccdImg} alt="Sau"/>
                                        <div style={styles.cccdLabel}>Mặt sau</div>
                                    </div>
                                ) : <div style={styles.cccdBox}><div style={styles.noCccd}><ImageIcon size={20}/>Mặt sau</div></div>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                             <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <span style={{ color: '#6b7280', fontSize: '11px' }}>Tổng tiền</span>
                                <div style={{ fontWeight: 'bold', color: '#111827' }}>{formatCurrency(selectedRoom.currentBooking.totalPrice)}</div>
                             </div>
                             <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <span style={{ color: '#6b7280', fontSize: '11px' }}>Thanh toán</span>
                                <div style={{ fontWeight: 'bold', color: '#16a34a' }}>{formatCurrency(selectedRoom.currentBooking.deposit)}</div>
                             </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedRoom.status === 'pending' && selectedRoom.currentBooking && (
                        <div style={styles.paymentSection}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#b45309', fontSize: '13px', fontWeight: '600' }}>
                                <AlertCircle size={16}/> Khách chưa thanh toán?
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowConfirmDialog({ type: 'reject', bookingId: selectedRoom.currentBooking!.id })} style={styles.rejectBtn}><Ban size={16}/> Từ chối</button>
                                <button onClick={() => setShowConfirmDialog({ type: 'approve', bookingId: selectedRoom.currentBooking!.id })} style={styles.confirmBtn}><Check size={16}/> Xác nhận thanh toán</button>
                            </div>
                        </div>
                    )}

                    {['occupied', 'checkout-soon', 'overdue'].includes(selectedRoom.status) && (
                        <button onClick={handleCheckout} style={{ ...styles.btnAction, backgroundColor: '#ea580c', color: 'white' }}><LogOut size={18}/> Trả phòng</button>
                    )}
                    
                    {selectedRoom.status === 'checkin-soon' && <button onClick={handleCheckIn} style={{ ...styles.btnAction, backgroundColor: '#0d9488', color: 'white' }}><UserCheck size={18}/> Khách nhận phòng</button>}
                    {selectedRoom.cleanStatus === 'dirty' && selectedRoom.status === 'available' && <button onClick={handleCleanRoom} style={{ ...styles.btnAction, backgroundColor: '#16a34a', color: 'white' }}><Sparkles size={18}/> Xác nhận dọn xong</button>}
                    {selectedRoom.status === 'available' && selectedRoom.cleanStatus === 'clean' && <button onClick={() => setShowBookingForm(true)} style={{ ...styles.btnAction, backgroundColor: '#2563eb', color: 'white' }}><Plus size={18}/> Tạo đơn mới</button>}
                </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div style={{ ...styles.modalOverlay, zIndex: 70 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: showConfirmDialog.type === 'approve' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    {showConfirmDialog.type === 'approve' ? <Check size={24} color="#16a34a"/> : <X size={24} color="#dc2626"/>}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    {showConfirmDialog.type === 'approve' ? 'Xác nhận thanh toán?' : 'Từ chối đơn này?'}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
                    {showConfirmDialog.type === 'approve' ? 'Đơn sẽ chuyển sang trạng thái "Đã thanh toán".' : 'Đơn đặt phòng sẽ bị HỦY và phòng sẽ trống trở lại.'}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowConfirmDialog(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleProcessBooking} disabled={actionLoading} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: showConfirmDialog.type === 'approve' ? '#16a34a' : '#dc2626', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{actionLoading ? 'Đang xử lý...' : 'Đồng ý'}</button>
                </div>
            </div>
        </div>
      )}

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