import { useState, useEffect, useMemo } from 'react';
import { uploadToCloudinary } from '../../utils/cloudinary';
// --- ĐÃ THÊM FileText VÀO DÒNG DƯỚI ĐÂY ---
import { Calendar, Users, Clock, RefreshCw, Check, AlertCircle, UploadCloud, ChevronRight, ArrowLeft, CheckCircle2, Info, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

// --- STYLES OBJECT ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '20px 16px',
    paddingBottom: '100px',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#1f2937',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  backBtn: {
    padding: '10px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px', margin: 0 },
  
  // Layout
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '32px',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f3f4f6',
  },
  cardHeader: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#ccfbf1',
    color: '#0f766e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },

  // Form Elements
  formGroup: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputWrapper: { width: '100%' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },

  // Booking Type Switcher
  tabContainer: { display: 'flex', gap: '12px', marginBottom: '24px' },
  tabBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },

  // Upload Area
  uploadGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  uploadBox: {
    height: '110px',
    border: '2px dashed #e5e7eb',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s',
    position: 'relative',
    overflow: 'hidden',
  },
  uploadedImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeBtn: {
    position: 'absolute', top: '6px', right: '6px',
    width: '24px', height: '24px', borderRadius: '50%',
    backgroundColor: '#ef4444', color: 'white', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },

  // Status Banners
  statusBox: { padding: '16px', borderRadius: '12px', border: '1px solid', display: 'flex', alignItems: 'start', gap: '12px' },
  
  // Footer Actions
  footer: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginBottom: '40px',
  },
  btn: {
    padding: '12px 32px',
    borderRadius: '99px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  
  // Existing Bookings Panel
  bookingListCard: {
    backgroundColor: '#fffbeb', 
    border: '1px solid #fcd34d',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
  },
  bookingListItem: {
    backgroundColor: 'white',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #fde68a',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  }
};

// --- SUB-COMPONENT: TimeSlotSelector ---
function TimeSlotSelector({ roomId, selectedDate, selectedSlots, onSlotsChange, existingBookings }: any) {
  const FIXED_SLOTS = [
    { label: '07:30 - 08:45', startH: 7, startM: 30, endH: 8, endM: 45 },
    { label: '09:00 - 10:15', startH: 9, startM: 0, endH: 10, endM: 15 },
    { label: '10:30 - 11:45', startH: 10, startM: 30, endH: 11, endM: 45 },
    { label: '12:00 - 13:15', startH: 12, startM: 0, endH: 13, endM: 15 },
    { label: '13:30 - 14:45', startH: 13, startM: 30, endH: 14, endM: 45 },
    { label: '15:00 - 16:15', startH: 15, startM: 0, endH: 16, endM: 15 },
    { label: '16:30 - 17:45', startH: 16, startM: 30, endH: 17, endM: 45 },
    { label: '18:00 - 19:15', startH: 18, startM: 0, endH: 19, endM: 15 },
    { label: '19:30 - 20:45', startH: 19, startM: 30, endH: 20, endM: 45 },
    { label: '21:00 - 22:15', startH: 21, startM: 0, endH: 22, endM: 15 },
    { label: '22:30 - 07:00 (Hôm sau)', startH: 22, startM: 30, endH: 7, endM: 0, nextDay: true }
  ];

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return FIXED_SLOTS.map(config => {
      const start = new Date(selectedDate);
      start.setHours(config.startH, config.startM, 0, 0);
      const end = new Date(selectedDate);
      if (config.nextDay) end.setDate(end.getDate() + 1);
      end.setHours(config.endH, config.endM, 0, 0);
      return { label: config.label, start, end, config };
    });
  }, [selectedDate]);

  const getSlotStatus = (slot: any) => {
    const now = new Date();
    if (slot.start < now) return { available: false, reason: 'past' };
    for (const booking of existingBookings) {
      const bStart = new Date(booking.thoi_gian_nhan);
      const bEnd = new Date(booking.thoi_gian_tra);
      const blockedStart = new Date(bStart.getTime() - 15 * 60000);
      const blockedEnd = new Date(bEnd.getTime() + 15 * 60000);
      if (slot.start < blockedEnd && slot.end > blockedStart) return { available: false, reason: 'booked' };
    }
    return { available: true, reason: 'ok' };
  };

  const handleSlotClick = (slot: any) => {
    const status = getSlotStatus(slot);
    if (!status.available) return status.reason === 'booked' && toast.error('Khung giờ này đã có đơn đặt.');
    const slotStartStr = slot.start.toISOString();
    const exists = selectedSlots.find((s: any) => s.start === slotStartStr);
    if (exists) onSlotsChange(selectedSlots.filter((s: any) => s.start !== slotStartStr));
    else onSlotsChange([...selectedSlots, { start: slot.start.toISOString(), end: slot.end.toISOString(), label: slot.label }]);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px', fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#f8fafc', border: '1px solid #e2e8f0' }}></div>Trống</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#0f766e' }}></div>Đang chọn</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#f1f5f9', border: '1px solid #cbd5e1' }}></div>Đã đặt/Qua giờ</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        {timeSlots.map((slot, idx) => {
          const status = getSlotStatus(slot);
          const isSelected = selectedSlots.some((s: any) => s.start === slot.start.toISOString());
          let bg = isSelected ? '#0f766e' : !status.available ? '#f1f5f9' : '#f8fafc';
          let color = isSelected ? '#fff' : !status.available ? '#94a3b8' : '#374151';
          let cursor = !status.available ? 'not-allowed' : 'pointer';
          return (
            <button type="button" key={idx} onClick={() => handleSlotClick(slot)} disabled={!status.available} style={{ padding: '10px 6px', borderRadius: '8px', backgroundColor: bg, color: color, border: isSelected ? '1px solid #0f766e' : '1px solid #e2e8f0', cursor: cursor, fontSize: 12, fontWeight: isSelected ? 700 : 500, transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
              {isSelected && <div style={{position: 'absolute', top: -5, right: -5, background: '#f59e0b', borderRadius: '50%', color: 'white', padding: 2, zIndex: 10}}><CheckCircle2 size={12} fill="#f59e0b" color="white"/></div>}
              <span>{slot.label.split(' - ')[0]} - {slot.label.split(' - ')[1].split(' ')[0]}</span>
              {slot.config.nextDay && <span style={{ fontSize: '10px', fontStyle: 'italic', opacity: 0.8 }}>(Qua đêm)</span>}
              {!status.available && status.reason === 'booked' && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>Đã có đơn</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function NewBooking() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ customerName: '', customerPhone: '', customerEmail: '', location: '', concept: '', room: '', numberOfGuests: 2, notes: '', bookingSource: 'facebook', paymentMethod: 'transfer', cccdFront: '', cccdBack: '', cccdFrontUploading: false, cccdBackUploading: false });
  const [bookingType, setBookingType] = useState<'ngay' | 'gio'>('ngay');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<any[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredConcepts, setFilteredConcepts] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  useEffect(() => { fetchData(); const today = new Date().toISOString().split('T')[0]; setSelectedDate(today); }, []);
  useEffect(() => { if (formData.room && selectedDate) { fetchBookingsForRoom(); } else { setExistingBookings([]); } setSelectedTimeSlots([]); }, [formData.room, selectedDate]);
  useEffect(() => { if (formData.location) { setFilteredConcepts(concepts.filter((c: any) => c.id_co_so === formData.location)); } else setFilteredConcepts([]); setFormData(prev => ({ ...prev, concept: '', room: '' })); }, [formData.location, concepts]);
  useEffect(() => { if (formData.concept) { setFilteredRooms(rooms.filter((r: any) => r.id_loai_phong === formData.concept && r.trang_thai === 'trong')); } else setFilteredRooms([]); setFormData(prev => ({ ...prev, room: '' })); }, [formData.concept, rooms]);

  const fetchData = async () => {
    try {
      const [locRes, conceptRes, roomRes] = await Promise.all([ fetch(`${API_URL}/co-so`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }), fetch(`${API_URL}/loai-phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }), fetch(`${API_URL}/phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }) ]);
      const [locData, conceptData, roomData] = await Promise.all([ locRes.json(), conceptRes.json(), roomRes.json() ]);
      if (locData.success) setLocations(locData.data || []);
      if (conceptData.success) setConcepts(conceptData.data || []);
      if (roomData.success) setRooms((roomData.data || []).filter((r: any) => r.trang_thai !== 'dinh_chi'));
    } catch (error) { toast.error('Lỗi tải dữ liệu ban đầu'); }
  };

  const fetchBookingsForRoom = async () => {
    if (!formData.room || !selectedDate) return;
    setFetchingBookings(true);
    try {
      const checkDate = new Date(selectedDate);
      const bufferStart = new Date(checkDate); bufferStart.setDate(bufferStart.getDate() - 1);
      const bufferEnd = new Date(checkDate); bufferEnd.setDate(bufferEnd.getDate() + 2);
      const response = await fetch(`${API_URL}/dat-phong?start_date=${bufferStart.toISOString()}&end_date=${bufferEnd.toISOString()}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      const data = await response.json();
      if (data.success) {
        const roomBookings = data.data.filter((b: any) => b.id_phong === formData.room && b.trang_thai !== 'da_huy');
        setExistingBookings(roomBookings);
      }
    } catch (error) { console.error(error); } finally { setFetchingBookings(false); }
  };

  const isDayBookingAvailable = useMemo(() => {
    if (!selectedDate || !formData.room) return false;
    const checkIn = new Date(`${selectedDate}T14:00:00`);
    const checkOut = new Date(checkIn); checkOut.setDate(checkOut.getDate() + 1); checkOut.setHours(12, 0, 0, 0);
    const requestStart = new Date(checkIn.getTime() - 30 * 60 * 1000);
    const requestEnd = new Date(checkOut.getTime() + 30 * 60 * 1000);
    for (const booking of existingBookings) {
      const bStart = new Date(booking.thoi_gian_nhan); const bEnd = new Date(booking.thoi_gian_tra);
      if (requestStart < bEnd && requestEnd > bStart) return false;
    }
    return true;
  }, [selectedDate, formData.room, existingBookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.room) return toast.error("Thiếu thông tin bắt buộc.");
    setLoading(true);
    try {
      const basePayload: any = { ho_ten: formData.customerName, sdt: formData.customerPhone, email: formData.customerEmail || null, id_phong: formData.room, so_khach: formData.numberOfGuests || 1, ghi_chu: formData.notes || null, ghi_chu_khach: formData.notes || null, kenh_dat: formData.bookingSource, trang_thai: 'da_coc', cccd_mat_truoc: formData.cccdFront || null, cccd_mat_sau: formData.cccdBack || null };
      if (bookingType === 'ngay') {
        if (!selectedDate) throw new Error('Vui lòng chọn ngày');
        if (!isDayBookingAvailable) throw new Error('Ngày này đã bị vướng lịch!');
        const checkIn = `${selectedDate}T14:00:00`; const nextDay = new Date(selectedDate); nextDay.setDate(nextDay.getDate() + 1); const checkOut = `${nextDay.toISOString().split('T')[0]}T12:00:00`;
        const response = await fetch(`${API_URL}/dat-phong`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` }, body: JSON.stringify({ ...basePayload, thoi_gian_nhan: checkIn, thoi_gian_tra: checkOut }) });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        toast.success(`Tạo đơn ngày thành công! Mã: ${data.data?.ma_dat}`);
      } else {
        if (selectedTimeSlots.length === 0) throw new Error('Vui lòng chọn ít nhất 1 khung giờ');
        const promises = selectedTimeSlots.map(slot => fetch(`${API_URL}/dat-phong`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` }, body: JSON.stringify({ ...basePayload, thoi_gian_nhan: slot.start, thoi_gian_tra: slot.end, ghi_chu: (formData.notes || '') + ` (Slot: ${slot.label})` }) }).then(r => r.json()));
        const results = await Promise.all(promises);
        const errors = results.filter(r => !r.success);
        if (errors.length > 0) toast.warning(`Có ${errors.length} khung giờ thất bại.`); else toast.success(`Đã tạo thành công ${results.length} đơn đặt phòng theo giờ!`);
      }
      setFormData(prev => ({ ...prev, customerName: '', customerPhone: '', customerEmail: '', notes: '', cccdFront: '', cccdBack: '' }));
      setSelectedTimeSlots([]);
      fetchBookingsForRoom();
    } catch (error: any) { toast.error(error.message || 'Lỗi xử lý'); } finally { setLoading(false); }
  };

  const handleUploadCCCD = async (file: File, type: 'front' | 'back') => {
    if (!file) return;
    setFormData(prev => ({ ...prev, [type === 'front' ? 'cccdFrontUploading' : 'cccdBackUploading']: true }));
    try { const url = await uploadToCloudinary(file, 'cccd'); setFormData(prev => ({ ...prev, [type === 'front' ? 'cccdFront' : 'cccdBack']: url, [type === 'front' ? 'cccdFrontUploading' : 'cccdBackUploading']: false })); toast.success('Đã tải ảnh lên'); } catch (err) { setFormData(prev => ({ ...prev, [type === 'front' ? 'cccdFrontUploading' : 'cccdBackUploading']: false })); toast.error('Lỗi tải ảnh'); }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={24} color="#4b5563" />
        </button>
        <div>
          <h1 style={styles.pageTitle}>Tạo Đơn Đặt Phòng</h1>
          <p style={styles.pageSubtitle}>Dành cho Admin & Staff</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          
          {/* CỘT TRÁI */}
          <div style={styles.col}>
            {/* Customer Info */}
            <div style={styles.card}>
              <div style={styles.cardHeader}><Users size={20} color="#0d9488"/> Thông tin khách</div>
              <div style={styles.formGroup}>
                <div style={styles.inputWrapper}><input type="text" placeholder="Họ tên khách *" style={styles.input} value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required /></div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <input type="tel" placeholder="Số điện thoại *" style={styles.input} value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} required />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f9fafb', padding: '0 12px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', whiteSpace: 'nowrap' }}>Số khách</span>
                        <input type="number" min="1" style={{ width: '40px', border: 'none', background: 'transparent', fontWeight: 'bold', textAlign: 'center', outline: 'none' }} value={formData.numberOfGuests} onChange={e => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 1 })} />
                    </div>
                </div>
                <input type="email" placeholder="Email" style={styles.input} value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
              </div>
            </div>

            {/* Order Details */}
            <div style={styles.card}>
               <div style={styles.cardHeader}><FileText size={20} color="#374151"/> Chi tiết đơn</div>
               <div style={styles.formGroup}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                       <div>
                           <label style={styles.label}>Nguồn khách</label>
                           <select style={styles.select} value={formData.bookingSource} onChange={e => setFormData({ ...formData, bookingSource: e.target.value })}>
                               <option value="facebook">Facebook</option><option value="zalo">Zalo</option><option value="phone">Điện thoại</option><option value="walkin">Vãng lai</option><option value="tiktok">TikTok</option><option value="other">Khác</option>
                           </select>
                       </div>
                       <div>
                           <label style={styles.label}>Thanh toán</label>
                           <select style={styles.select} value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                               <option value="transfer">Chuyển khoản</option><option value="cash">Tiền mặt</option><option value="card">Quẹt thẻ</option><option value="vnpay">VNPAY</option><option value="momo">Momo</option>
                           </select>
                       </div>
                   </div>
                   <textarea placeholder="Ghi chú..." style={styles.textarea} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
               </div>
            </div>

             {/* CCCD Upload */}
             <div style={styles.card}>
               <div style={styles.cardHeader}><UploadCloud size={20} color="#374151"/> Ảnh CCCD</div>
               <div style={styles.uploadGrid}>
                  {['front', 'back'].map((side) => (
                    <div key={side}>
                      {formData[side === 'front' ? 'cccdFront' : 'cccdBack'] ? (
                        <div style={{ ...styles.uploadBox, border: '1px solid #14b8a6' }}>
                           <img src={formData[side === 'front' ? 'cccdFront' : 'cccdBack']} alt={side} style={styles.uploadedImg} />
                           <button type="button" onClick={() => setFormData({ ...formData, [side === 'front' ? 'cccdFront' : 'cccdBack']: '' })} style={styles.removeBtn}>×</button>
                        </div>
                      ) : (
                        <label style={styles.uploadBox}>
                           {formData[side === 'front' ? 'cccdFrontUploading' : 'cccdBackUploading'] ? <RefreshCw size={20} className="animate-spin text-teal-500"/> : <><UploadCloud size={24} color="#9ca3af"/><span style={{fontSize: '12px', color: '#6b7280', marginTop: '8px', textTransform: 'uppercase'}}>{side === 'front' ? 'Mặt trước' : 'Mặt sau'}</span></>}
                           <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleUploadCCCD(e.target.files[0], side as 'front' | 'back')} disabled={formData.cccdFrontUploading || formData.cccdBackUploading} />
                        </label>
                      )}
                    </div>
                  ))}
               </div>
             </div>
          </div>

          {/* CỘT PHẢI */}
          <div style={styles.col}>
             {/* 1. Chọn Phòng */}
             <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <span style={styles.stepBadge}>1</span> Chọn Phòng
                </div>
                <div style={styles.formGroup}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                         <div style={{ flex: 1 }}>
                             <label style={styles.label}>Cơ sở</label>
                             <select style={styles.select} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                                 <option value="">-- Chọn cơ sở --</option>{locations.map(l => <option key={l.id} value={l.id}>{l.ten_co_so}</option>)}
                             </select>
                         </div>
                         <div style={{ flex: 1 }}>
                             <label style={styles.label}>Loại phòng</label>
                             <select style={styles.select} value={formData.concept} onChange={e => setFormData({ ...formData, concept: e.target.value })} disabled={!formData.location}>
                                 <option value="">-- Chọn loại --</option>{filteredConcepts.map(c => <option key={c.id} value={c.id}>{c.ten_loai}</option>)}
                             </select>
                         </div>
                    </div>
                    <div>
                         <label style={styles.label}>Phòng số</label>
                         <select style={styles.select} value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} disabled={!formData.concept}>
                             <option value="">-- Chọn phòng --</option>{filteredRooms.map(r => <option key={r.id} value={r.id}>{r.ma_phong} ({r.trang_thai === 'trong' ? 'Trống' : 'Đang dùng'})</option>)}
                         </select>
                    </div>
                    {formData.concept && filteredRooms.length === 0 && <p style={{ fontSize: '13px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14}/> Hết phòng trống loại này.</p>}
                </div>
             </div>

             {/* 2. Chọn Lịch */}
             {formData.room && (
                 <div style={{ ...styles.card, animation: 'fadeIn 0.5s' }}>
                    <div style={{ ...styles.cardHeader, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={styles.stepBadge}>2</span> Thời gian đặt
                        </div>
                        {fetchingBookings && <span style={{ fontSize: '12px', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ccfbf1', padding: '4px 8px', borderRadius: '99px' }}><RefreshCw size={12} className="animate-spin"/> Đang tải lịch...</span>}
                    </div>

                    <div style={styles.tabContainer}>
                        <div onClick={() => setBookingType('ngay')} style={{ ...styles.tabBtn, backgroundColor: bookingType === 'ngay' ? '#f0fdfa' : 'white', border: bookingType === 'ngay' ? '1px solid #99f6e4' : '1px solid #e5e7eb', color: bookingType === 'ngay' ? '#0f766e' : '#6b7280' }}><Calendar size={16}/> Theo Ngày</div>
                        <div onClick={() => setBookingType('gio')} style={{ ...styles.tabBtn, backgroundColor: bookingType === 'gio' ? '#f0fdfa' : 'white', border: bookingType === 'gio' ? '1px solid #99f6e4' : '1px solid #e5e7eb', color: bookingType === 'gio' ? '#0f766e' : '#6b7280' }}><Clock size={16}/> Theo Giờ</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={styles.label}>Ngày {bookingType === 'ngay' ? 'nhận phòng' : 'xem lịch'}</label>
                        <input type="date" style={styles.input} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    </div>

                    {/* EXISTING BOOKINGS PANEL */}
                    {existingBookings.length > 0 && (
                        <div style={styles.bookingListCard}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '12px' }}>
                                 <Info size={16}/> Lịch đặt hiện tại ({new Date(selectedDate).toLocaleDateString('vi-VN')}):
                             </div>
                             {existingBookings.map((b: any, idx) => {
                                 const start = new Date(b.thoi_gian_nhan);
                                 const end = new Date(b.thoi_gian_tra);
                                 return (
                                     <div key={idx} style={styles.bookingListItem}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                             <Users size={14} color="#9ca3af"/>
                                             <span style={{ fontWeight: '600', color: '#374151' }}>{b.khach_hang?.ho_ten || b.ho_ten || 'Khách'}</span>
                                         </div>
                                         <div style={{ fontFamily: 'monospace', fontWeight: '500', color: '#4b5563' }}>
                                             {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                         </div>
                                     </div>
                                 )
                             })}
                        </div>
                    )}

                    {/* SELECTOR */}
                    {bookingType === 'ngay' ? (
                        <div style={{ ...styles.statusBox, backgroundColor: isDayBookingAvailable ? '#f0fdf4' : '#fef2f2', borderColor: isDayBookingAvailable ? '#bbf7d0' : '#fecaca', color: isDayBookingAvailable ? '#166534' : '#991b1b' }}>
                            {isDayBookingAvailable ? <Check size={20}/> : <AlertCircle size={20}/>}
                            <div>
                                <div style={{ fontWeight: '700' }}>{isDayBookingAvailable ? 'Có thể đặt' : 'Không thể đặt'}</div>
                                <div style={{ fontSize: '13px', opacity: 0.9 }}>{isDayBookingAvailable ? 'Phòng trống.' : 'Đã vướng lịch.'}</div>
                            </div>
                        </div>
                    ) : (
                        selectedDate ? (
                             <>
                                <label style={styles.label}>Chọn khung giờ</label>
                                <TimeSlotSelector roomId={formData.room} selectedDate={selectedDate} selectedSlots={selectedTimeSlots} onSlotsChange={setSelectedTimeSlots} existingBookings={existingBookings} />
                             </>
                        ) : <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>Vui lòng chọn ngày</div>
                    )}
                </div>
             )}
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div style={styles.footer}>
             <button type="button" onClick={() => navigate(-1)} style={{ ...styles.btn, backgroundColor: 'white', border: '1px solid #d1d5db', color: '#4b5563' }}><RefreshCw size={16}/> Hủy</button>
             <button type="submit" disabled={loading || formData.cccdFrontUploading || formData.cccdBackUploading} style={{ ...styles.btn, backgroundColor: '#0d9488', color: 'white', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                <Check size={16}/> {loading ? 'Đang xử lý...' : 'Xác Nhận Tạo Đơn'}
             </button>
        </div>

      </form>
    </div>
  );
}