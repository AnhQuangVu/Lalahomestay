import { useState, useEffect, useMemo } from 'react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { Calendar, Users, Clock, RefreshCw, Check, AlertCircle, UploadCloud, ChevronRight, ArrowLeft } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

// --- SUB-COMPONENT: TimeSlotSelector (Timeline chọn giờ) ---
function TimeSlotSelector({
  roomId,
  selectedDate,
  selectedSlots,
  onSlotsChange,
  existingBookings
}: {
  roomId: string;
  selectedDate: string;
  selectedSlots: { start: string, end: string } | null;
  onSlotsChange: (slots: { start: string, end: string } | null) => void;
  existingBookings: any[];
}) {
  // Tạo timeline: 06:00 ngày N đến 06:00 ngày N+1 (30 phút/slot)
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const slots = [];
    // Dùng chuỗi ISO để đảm bảo ngày giờ chính xác
    let date = new Date(`${selectedDate}T06:00:00`);
    for (let i = 0; i < 48; i++) {
      slots.push({
        label: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(date),
      });
      date = new Date(date.getTime() + 30 * 60 * 1000); // +30 phút
    }
    return slots;
  }, [selectedDate]);

  // Kiểm tra khả dụng (Logic Buffer chồng chéo, cho phép đặt nếu chạm đúng ranh buffer)
  const isTimeSlotAvailable = (slot: { label: string, date: Date }) => {
    const slotStart = slot.date;
    const slotEnd = new Date(slot.date.getTime() + 30 * 60 * 1000);

    for (const booking of existingBookings) {
      const bookingStart = new Date(booking.thoi_gian_nhan);
      const bookingEnd = new Date(booking.thoi_gian_tra);
      const bufferStart = new Date(bookingStart.getTime() - 30 * 60 * 1000);
      const bufferEnd = new Date(bookingEnd.getTime() + 30 * 60 * 1000);

      // Nếu slotEnd == bufferStart hoặc slotStart == bufferEnd thì cho phép đặt (chạm biên)
      if (slotEnd.getTime() === bufferStart.getTime() || slotStart.getTime() === bufferEnd.getTime()) {
        continue;
      }
      // Nếu slotStart < bufferEnd && slotEnd > bufferStart thì bị trùng
      if (slotStart < bufferEnd && slotEnd > bufferStart) {
        return false;
      }
    }
    return true;
  };

  // Logic màu sắc timeline theo quy tắc mới
  const getSlotColor = (slot: { label: string, date: Date }) => {
    const hour = slot.date.getHours();
    const minute = slot.date.getMinutes();

    // 06:00–06:30 và 21:30–22:00 luôn màu xám, không cho đặt
    const slotTime = hour * 60 + minute;
    if ((slotTime >= 360 && slotTime < 390) || (slotTime >= 1290 && slotTime < 1320)) {
      // 06:00–06:30 (360–390), 21:30–22:00 (1290–1320)
      return 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200';
    }

    if (!isTimeSlotAvailable(slot)) {
      return 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200'; // Màu xám (Đã đặt/Buffer)
    }

    // Vàng: 06:30–21:30 (390–1290)
    if (slotTime >= 390 && slotTime < 1290) {
      return 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200';
    }
    // Xanh: 22:00–06:00 hôm sau (1320–1440 hoặc 0–360)
    if ((slotTime >= 1320 && slotTime < 1440) || (slotTime >= 0 && slotTime < 360)) {
      return 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-200';
    }
    // Default: xám
    return 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200';
  };

  const handleSlotClick = (slot: { label: string, date: Date }) => {
    if (!isTimeSlotAvailable(slot)) return;

    const slotDateTime = slot.date.toISOString();

    if (!selectedSlots) {
      // Chọn điểm đầu tiên
      onSlotsChange({ start: slotDateTime, end: slotDateTime });
    } else {
      const startTime = new Date(selectedSlots.start);
      const endTime = new Date(selectedSlots.end);
      const clickedTime = slot.date;

      // Nếu click vào vùng đã chọn -> Hủy chọn
      if (clickedTime.getTime() >= startTime.getTime() && clickedTime.getTime() <= endTime.getTime()) {
        onSlotsChange(null);
        return;
      }

      // Logic chọn khoảng (Range selection)
      if (clickedTime < startTime) {
        onSlotsChange({ start: slotDateTime, end: selectedSlots.end });
      } else {
        onSlotsChange({ start: selectedSlots.start, end: slotDateTime });
      }
    }
  };

  const isSlotSelected = (slotDate: Date) => {
    if (!selectedSlots) return false;
    const start = new Date(selectedSlots.start);
    const end = new Date(selectedSlots.end);
    return slotDate.getTime() >= start.getTime() && slotDate.getTime() <= end.getTime();
  };

  return (
    <div style={{ marginTop: 8, marginBottom: 8 }}>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px', fontSize: 14, color: '#555', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24' }}></div>Ngày (06:30-21:30)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#6366f1' }}></div>Đêm (21:30-06:30)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#d1d5db' }}></div>Không khả dụng</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#14b8a6' }}></div>Đang chọn</div>
      </div>

      {/* Time Slot Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
        gap: 8,
        padding: 16,
        background: '#f9fafb',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        maxHeight: 320,
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
        {timeSlots.map((slot, idx) => {
          const isCurrentlySelected = isSlotSelected(slot.date);
          const baseColorClass = getSlotColor(slot);
          let style: React.CSSProperties = {
            padding: '8px 4px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: '1px solid',
            transition: 'all 0.15s',
            outline: 'none',
            cursor: baseColorClass.includes('cursor-not-allowed') ? 'not-allowed' : 'pointer',
            boxShadow: isCurrentlySelected ? '0 2px 8px rgba(20,184,166,0.15)' : undefined,
            transform: isCurrentlySelected ? 'scale(1.08)' : undefined,
            zIndex: isCurrentlySelected ? 10 : undefined,
          };
          // Color logic
          if (isCurrentlySelected) {
            style.background = '#14b8a6';
            style.color = '#fff';
            style.borderColor = '#14b8a6';
          } else if (baseColorClass.includes('bg-gray-200')) {
            style.background = '#d1d5db';
            style.color = '#9ca3af';
            style.borderColor = '#d1d5db';
          } else if (baseColorClass.includes('bg-amber-100')) {
            style.background = '#fef3c7';
            style.color = '#b45309';
            style.borderColor = '#fde68a';
          } else if (baseColorClass.includes('bg-indigo-100')) {
            style.background = '#e0e7ff';
            style.color = '#3730a3';
            style.borderColor = '#6366f1';
          }

          return (
            <button
              type="button"
              key={idx}
              onClick={() => handleSlotClick(slot)}
              disabled={baseColorClass.includes('cursor-not-allowed')}
              style={style}
            >
              {slot.label}
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

  // Form Data
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', customerEmail: '',
    location: '', concept: '', room: '',
    numberOfGuests: 2, notes: '', bookingSource: 'facebook', paymentMethod: 'transfer',
    cccdFront: '', cccdBack: '', cccdFrontUploading: false, cccdBackUploading: false
  });

  // State Logic Đặt Lịch
  const [bookingType, setBookingType] = useState<'ngay' | 'gio'>('ngay');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{ start: string, end: string } | null>(null);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);

  // Data Lists
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredConcepts, setFilteredConcepts] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  // --- INIT DATA ---
  useEffect(() => {
    fetchData();
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // --- FETCH BOOKINGS KHI CHỌN PHÒNG/NGÀY ---
  useEffect(() => {
    if (formData.room && selectedDate) {
      fetchBookingsForRoom();
    } else {
      setExistingBookings([]);
    }
    setSelectedTimeSlots(null);
  }, [formData.room, selectedDate]);

  const fetchBookingsForRoom = async () => {
    if (!formData.room || !selectedDate) return;
    setFetchingBookings(true);
    try {
      const startOfDay = `${selectedDate}T00:00:00`;
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 2); // Lấy dư ra 2 ngày để cover xuyên đêm
      const endOfNextDay = `${nextDay.toISOString().split('T')[0]}T00:00:00`;

      const response = await fetch(
        `${API_URL}/dat-phong?start_date=${startOfDay}&end_date=${endOfNextDay}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const data = await response.json();
      if (data.success) {
        const roomBookings = data.data.filter((b: any) =>
          b.id_phong === formData.room && b.trang_thai !== 'da_huy'
        );
        setExistingBookings(roomBookings);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingBookings(false);
    }
  };

  // --- FILTER LOGIC ---
  useEffect(() => {
    if (formData.location) {
      setFilteredConcepts(concepts.filter(c => c.id_co_so === formData.location));
    } else setFilteredConcepts([]);
    setFormData(prev => ({ ...prev, concept: '', room: '' }));
  }, [formData.location, concepts]);

  useEffect(() => {
    if (formData.concept) {
      setFilteredRooms(rooms.filter(r => r.id_loai_phong === formData.concept && r.trang_thai === 'trong'));
    } else setFilteredRooms([]);
    setFormData(prev => ({ ...prev, room: '' }));
  }, [formData.concept, rooms]);

  const fetchData = async () => {
    try {
      const [locRes, conceptRes, roomRes] = await Promise.all([
        fetch(`${API_URL}/co-so`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }),
        fetch(`${API_URL}/loai-phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }),
        fetch(`${API_URL}/phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } })
      ]);
      const [locData, conceptData, roomData] = await Promise.all([
        locRes.json(), conceptRes.json(), roomRes.json()
      ]);
      if (locData.success) setLocations(locData.data || []);
      if (conceptData.success) setConcepts(conceptData.data || []);
      if (roomData.success) setRooms((roomData.data || []).filter((r: any) => r.trang_thai !== 'dinh_chi'));
    } catch (error) { toast.error('Lỗi tải dữ liệu ban đầu'); }
  };

  // --- VALIDATION HELPERS ---
  const isDayBookingAvailable = useMemo(() => {
    if (!selectedDate || !formData.room) return false;
    const checkIn = new Date(`${selectedDate}T14:00:00`);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
    checkOut.setHours(12, 0, 0, 0);

    // Buffer: -30p checkin, +30p checkout
    const requestStart = new Date(checkIn.getTime() - 30 * 60 * 1000);
    const requestEnd = new Date(checkOut.getTime() + 30 * 60 * 1000);

    for (const booking of existingBookings) {
      const bStart = new Date(booking.thoi_gian_nhan);
      const bEnd = new Date(booking.thoi_gian_tra);
      if (requestStart < bEnd && requestEnd > bStart) return false;
    }
    return true;
  }, [selectedDate, formData.room, existingBookings]);

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalCheckIn = '';
    let finalCheckOut = '';

    if (bookingType === 'ngay') {
      if (!selectedDate) return toast.error('Vui lòng chọn ngày');
      if (!isDayBookingAvailable) return toast.error('Ngày này đã bị vướng lịch! Vui lòng kiểm tra lại.');

      finalCheckIn = `${selectedDate}T14:00:00`;
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      finalCheckOut = `${nextDay.toISOString().split('T')[0]}T12:00:00`;

    } else { // Theo giờ
      if (!selectedTimeSlots) return toast.error('Vui lòng chọn khung giờ trên timeline');
      finalCheckIn = selectedTimeSlots.start;
      // Cộng thêm 30p vào slot cuối cùng để ra giờ trả
      const endOfLastSlot = new Date(new Date(selectedTimeSlots.end).getTime() + 30 * 60 * 1000);
      finalCheckOut = endOfLastSlot.toISOString();
    }

    // Validate chung
    if (new Date(finalCheckIn) >= new Date(finalCheckOut)) return toast.error("Giờ trả phải sau giờ nhận.");
    if (!formData.customerName || !formData.customerPhone || !formData.room) return toast.error("Thiếu thông tin bắt buộc.");

    setLoading(true);
    try {
      const payload: any = {
        ho_ten: formData.customerName,
        sdt: formData.customerPhone,
        email: formData.customerEmail || null,
        id_phong: formData.room,
        thoi_gian_nhan: finalCheckIn,
        thoi_gian_tra: finalCheckOut,
        so_khach: formData.numberOfGuests || 1,
        ghi_chu: formData.notes || null,
        ghi_chu_khach: formData.notes || null,
        kenh_dat: formData.bookingSource,
        trang_thai: 'da_coc',
        cccd_mat_truoc: formData.cccdFront || null,
        cccd_mat_sau: formData.cccdBack || null
      };

      const response = await fetch(`${API_URL}/dat-phong`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Tạo đơn thành công! Mã: ${data.data?.ma_dat}`);
        // Reset Form
        setFormData(prev => ({ ...prev, customerName: '', customerPhone: '', customerEmail: '', notes: '', cccdFront: '', cccdBack: '' }));
        setSelectedTimeSlots(null);
        fetchBookingsForRoom(); // Refresh lại lịch
      } else {
        toast.error('Lỗi: ' + (data.error || 'Không xác định'));
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // Upload Handler
  const handleUploadCCCD = async (file: File, type: 'front' | 'back') => {
    if (!file) return;
    setFormData(prev => ({ ...prev, [type === 'front' ? 'cccdFrontUploading' : 'cccdBackUploading']: true }));
    try {
      const url = await uploadToCloudinary(file, 'cccd');
      setFormData(prev => ({ ...prev, [type === 'front' ? 'cccdFront' : 'cccdBack']: url, [type === 'front' ? 'cccdFrontUploading' : 'cccdBackUploading']: false }));
      toast.success('Đã tải ảnh lên');
    } catch (err) {
      setFormData(prev => ({ ...prev, [type === 'front' ? 'cccdFrontUploading' : 'cccdBackUploading']: false }));
      toast.error('Lỗi tải ảnh');
    }
  };

  // Tailwind Input Class
  const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 outline-none";

  return (
    <div className="max-w-6xl mx-auto pb-24 px-2 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Đơn Đặt Phòng</h1>
          <p className="text-sm text-gray-500">Dành cho Admin & Staff</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CỘT TRÁI: THÔNG TIN KHÁCH & THANH TOÁN */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" /> Thông tin khách
              </h2>
              <div className="flex flex-col gap-4">
                <input type="text" placeholder="Họ tên khách *" className={inputClass + ' w-full'} value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
                <input type="tel" placeholder="Số điện thoại *" className={inputClass + ' w-full'} value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} required />
                <input type="email" placeholder="Email" className={inputClass + ' w-full'} value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Số khách:</span>
                  <input type="number" min="1" className="w-20 p-1 bg-transparent text-center font-bold outline-none border-b-2 border-gray-300 focus:border-teal-500" value={formData.numberOfGuests} onChange={e => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Chi tiết đơn</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nguồn khách</label>
                  <select className={inputClass + ' w-full'} value={formData.bookingSource} onChange={e => setFormData({ ...formData, bookingSource: e.target.value })}>
                    <option value="facebook">Facebook</option>
                    <option value="zalo">Zalo</option>
                    <option value="phone">Điện thoại</option>
                    <option value="walkin">Vãng lai</option>
                    <option value="tiktok">TikTok</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Thanh toán</label>
                  <select className={inputClass + ' w-full'} value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                    <option value="transfer">Chuyển khoản</option>
                    <option value="cash">Tiền mặt</option>
                    <option value="card">Quẹt thẻ</option>
                    <option value="vnpay">VNPAY</option>
                    <option value="momo">Momo</option>
                  </select>
                </div>
                <textarea placeholder="Ghi chú..." className={inputClass + ' w-full'} rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
              </div>
            </div>

            {/* CCCD Upload */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Ảnh CCCD</h2>
              <div className="grid grid-cols-2 gap-3">
                {['front', 'back'].map((side) => (
                  <div key={side} className="relative group">
                    {formData[side === 'front' ? 'cccdFront' : 'cccdBack'] ? (
                      <div className="relative h-24 w-full rounded-lg overflow-hidden border border-teal-500">
                        <img src={formData[side === 'front' ? 'cccdFront' : 'cccdBack']} alt={side} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setFormData({ ...formData, [side === 'front' ? 'cccdFront' : 'cccdBack']: '' })} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-red-600">×</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-24 w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-teal-400 transition-all">
                        {formData[side === 'front' ? 'cccdFrontUploading' : 'cccdBackUploading'] ? (
                          <RefreshCw className="w-5 h-5 text-teal-500 animate-spin" />
                        ) : (
                          <>
                            <UploadCloud className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-500 mt-1 uppercase">{side === 'front' ? 'Mặt trước' : 'Mặt sau'}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadCCCD(e.target.files[0], side as 'front' | 'back')} disabled={formData.cccdFrontUploading || formData.cccdBackUploading} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: CHỌN PHÒNG & LỊCH */}
          <div className="flex flex-col gap-6">
            {/* 1. Chọn Phòng */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">1</div>
                Chọn Phòng
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="min-w-[140px] w-full">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Cơ sở</label>
                  <select className={inputClass + ' w-full min-w-[140px]'} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                    <option value="">-- Chọn cơ sở --</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.ten_co_so}</option>)}
                  </select>
                </div>
                <div className="min-w-[140px] w-full">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại phòng</label>
                  <select className={inputClass + ' w-full min-w-[140px]'} value={formData.concept} onChange={e => setFormData({ ...formData, concept: e.target.value })} disabled={!formData.location}>
                    <option value="">-- Chọn loại --</option>
                    {filteredConcepts.map(c => <option key={c.id} value={c.id}>{c.ten_loai}</option>)}
                  </select>
                </div>
                <div className="min-w-[140px] w-full">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Phòng số</label>
                  <select className={inputClass + ' w-full min-w-[140px]'} value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} disabled={!formData.concept}>
                    <option value="">-- Chọn phòng --</option>
                    {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.ma_phong} ({r.trang_thai === 'trong' ? 'Trống' : 'Đang dùng'})</option>)}
                  </select>
                </div>
              </div>
              {formData.concept && filteredRooms.length === 0 && (
                <p className="text-sm text-amber-600 mt-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Hết phòng trống loại này.</p>
              )}
            </div>

            {/* 2. Chọn Lịch */}
            {formData.room && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">2</div>
                    Thời gian đặt
                  </h2>
                  {fetchingBookings && <span className="text-xs text-teal-600 flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-full"><RefreshCw className="w-3 h-3 animate-spin" /> Đang tải lịch...</span>}
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-4 mb-6">
                  <button type="button" onClick={() => setBookingType('ngay')} className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${bookingType === 'ngay' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <Calendar className="w-4 h-4" /> Đặt Theo Ngày
                  </button>
                  <button type="button" onClick={() => setBookingType('gio')} className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${bookingType === 'gio' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <Clock className="w-4 h-4" /> Đặt Theo Giờ
                  </button>
                </div>

                {/* Date Picker */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Ngày {bookingType === 'ngay' ? 'nhận phòng' : 'xem lịch'}</label>
                  <input type="date" className="p-3 border border-gray-300 rounded-lg w-full sm:w-1/2 focus:ring-2 focus:ring-teal-500 outline-none" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>

                {/* CONTENT BOOKING */}
                {bookingType === 'ngay' ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="font-semibold text-gray-800">Quy định:</span>
                      <span>Check-in 14:00</span> <ChevronRight className="w-4 h-4 text-gray-400" /> <span>Check-out 12:00 (Hôm sau)</span>
                    </div>
                    <div className={`p-4 rounded-xl flex items-start gap-3 border ${isDayBookingAvailable ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {isDayBookingAvailable ? (
                        <><Check className="w-5 h-5 mt-0.5" /> <div><p className="font-bold">Có thể đặt</p><p className="text-sm opacity-80">Phòng trống cho ngày này.</p></div></>
                      ) : (
                        <><AlertCircle className="w-5 h-5 mt-0.5" /> <div><p className="font-bold">Không thể đặt</p><p className="text-sm opacity-80">Phòng đã bị vướng lịch (hoặc buffer).</p></div></>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDate ? (
                      <>
                        <TimeSlotSelector roomId={formData.room} selectedDate={selectedDate} selectedSlots={selectedTimeSlots} onSlotsChange={setSelectedTimeSlots} existingBookings={existingBookings} />
                        {selectedTimeSlots && (
                          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-teal-600" />
                              <div>
                                <p className="text-xs text-teal-600 font-semibold uppercase">Thời gian đã chọn</p>
                                <p className="font-bold text-lg">
                                  {new Date(selectedTimeSlots.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {new Date(new Date(selectedTimeSlots.end).getTime() + 30 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-10 text-gray-400">Vui lòng chọn ngày để xem lịch</div>
                    )}
                  </div>
                )}

                {/* Button group moved up here */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  gap: '14px',
                  marginTop: '18px',
                  marginBottom: '0',
                }}>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '999px',
                      border: '1.5px solid #e5e7eb',
                      color: '#374151',
                      fontWeight: 600,
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      fontSize: 15,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#f3f4f6')}
                    onMouseOut={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.cccdFrontUploading || formData.cccdBackUploading}
                    style={{
                      padding: '8px 26px',
                      borderRadius: '999px',
                      background: loading ? '#2dd4bf' : '#14b8a6',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 15,
                      boxShadow: '0 2px 8px #99f6e4',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: loading || formData.cccdFrontUploading || formData.cccdBackUploading ? 0.5 : 1,
                      cursor: loading || formData.cccdFrontUploading || formData.cccdBackUploading ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s, box-shadow 0.2s',
                    }}
                    onMouseOver={e => { if (!loading && !formData.cccdFrontUploading && !formData.cccdBackUploading) e.currentTarget.style.background = '#0d9488'; }}
                    onMouseOut={e => { if (!loading && !formData.cccdFrontUploading && !formData.cccdBackUploading) e.currentTarget.style.background = '#14b8a6'; }}
                  >
                    <Check className="w-4 h-4 text-white" />
                    {loading ? 'Đang xử lý...' : 'Xác Nhận Tạo Đơn'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modern Button Group at Form End */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: '14px',
          marginTop: '18px',
          marginBottom: '32px',
        }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              border: '1.5px solid #e5e7eb',
              color: '#374151',
              fontWeight: 600,
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              fontSize: 15,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseOut={e => (e.currentTarget.style.background = '#fff')}
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || formData.cccdFrontUploading || formData.cccdBackUploading}
            style={{
              padding: '8px 26px',
              borderRadius: '999px',
              background: loading ? '#2dd4bf' : '#14b8a6',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 2px 8px #99f6e4',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading || formData.cccdFrontUploading || formData.cccdBackUploading ? 0.5 : 1,
              cursor: loading || formData.cccdFrontUploading || formData.cccdBackUploading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={e => { if (!loading && !formData.cccdFrontUploading && !formData.cccdBackUploading) e.currentTarget.style.background = '#0d9488'; }}
            onMouseOut={e => { if (!loading && !formData.cccdFrontUploading && !formData.cccdBackUploading) e.currentTarget.style.background = '#14b8a6'; }}
          >
            <Check className="w-4 h-4 text-white" />
            {loading ? 'Đang xử lý...' : 'Xác Nhận Tạo Đơn'}
          </button>
        </div>
      </form>
    </div>
  );
}