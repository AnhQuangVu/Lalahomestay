// Việt hóa trạng thái đơn đặt phòng
const getBookingStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    'da_coc': 'Đã đặt cọc',
    'da_tra': 'Đã trả phòng',
    'dang_o': 'Đang ở',
    'dang_dung': 'Đang sử dụng',
    'da_huy': 'Đã hủy',
    'cho_xac_nhan': 'Chờ xác nhận',
    'checkout': 'Đã checkout',
    'sap_nhan': 'Sắp nhận',
    'sap_tra': 'Sắp trả',
    'trong': 'Trống',
    '': 'Không xác định'
  };
  return map[status] || status;
};
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import {
  MoreVertical, Clock, UserCheck, LogOut, Sparkles,
  FileText, Settings, User, CalendarRange, Plus, X,
  CreditCard, MapPin, Phone, StickyNote
} from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// --- INTERFACES ---
interface Room {
  id: string;
  number: string;
  concept: string;
  location: string;
  status: 'available' | 'occupied' | 'checkout-soon' | 'checkin-soon' | 'overdue' | 'maintenance';
  cleanStatus: 'clean' | 'dirty' | 'cleaning';
  price2h: number;
  priceNight: number;
  currentBooking?: {
    code: string;
    customerName: string;
    checkIn: string;
    checkOut: string;
  };
}

