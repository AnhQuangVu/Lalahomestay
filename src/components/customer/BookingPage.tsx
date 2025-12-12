import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, eachDayOfInterval, startOfDay, parseISO } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, MapPin, Home, RefreshCw,
  Upload, X, Clock, Sun, Moon, Sunset, Sunrise, CreditCard, User, Phone, Mail, FileText, CheckCircle2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// --- IMPORTS TỪ PROJECT CỦA BẠN ---
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getRoomImages, formatCurrency } from '../../utils/imageUtils';
import { uploadToCloudinary } from '../../utils/cloudinary';
import PaymentQRDialog from '../PaymentQRDialog';
import RoomImageCarousel from './RoomImageCarousel';
import { cn } from '../ui/utils';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

// Ref để ngăn double-submit (state update không đủ nhanh)
let isSubmittingGlobal = false;

function toLocalISOString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// --- COMPONENT 1: CALENDAR CHO ĐẶT NGÀY ---
const DailyCalendar = ({ selectedDate, setSelectedDate, numberOfNights, bookings }: {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  numberOfNights: number;
  bookings: any[];
}) => {
  // Tính toán tất cả các ngày đã bị book
  const bookedDateStrings = useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach(b => {
      if (!b.thoi_gian_nhan || !b.thoi_gian_tra) return;
      const start = startOfDay(new Date(b.thoi_gian_nhan));
      const end = startOfDay(new Date(b.thoi_gian_tra));
      // Thêm tất cả các ngày từ check-in đến check-out (không bao gồm ngày checkout vì 12h trả phòng)
      eachDayOfInterval({ start, end }).forEach(d => {
        dates.add(format(d, 'yyyy-MM-dd'));
      });
    });
    return dates;
  }, [bookings]);

  // Chuyển thành Date objects để hiển thị style đỏ
  const bookedDateObjects = useMemo(() => {
    return Array.from(bookedDateStrings).map(dateStr => new Date(dateStr));
  }, [bookedDateStrings]);

  // Tính các ngày cần disable: 
  // - Nếu chọn ngày đó làm check-in + numberOfNights đêm thì có overlap với ngày đã book
  const disabledBookedDates = useMemo(() => {
    const disabled: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Duyệt 2 năm tới
    for (let i = 0; i < 365 * 2; i++) {
      const checkInDate = new Date(today);
      checkInDate.setDate(checkInDate.getDate() + i);
      
      // Kiểm tra nếu đặt từ ngày này + numberOfNights đêm có overlap không
      let hasOverlap = false;
      for (let n = 0; n < numberOfNights; n++) {
        const stayDate = new Date(checkInDate);
        stayDate.setDate(stayDate.getDate() + n);
        if (bookedDateStrings.has(format(stayDate, 'yyyy-MM-dd'))) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) {
        disabled.push(new Date(checkInDate));
      }
    }
    return disabled;
  }, [bookedDateStrings, numberOfNights]);

  // Ngày checkout dự kiến của user
  let userCheckoutDate: Date | null = null;
  if (selectedDate && numberOfNights > 0) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + numberOfNights);
    userCheckoutDate = d;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Disable: ngày quá khứ + ngày có overlap booking
  const disabledDates = [
    ...disabledBookedDates,
    ...Array.from({ length: 365 * 2 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (i + 1));
      return d;
    })
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
      <DayPicker
        mode="single"
        selected={selectedDate ? new Date(selectedDate) : undefined}
        onSelect={d => d && setSelectedDate(format(d, 'yyyy-MM-dd'))}
        modifiers={{
          booked: bookedDateObjects,
          userCheckout: userCheckoutDate ? [userCheckoutDate] : []
        }}
        modifiersStyles={{
          booked: { backgroundColor: '#fee2e2', color: '#dc2626', border: '2px solid #dc2626', borderRadius: '8px', opacity: 0.7, cursor: 'not-allowed' },
          userCheckout: { backgroundColor: '#dbeafe', color: '#2563eb', border: '2px dashed #2563eb', borderRadius: '8px' }
        }}
        disabled={disabledDates}
        weekStartsOn={1}
        styles={{ day: { borderRadius: '8px' } }}
      />
      {selectedDate && numberOfNights > 0 && (
        <div style={{ minWidth: '220px', padding: '16px 20px', background: '#fff7ed', borderRadius: '12px', border: '1px solid #fdba74', color: '#d97706', fontWeight: 600, fontSize: '15px', boxShadow: '0 2px 8px #fbbf2433' }}>
          <div>Thông tin lưu trú:</div>
          <div style={{ marginTop: '8px', fontSize: '16px' }}>
            <span>Nhận phòng: </span>
            <b>{(() => {
              const d = new Date(selectedDate);
              d.setHours(14, 0, 0, 0);
              return d.toLocaleString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            })()}</b>
          </div>
          <div style={{ marginTop: '8px', fontSize: '16px' }}>
            <span>Trả phòng: </span>
            <b>{(() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + numberOfNights);
              d.setHours(12, 0, 0, 0);
              return d.toLocaleString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            })()}</b>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT 2: MULTI-SELECT TIME SLOT SELECTOR ---
