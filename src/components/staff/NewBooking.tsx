import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { 
  Calendar, Users, Clock, RefreshCw, Check, AlertCircle, UploadCloud, 
  ChevronRight, ArrowLeft, CheckCircle2, Info, FileText, Search, Grid, List, Plus, Eye, Ban, Phone, MapPin, StickyNote, Image as ImageIcon, PenTool, X, User
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMinutes, isValid, differenceInHours } from 'date-fns';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return (
            <div>
                <div style={{fontWeight: 'bold', fontSize: '13px'}}>{format(d, 'dd/MM/yy')}</div>
                <div style={{fontSize: '11px', color: '#6b7280'}}>{format(d, 'HH:mm')}</div>
            </div>
        );
    } catch { return '-'; }
};

const formatTimeRange = (startStr: string, endStr: string) => {
    try {
        const start = new Date(startStr);
        const end = new Date(endStr);
        return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
    } catch { return 'Errors'; }
};

const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '-';
    try {
        const diffMins = differenceInMinutes(new Date(end), new Date(start));
        const hours = Math.floor(diffMins / 60);
        const days = Math.floor(hours / 24);
        
        return (
            <div>
                <div style={{fontWeight: 'bold', fontSize: '13px'}}>{hours}h</div>
                {days >= 1 && <div style={{fontSize: '11px', color: '#6b7280'}}>({days} đêm)</div>}
            </div>
        );
    } catch { return '-'; }
};

