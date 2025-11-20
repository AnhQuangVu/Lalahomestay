// CalendarDateSelector: Hiển thị calendar, đánh dấu ngày đã bị đặt bằng màu đỏ và disable không cho chọn
import React, { useState, useEffect, useMemo } from 'react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
// Helper giữ nguyên giờ địa phương khi gửi lên backend
function toLocalISOString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

function CalendarDateSelector({ roomId, selectedDate, setSelectedDate, bookingType, numberOfNights }: {
  roomId: string,
  selectedDate: string,
  setSelectedDate: (date: string) => void,
  bookingType: 'ngay' | 'gio',
  numberOfNights: number
}) {
  const [bookings, setBookings] = useState<any[]>([]);
  useEffect(() => {
    if (roomId) {
      fetchBookings();
    }
    // eslint-disable-next-line
  }, [roomId]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/dat-phong?room_id=${roomId}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      const data = await response.json();
      if (data.success) {
        setBookings(data.data.filter((b: any) => b.trang_thai !== 'da_huy'));
      }
    } catch (e) { /* ignore */ }
  };

  // Tính các ngày đã bị đặt (bị overlap, có buffer)
  const bookedDates = useMemo(() => {
    let dates: string[] = [];
    let checkInDates: Date[] = [];
    let checkOutDates: Date[] = [];
    bookings.forEach(b => {
      // Buffer: trừ 30 phút đầu, cộng 30 phút cuối
      const start = startOfDay(new Date(new Date(b.thoi_gian_nhan).getTime() - 30 * 60 * 1000));
      const end = startOfDay(new Date(new Date(b.thoi_gian_tra).getTime() + 30 * 60 * 1000));
      eachDayOfInterval({ start, end }).forEach(d => {
        dates.push(format(d, 'yyyy-MM-dd'));
      });
      checkInDates.push(start);
      checkOutDates.push(end);
    });
    return { dates, checkInDates, checkOutDates };
  }, [bookings]);

  // Tạo danh sách ngày booked (bất kỳ ngày trong khoảng số đêm bị booked)
  const bookedDateObjects: Date[] = [];
  for (let d = new Date(); d < new Date(new Date().getFullYear() + 2, 0, 1); d.setDate(d.getDate() + 1)) {
    for (let i = 0; i < numberOfNights; i++) {
      const checkDate = new Date(d);
      checkDate.setDate(checkDate.getDate() + i);
      if (bookedDates.dates.includes(format(checkDate, 'yyyy-MM-dd'))) {
        bookedDateObjects.push(new Date(d));
        break;
      }
    }
  }


  // Hiển thị ngày nhận và trả phòng của các booking khác
  const checkInObjects = bookedDates.checkInDates;
  const checkOutObjects = bookedDates.checkOutDates;

  // Ngày trả phòng dự kiến của booking hiện tại
  let currentCheckout: Date | null = null;
  if (bookingType === 'ngay' && selectedDate && numberOfNights > 0) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + numberOfNights);
    currentCheckout = d;
  }

  // Tạo danh sách ngày bị disable
  // Disable ngày trong quá khứ cho cả hai loại booking
  let disabledDates: Date[] = bookedDateObjects;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today;
  disabledDates = [
    ...bookedDateObjects,
    ...Array.from({ length: 365 * 10 }, (_, i) => {
      const d = new Date(minDate);
      d.setDate(d.getDate() - (i + 1));
      return d;
    })
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
      <DayPicker
        mode="single"
        selected={selectedDate ? new Date(selectedDate) : undefined}
        onSelect={d => d && setSelectedDate(format(d, 'yyyy-MM-dd'))}
        modifiers={{
          booked: bookedDateObjects,
          checkin: checkInObjects,
          checkout: currentCheckout ? [...checkOutObjects, currentCheckout] : checkOutObjects
        }}
        modifiersClassNames={{ booked: 'calendar-day--booked', checkin: 'calendar-day--checkin', checkout: 'calendar-day--checkout' }}
        disabled={disabledDates}
        weekStartsOn={1}
        styles={{
          day: { borderRadius: '8px' },
        }}
      />
      {bookingType === 'ngay' && selectedDate && numberOfNights > 0 && (
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
}
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, MapPin, Home, RefreshCw,
  Upload, X, Clock, Sun, Moon, Sunset, Sunrise, CreditCard, User, Phone, Mail, FileText
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getRoomImages, formatCurrency } from '../../utils/imageUtils';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { toast, Toaster } from 'sonner';
import PaymentQRDialog from '../PaymentQRDialog';
import RoomImageCarousel from './RoomImageCarousel';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;
const DEPOSIT_AMOUNT = 0;

// --- COMPONENT CHỌN GIỜ (GIAO DIỆN PILL) ---
function TimeSlotSelector({
  roomId,
  selectedDate,
  selectedSlots,
  onSlotsChange
}: {
  roomId: string;
  selectedDate: string;
  selectedSlots: { start: string, end: string } | null;
  onSlotsChange: (slots: { start: string, end: string } | null) => void;
}) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate && roomId) fetchBookingsForDate();
  }, [selectedDate, roomId]);

  const fetchBookingsForDate = async () => {
    setLoading(true);
    try {
      const checkDate = new Date(selectedDate);
      const bufferStart = new Date(checkDate);
      bufferStart.setDate(bufferStart.getDate() - 30);
      const bufferEnd = new Date(checkDate);
      bufferEnd.setDate(bufferEnd.getDate() + 30);

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

  const generateTimeSlots = () => {
    const slots = [];
    let date = new Date(`${selectedDate}T06:00:00`);
    for (let i = 0; i < 48; i++) {
      slots.push({
        label: date.toTimeString().slice(0, 5),
        date: new Date(date),
        period: i < 12 ? 'sang' : i < 24 ? 'chieu' : i < 36 ? 'toi' : 'dem'
      });
      date = new Date(date.getTime() + 30 * 60 * 1000);
    }
    return slots;
  };

  const isValidDate = selectedDate && !isNaN(new Date(`${selectedDate}T06:00:00`).getTime());
  const timeSlots = isValidDate ? generateTimeSlots() : [];

  const isTimeSlotAvailable = (slot: { label: string, date: Date }) => {
    const slotStart = slot.date;
    const slotEnd = new Date(slot.date.getTime() + 30 * 60 * 1000);
    const hour = slot.date.getHours();
    const minute = slot.date.getMinutes();

    // Hard Locks
    if (hour === 6 && minute === 0) return false;
    if (hour === 21 && minute === 30) return false;

    // Booking Checks
    for (const booking of bookings) {
      const bookingStart = new Date(booking.thoi_gian_nhan);
      const bookingEnd = new Date(booking.thoi_gian_tra);
      const bufferStart = new Date(bookingStart.getTime() - 30 * 60 * 1000);
      const bufferEnd = new Date(bookingEnd.getTime() + 30 * 60 * 1000);

      if (slotStart < bufferEnd && slotEnd > bufferStart) return false;
    }
    return true;
  };

  const handleSlotClick = (slot: { label: string, date: Date }) => {
    if (!isTimeSlotAvailable(slot)) return;
    const slotDateTime = slot.date.toISOString();

    if (!selectedSlots) {
      onSlotsChange({ start: slotDateTime, end: slotDateTime });
    } else if (selectedSlots.start === slotDateTime && selectedSlots.end === slotDateTime) {
      onSlotsChange(null);
    } else {
      const startTime = new Date(selectedSlots.start);
      const endTime = new Date(slotDateTime);
      let from = startTime < endTime ? startTime : endTime;
      let to = startTime < endTime ? endTime : startTime;

      // Fix: kiểm tra toàn bộ khoảng from → to có bị giao thoa với bất kỳ booking nào không
      let isRangeAvailable = true;
      for (const booking of bookings) {
        const bookingStart = new Date(booking.thoi_gian_nhan);
        const bookingEnd = new Date(booking.thoi_gian_tra);
        const blockedStart = new Date(bookingStart.getTime() - 30 * 60000);
        const blockedEnd = new Date(bookingEnd.getTime() + 30 * 60000);
        // Nếu khoảng chọn bị giao thoa với vùng buffer của bất kỳ booking nào thì không cho đặt
        if (from < blockedEnd && to > blockedStart) {
          isRangeAvailable = false;
          break;
        }
      }
      if (!isRangeAvailable) {
        toast.error('Khoảng thời gian bạn chọn bị vướng lịch hoặc buffer của khách khác.');
        return;
      }

      if (endTime > startTime) onSlotsChange({ start: selectedSlots.start, end: slotDateTime });
      else onSlotsChange({ start: slotDateTime, end: slotDateTime });
    }
  };

  const getSlotStyle = (slot: { label: string, date: Date }, isAvailable: boolean, isSelected: boolean) => {
    const baseStyle = {
      padding: '6px 12px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: isSelected ? '700' : '500',
      cursor: 'pointer',
      border: '1px solid transparent',
      minWidth: '58px',
      textAlign: 'center' as const,
      transition: 'all 0.15s ease',
    };

    if (isSelected) {
      return { ...baseStyle, backgroundColor: '#0f7072', color: '#fff', boxShadow: '0 2px 5px rgba(15, 112, 114, 0.4)', transform: 'scale(1.05)' };
    }
    if (!isAvailable) {
      // Slot bị disable do trùng lịch hoặc buffer: màu đỏ
      return { ...baseStyle, backgroundColor: '#ffe4e6', color: '#dc2626', border: '2px solid #dc2626', cursor: 'not-allowed', textDecoration: 'line-through', boxShadow: '0 0 0 2px #dc2626' };
    }

    const hour = slot.date.getHours();
    const minute = slot.date.getMinutes();

    if ((hour > 6 || (hour === 6 && minute >= 30)) && (hour < 22)) {
      return { ...baseStyle, backgroundColor: '#fefce8', color: '#854d0e', border: '1px solid #fde047' };
    }
    if (hour >= 22 || hour < 6) {
      return { ...baseStyle, backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #93c5fd' };
    }
    return baseStyle;
  };

  const renderGroup = (title: string, icon: any, groupSlots: any[], color: string) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {icon} <span style={{ color: color }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {groupSlots.map((slot) => {
          const isAvailable = Boolean(isTimeSlotAvailable(slot));
          const isSelected = Boolean(selectedSlots && slot.date >= new Date(selectedSlots.start) && slot.date <= new Date(selectedSlots.end));
          const style = getSlotStyle(slot, isAvailable, isSelected);
          return (
            <button
              key={slot.label + slot.date.toISOString()}
              onClick={() => handleSlotClick(slot)}
              disabled={!isAvailable}
              style={style}
              onMouseEnter={(e) => { if (isAvailable && !isSelected) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { if (isAvailable && !isSelected) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {slot.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
      {!isValidDate || loading ? (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: '#0f7072' }} />
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Đang kiểm tra lịch...</p>
        </div>
      ) : (
        <div>
          {renderGroup('Sáng (06:00 - 12:00)', <Sunrise size={16} color="#f97316" />, timeSlots.filter(s => s.period === 'sang'), '#f97316')}
          {renderGroup('Chiều (12:00 - 18:00)', <Sun size={16} color="#eab308" />, timeSlots.filter(s => s.period === 'chieu'), '#eab308')}
          {renderGroup('Tối (18:00 - 24:00)', <Sunset size={16} color="#a855f7" />, timeSlots.filter(s => s.period === 'toi'), '#a855f7')}
          {renderGroup('Đêm (00:00 - 06:00)', <Moon size={16} color="#3b82f6" />, timeSlots.filter(s => s.period === 'dem'), '#3b82f6')}
        </div>
      )}

      {selectedSlots && (
        <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #bbf7d0' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#15803d' }}>
            🕐 Đã chọn: {new Date(selectedSlots.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedSlots.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }} onClick={() => onSlotsChange(null)}>Xóa</button>
        </div>
      )}
    </div>
  );
}

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
  const [statusFilter, setStatusFilter] = useState<string>('trong');

  // Booking State
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [bookingType, setBookingType] = useState<'ngay' | 'gio'>('ngay');
  const [selectedDate, setSelectedDate] = useState('');
  const [numberOfNights, setNumberOfNights] = useState(1);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{ start: string, end: string } | null>(null);

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

  // Auto select today
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

  useEffect(() => { filterRooms(); }, [allRooms, selectedLocation, selectedConcept, priceRange, statusFilter]);

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
      // Giá ngày
      const price = selectedRoom.loai_phong?.gia_dem ? Number(selectedRoom.loai_phong.gia_dem) : 0;
      return price * numberOfNights;
    } else if (bookingType === 'gio' && selectedTimeSlots) {
      // Giá giờ
      const start = new Date(selectedTimeSlots.start);
      const end = new Date(selectedTimeSlots.end);
      let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (hours < 1) hours = 1;
      else hours = Math.ceil(hours);
      const price = selectedRoom.loai_phong?.gia_gio ? Number(selectedRoom.loai_phong.gia_gio) : 0;
      return price * hours;
    }
    return 0;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!selectedRoom) { toast.error('Bạn phải chọn phòng trước.'); return; }
      setStep(2);
    } else if (step === 2) {
      let checkInDateTime, checkOutDateTime;

      if (bookingType === 'ngay') {
        if (!selectedDate) { toast.error('Chọn ngày nhận phòng.'); return; }
        if (numberOfNights < 1) { toast.error('Số đêm tối thiểu là 1.'); return; }

        // Cố định giờ check-in 14:00, check-out 12:00
        checkInDateTime = new Date(selectedDate);
        checkInDateTime.setHours(14, 0, 0, 0);
        checkOutDateTime = new Date(selectedDate);
        checkOutDateTime.setDate(checkOutDateTime.getDate() + numberOfNights);
        checkOutDateTime.setHours(12, 0, 0, 0);
      } else {
        if (!selectedTimeSlots) { toast.error('Chọn khung giờ.'); return; }
        // Đặt theo giờ: lấy đúng giờ đã chọn
        checkInDateTime = new Date(selectedTimeSlots.start);
        checkOutDateTime = new Date(selectedTimeSlots.end);
        // Nếu chỉ chọn 1 slot thì end phải lớn hơn start ít nhất 30 phút
        if (checkOutDateTime <= checkInDateTime) {
          checkOutDateTime = new Date(checkInDateTime.getTime() + 30 * 60 * 1000);
        }
      }

      if (new Date() > checkInDateTime && bookingType === 'ngay') { toast.error('Không thể đặt ngày trong quá khứ.'); return; }

      setLoading(true);
      try {
        const bufferCheckStart = new Date(checkInDateTime);
        bufferCheckStart.setDate(bufferCheckStart.getDate() - 30);
        const bufferCheckEnd = new Date(checkOutDateTime);
        bufferCheckEnd.setHours(23, 59, 59, 999);

        const response = await fetch(
          `${API_URL}/dat-phong?start_date=${bufferCheckStart.toISOString()}&end_date=${bufferCheckEnd.toISOString()}`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        let isAvailable = true;

        if (data.success) {
          const roomBookings = data.data.filter((booking: any) =>
            booking.id_phong === selectedRoom.id && booking.trang_thai !== 'da_huy'
          );

          for (const booking of roomBookings) {
            const bStart = new Date(booking.thoi_gian_nhan);
            const bEnd = new Date(booking.thoi_gian_tra);

            const blockedStart = new Date(bStart.getTime() - 30 * 60000);
            const blockedEnd = new Date(bEnd.getTime() + 30 * 60000);

            if (checkInDateTime < blockedEnd && checkOutDateTime > blockedStart) {
              isAvailable = false; break;
            }
          }
        }
        if (!isAvailable) {
          toast.error('Khung giờ/Ngày này đã bị trùng lịch.');
          setLoading(false); return;
        }

        setCheckIn(checkInDateTime.toISOString().slice(0, 16));
        setCheckOut(checkOutDateTime.toISOString().slice(0, 16));
        setStep(3);
      } catch (e) { console.error(e); toast.error('Lỗi kiểm tra phòng.'); } finally { setLoading(false); }

      if (numberOfGuests < 1 || numberOfGuests > 10) { toast.error('Số khách không hợp lệ (1-10).'); return; }
    } else if (step === 3) {
      handleSubmitBooking();
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

  const handleSubmitBooking = async () => {
    if (!fullName || !phone) return toast.error('Nhập đầy đủ họ tên và SĐT.');
    if (!/^0[0-9]{9,10}$/.test(phone)) return toast.error('SĐT không hợp lệ.');
    setLoading(true);
    try {
      let cccdFrontUrl = null; let cccdBackUrl = null;
      if (cccdFront || cccdBack) {
        setUploadingCccd(true); toast.info('Đang upload CCCD...');
        try {
          if (cccdFront) cccdFrontUrl = await uploadToCloudinary(cccdFront, 'cccd');
          if (cccdBack) cccdBackUrl = await uploadToCloudinary(cccdBack, 'cccd');
          toast.success('Upload ảnh xong!');
        } catch { setUploadingCccd(false); setLoading(false); return toast.error('Lỗi upload ảnh.'); }
        setUploadingCccd(false);
      }
      let thoi_gian_nhan = checkIn;
      let thoi_gian_tra = checkOut;
      if (bookingType === 'gio' && selectedTimeSlots) {
        thoi_gian_nhan = toLocalISOString(new Date(selectedTimeSlots.start));
        thoi_gian_tra = toLocalISOString(new Date(selectedTimeSlots.end));
      }
      const bookingPayload = {
        ho_ten: fullName, sdt: phone, email: email || null,
        cccd_mat_truoc: cccdFrontUrl, cccd_mat_sau: cccdBackUrl,
        id_phong: selectedRoom.id, thoi_gian_nhan, thoi_gian_tra,
        so_khach: numberOfGuests, tong_tien: calculateTotal(), coc_csvc: 0,
        kenh_dat: 'website', ghi_chu: notes || null, ghi_chu_khach: notes || null
      };
      const res = await fetch(`${API_URL}/dat-phong`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify(bookingPayload)
      });
      const result = await res.json();
      if (result.success) {
        let checkInDisplay, checkOutDisplay;
        if (bookingType === 'gio' && selectedTimeSlots) {
          checkInDisplay = new Date(selectedTimeSlots.start).toLocaleString('vi-VN');
          checkOutDisplay = new Date(selectedTimeSlots.end).toLocaleString('vi-VN');
        } else {
          checkInDisplay = new Date(checkIn).toLocaleString('vi-VN');
          checkOutDisplay = new Date(checkOut).toLocaleString('vi-VN');
        }
        setBookingData({
          bookingCode: result.data.ma_dat, amount: calculateTotal(),
          bookingDetails: { roomName: `${selectedRoom.loai_phong?.ten_loai} - ${selectedRoom.ma_phong}`, checkIn: checkInDisplay, checkOut: checkOutDisplay }
        });
        setShowPaymentDialog(true); toast.success('Đặt thành công!');
      } else throw new Error(result.error);
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
                {filteredRooms.map(room => (
                  <div key={room.id} onClick={() => room.trang_thai !== 'bao_tri' && setSelectedRoom(room)} style={{ border: selectedRoom?.id === room.id ? '2px solid #0f7072' : '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'white', position: 'relative', transform: selectedRoom?.id === room.id ? 'translateY(-4px)' : 'none', boxShadow: selectedRoom?.id === room.id ? '0 10px 15px -3px rgba(15, 112, 114, 0.1)' : 'none' }}>
                    <div style={{ position: 'relative', aspectRatio: '16/10' }}>
                      <RoomImageCarousel images={room.anh_chinh ? [room.anh_chinh] : getRoomImages(room.id)} alt={room.ma_phong} />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backdropFilter: 'blur(4px)' }}>{room.loai_phong?.ten_loai}</div>
                      {selectedRoom?.id === room.id && <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#0f7072', color: 'white', borderRadius: '50%', padding: '6px' }}><div style={{ width: '10px', height: '10px', backgroundColor: 'white', borderRadius: '50%' }}></div></div>}
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Phòng {room.ma_phong}</h3>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f7072' }}>{formatCurrency(room.loai_phong?.gia_gio || 0)}<span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>/h</span></div>
                      </div>
                      <p style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b', margin: 0 }}><MapPin size={14} style={{ marginRight: '4px' }} /> {room.loai_phong?.co_so?.ten_co_so}</p>
                    </div>
                  </div>
                ))}
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
                  <CalendarDateSelector
                    roomId={selectedRoom.id}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    bookingType={bookingType}
                    numberOfNights={numberOfNights}
                  />
                </div>

                {bookingType === 'ngay' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Số đêm lưu trú</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => setNumberOfNights(Math.max(1, numberOfNights - 1))} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>-</button>
                      <input type="number" readOnly value={numberOfNights} style={{ width: '60px', textAlign: 'center', border: 'none', fontSize: '16px', fontWeight: 'bold' }} />
                      <button onClick={() => setNumberOfNights(Math.min(30, numberOfNights + 1))} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '12px' }}>Chọn khung giờ</label>
                    {selectedDate ? <TimeSlotSelector roomId={selectedRoom.id} selectedDate={selectedDate} selectedSlots={selectedTimeSlots} onSlotsChange={setSelectedTimeSlots} /> : <p style={{ color: '#94a3b8', fontSize: '14px' }}>Vui lòng chọn ngày trước</p>}
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
                    <span>{bookingType === 'ngay' ? `${numberOfNights} đêm` : `${selectedTimeSlots ? Math.ceil((new Date(selectedTimeSlots.end).getTime() - new Date(selectedTimeSlots.start).getTime()) / 3600000) : 0} giờ`}</span>
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

              {/* Thông tin đặt phòng chi tiết */}
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
                    <div>Giờ nhận: <b>{selectedTimeSlots ? new Date(selectedTimeSlots.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</b></div>
                    <div>Giờ trả: <b>{selectedTimeSlots ? new Date(selectedTimeSlots.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</b></div>
                  </>
                )}
                <div>Tổng tiền: <b>{formatCurrency(calculateTotal())}</b></div>
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Email (Không bắt buộc)</label>
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