function TimeSlotSelector({
  roomId,
  selectedDate,
  selectedSlots, // Array
  onSlotsChange
}: {
  roomId: string;
  selectedDate: string;
  selectedSlots: any[];
  onSlotsChange: (slots: any[]) => void;
}) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (selectedDate && roomId) fetchBookingsForDate();
  }, [selectedDate, roomId]);

  const fetchBookingsForDate = async () => {
    setLoading(true);
    try {
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
        const roomBookings = data.data.filter((booking: any) =>
          booking.id_phong === roomId && booking.trang_thai !== 'da_huy'
        );
        setBookings(roomBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlots = () => {
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
  };

  const slots = generateSlots();
  const isValidDate = selectedDate && !isNaN(new Date(selectedDate).getTime());

  const getSlotStatus = (slot: { start: Date, end: Date }) => {
    const now = new Date();
    if (slot.start < now) return { available: false, reason: 'past' };

    for (const booking of bookings) {
      const bStart = new Date(booking.thoi_gian_nhan);
      const bEnd = new Date(booking.thoi_gian_tra);
      const blockedStart = new Date(bStart.getTime() - 15 * 60000);
      const blockedEnd = new Date(bEnd.getTime() + 15 * 60000);

      if (slot.start < blockedEnd && slot.end > blockedStart) {
        return { available: false, reason: 'booked' };
      }
    }
    return { available: true, reason: 'ok' };
  };

  const handleSlotClick = (slot: { start: Date, end: Date, label: string }) => {
    const status = getSlotStatus(slot);
    if (!status.available) {
      if (status.reason === 'booked') toast.error('Khung giờ này đã bị trùng lịch.');
      return;
    }

    const slotStartStr = slot.start.toISOString();
    // Check if exists
    const exists = selectedSlots.find(s => s.start === slotStartStr);

    if (exists) {
      // Remove (Toggle off)
      onSlotsChange(selectedSlots.filter(s => s.start !== slotStartStr));
    } else {
      // Add (Toggle on)
      onSlotsChange([...selectedSlots, { 
        start: slot.start.toISOString(), 
        end: slot.end.toISOString(),
        label: slot.label 
      }]);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
      {!isValidDate || loading ? (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: '#0f7072' }} />
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Đang kiểm tra lịch...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {slots.map((slot, index) => {
            const status = getSlotStatus(slot);
            const isSelected = selectedSlots.some(s => s.start === slot.start.toISOString());
            
            let bg = '#fff';
            let color = '#334155';
            let border = '1px solid #e2e8f0';
            let cursor = 'pointer';
            let opacity = 1;

            if (isSelected) {
              bg = '#0f7072'; color = '#fff'; border = '1px solid #0f7072';
            } else if (!status.available) {
              bg = '#f1f5f9'; color = '#94a3b8'; border = '1px solid #f1f5f9'; cursor = 'not-allowed'; opacity = 0.6;
            } else {
              bg = '#f8fafc';
            }

            return (
              <button
                key={index}
                onClick={() => handleSlotClick(slot)}
                disabled={!status.available}
                style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  backgroundColor: bg,
                  color: color,
                  border: border,
                  cursor: cursor,
                  opacity: opacity,
                  fontSize: '13px',
                  fontWeight: isSelected ? '700' : '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: isSelected ? '0 4px 6px -1px rgba(15, 112, 114, 0.3)' : 'none',
                  position: 'relative'
                }}
              >
                 {isSelected && <div style={{position: 'absolute', top: -6, right: -6, background: '#f59e0b', borderRadius: '50%', color: 'white', padding: 2}}><CheckCircle2 size={14} fill="#f59e0b" color="white"/></div>}
                <span>{slot.label.split(' - ')[0]} - {slot.label.split(' - ')[1].split(' ')[0]}</span>
                {slot.config.nextDay && <span style={{ fontSize: '10px', fontStyle: 'italic', opacity: 0.8 }}>(Qua đêm)</span>}
                {!status.available && status.reason === 'booked' && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>Đã đặt</span>}
              </button>
            );
          })}
        </div>
      )}

      {selectedSlots.length > 0 && (
        <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #bbf7d0' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#15803d' }}>
             Đã chọn {selectedSlots.length} khung giờ
          </span>
          <button style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }} onClick={() => onSlotsChange([])}>Xóa tất cả</button>
        </div>
      )}
    </div>
  );
}

