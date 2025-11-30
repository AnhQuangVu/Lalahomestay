import { useState, useEffect, useMemo } from 'react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { Calendar, Users, Clock, RefreshCw, Check, AlertCircle, UploadCloud, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

// --- SUB-COMPONENT: TimeSlotSelector (Fixed Slots + Multi-select) ---
function TimeSlotSelector({
  roomId,
  selectedDate,
  selectedSlots, // Array
  onSlotsChange,
  existingBookings
}: {
  roomId: string;
  selectedDate: string;
  selectedSlots: any[];
  onSlotsChange: (slots: any[]) => void;
  existingBookings: any[];
}) {
  
  // CẤU HÌNH KHUNG GIỜ CỐ ĐỊNH
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
      if (config.nextDay) {
        end.setDate(end.getDate() + 1);
      }
      end.setHours(config.endH, config.endM, 0, 0);
      return { label: config.label, start, end, config };
    });
  }, [selectedDate]);

  // Kiểm tra khả dụng
  const getSlotStatus = (slot: { start: Date, end: Date }) => {
    const now = new Date();
    // 1. Check quá khứ
    if (slot.start < now) return { available: false, reason: 'past' };

    // 2. Check trùng lịch
    for (const booking of existingBookings) {
      const bStart = new Date(booking.thoi_gian_nhan);
      const bEnd = new Date(booking.thoi_gian_tra);
      // Buffer 15 phút
      const blockedStart = new Date(bStart.getTime() - 15 * 60000);
      const blockedEnd = new Date(bEnd.getTime() + 15 * 60000);

      if (slot.start < blockedEnd && slot.end > blockedStart) {
        return { available: false, reason: 'booked' };
      }
    }
    return { available: true, reason: 'ok' };
  };

  const handleSlotClick = (slot: any) => {
    const status = getSlotStatus(slot);
    if (!status.available) {
       if(status.reason === 'booked') toast.error('Khung giờ này đã có đơn đặt.');
       return;
    }

    const slotStartStr = slot.start.toISOString();
    const exists = selectedSlots.find(s => s.start === slotStartStr);

    if (exists) {
      // Bỏ chọn
      onSlotsChange(selectedSlots.filter(s => s.start !== slotStartStr));
    } else {
      // Chọn thêm
      onSlotsChange([...selectedSlots, { 
        start: slot.start.toISOString(), 
        end: slot.end.toISOString(),
        label: slot.label 
      }]);
    }
  };

  return (
    <div style={{ marginTop: 8, marginBottom: 8 }}>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px', fontSize: 14, color: '#555', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#f8fafc', border: '1px solid #e2e8f0' }}></div>Trống</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#0f7072' }}></div>Đang chọn</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#f1f5f9', border: '1px solid #cbd5e1' }}></div>Đã đặt/Qua giờ</div>
      </div>

      {/* Grid Slot */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
        padding: 16,
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
      }}>
        {timeSlots.map((slot, idx) => {
          const status = getSlotStatus(slot);
          const isSelected = selectedSlots.some(s => s.start === slot.start.toISOString());
          
          let bg = '#fff';
          let color = '#334155';
          let border = '1px solid #e2e8f0';
          let cursor = 'pointer';

          if (isSelected) {
            bg = '#0f7072'; color = '#fff'; border = '1px solid #0f7072';
          } else if (!status.available) {
            bg = '#f1f5f9'; color = '#94a3b8'; border = '1px solid #f1f5f9'; cursor = 'not-allowed';
          } else {
            bg = '#f8fafc';
          }

          return (
            <button
              type="button"
              key={idx}
              onClick={() => handleSlotClick(slot)}
              disabled={!status.available}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                backgroundColor: bg,
                color: color,
                border: border,
                cursor: cursor,
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                position: 'relative'
              }}
            >
              {isSelected && <div style={{position: 'absolute', top: -6, right: -6, background: '#f59e0b', borderRadius: '50%', color: 'white', padding: 2, zIndex: 10}}><CheckCircle2 size={14} fill="#f59e0b" color="white"/></div>}
              <span>{slot.label.split(' - ')[0]} - {slot.label.split(' - ')[1].split(' ')[0]}</span>
              {slot.config.nextDay && <span className="text-[10px] italic opacity-80">(Qua đêm)</span>}
              {!status.available && status.reason === 'booked' && <span className="text-[10px] text-red-500 font-bold">Đã có đơn</span>}
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
  
  // *** UPDATE: Đổi thành mảng để chọn nhiều ***
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<any[]>([]);
  
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
    // Reset slot khi đổi ngày/phòng
    setSelectedTimeSlots([]);
  }, [formData.room, selectedDate]);

  const fetchBookingsForRoom = async () => {
    if (!formData.room || !selectedDate) return;
    setFetchingBookings(true);
    try {
      // Lấy buffer rộng hơn (trước 1 ngày, sau 2 ngày) để cover mọi trường hợp
      const checkDate = new Date(selectedDate);
      const bufferStart = new Date(checkDate);
      bufferStart.setDate(bufferStart.getDate() - 1);
      const bufferEnd = new Date(checkDate);
      bufferEnd.setDate(bufferEnd.getDate() + 2);

      const response = await fetch(
        `${API_URL}/dat-phong?start_date=${bufferStart.toISOString()}&end_date=${bufferEnd.toISOString()}`,
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

  // --- VALIDATION HELPERS (Cho booking ngày) ---
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

    if (!formData.customerName || !formData.customerPhone || !formData.room) return toast.error("Thiếu thông tin bắt buộc.");
    
    setLoading(true);

    try {
        // Payload cơ bản
        const basePayload: any = {
            ho_ten: formData.customerName,
            sdt: formData.customerPhone,
            email: formData.customerEmail || null,
            id_phong: formData.room,
            so_khach: formData.numberOfGuests || 1,
            ghi_chu: formData.notes || null,
            ghi_chu_khach: formData.notes || null,
            kenh_dat: formData.bookingSource,
            trang_thai: 'da_coc', // Mặc định đã cọc khi admin tạo? Hoặc 'cho_xac_nhan' tùy logic bạn
            cccd_mat_truoc: formData.cccdFront || null,
            cccd_mat_sau: formData.cccdBack || null
        };

        if (bookingType === 'ngay') {
            if (!selectedDate) throw new Error('Vui lòng chọn ngày');
            if (!isDayBookingAvailable) throw new Error('Ngày này đã bị vướng lịch!');

            const checkIn = `${selectedDate}T14:00:00`;
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const checkOut = `${nextDay.toISOString().split('T')[0]}T12:00:00`;

            const payload = {
                ...basePayload,
                thoi_gian_nhan: checkIn,
                thoi_gian_tra: checkOut
            };

            const response = await fetch(`${API_URL}/dat-phong`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            toast.success(`Tạo đơn ngày thành công! Mã: ${data.data?.ma_dat}`);

        } else { // Booking Type: GIỜ (Multiple Slots)
            if (selectedTimeSlots.length === 0) throw new Error('Vui lòng chọn ít nhất 1 khung giờ');

            // Tạo mảng promise để gửi nhiều request
            const promises = selectedTimeSlots.map(slot => {
                const payload = {
                    ...basePayload,
                    thoi_gian_nhan: slot.start,
                    thoi_gian_tra: slot.end,
                    ghi_chu: (formData.notes || '') + ` (Slot: ${slot.label})`
                };
                return fetch(`${API_URL}/dat-phong`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
                    body: JSON.stringify(payload)
                }).then(r => r.json());
            });

            const results = await Promise.all(promises);
            const errors = results.filter(r => !r.success);
            
            if (errors.length > 0) {
                console.error(errors);
                toast.warning(`Có ${errors.length} khung giờ thất bại. Các khung giờ khác đã tạo thành công.`);
            } else {
                toast.success(`Đã tạo thành công ${results.length} đơn đặt phòng theo giờ!`);
            }
        }

        // Reset Form sau khi thành công
        setFormData(prev => ({ ...prev, customerName: '', customerPhone: '', customerEmail: '', notes: '', cccdFront: '', cccdBack: '' }));
        setSelectedTimeSlots([]);
        fetchBookingsForRoom();

    } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Lỗi xử lý');
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
                        <p className="text-sm font-semibold text-gray-700">Chọn khung giờ (Có thể chọn nhiều):</p>
                        <TimeSlotSelector roomId={formData.room} selectedDate={selectedDate} selectedSlots={selectedTimeSlots} onSlotsChange={setSelectedTimeSlots} existingBookings={existingBookings} />
                        
                        {selectedTimeSlots.length > 0 && (
                          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 font-bold text-teal-700">
                                <CheckCircle2 className="w-5 h-5"/> Đã chọn {selectedTimeSlots.length} khung giờ:
                            </div>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                                {selectedTimeSlots.map((s, i) => (
                                    <li key={i}>{s.label}</li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-10 text-gray-400">Vui lòng chọn ngày để xem lịch</div>
                    )}
                  </div>
                )}
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