const getStatusBadge = (status: string) => {
    const styleBase: React.CSSProperties = { padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', border: '1px solid', display: 'inline-block' };
    
    switch (status) {
        case 'cho_coc': return <span style={{...styleBase, backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fdba74'}}>Chưa thanh toán</span>;
        case 'da_coc': return <span style={{...styleBase, backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#86efac'}}>Đã thanh toán</span>;
        case 'da_nhan_phong': return <span style={{...styleBase, backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#93c5fd'}}>Đã nhận</span>;
        case 'da_tra_phong': return <span style={{...styleBase, backgroundColor: '#f3f4f6', color: '#4b5563', borderColor: '#d1d5db'}}>Đã trả</span>;
        case 'da_huy': return <span style={{...styleBase, backgroundColor: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5'}}>Đã hủy</span>;
        default: return <span style={{...styleBase, backgroundColor: '#f3f4f6', color: '#4b5563', borderColor: '#d1d5db'}}>{status}</span>;
    }
};

const getChannelBadge = (channel: string) => {
    return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', textTransform: 'capitalize' }}>{channel}</span>
};

// --- STYLES OBJECT ---
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '20px 16px', paddingBottom: '100px', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#1f2937' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { padding: '10px', borderRadius: '50%', border: 'none', backgroundColor: 'white', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px', margin: 0 },
  
  // Layout
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' },
  col: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f3f4f6' },
  cardHeader: { fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  stepBadge: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },

  // Form Elements
  formGroup: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputWrapper: { width: '100%' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  select: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  tabContainer: { display: 'flex', gap: '12px', marginBottom: '24px' },
  tabBtn: { flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' },
  uploadGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  uploadBox: { height: '110px', border: '2px dashed #e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f9fafb', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' },
  uploadedImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeBtn: { position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  statusBox: { padding: '16px', borderRadius: '12px', border: '1px solid', display: 'flex', alignItems: 'start', gap: '12px' },
  footer: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '40px' },
  btn: { padding: '12px 32px', borderRadius: '99px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  bookingListCard: { backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px', marginTop: '16px' },
  bookingListItem: { backgroundColor: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  lookupContainer: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '32px' },
  lookupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' },
  searchBox: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', flex: 1, minWidth: '200px' },
  searchInput: { border: 'none', outline: 'none', padding: '10px 0', fontSize: '14px', width: '100%', marginLeft: '8px' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' },
  modalContent: { backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' },
  modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  cccdContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' },
  cccdImage: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: '#f9fafb' },
  cccdPlaceholder: { width: '100%', height: '120px', borderRadius: '8px', border: '2px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px', backgroundColor: '#f9fafb', flexDirection: 'column', gap: '4px' },
  paymentSection: { padding: '16px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' },
  confirmBtn: { flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', backgroundColor: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  rejectBtn: { flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  btnAction: { width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' },
  manualBtn: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #d1d5db', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  toggleBtn: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 5px rgba(59, 130, 246, 0.3)' }
};

const tableStyles: { [key: string]: React.CSSProperties } = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '16px' },
  th: { textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700', backgroundColor: '#f8fafc', whiteSpace: 'nowrap' },
  td: { padding: '10px', borderBottom: '1px solid #f1f5f9', color: '#334155', verticalAlign: 'middle' },
  tr: { cursor: 'pointer', transition: 'background-color 0.15s' },
  badge: { padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', display: 'inline-block' },
  availableBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    border: '1px solid #bbf7d0'
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
      if (slot.start < bEnd && slot.end > bStart) return { available: false, reason: 'booked' };
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#0f7072' }}></div>Đang chọn</div>
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
  // State Form
  const [formData, setFormData] = useState({ customerName: '', customerPhone: '', customerEmail: '', location: '', concept: '', room: '', numberOfGuests: 2, notes: '', bookingSource: 'facebook', paymentMethod: 'transfer', cccdFront: '', cccdBack: '', cccdFrontUploading: false, cccdBackUploading: false });
  const [bookingType, setBookingType] = useState<'ngay' | 'gio'>('ngay');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<any[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  
  // State Data & Lookup
  const [fetchingBookings, setFetchingBookings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  // State for Lookup Tool
  const [lookupDate, setLookupDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lookupBookings, setLookupBookings] = useState<any[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showHistoryTable, setShowHistoryTable] = useState(false); // Toggle 2 bảng

  // Modal & Form Visibility
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ type: 'approve' | 'reject', bookingId: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBookingSection, setShowBookingSection] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);

  const [filteredConcepts, setFilteredConcepts] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  // Init
  useEffect(() => { 
      fetchData(); 
      const today = new Date().toISOString().split('T')[0]; 
      setSelectedDate(today); 
      setLookupDate(today);
      fetchAllBookingsForLookup(today); 
  }, []);

  useEffect(() => { if (formData.location) { setFilteredConcepts(concepts.filter((c: any) => c.id_co_so === formData.location)); } else setFilteredConcepts([]); }, [formData.location, concepts]);
  useEffect(() => { if (formData.concept) { setFilteredRooms(rooms.filter((r: any) => r.id_loai_phong === formData.concept && r.trang_thai === 'trong')); } else setFilteredRooms([]); }, [formData.concept, rooms]);
  useEffect(() => { if (formData.room && selectedDate) { fetchBookingsForRoom(); } else { setExistingBookings([]); } setSelectedTimeSlots([]); }, [formData.room, selectedDate]);
  
  // Khi đổi ngày trong "Tra cứu nhanh", load lại dữ liệu
  useEffect(() => { 
      if (lookupDate && !showHistoryTable) fetchAllBookingsForLookup(lookupDate); 
  }, [lookupDate, showHistoryTable]);

  // Khi bật "Lịch sử đơn", load ALL
  useEffect(() => {
      if (showHistoryTable) fetchAllHistoryBookings();
  }, [showHistoryTable]);

  const fetchData = async () => {
    try {
      const [locRes, conceptRes, roomRes] = await Promise.all([ 
          fetch(`${API_URL}/co-so`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }), 
          fetch(`${API_URL}/loai-phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }), 
          fetch(`${API_URL}/phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }),
      ]);
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
      const response = await fetch(`${API_URL}/dat-phong?start_date=${bufferStart.toISOString()}&end_date=${checkDate.toISOString()}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      const data = await response.json();
      if (data.success) {
        const roomBookings = data.data.filter((b: any) => b.id_phong === formData.room && b.trang_thai !== 'da_huy');
        setExistingBookings(roomBookings);
      }
    } catch (error) { console.error(error); } finally { setFetchingBookings(false); }
  };

  // --- FETCH DATA CHO 2 BẢNG ---
  // 1. Fetch theo ngày (cho bảng Tra Cứu Phòng)
  const fetchAllBookingsForLookup = async (dateStr: string) => {
      setIsLookingUp(true);
      try {
          const date = new Date(dateStr);
          const start = new Date(date); start.setHours(0,0,0,0);
          const end = new Date(date); end.setHours(23,59,59,999);
          const response = await fetch(`${API_URL}/dat-phong?start_date=${start.toISOString()}&end_date=${end.toISOString()}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
          const data = await response.json();
          if(data.success) setLookupBookings(data.data.filter((b:any) => b.trang_thai !== 'da_huy'));
      } catch { } finally { setIsLookingUp(false); }
  };

  // 2. Fetch ALL (cho bảng Lịch Sử - Ẩn)
  const fetchAllHistoryBookings = async () => {
      setIsLookingUp(true);
      try {
          const response = await fetch(`${API_URL}/dat-phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
          const data = await response.json();
          if(data.success) setLookupBookings(data.data); // Dùng chung state, nhưng data nhiều hơn
      } catch { } finally { setIsLookingUp(false); }
  };

  // --- LOGIC LỌC & SẮP XẾP ---
  // Dành cho bảng "Tra Cứu Phòng" (Default View)
  const lookupRooms = useMemo(() => {
     return rooms.filter(r => 
        r.ma_phong.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.loai_phong?.ten_loai?.toLowerCase().includes(searchTerm.toLowerCase())
     );
  }, [rooms, searchTerm]);

  const getRoomDailySchedule = (roomId: string) => {
      if (!lookupDate) return [];
      const dayStart = new Date(lookupDate); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(lookupDate); dayEnd.setHours(23, 59, 59, 999);

      const bookings = lookupBookings.filter(b => {
        if (b.id_phong !== roomId) return false;
        const bookingStart = new Date(b.thoi_gian_nhan);
        const bookingEnd = new Date(b.thoi_gian_tra);
        // Overlap Logic
        return bookingStart < dayEnd && bookingEnd > dayStart;
      });

      bookings.sort((a, b) => new Date(a.thoi_gian_nhan).getTime() - new Date(b.thoi_gian_nhan).getTime());
      return bookings;
  };

  // Dành cho bảng "Lịch Sử Đơn" (Hidden View)
  const sortedHistoryBookings = useMemo(() => {
    let filtered = [...lookupBookings];
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter(b => 
            b.ma_dat?.toLowerCase().includes(lower) ||
            b.khach_hang?.ho_ten?.toLowerCase().includes(lower) ||
            b.khach_hang?.sdt?.includes(lower) ||
            b.phong?.ma_phong?.toLowerCase().includes(lower)
        );
    }
    // Sort mới nhất lên đầu
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [lookupBookings, searchTerm]);

  // --- HANDLERS ---
  const handleSelectRoomFromLookup = (room: any) => {
      setFormData(prev => ({
          ...prev,
          location: room.loai_phong?.id_co_so || '',
          concept: room.id_loai_phong || '',
          room: room.id
      }));
      setSelectedDate(lookupDate);
      setShowBookingSection(true);
      setTimeout(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  const handleManualCreate = () => {
      setShowBookingSection(true);
      setTimeout(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  const handleViewBookingDetail = async (booking: any) => {
      setViewLoadingId(booking.id); 
      try {
          const res = await fetch(`${API_URL}/dat-phong/${booking.id}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
          const data = await res.json();
          if (data.success) setBookingDetail(data.data);
          else setBookingDetail(booking);
      } catch { setBookingDetail(booking); } finally { setViewLoadingId(null); }
  };

  const handleProcessBooking = async () => {
    if (!showConfirmDialog) return;
    const { type, bookingId } = showConfirmDialog;
    setActionLoading(true);
    try {
        const status = type === 'approve' ? 'da_coc' : 'da_huy';
        const noteUpdate = type === 'reject' ? (bookingDetail?.ghi_chu ? `${bookingDetail.ghi_chu} [Đã từ chối]` : '[Đã từ chối]') : undefined;
        const body: any = { trang_thai: status };
        if (noteUpdate) body.ghi_chu = noteUpdate;
        
        await fetch(`${API_URL}/dat-phong/${bookingId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
            body: JSON.stringify(body)
        });
        toast.success(type === 'approve' ? 'Đã xác nhận thanh toán!' : 'Đã từ chối đơn!');
        setShowConfirmDialog(null);
        setBookingDetail(null);
        // Refresh data tùy view đang đứng
        if (showHistoryTable) fetchAllHistoryBookings(); else fetchAllBookingsForLookup(lookupDate);
    } catch { toast.error('Lỗi kết nối'); } finally { setActionLoading(false); }
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
      if (showHistoryTable) fetchAllHistoryBookings(); else fetchAllBookingsForLookup(lookupDate);
      setShowBookingSection(false); 
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
        <div style={styles.headerLeft}>
            {/* <button onClick={() => navigate(-1)} style={styles.backBtn}>
                <ArrowLeft size={24} color="#4b5563" />
            </button> */}
            <div>
                <h1 style={styles.pageTitle}>Tạo Đơn Đặt Phòng</h1>

            </div>
        </div>
        
        {/* Toggle Lookup/History Button */}
        <button onClick={() => setShowHistoryTable(!showHistoryTable)} style={styles.toggleBtn}>
            {showHistoryTable ? <Grid size={16}/> : <List size={16}/>}
            {showHistoryTable ? 'Xem lịch phòng (Theo ngày)' : 'Tra cứu lịch sử đơn (Chi tiết)'}
        </button>
      </div>

      {/* --- TABLE AREA: SWITCH BETWEEN "AVAILABILITY" AND "HISTORY" --- */}
      <div style={styles.lookupContainer}>
        {showHistoryTable ? (
            // --- VIEW 2: BẢNG LỊCH SỬ ĐƠN (CHI TIẾT, TÌM KIẾM TOÀN BỘ) ---
            <>
                <div style={styles.lookupHeader}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <List size={18} /> Danh sách tất cả đơn đặt phòng
                    </h3>
                    <div style={styles.searchBox}>
                        <Search size={14} color="#94a3b8"/>
                        <input type="text" placeholder="Tìm kiếm đơn (Mã, Tên, SĐT)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                    </div>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
                    <table style={tableStyles.table}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={tableStyles.th}>Mã đơn</th>
                                <th style={tableStyles.th}>Khách hàng</th>
                                <th style={{...tableStyles.th, textAlign: 'center'}}>Phòng</th>
                                <th style={tableStyles.th}>Check-in</th>
                                <th style={tableStyles.th}>Check-out</th>
                                <th style={tableStyles.th}>Thời gian</th>
                                <th style={tableStyles.th}>Kênh</th>
                                <th style={tableStyles.th}>Trạng thái</th>
                                <th style={{...tableStyles.th, textAlign: 'right'}}>Tổng tiền</th>
                                <th style={{...tableStyles.th, textAlign: 'center'}}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHistoryBookings.map((booking: any) => (
                                <tr key={booking.id} style={tableStyles.tr} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={{...tableStyles.td, fontFamily: 'monospace', color: '#2563eb', fontWeight: 'bold'}}>{booking.ma_dat}</td>
                                    <td style={{...tableStyles.td, fontWeight: '600'}}>
                                        <div>{booking.khach_hang?.ho_ten || 'Khách lẻ'}</div>
                                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'normal' }}>{booking.khach_hang?.sdt}</div>
                                    </td>
                                    <td style={{...tableStyles.td, textAlign: 'center', fontWeight: '700'}}>{booking.phong?.ma_phong}</td>
                                    <td style={tableStyles.td}>{formatDate(booking.thoi_gian_nhan)}</td>
                                    <td style={tableStyles.td}>{formatDate(booking.thoi_gian_tra)}</td>
                                    <td style={tableStyles.td}><span style={{ fontSize: '12px', color: '#6b7280' }}>{calculateDuration(booking.thoi_gian_nhan, booking.thoi_gian_tra)}</span></td>
                                    <td style={tableStyles.td}>{booking.kenh_dat}</td>
                                    <td style={tableStyles.td}>{getStatusBadge(booking.trang_thai)}</td>
                                    <td style={{...tableStyles.td, textAlign: 'right', fontWeight: 'bold'}}>{formatCurrency(booking.tong_tien)}</td>
                                    <td style={{...tableStyles.td, textAlign: 'center'}}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            {booking.trang_thai === 'cho_coc' && (
                                                <button onClick={() => handleViewBookingDetail(booking)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={12}/> Xác nhận</button>
                                            )}
                                            <button onClick={() => handleViewBookingDetail(booking)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Eye size={12}/> Xem</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sortedHistoryBookings.length === 0 && <tr><td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>{isLookingUp ? 'Đang tải...' : 'Không có đơn nào.'}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </>
        ) : (
            // --- VIEW 1: BẢNG TRA CỨU PHÒNG THEO NGÀY (NHƯ CŨ) ---
            <>
                <div style={styles.lookupHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <Grid size={18} /> Tình trạng phòng theo ngày
                        </h3>
                        {!showBookingSection && <button onClick={handleManualCreate} style={styles.manualBtn}><PenTool size={14}/> Nhập tay</button>}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Ngày xem:</label>
                            <input type="date" value={lookupDate} onChange={(e) => setLookupDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                        </div>
                        <div style={styles.searchBox}>
                            <Search size={14} color="#94a3b8"/>
                            <input type="text" placeholder="Tìm phòng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '12px', color: '#64748b', paddingLeft: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }}></div> Trống</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div> Đã đặt / Đang ở</div>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', position: 'relative' }}>
                    {isLookingUp && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}><RefreshCw size={24} className="animate-spin text-teal-600" /></div>}
                    <table style={tableStyles.table}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={tableStyles.th}>Cơ sở</th>
                                <th style={tableStyles.th}>Loại phòng</th>
                                <th style={tableStyles.th}>Mã phòng</th>
                                <th style={tableStyles.th}>Mã đơn</th>
                                <th style={tableStyles.th}>Khách hàng</th>
                                <th style={tableStyles.th}>Check-in</th>
                                <th style={tableStyles.th}>Check-out</th>
                                <th style={tableStyles.th}>Thời gian</th>
                                <th style={tableStyles.th}>Kênh</th>
                                <th style={tableStyles.th}>Trạng thái</th>
                                <th style={{...tableStyles.th, textAlign: 'right'}}>Tổng tiền</th>
                                <th style={{...tableStyles.th, textAlign: 'center'}}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lookupRooms.map(room => {
                                const bookings = getRoomDailySchedule(room.id);
                                const isMaintenance = room.trang_thai === 'bao_tri';
                                
                                let totalBookedHours = 0;
                                bookings.forEach(b => {
                                    const diff = differenceInHours(new Date(b.thoi_gian_tra), new Date(b.thoi_gian_nhan));
                                    totalBookedHours += diff;
                                });
                                const isFullDayBooked = totalBookedHours > 20;

                                const rows = [];
                                
                                if (bookings.length > 0) {
                                    bookings.forEach(booking => {
                                        rows.push(
                                            <tr key={booking.id} style={tableStyles.tr} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={{...tableStyles.td, fontSize: '11px', color: '#6b7280'}}>{room.loai_phong?.co_so?.ten_co_so || '-'}</td>
                                                <td style={{...tableStyles.td, fontSize: '12px', fontWeight: '500'}}>{room.loai_phong?.ten_loai || '-'}</td>
                                                <td style={{...tableStyles.td, textAlign: 'center', fontWeight: '700', color: '#1f2937'}}>{room.ma_phong}</td>
                                                <td style={{...tableStyles.td, fontFamily: 'monospace', color: '#2563eb', fontWeight: 'bold'}}>{booking.ma_dat}</td>
                                                <td style={{...tableStyles.td, fontWeight: '600'}}>
                                                    <div>{booking.khach_hang?.ho_ten || 'Khách lẻ'}</div>
                                                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'normal' }}>{booking.khach_hang?.sdt}</div>
                                                </td>
                                                <td style={tableStyles.td}>{formatDate(booking.thoi_gian_nhan)}</td>
                                                <td style={tableStyles.td}>{formatDate(booking.thoi_gian_tra)}</td>
                                                <td style={tableStyles.td}>{calculateDuration(booking.thoi_gian_nhan, booking.thoi_gian_tra)}</td>
                                                <td style={tableStyles.td}>{booking.kenh_dat}</td>
                                                <td style={tableStyles.td}>{getStatusBadge(booking.trang_thai)}</td>
                                                <td style={{...tableStyles.td, textAlign: 'right', fontWeight: 'bold'}}>{formatCurrency(booking.tong_tien)}</td>
                                                <td style={{...tableStyles.td, textAlign: 'center'}}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                        {booking.trang_thai === 'cho_coc' && <button onClick={() => handleViewBookingDetail(booking)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={12}/> Xác nhận</button>}
                                                        <button onClick={() => handleViewBookingDetail(booking)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Eye size={12}/> Xem</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    });
                                }

                                if (!isMaintenance && !isFullDayBooked) {
                                    rows.push(
                                        <tr key={`empty-${room.id}`} style={tableStyles.tr} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{...tableStyles.td, fontSize: '11px', color: '#6b7280'}}>{room.loai_phong?.co_so?.ten_co_so || '-'}</td>
                                            <td style={{...tableStyles.td, fontSize: '12px', fontWeight: '500'}}>{room.loai_phong?.ten_loai || '-'}</td>
                                            <td style={{...tableStyles.td, textAlign: 'center', fontWeight: '700', color: '#15803d'}}>{room.ma_phong}</td>
                                            <td style={tableStyles.td}>-</td>
                                            <td style={{...tableStyles.td, color: '#94a3b8', fontStyle: 'italic'}}>Chưa có khách</td>
                                            <td style={tableStyles.td}>-</td>
                                            <td style={tableStyles.td}>-</td>
                                            <td style={tableStyles.td}>-</td>
                                            <td style={tableStyles.td}>-</td>
                                            <td style={tableStyles.td}>
                                                <span style={{display: 'inline-block', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0'}}>Trống</span>
                                            </td>
                                            <td style={{...tableStyles.td, textAlign: 'right'}}>-</td>
                                            <td style={{...tableStyles.td, textAlign: 'center'}}>
                                                <button onClick={() => handleSelectRoomFromLookup(room)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Plus size={12}/> Chọn</button>
                                            </td>
                                        </tr>
                                    );
                                }
                                if (isMaintenance) {
                                     rows.push(
                                        <tr key={`maint-${room.id}`} style={tableStyles.tr}>
                                            <td style={{...tableStyles.td, fontSize: '11px', color: '#6b7280'}}>{room.loai_phong?.co_so?.ten_co_so || '-'}</td>
                                            <td style={{...tableStyles.td, fontSize: '12px', fontWeight: '500'}}>{room.loai_phong?.ten_loai || '-'}</td>
                                            <td style={{...tableStyles.td, textAlign: 'center', fontWeight: '700', color: '#64748b'}}>{room.ma_phong}</td>
                                            <td colSpan={8} style={{...tableStyles.td, textAlign: 'center', fontStyle: 'italic', color: '#64748b'}}>Phòng đang bảo trì</td>
                                            <td style={tableStyles.td}></td>
                                        </tr>
                                     )
                                }
                                return rows;
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        )}
      </div>

      {/* DETAIL MODAL & FORM (GIỮ NGUYÊN) */}
      {/* ... (Phần dưới giữ nguyên như các modal và form đã làm) ... */}
      {/* ... (Copy lại phần Modal Detail, Confirm Dialog và Form từ bản trước) ... */}
      {bookingDetail && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18}/> Chi tiết đơn
                </h2>
                <button onClick={() => setBookingDetail(null)} style={{ padding: '6px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
                 {/* Customer */}
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}><User size={20}/></div>
                    <div>
                        <p style={{ fontWeight: 'bold', color: '#111827', margin: 0 }}>{bookingDetail.khach_hang?.ho_ten || bookingDetail.ho_ten}</p>
                        <p style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}><Phone size={12}/> {bookingDetail.khach_hang?.sdt || bookingDetail.sdt}</p>
                    </div>
                </div>

                {/* CCCD */}
                <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>GIẤY TỜ TÙY THÂN</p>
                    <div style={styles.cccdContainer}>
                        {bookingDetail.khach_hang?.cccd_mat_truoc ? (
                            <div style={{...styles.uploadBox, border: '1px solid #e5e7eb'}} onClick={() => window.open(bookingDetail.khach_hang.cccd_mat_truoc, '_blank')}>
                                <img src={bookingDetail.khach_hang.cccd_mat_truoc} style={styles.uploadedImg} alt="Trước"/>
                            </div>
                        ) : <div style={styles.uploadBox}><div style={{ color: '#9ca3af', fontSize: '12px' }}>Không có ảnh trước</div></div>}
                        {bookingDetail.khach_hang?.cccd_mat_sau ? (
                            <div style={{...styles.uploadBox, border: '1px solid #e5e7eb'}} onClick={() => window.open(bookingDetail.khach_hang.cccd_mat_sau, '_blank')}>
                                <img src={bookingDetail.khach_hang.cccd_mat_sau} style={styles.uploadedImg} alt="Sau"/>
                            </div>
                        ) : <div style={styles.uploadBox}><div style={{ color: '#9ca3af', fontSize: '12px' }}>Không có ảnh sau</div></div>}
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <div><span style={{ color: '#6b7280', fontSize: '11px' }}>Phòng</span><div style={{ fontWeight: 'bold', color: '#111827' }}><MapPin size={12} style={{display:'inline', marginRight:4}}/> {bookingDetail.phong?.ma_phong}</div></div>
                    <div><span style={{ color: '#6b7280', fontSize: '11px' }}>Tổng tiền</span><div style={{ fontWeight: 'bold', color: '#111827' }}>{formatCurrency(bookingDetail.tong_tien)}</div></div>
                    <div><span style={{ color: '#6b7280', fontSize: '11px' }}>Check-in</span><div style={{ fontWeight: '600' }}>{formatDate(bookingDetail.thoi_gian_nhan)}</div></div>
                    <div><span style={{ color: '#6b7280', fontSize: '11px' }}>Check-out</span><div style={{ fontWeight: '600' }}>{formatDate(bookingDetail.thoi_gian_tra)}</div></div>
                </div>

                {/* Actions for Pending */}
                {bookingDetail.trang_thai === 'cho_coc' && (
                    <div style={styles.paymentSection}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#b45309', fontSize: '13px', fontWeight: '600' }}>
                            <AlertCircle size={16}/> Khách chưa thanh toán cọc
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowConfirmDialog({ type: 'reject', bookingId: bookingDetail.id })} style={styles.rejectBtn}>
                                <Ban size={16}/> Từ chối
                            </button>
                            <button onClick={() => setShowConfirmDialog({ type: 'approve', bookingId: bookingDetail.id })} style={styles.confirmBtn}>
                                <Check size={16}/> Xác nhận
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {showConfirmDialog && (
        <div style={styles.modalOverlay}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    {showConfirmDialog.type === 'approve' ? 'Xác nhận thanh toán?' : 'Từ chối đơn này?'}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
                    {showConfirmDialog.type === 'approve' ? 'Đơn sẽ chuyển sang trạng thái "Đã cọc".' : 'Đơn sẽ bị hủy và phòng sẽ trống.'}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowConfirmDialog(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleProcessBooking} disabled={actionLoading} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: showConfirmDialog.type === 'approve' ? '#16a34a' : '#dc2626', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                        {actionLoading ? 'Đang xử lý...' : 'Đồng ý'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- FORM ĐẶT PHÒNG (HIDDEN INITIALLY) --- */}
      {showBookingSection && (
        <div ref={formRef} className="animate-in fade-in slide-in-from-bottom-10 duration-500" style={{ marginTop: '40px', borderTop: '2px dashed #e2e8f0', paddingTop: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Thông tin đặt phòng</h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Điền đầy đủ thông tin khách và lịch đặt</p>
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
                            selectedDate ? (
                                <div style={{ ...styles.statusBox, backgroundColor: isDayBookingAvailable ? '#f0fdf4' : '#fef2f2', borderColor: isDayBookingAvailable ? '#bbf7d0' : '#fecaca', color: isDayBookingAvailable ? '#166534' : '#991b1b' }}>
                                    {isDayBookingAvailable ? <Check size={20}/> : <AlertCircle size={20}/>}
                                    <div>
                                        <div style={{ fontWeight: '700' }}>{isDayBookingAvailable ? 'Có thể đặt' : 'Không thể đặt'}</div>
                                        <div style={{ fontSize: '13px', opacity: 0.9 }}>{isDayBookingAvailable ? 'Phòng trống.' : 'Đã vướng lịch.'}</div>
                                    </div>
                                </div>
                            ) : <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>Vui lòng chọn ngày</div>
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
                <button type="button" onClick={() => setShowBookingSection(false)} style={{ ...styles.btn, backgroundColor: 'white', border: '1px solid #d1d5db', color: '#4b5563' }}><RefreshCw size={16}/> Đóng</button>
                <button type="submit" disabled={loading || formData.cccdFrontUploading || formData.cccdBackUploading} style={{ ...styles.btn, backgroundColor: '#0d9488', color: 'white', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    <Check size={16}/> {loading ? 'Đang xử lý...' : 'Xác Nhận Tạo Đơn'}
                </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}