// --- COMPONENT 3: HOURLY CALENDAR WRAPPER ---
const HourlyCalendar = ({ selectedDate, setSelectedDate, selectedTimeSlots, onSlotsChange, roomId, bookings }: {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTimeSlots: any[];
  onSlotsChange: (slots: any[]) => void;
  roomId: string;
  bookings: any[];
}) => {
  // Tính các ngày ĐÃ CÓ booking theo ngày (loại đặt theo ngày sẽ block cả ngày)
  const bookedFullDayDates = useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach(b => {
      // Chỉ block nếu là booking theo ngày (loai_dat = 'ngay')
      if (b.loai_dat === 'ngay') {
        const start = parseISO(b.ngay_nhan);
        const end = parseISO(b.ngay_tra);
        eachDayOfInterval({ start, end: new Date(end.getTime() - 1) }).forEach(d => {
          dates.add(format(d, 'yyyy-MM-dd'));
        });
      }
    });
    return dates;
  }, [bookings]);

  // Chuyển thành Date[] để DayPicker hiển thị màu đỏ
  const bookedDateObjects = useMemo(() => {
    return Array.from(bookedFullDayDates).map(s => parseISO(s));
  }, [bookedFullDayDates]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Disable: ngày quá khứ + ngày đã có booking theo ngày
  const disabledDates = [
    ...bookedDateObjects,
    ...Array.from({ length: 365 * 2 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (i + 1));
      return d;
    })
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
        <DayPicker
          mode="single"
          selected={selectedDate ? new Date(selectedDate) : undefined}
          onSelect={d => {
            if (d) {
              setSelectedDate(format(d, 'yyyy-MM-dd'));
              onSlotsChange([]); // Reset khi đổi ngày
            }
          }}
          modifiers={{
            booked: bookedDateObjects
          }}
          modifiersStyles={{
            booked: { backgroundColor: '#fee2e2', color: '#dc2626', border: '2px solid #dc2626', borderRadius: '8px', opacity: 0.7, cursor: 'not-allowed' }
          }}
          disabled={disabledDates}
          weekStartsOn={1}
          styles={{ day: { borderRadius: '8px' } }}
        />
        <div style={{ minWidth: '220px', padding: '16px 20px', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600, fontSize: '15px', boxShadow: '0 2px 8px #64748b33' }}>
          <div>Thông tin sử dụng:</div>
          <div style={{ marginTop: '8px', fontSize: '16px' }}>
            <span>Ngày sử dụng: </span>
            <b>{selectedDate ? new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</b>
          </div>
          <div style={{ marginTop: '8px', fontSize: '16px' }}>
            <span>Số khung giờ: </span>
            <b>{selectedTimeSlots.length > 0 ? `${selectedTimeSlots.length} slot` : 'Chưa chọn'}</b>
          </div>
          {selectedTimeSlots.length > 0 && (
             <div style={{marginTop: '12px', fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                {selectedTimeSlots.map((s, idx) => (
                   <div key={idx}>- {s.label}</div>
                ))}
             </div>
          )}
        </div>
      </div>
      
      <div>
         <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '12px' }}>Chọn khung giờ (có thể chọn nhiều):</label>
         {selectedDate ? (
           <TimeSlotSelector 
             roomId={roomId} 
             selectedDate={selectedDate} 
             selectedSlots={selectedTimeSlots} 
             onSlotsChange={onSlotsChange} 
           />
         ) : (
           <p style={{ color: '#94a3b8', fontSize: '14px' }}>Vui lòng chọn ngày trước</p>
         )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Data & Filters
  const [locations, setLocations] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedConcept, setSelectedConcept] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');

  // Booking State
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [bookingType, setBookingType] = useState<'ngay' | 'gio'>('ngay');
  const [selectedDate, setSelectedDate] = useState('');
  const [numberOfNights, setNumberOfNights] = useState(1);
  
  // *** THAY ĐỔI: Chuyển thành Array ***
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<any[]>([]);

  // Customer Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [cccdFront, setCccdFront] = useState<File | null>(null);
  const [cccdBack, setCccdBack] = useState<File | null>(null);
  const [cccdFrontPreview, setCccdFrontPreview] = useState<string>('');
  const [cccdBackPreview, setCccdBackPreview] = useState<string>('');
  const [uploadingCccd, setUploadingCccd] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  useEffect(() => {
    if (step === 2 && bookingType === 'gio' && !selectedDate) {
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
      setSelectedDate(localISOTime);
    }
  }, [step, bookingType, selectedDate]);

  useEffect(() => {
    fetchData();
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
    setSelectedDate(localISOTime);
    setNumberOfNights(1);
  }, []);

  useEffect(() => { filterRooms(); }, [allRooms, selectedLocation, selectedConcept, priceRange]);

  // Fetch existing bookings for overlap check - fetch khi chọn phòng
  useEffect(() => {
    if (selectedRoom?.id) {
      fetchBookingsForRoom();
    } else {
      setExistingBookings([]);
    }
  }, [selectedRoom?.id]);

  const fetchBookingsForRoom = async () => {
    if (!selectedRoom) return;
    try {
      // Fetch TẤT CẢ bookings của phòng này (không dùng date filter vì API filter không đúng logic overlap)
      const response = await fetch(
        `${API_URL}/dat-phong`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const data = await response.json();
      if (data.success) {
        // Filter ở client: lấy bookings của phòng này, chưa hủy, và kết thúc >= hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const roomBookings = data.data.filter((b: any) =>
          b.id_phong === selectedRoom.id && 
          b.trang_thai !== 'da_huy' &&
          new Date(b.thoi_gian_tra) >= today
        );
        console.log('Fetched bookings for room:', roomBookings);
        setExistingBookings(roomBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locRes, conceptRes, roomRes] = await Promise.all([
        fetch(`${API_URL}/co-so`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }),
        fetch(`${API_URL}/loai-phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }),
        fetch(`${API_URL}/phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } })
      ]);
      const [locData, conceptData, roomData] = await Promise.all([locRes.json(), conceptRes.json(), roomRes.json()]);
      if (locData.success) setLocations(locData.data || []);
      if (conceptData.success) setConcepts(conceptData.data || []);
      if (roomData.success) {
        const availableRooms = (roomData.data || []).filter((room: any) => room.trang_thai !== 'dinh_chi');
        setAllRooms(availableRooms);
      }
    } catch (error) { toast.error('Không thể tải dữ liệu.'); } finally { setLoading(false); }
  };

  const filterRooms = async () => {
    let filtered = allRooms.filter(r => r.trang_thai !== 'dinh_chi');
    if (selectedLocation !== 'all') filtered = filtered.filter(r => r.loai_phong?.id_co_so === selectedLocation);
    if (selectedConcept !== 'all') filtered = filtered.filter(r => r.id_loai_phong === selectedConcept);
    if (priceRange !== 'all') {
      filtered = filtered.filter(r => {
        const price = bookingType === 'gio' ? r.loai_phong?.gia_gio : r.loai_phong?.gia_dem;
        if (priceRange === 'low') return price < 200000;
        if (priceRange === 'mid') return price >= 200000 && price < 500000;
        if (priceRange === 'high') return price >= 500000;
        return true;
      });
    }
    setFilteredRooms(filtered);
  };

  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    if (bookingType === 'ngay' && selectedDate && numberOfNights > 0) {
      const price = selectedRoom.loai_phong?.gia_dem ? Number(selectedRoom.loai_phong.gia_dem) : 0;
      return price * numberOfNights;
    } else if (bookingType === 'gio' && selectedTimeSlots.length > 0) {
      // *** TÍNH TỔNG TIỀN CHO NHIỀU SLOT ***
      let total = 0;
      const hourlyPrice = selectedRoom.loai_phong?.gia_gio ? Number(selectedRoom.loai_phong.gia_gio) : 0;
      
      selectedTimeSlots.forEach(slot => {
         const start = new Date(slot.start);
         const end = new Date(slot.end);
         // Làm tròn thời gian cho từng slot (đã fix cứng trong FIXED_SLOTS rồi)
         let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
         total += hourlyPrice * hours;
      });
      return Math.round(total);
    }
    return 0;
  };

  const handleNextStep = async () => {
    // Ngăn double-click bằng cả ref (sync) và state
    if (loading || isSubmittingGlobal) return;
    
    if (step === 1) {
      if (!selectedRoom) { toast.error('Bạn phải chọn phòng trước.'); return; }
      setStep(2);
    } else if (step === 2) {
      let checkInDateTime: Date | undefined, checkOutDateTime: Date | undefined;

      if (bookingType === 'ngay') {
        if (!selectedDate) { toast.error('Chọn ngày nhận phòng.'); return; }
        if (numberOfNights < 1) { toast.error('Số đêm tối thiểu là 1.'); return; }

        checkInDateTime = new Date(selectedDate);
        checkInDateTime.setHours(14, 0, 0, 0);
        checkOutDateTime = new Date(selectedDate);
        checkOutDateTime.setDate(checkOutDateTime.getDate() + numberOfNights);
        checkOutDateTime.setHours(12, 0, 0, 0);
        
        if (new Date() > checkInDateTime) { toast.error('Không thể đặt ngày trong quá khứ.'); return; }

        // Kiểm tra trùng lịch với các booking hiện có
        const hasOverlap = existingBookings.some((booking: any) => {
          const bStart = new Date(booking.thoi_gian_nhan);
          const bEnd = new Date(booking.thoi_gian_tra);
          // Overlap: (StartA < EndB) AND (EndA > StartB)
          return checkInDateTime! < bEnd && checkOutDateTime! > bStart;
        });

        if (hasOverlap) {
          toast.error('Phòng đã có booking trong khoảng thời gian này. Vui lòng chọn ngày khác.');
          return;
        }

        // Set checkIn và checkOut state
        setCheckIn(toLocalISOString(checkInDateTime!));
        setCheckOut(toLocalISOString(checkOutDateTime!));
      } else {
        if (selectedTimeSlots.length === 0) { toast.error('Chọn ít nhất 1 khung giờ.'); return; }
        // Với nhiều slot, ta chỉ cần kiểm tra slot sớm nhất
        // (Logic kiểm tra trùng lặp đã làm ở bước chọn slot rồi)
      }

      setStep(3);
    } else if (step === 3) {
      if (isSubmittingGlobal) return; // Double check
      isSubmittingGlobal = true; // Set ngay lập tức (sync)
      setLoading(true); // Set loading trước để ngăn double-click
      try {
        await handleSubmitBooking();
      } finally {
        isSubmittingGlobal = false; // Luôn reset dù success hay error
      }
    }
  };

  const handleCccdUpload = (file: File, side: 'front' | 'back') => {
    if (!file.type.startsWith('image/')) return toast.error('Vui lòng chọn file ảnh');
    if (file.size > 5 * 1024 * 1024) return toast.error('File ảnh > 5MB');
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') { setCccdFront(file); setCccdFrontPreview(reader.result as string); }
      else { setCccdBack(file); setCccdBackPreview(reader.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const removeCccdImage = (side: 'front' | 'back') => {
    if (side === 'front') { setCccdFront(null); setCccdFrontPreview(''); }
    else { setCccdBack(null); setCccdBackPreview(''); }
  };

  // *** XỬ LÝ SUBMIT NHIỀU BOOKING ***
  const handleSubmitBooking = async () => {
    if (!fullName || !phone) return toast.error('Nhập đầy đủ họ tên và SĐT.');
    if (!/^0[0-9]{9,10}$/.test(phone)) return toast.error('SĐT không hợp lệ.');
    if (!cccdFront && !cccdFrontPreview) return toast.error('Vui lòng tải ảnh CCCD mặt trước.');
    if (!cccdBack && !cccdBackPreview) return toast.error('Vui lòng tải ảnh CCCD mặt sau.');
    
    setLoading(true);
    try {
      let cccdFrontUrl = cccdFrontPreview || null; 
      let cccdBackUrl = cccdBackPreview || null;
      if (cccdFront || cccdBack) {
        setUploadingCccd(true); toast.info('Đang upload CCCD...');
        try {
          if (cccdFront) cccdFrontUrl = await uploadToCloudinary(cccdFront, 'cccd');
          if (cccdBack) cccdBackUrl = await uploadToCloudinary(cccdBack, 'cccd');
          toast.success('Upload ảnh xong!');
        } catch { setUploadingCccd(false); setLoading(false); return toast.error('Lỗi upload ảnh.'); }
        setUploadingCccd(false);
      }

      // Payload cơ bản
      const basePayload = {
        ho_ten: fullName, sdt: phone, email: email || null,
        cccd_mat_truoc: cccdFrontUrl, cccd_mat_sau: cccdBackUrl,
        id_phong: selectedRoom.id,
        so_khach: numberOfGuests, 
        kenh_dat: 'website', ghi_chu: notes || null, ghi_chu_khach: notes || null
      };

      if (bookingType === 'ngay') {
          const payload = {
              ...basePayload,
              thoi_gian_nhan: checkIn,
              thoi_gian_tra: checkOut,
              tong_tien: calculateTotal(),
              coc_csvc: 0
          };
          const res = await fetch(`${API_URL}/dat-phong`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
              body: JSON.stringify(payload)
          });
          const result = await res.json();
          if(!result.success) throw new Error(result.error);

          setBookingData({
            bookingCode: result.data.ma_dat, amount: calculateTotal(),
            bookingDetails: { roomName: `${selectedRoom.loai_phong?.ten_loai} - ${selectedRoom.ma_phong}`, checkIn: new Date(checkIn).toLocaleString('vi-VN'), checkOut: new Date(checkOut).toLocaleString('vi-VN') }
          });
      } else {
          // *** LOOP CREATE MULTIPLE BOOKINGS ***
          // Với mỗi slot, ta tạo 1 booking riêng
          const hourlyPrice = selectedRoom.loai_phong?.gia_gio ? Number(selectedRoom.loai_phong.gia_gio) : 0;
          
          // Dùng Promise.all để gửi đồng thời
          const promises = selectedTimeSlots.map(slot => {
             const start = new Date(slot.start);
             const end = new Date(slot.end);
             const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
             const slotPrice = Math.round(hourlyPrice * hours);

             const payload = {
                 ...basePayload,
                 thoi_gian_nhan: toLocalISOString(start),
                 thoi_gian_tra: toLocalISOString(end),
                 tong_tien: slotPrice,
                 coc_csvc: 0,
                 ghi_chu: (notes || '') + ` (Slot: ${slot.label})` // Note thêm tên slot vào
             };

             return fetch(`${API_URL}/dat-phong`, {
                 method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
                 body: JSON.stringify(payload)
             }).then(r => r.json());
          });

          const results = await Promise.all(promises);
          
          // Kiểm tra xem có lỗi nào không
          const errors = results.filter(r => !r.success);
          if (errors.length > 0) {
              console.error(errors);
              toast.warning(`Có ${errors.length} khung giờ bị lỗi (có thể do vừa bị đặt). Các khung giờ khác thành công.`);
          }

          // Lấy mã đặt của cái đầu tiên thành công để hiển thị QR
          const successBooking = results.find(r => r.success);
          if (successBooking) {
              setBookingData({
                  bookingCode: successBooking.data.ma_dat + '...', // Mã đại diện
                  amount: calculateTotal(),
                  bookingDetails: { 
                      roomName: `${selectedRoom.loai_phong?.ten_loai} - ${selectedRoom.ma_phong}`, 
                      checkIn: `${selectedTimeSlots.length} khung giờ`, 
                      checkOut: new Date(selectedDate).toLocaleDateString('vi-VN') 
                  }
              });
          } else {
             throw new Error('Không thể đặt phòng.');
          }
      }

      setShowPaymentDialog(true); 
      toast.success('Đặt thành công!');

    } catch (e: any) { toast.error(e.message || 'Lỗi đặt phòng'); } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 0', fontFamily: '"Inter", sans-serif' }}>
      <Toaster position="top-right" richColors closeButton />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

        {/* Steps */}
        <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: step >= s ? '#0f7072' : '#e2e8f0', color: step >= s ? 'white' : '#64748b', fontWeight: 'bold',
                  boxShadow: step >= s ? '0 4px 6px -1px rgba(15, 112, 114, 0.3)' : 'none', transition: 'all 0.3s'
                }}>
                  {s}
                </div>
                {s < 3 && <div style={{ width: '60px', height: '3px', margin: '0 12px', backgroundColor: step > s ? '#0f7072' : '#e2e8f0', borderRadius: '2px' }} />}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '86px', fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span style={{ color: step >= 1 ? '#0f7072' : 'inherit' }}>Chọn phòng</span>
            <span style={{ color: step >= 2 ? '#0f7072' : 'inherit' }}>Thời gian</span>
            <span style={{ color: step >= 3 ? '#0f7072' : 'inherit' }}>Thông tin</span>
          </div>
        </div>

        {/* --- STEP 1: CHỌN PHÒNG --- */}
        {step === 1 && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>Danh sách phòng</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['all', 'low', 'mid', 'high'].map(p => (
                  <button key={p} onClick={() => setPriceRange(p)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid #e2e8f0', backgroundColor: priceRange === p ? '#0f7072' : 'white', color: priceRange === p ? 'white' : '#475569', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {p === 'all' ? 'Tất cả giá' : p === 'low' ? '< 200k' : p === 'mid' ? '200-500k' : '> 500k'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', outline: 'none', cursor: 'pointer', flex: 1, minWidth: '200px' }}>
                <option value="all">📍 Tất cả cơ sở</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.ten_co_so}</option>)}
              </select>
              <select value={selectedConcept} onChange={(e) => setSelectedConcept(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', outline: 'none', cursor: 'pointer', flex: 1, minWidth: '200px' }}>
                <option value="all">🏷️ Tất cả loại phòng</option>
                {concepts.map(c => <option key={c.id} value={c.id}>{c.ten_loai}</option>)}
              </select>
              <button onClick={fetchData} style={{ marginLeft: 'auto', color: '#0f7072', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '500', border: 'none', background: 'none', cursor: 'pointer' }}><RefreshCw size={16} /> Làm mới</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}><RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: '#0f7072' }} /><p style={{ color: '#64748b' }}>Đang tải dữ liệu...</p></div>
            ) : filteredRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f8fafc', borderRadius: '16px' }}><Home className="w-12 h-12 mx-auto mb-4 text-gray-400" /><p style={{ color: '#64748b', fontWeight: '500' }}>Không tìm thấy phòng phù hợp</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {filteredRooms.map(room => {
                  let isBooked = false;
                  if (bookingType === 'gio' && selectedDate) {
                    const bookings = room.bookings || [];
                    const dateStr = new Date(selectedDate).toISOString().slice(0, 10);
                    isBooked = bookings.some((b: { start: string }) => {
                      const bookingDateStr = new Date(b.start).toISOString().slice(0, 10);
                      return bookingDateStr === dateStr;
                    });
                  }
                  return (
                    <div
                      key={room.id}
                      onClick={() => room.trang_thai !== 'bao_tri' && setSelectedRoom(room)}
                      style={{
                        border: isBooked ? '2px solid #ef4444' : (selectedRoom?.id === room.id ? '2px solid #0f7072' : '1px solid #e2e8f0'),
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: room.trang_thai === 'bao_tri' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: 'white',
                        position: 'relative',
                        transform: selectedRoom?.id === room.id ? 'translateY(-4px)' : 'none',
                        boxShadow: selectedRoom?.id === room.id ? '0 10px 15px -3px rgba(15, 112, 114, 0.1)' : 'none',
                        opacity: room.trang_thai === 'bao_tri' ? 0.5 : 1,
                        pointerEvents: room.trang_thai === 'bao_tri' ? 'none' : 'auto'
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '16/10' }}>
                        <RoomImageCarousel images={[room.anh_chinh, ...(room.anh_phu || [])].filter(Boolean)} alt={`Phòng ${room.ma_phong}`} />
                        <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backdropFilter: 'blur(4px)' }}>{room.loai_phong?.ten_loai}</div>
                        {room.trang_thai === 'bao_tri' && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#6b7280', color: 'white', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontWeight: '700' }}>Bảo trì</div>
                        )}
                        {isBooked && room.trang_thai !== 'bao_tri' && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#ef4444', color: 'white', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontWeight: '700' }}>Đã có khách</div>
                        )}
                        {selectedRoom?.id === room.id && !isBooked && room.trang_thai !== 'bao_tri' && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#0f7072', color: 'white', borderRadius: '50%', padding: '6px' }}><div style={{ width: '10px', height: '10px', backgroundColor: 'white', borderRadius: '50%' }}></div></div>
                        )}
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Phòng {room.ma_phong}</h3>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f7072' }}>{formatCurrency(room.loai_phong?.gia_gio || 0)}<span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>/h</span></div>
                        </div>
                        <p style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b', margin: 0 }}><MapPin size={14} style={{ marginRight: '4px' }} /> {room.loai_phong?.co_so?.ten_co_so}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- STEP 2: CHỌN THỜI GIAN --- */}
        {step === 2 && selectedRoom && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', alignItems: 'start' }}>

            {/* Left: Booking Form */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>Thiết lập thời gian</h2>

              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '32px' }}>
                <button onClick={() => setBookingType('ngay')} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: bookingType === 'ngay' ? 'white' : 'transparent', color: bookingType === 'ngay' ? '#0f7072' : '#64748b', boxShadow: bookingType === 'ngay' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CalendarIcon size={16} /> Theo Ngày
                </button>
                <button onClick={() => setBookingType('gio')} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: bookingType === 'gio' ? 'white' : 'transparent', color: bookingType === 'gio' ? '#0f7072' : '#64748b', boxShadow: bookingType === 'gio' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Clock size={16} /> Theo Giờ
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Ngày {bookingType === 'ngay' ? 'nhận phòng' : 'sử dụng'}</label>
                  {bookingType === 'ngay' ? (
                    <DailyCalendar
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      numberOfNights={numberOfNights}
                      bookings={existingBookings}
                    />
                  ) : (
                    <HourlyCalendar
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      selectedTimeSlots={selectedTimeSlots}
                      onSlotsChange={setSelectedTimeSlots}
                      roomId={selectedRoom.id}
                      bookings={existingBookings}
                    />
                  )}
                </div>

                {bookingType === 'ngay' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Số đêm lưu trú</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => setNumberOfNights(Math.max(1, numberOfNights - 1))} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>-</button>
                      <input type="number" readOnly value={numberOfNights} style={{ width: '60px', textAlign: 'center', border: 'none', fontSize: '16px', fontWeight: 'bold' }} />
                      <button onClick={() => setNumberOfNights(Math.min(30, numberOfNights + 1))} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Số lượng khách</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={20} color="#64748b" />
                    <input type="number" min="1" max="10" value={numberOfGuests} onChange={e => setNumberOfGuests(Number(e.target.value))} style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sticky Summary */}
            <div style={{ position: 'sticky', top: '24px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>Chi tiết thanh toán</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px dashed #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={selectedRoom.anh_chinh || getRoomImages(selectedRoom.id)[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: '#334155' }}>Phòng {selectedRoom.ma_phong}</p>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>{selectedRoom.loai_phong?.ten_loai}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Đơn giá</span>
                    <span>{formatCurrency(bookingType === 'ngay' ? selectedRoom.loai_phong?.gia_dem : selectedRoom.loai_phong?.gia_gio)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thời lượng</span>
                    <span>
                      {bookingType === 'ngay'
                        ? `${numberOfNights} đêm`
                        : selectedTimeSlots.length > 0
                          ? (() => {
                              // Tổng giờ của tất cả các slot
                              let totalHours = 0;
                              selectedTimeSlots.forEach(s => {
                                 const start = new Date(s.start);
                                 const end = new Date(s.end);
                                 totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                              });
                              return `${totalHours.toFixed(2)} giờ (${selectedTimeSlots.length} slots)`;
                            })()
                          : '0 giờ'}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>Tổng cộng</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f7072' }}>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 3: THÔNG TIN KHÁCH --- */}
        {step === 3 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>Thông tin của bạn</h2>

              <div style={{ marginBottom: '32px', background: '#fef9c3', borderRadius: '12px', padding: '20px', border: '1px solid #fde047', color: '#92400e', fontWeight: 600, fontSize: '15px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '12px', color: '#b45309' }}>Thông tin đặt phòng</h3>
                <div>Loại đặt: <b>{bookingType === 'ngay' ? 'Theo ngày' : 'Theo giờ'}</b></div>
                <div>Phòng: <b>{selectedRoom?.ma_phong}</b> ({selectedRoom?.loai_phong?.ten_loai})</div>
                <div>Số khách: <b>{numberOfGuests}</b></div>
                {bookingType === 'ngay' ? (
                  <>
                    <div>Nhận phòng: <b>{(() => { const d = new Date(selectedDate); d.setHours(14, 0, 0, 0); return d.toLocaleString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); })()}</b></div>
                    <div>Trả phòng: <b>{(() => { const d = new Date(selectedDate); d.setDate(d.getDate() + numberOfNights); d.setHours(12, 0, 0, 0); return d.toLocaleString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); })()}</b></div>
                    <div>Số đêm: <b>{numberOfNights}</b></div>
                  </>
                ) : (
                  <>
                    <div>Ngày sử dụng: <b>{selectedDate ? new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</b></div>
                    <div>Các khung giờ đã chọn:</div>
                    <ul style={{marginTop: 4, paddingLeft: 20}}>
                        {selectedTimeSlots.map((s, idx) => (
                            <li key={idx}><b>{s.label}</b></li>
                        ))}
                    </ul>
                  </>
                )}
                <div style={{marginTop: 10}}>Tổng tiền: <b>{formatCurrency(calculateTotal())}</b></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Họ và tên</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nhập họ tên" style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Số điện thoại</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0912..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Email </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@domain.com" style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Ghi chú</label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Yêu cầu đặc biệt..." rows={3} style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Căn cước công dân (CCCD)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* Front */}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>Mặt trước</p>
                    <div style={{ height: '160px', border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#f8fafc', cursor: 'pointer', overflow: 'hidden' }} onClick={() => !cccdFrontPreview && document.getElementById('cccd-front')?.click()}>
                      {cccdFrontPreview ? (
                        <>
                          <img src={cccdFrontPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={(e) => { e.stopPropagation(); removeCccdImage('front'); }} style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}><X size={16} /></button>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <CreditCard size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Tải ảnh lên</span>
                        </div>
                      )}
                      <input id="cccd-front" type="file" hidden onChange={e => e.target.files?.[0] && handleCccdUpload(e.target.files[0], 'front')} />
                    </div>
                  </div>
                  {/* Back */}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>Mặt sau</p>
                    <div style={{ height: '160px', border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#f8fafc', cursor: 'pointer', overflow: 'hidden' }} onClick={() => !cccdBackPreview && document.getElementById('cccd-back')?.click()}>
                      {cccdBackPreview ? (
                        <>
                          <img src={cccdBackPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={(e) => { e.stopPropagation(); removeCccdImage('back'); }} style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}><X size={16} /></button>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <CreditCard size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Tải ảnh lên</span>
                        </div>
                      )}
                      <input id="cccd-back" type="file" hidden onChange={e => e.target.files?.[0] && handleCccdUpload(e.target.files[0], 'back')} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', maxWidth: '1000px', margin: '40px auto 0' }}>
          <button onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: 'none', backgroundColor: step === 1 ? 'transparent' : '#e2e8f0', color: '#475569', cursor: step === 1 ? 'default' : 'pointer', fontWeight: '600', opacity: step === 1 ? 0 : 1 }}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <button onClick={handleNextStep} disabled={loading || uploadingCccd} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', borderRadius: '12px', border: 'none', backgroundColor: '#0f7072', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(15, 112, 114, 0.2)', opacity: loading ? 0.7 : 1, fontSize: '15px' }}>
            {step === 3 ? 'Xác nhận & Thanh toán' : 'Tiếp tục'} <ChevronRight size={20} />
          </button>
        </div>
      </div>
      {bookingData && <PaymentQRDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} bookingCode={bookingData.bookingCode} amount={bookingData.amount} bookingDetails={bookingData.bookingDetails} />}
    </div>
  );
}