export default function StaffDashboard() {
  // --- STATE ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit States
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [editClean, setEditClean] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Sub-modals
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 15000);
    return () => clearInterval(interval);
  }, []);

  // --- DATA LOADING ---
  const loadRooms = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/phong`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/dat-phong`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
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

          // Nếu trạng thái đang ở -> lấy luôn
          if (b.trang_thai === 'dang_o' || b.trang_thai === 'dang_dung') return true;

          // Logic thời gian
          const start = new Date(b.thoi_gian_nhan);
          const end = new Date(b.thoi_gian_tra);
          if (r.trang_thai === 'dang_dung') return true;
          return now <= end && (now >= start || differenceInHours(start, now) <= 2);
        });

        const statusMap: any = { 'trong': 'available', 'dang_dung': 'occupied', 'sap_nhan': 'checkin-soon', 'sap_tra': 'checkout-soon', 'bao_tri': 'maintenance' };
        const cleanMap: any = { 'sach': 'clean', 'dang_don': 'cleaning', 'chua_don': 'dirty' };

        let derivedStatus = statusMap[r.trang_thai] || 'available';
        if (currentBooking && derivedStatus === 'available') {
          if (new Date() >= new Date(currentBooking.thoi_gian_nhan)) {
            derivedStatus = 'occupied';
          } else {
            derivedStatus = 'checkin-soon';
          }
        }

        return {
          id: r.id,
          number: r.ma_phong,
          concept: r.loai_phong?.ten_loai || '',
          location: r.loai_phong?.co_so?.ten_co_so || '',
          status: derivedStatus,
          cleanStatus: cleanMap[r.tinh_trang_vesinh] || 'clean',
          price2h: r.loai_phong?.gia_gio || 0,
          priceNight: r.loai_phong?.gia_dem || 0,
          currentBooking: currentBooking ? {
            code: currentBooking.ma_dat,
            customerName: currentBooking.khach_hang?.ho_ten || currentBooking.ho_ten || 'Khách vãng lai',
            checkIn: currentBooking.thoi_gian_nhan,
            checkOut: currentBooking.thoi_gian_tra
          } : undefined
        } as Room;
      });
      setRooms(mapped);
    } catch (error) { console.error(error); setRooms([]); } finally { setLoading(false); }
  };

  // --- API ACTIONS ---
  const updateRoomStatusApi = async (roomId: string, status: string, cleanStatus: string) => {
    const statusMap: any = { 'available': 'trong', 'occupied': 'dang_dung', 'checkout-soon': 'sap_tra', 'checkin-soon': 'sap_nhan', 'maintenance': 'bao_tri' };
    const cleanMap: any = { 'clean': 'sach', 'cleaning': 'dang_don', 'dirty': 'chua_don' };
    await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/phong/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ trang_thai: statusMap[status] || 'trong', tinh_trang_vesinh: cleanMap[cleanStatus] || 'sach' })
    });
  };

  // --- ACTION: TRẢ PHÒNG (ĐÃ ĐƠN GIẢN HÓA) ---
  const handleCheckout = async () => {
    if (!selectedRoom?.currentBooking) return;

    if (!window.confirm(`Xác nhận trả phòng cho khách ${selectedRoom.currentBooking.customerName}?`)) return;

    const toastId = toast.loading('Đang xử lý trả phòng...');

    try {
      setEditLoading(true);
      const bookingRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/dat-phong/ma/${selectedRoom.currentBooking.code}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      const bookingData = await bookingRes.json();

      if (bookingData.success) {
        await Promise.all([
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/dat-phong/${bookingData.data.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
            body: JSON.stringify({ trang_thai: 'da_tra', thoi_gian_tra_thuc_te: new Date().toISOString() })
          }),
          updateRoomStatusApi(selectedRoom.id, 'available', 'dirty')
        ]);

        toast.success('Trả phòng thành công!', { id: toastId });
        setSelectedRoom(null);
        loadRooms();
      } else {
        toast.error('Không tìm thấy đơn đặt phòng', { id: toastId });
      }
    } catch (e) {
      toast.error('Lỗi hệ thống', { id: toastId });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCleanRoom = async () => {
    if (!selectedRoom) return;
    const toastId = toast.loading('Đang cập nhật...');
    try {
      setEditLoading(true);
      await updateRoomStatusApi(selectedRoom.id, 'available', 'clean');
      toast.success('Phòng đã sạch sẽ!', { id: toastId });
      setSelectedRoom(null); loadRooms();
    } catch (e) { toast.error('Lỗi kết nối', { id: toastId }); } finally { setEditLoading(false); }
  };

  const handleCheckIn = async () => {
    if (!selectedRoom) return;
    const toastId = toast.loading('Đang nhận phòng...');
    try {
      setEditLoading(true);
      await updateRoomStatusApi(selectedRoom.id, 'occupied', selectedRoom.cleanStatus);
      toast.success('Nhận phòng thành công!', { id: toastId });
      setSelectedRoom(null); loadRooms();
    } catch (e) { toast.error('Lỗi kết nối', { id: toastId }); } finally { setEditLoading(false); }
  };

  const handleSaveManual = async () => {
    if (!selectedRoom) return;
    const toastId = toast.loading('Đang lưu...');
    try {
      setEditLoading(true);
      await updateRoomStatusApi(selectedRoom.id, editStatus || selectedRoom.status, editClean || selectedRoom.cleanStatus);
      toast.success('Cập nhật thành công', { id: toastId });
      setSelectedRoom(null); loadRooms();
    } catch (e) { toast.error('Lỗi kết nối', { id: toastId }); } finally { setEditLoading(false); }
  };

  const handleShowDetail = async () => {
    if (!selectedRoom?.currentBooking) return;
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/dat-phong/ma/${selectedRoom.currentBooking.code}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      const data = await res.json();
      if (data.success) {
        console.log('bookingDetail:', data.data);
        setBookingDetail(data.data);
      } else {
        toast.error('Không tìm thấy chi tiết');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  // --- STYLES & HELPERS ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

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

  const getTimeRemaining = (checkOut: string) => {
    const hours = differenceInHours(new Date(checkOut), new Date());
    if (hours < 0) return 'Quá giờ';
    if (hours === 0) return '< 1h';
    return `${hours}h`;
  };

  const filteredRooms = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  // --- MAIN RENDER ---
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '80px', padding: '20px', fontFamily: 'sans-serif' }}>

      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Lịch đặt phòng</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { val: 'all', label: 'Tất cả', bg: '#1f2937', text: '#fff' },
            { val: 'available', label: 'Phòng Trống', bg: '#16a34a', text: '#fff' },
            { val: 'occupied', label: 'Đang ở', bg: '#2563eb', text: '#fff' },
            { val: 'checkin-soon', label: 'Sắp nhận', bg: '#f97316', text: '#fff' },
            { val: 'checkout-soon', label: 'Sắp trả', bg: '#eab308', text: '#fff' },
            { val: 'maintenance', label: 'Bảo trì', bg: '#6b7280', text: '#fff' }
          ].map(btn => (
            <button
              key={btn.val}
              onClick={() => setFilter(btn.val)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                border: '1px solid transparent',
                backgroundColor: filter === btn.val ? btn.bg : '#fff',
                color: filter === btn.val ? btn.text : '#4b5563',
                borderColor: filter === btn.val ? 'transparent' : '#e5e7eb',
                boxShadow: filter === btn.val ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Rooms */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {filteredRooms.map(room => {
          const conf = getStatusColor(room.status);
          const isOccupied = room.status === 'occupied' || room.status === 'checkout-soon';

          return (
            <div
              key={room.id}
              onClick={() => { setSelectedRoom(room); setIsEditing(false); }}
              style={{
                backgroundColor: conf.bg,
                border: `1px solid ${conf.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '160px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ padding: '16px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{room.number}</h3>
                  <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', margin: 0 }}>{room.concept}</p>
                </div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  color: conf.text
                }}>
                  {conf.label}
                </span>
              </div>

              <div style={{ padding: '16px', paddingTop: '8px', flex: 1 }}>
                {room.currentBooking ? (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: isOccupied ? '#2563eb' : '#f97316',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <User size={16} />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {room.currentBooking.customerName}
                        </p>
                        <p style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace', margin: 0 }}>
                          {room.currentBooking.code.slice(-6)}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '8px',
                      border: '1px solid rgba(0,0,0,0.05)', fontSize: '12px', color: '#4b5563',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af' }}>Vào</span>
                        <span style={{ fontWeight: '600' }}>{format(new Date(room.currentBooking.checkIn), 'HH:mm')}</span>
                      </div>
                      <CalendarRange size={14} color="#d1d5db" />
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af' }}>Ra</span>
                        <span style={{ fontWeight: '600' }}>{format(new Date(room.currentBooking.checkOut), 'HH:mm')}</span>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      fontSize: '11px', fontWeight: '500', color: '#ea580c', backgroundColor: '#ffedd5',
                      padding: '4px', borderRadius: '4px'
                    }}>
                      <Clock size={12} />
                      <span>Còn {getTimeRemaining(room.currentBooking.checkOut)}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      <span>2h:</span>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>{room.price2h.toLocaleString()}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
                      <span>Đêm:</span>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>{room.priceNight.toLocaleString()}đ</span>
                    </div>
                  </div>
                )}

                {room.cleanStatus === 'dirty' && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.2)' }}></div>
                  </div>
                )}
                {room.cleanStatus === 'dirty' && (
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 'bold', color: '#dc2626', backgroundColor: '#fef2f2',
                      padding: '2px 8px', borderRadius: '12px', border: '1px solid #fee2e2',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Sparkles size={10} /> Cần dọn dẹp
                    </span>
                  </div>
                )}
              </div>

              <div style={{ height: '6px', width: '100%', backgroundColor: room.cleanStatus === 'dirty' ? '#ef4444' : (isOccupied ? '#3b82f6' : '#22c55e') }}></div>
            </div>
          )
        })}
      </div>

      {/* --- MODAL PHÒNG CHÍNH --- */}
      {selectedRoom && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Phòng {selectedRoom.number}</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{selectedRoom.concept} • {selectedRoom.location}</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                <X size={24} color="#9ca3af" />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid', textAlign: 'center',
                  backgroundColor: selectedRoom.cleanStatus === 'clean' ? '#f0fdf4' : '#fef2f2',
                  borderColor: selectedRoom.cleanStatus === 'clean' ? '#dcfce7' : '#fee2e2',
                  color: selectedRoom.cleanStatus === 'clean' ? '#15803d' : '#b91c1c'
                }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7, margin: 0, marginBottom: '4px' }}>Vệ sinh</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{selectedRoom.cleanStatus === 'clean' ? 'Sạch sẽ' : 'Cần dọn'}</p>
                </div>
                <div style={{
                  flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid', textAlign: 'center',
                  backgroundColor: getStatusColor(selectedRoom.status).bg,
                  borderColor: getStatusColor(selectedRoom.status).border,
                  color: getStatusColor(selectedRoom.status).text
                }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7, margin: 0, marginBottom: '4px' }}>Trạng thái</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{getStatusColor(selectedRoom.status).label}</p>
                </div>
              </div>

              {selectedRoom.currentBooking && (
                <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px', border: '1px solid #dbeafe', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>Khách hàng</p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{selectedRoom.currentBooking.customerName}</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #dbeafe', paddingTop: '12px' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Check-in</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{format(new Date(selectedRoom.currentBooking.checkIn), 'HH:mm dd/MM', { locale: vi })}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Check-out</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{format(new Date(selectedRoom.currentBooking.checkOut), 'HH:mm dd/MM', { locale: vi })}</p>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px' }}>
                {selectedRoom.cleanStatus === 'dirty' && selectedRoom.status === 'available' && (
                  <button
                    onClick={handleCleanRoom}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)' }}
                  >
                    <Sparkles size={18} /> Xác nhận đã dọn xong
                  </button>
                )}

                {selectedRoom.status === 'occupied' && (
                  <>
                    <button
                      onClick={handleCheckout}
                      style={{ width: '100%', padding: '12px', backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.3)' }}
                    >
                      <LogOut size={18} /> Trả phòng
                    </button>
                    <button
                      onClick={handleShowDetail}
                      style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <FileText size={18} /> Xem chi tiết đơn
                    </button>
                  </>
                )}

                {selectedRoom.status === 'checkin-soon' && (
                  <button
                    onClick={handleCheckIn}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.3)' }}
                  >
                    <UserCheck size={18} /> Khách nhận phòng
                  </button>
                )}

                {selectedRoom.status === 'available' && selectedRoom.cleanStatus === 'clean' && (
                  <button
                    onClick={() => setShowBookingForm(true)}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' }}
                  >
                    <Plus size={18} /> Tạo đơn đặt phòng mới
                  </button>
                )}
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}
                >
                  <Settings size={12} /> {isEditing ? 'Ẩn tùy chỉnh' : 'Sửa trạng thái thủ công'}
                </button>

                {isEditing && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px', animation: 'fadeIn 0.2s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }} value={editStatus || selectedRoom.status} onChange={e => setEditStatus(e.target.value)}>
                        <option value="available">Trống</option><option value="occupied">Đang ở</option><option value="maintenance">Bảo trì</option>
                      </select>
                      <select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }} value={editClean || selectedRoom.cleanStatus} onChange={e => setEditClean(e.target.value)}>
                        <option value="clean">Sạch</option><option value="dirty">Bẩn</option><option value="cleaning">Đang dọn</option>
                      </select>
                    </div>
                    <button onClick={handleSaveManual} disabled={editLoading} style={{ width: '100%', padding: '8px', backgroundColor: '#1f2937', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Lưu thay đổi</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- MODAL CHI TIẾT HÓA ĐƠN/ĐẶT PHÒNG (ĐÃ NÂNG CẤP) --- */}
          {bookingDetail && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
              <div style={{ backgroundColor: 'white', padding: '0', borderRadius: '20px', width: '360px', boxShadow: '0 20px 40px -5px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>

                {/* Header */}
                <div style={{ backgroundColor: '#1f2937', padding: '20px', color: 'white' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} /> Chi tiết đơn đặt
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.8 }}>Mã: <span style={{ fontFamily: 'monospace' }}>{bookingDetail.ma_dat}</span></p>
                </div>

                <div style={{ padding: '20px' }}>
                  {/* Customer Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Khách hàng</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
                        <User size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{bookingDetail.khach_hang?.ho_ten || bookingDetail.ho_ten}</p>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {bookingDetail.khach_hang?.sdt || bookingDetail.sdt}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', borderTop: '1px dashed #e5e7eb', borderBottom: '1px dashed #e5e7eb', padding: '16px 0' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Phòng</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#1f2937' }}>
                        <MapPin size={14} /> {bookingDetail.phong?.ma_phong || selectedRoom.number}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Trạng thái</p>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '99px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                        {getBookingStatusLabel(bookingDetail.trang_thai)}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Check-in</p>
                      <p style={{ fontSize: '13px', fontWeight: '600' }}>{format(new Date(bookingDetail.thoi_gian_nhan), 'HH:mm dd/MM', { locale: vi })}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Check-out</p>
                      <p style={{ fontSize: '13px', fontWeight: '600' }}>{format(new Date(bookingDetail.thoi_gian_tra), 'HH:mm dd/MM', { locale: vi })}</p>
                    </div>
                  </div>

                  {/* Money Section (Mockup if data missing) */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Thanh toán</p>
                    <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                        <span style={{ color: '#4b5563' }}>Tổng tiền (dự kiến)</span>
                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(bookingDetail.tong_tien || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#4b5563' }}>Đã cọc</span>
                        <span style={{ fontWeight: 'bold', color: '#059669' }}>{formatCurrency(bookingDetail.tien_coc || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Note Section */}
                  {bookingDetail.ghi_chu && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Ghi chú</p>
                      <p style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic', display: 'flex', gap: '6px' }}>
                        <StickyNote size={14} style={{ marginTop: '2px' }} /> {bookingDetail.ghi_chu}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setBookingDetail(null)}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#374151', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {showBookingForm && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '320px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Tạo đơn mới</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Chức năng đang phát triển...</p>
                <button onClick={() => setShowBookingForm(false)} style={{ width: '100%', padding: '8px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Đóng</button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}