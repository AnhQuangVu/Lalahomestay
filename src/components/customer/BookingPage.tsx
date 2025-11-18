import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Users, MapPin, Home, Filter, RefreshCw, Upload, X, Clock } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getRoomImage, getRoomImages, formatCurrency } from '../../utils/imageUtils';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { toast } from 'sonner';
import PaymentQRDialog from '../PaymentQRDialog';
import RoomImageCarousel from './RoomImageCarousel';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;
const DEPOSIT_AMOUNT = 500000;

// Time slot selector component
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

  // Fetch bookings for the selected date
  useEffect(() => {
    console.log('TimeSlotSelector useEffect - selectedDate:', selectedDate, 'roomId:', roomId);
    fetchBookingsForDate();
  }, [selectedDate, roomId]);

  const fetchBookingsForDate = async () => {
    setLoading(true);
    try {
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;

      const response = await fetch(
        `${API_URL}/dat-phong?start_date=${startOfDay}&end_date=${endOfDay}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );

      const data = await response.json();
      if (data.success) {
        // Filter bookings for this specific room
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

  // Generate timeline: 06:00 ngày N đến 06:00 ngày N+1 (30 phút/slot)
  const generateTimeSlots = () => {
    const slots = [];
    let date = new Date(`${selectedDate}T06:00:00`);
    for (let i = 0; i < 48; i++) {
      slots.push({
        label: date.toTimeString().slice(0, 5),
        date: new Date(date),
      });
      date = new Date(date.getTime() + 30 * 60 * 1000);
    }
    return slots;
  };

  // Kiểm tra selectedDate hợp lệ
  const isValidDate = selectedDate && !isNaN(new Date(`${selectedDate}T06:00:00`).getTime());
  const timeSlots = isValidDate ? generateTimeSlots() : [];

  // Check if a time slot is available (not in any buffer region)
  const isTimeSlotAvailable = (slot: { label: string, date: Date }) => {
    const slotStart = slot.date;
    const slotEnd = new Date(slot.date.getTime() + 30 * 60 * 1000); // 30 phút sau
    for (const booking of bookings) {
      const bookingStart = new Date(booking.thoi_gian_nhan);
      const bookingEnd = new Date(booking.thoi_gian_tra);
      const bufferStart = new Date(bookingStart.getTime() - 30 * 60 * 1000);
      const bufferEnd = new Date(bookingEnd.getTime() + 30 * 60 * 1000);
      // Kiểm tra giao thoa giữa slot và buffer
      const overlaps = slotStart < bufferEnd && slotEnd > bufferStart;
      if (overlaps) {
        return false;
      }
    }
    return true;
  };

  // Get slot background color (inline style)
  const getSlotBgColor = (slot: { label: string, date: Date }) => {
    if (!isTimeSlotAvailable(slot)) return '#9ca3af'; // gray
    const hour = slot.date.getHours();
    const minute = slot.date.getMinutes();
    if ((hour > 6 || (hour === 6 && minute >= 30)) && (hour < 21 || (hour === 21 && minute < 30))) return '#fde047'; // yellow
    if (hour >= 22 || hour < 6) return '#60a5fa'; // blue
    return '#9ca3af'; // gray
  };

  const handleSlotClick = (slot: { label: string, date: Date }) => {
    if (!isTimeSlotAvailable(slot)) return;

    const slotDateTime = slot.date.toISOString();

    if (!selectedSlots) {
      // Start selection
      onSlotsChange({ start: slotDateTime, end: slotDateTime });
    } else if (selectedSlots.start === slotDateTime && selectedSlots.end === slotDateTime) {
      // Deselect single slot
      onSlotsChange(null);
    } else {
      // End selection
      const startTime = new Date(selectedSlots.start);
      const endTime = new Date(slotDateTime);

      // Đảm bảo startTime <= endTime
      let from = startTime < endTime ? startTime : endTime;
      let to = startTime < endTime ? endTime : startTime;

      // Lấy tất cả các slot trong khoảng from -> to
      const slotsInRange = timeSlots.filter(s => s.date >= from && s.date <= to);
      const allAvailable = slotsInRange.every(s => isTimeSlotAvailable(s));
      if (!allAvailable) {
        toast.error('Khung giờ chọn phải liên tục, không được chứa slot không khả dụng.');
        return;
      }

      if (endTime > startTime) {
        onSlotsChange({ start: selectedSlots.start, end: slotDateTime });
      } else {
        // Reset and start new selection
        onSlotsChange({ start: slotDateTime, end: slotDateTime });
      }
    }
  };

  const isSlotSelected = (timeString: string) => {
    if (!selectedSlots) return false;
    const slotDateTime = `${selectedDate}T${timeString}:00`;
    const slotTime = new Date(slotDateTime);
    const startTime = new Date(selectedSlots.start);
    const endTime = new Date(selectedSlots.end);
    return slotTime >= startTime && slotTime <= endTime;
  };

  if (!isValidDate || loading) {
    console.log('selectedDate:', selectedDate, 'isValidDate:', isValidDate);
  }
  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span>Giờ ban ngày (06:30-21:30)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
          <span>Giờ qua đêm (22:00-06:00)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Không khả dụng</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span>Đã chọn</span>
        </div>
      </div>

      {/* Time slots grid */}
      <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
        {/* Move debug log outside JSX */}
        {!isValidDate || loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: '#0f7072' }} />
            <p className="text-gray-600">Đang tải lịch...</p>
          </div>
        ) : (
          <>
            {console.log('Rendering time slots:', timeSlots.length, timeSlots.map(s => s.date.toISOString()))}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {timeSlots.map((slot) => {
                const isAvailable = isTimeSlotAvailable(slot);
                const isSelected = selectedSlots && slot.date >= new Date(selectedSlots.start) && slot.date <= new Date(selectedSlots.end);
                let bgColor = getSlotBgColor(slot);
                let textColor = '#fff';
                if (isSelected) {
                  bgColor = '#4ade80'; // green
                  textColor = '#fff';
                } else if (!isAvailable) {
                  bgColor = '#9ca3af'; // gray
                  textColor = '#1f2937';
                } else if (bgColor === '#9ca3af') {
                  textColor = '#1f2937';
                } else if (bgColor === '#fde047' || bgColor === '#60a5fa') {
                  textColor = '#fff';
                }

                // Log từng slot để debug
                console.log('Slot:', slot.label, slot.date.toISOString(), 'BgColor:', bgColor, 'Available:', isAvailable);

                return (
                  <button
                    key={slot.label + slot.date.toISOString()}
                    onClick={() => handleSlotClick(slot)}
                    disabled={!isAvailable}
                    className={`px-2 py-2 text-xs font-medium rounded-lg border-2 border-gray-200 shadow-sm transition-all duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#0f7072]`}
                    style={{ backgroundColor: bgColor, color: textColor }}
                    title={`${slot.label} ${isAvailable ? '(Có thể đặt)' : '(Không khả dụng)'}`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Selected slots summary */}
      {selectedSlots && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            🕐 Đã chọn: {new Date(selectedSlots.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedSlots.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Data from API
  const [locations, setLocations] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedConcept, setSelectedConcept] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('trong');

  // Step 1: Room selection
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // Step 2: Date & Time
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [bookingType, setBookingType] = useState<'ngay' | 'gio'>('ngay'); // Changed from 'dem' to 'ngay'
  const [selectedDate, setSelectedDate] = useState(''); // For ngày mode
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{ start: string, end: string } | null>(null); // For giờ mode

  // Ensure selectedDate is always set when switching to 'gio' mode
  useEffect(() => {
    if (step === 2 && bookingType === 'gio' && !selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [step, bookingType, selectedDate]);

  // Step 3: Customer Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // CCCD Images
  const [cccdFront, setCccdFront] = useState<File | null>(null);
  const [cccdBack, setCccdBack] = useState<File | null>(null);
  const [cccdFrontPreview, setCccdFrontPreview] = useState<string>('');
  const [cccdBackPreview, setCccdBackPreview] = useState<string>('');
  const [uploadingCccd, setUploadingCccd] = useState(false);

  // Payment QR Dialog
  const [bookingData, setBookingData] = useState<{
    bookingCode: string;
    amount: number;
    bookingDetails: {
      roomName: string;
      checkIn: string;
      checkOut: string;
    };
  } | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    fetchData();

    // Set default dates
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setCheckIn(now.toISOString().slice(0, 16));
    setCheckOut(tomorrow.toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    filterRooms();
  }, [allRooms, selectedLocation, selectedConcept, priceRange, statusFilter]);

  // Check if day booking is available for selected date
  const isDayBookingAvailable = async (date: string) => {
    if (!date || !selectedRoom) return false;

    try {
      const checkInDateTime = new Date(date);
      checkInDateTime.setHours(14, 0, 0, 0); // 14:00

      const checkOutDateTime = new Date(date);
      checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);
      checkOutDateTime.setHours(12, 0, 0, 0); // 12:00 trưa hôm sau

      // Fetch bookings for the selected date range
      const startOfPeriod = checkInDateTime.toISOString();
      const endOfPeriod = checkOutDateTime.toISOString();

      const response = await fetch(
        `${API_URL}/dat-phong?start_date=${startOfPeriod}&end_date=${endOfPeriod}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );

      const data = await response.json();
      if (data.success) {
        // Filter bookings for this specific room
        const roomBookings = data.data.filter((booking: any) =>
          booking.id_phong === selectedRoom.id && booking.trang_thai !== 'da_huy'
        );

        // Check for conflicting bookings
        for (const booking of roomBookings) {
          const bookingStart = new Date(booking.thoi_gian_nhan);
          const bookingEnd = new Date(booking.thoi_gian_tra);

          // Check if booking overlaps with day booking period
          if (bookingStart < checkOutDateTime && bookingEnd > checkInDateTime) {
            return false;
          }
        }

        return true;
      } else {
        console.error('Failed to fetch bookings for availability check');
        return false;
      }
    } catch (error) {
      console.error('Error checking day booking availability:', error);
      return false;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locRes, conceptRes, roomRes] = await Promise.all([
        fetch(`${API_URL}/co-so`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/loai-phong`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/phong`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);

      const [locData, conceptData, roomData] = await Promise.all([
        locRes.json(),
        conceptRes.json(),
        roomRes.json()
      ]);

      if (locData.success) setLocations(locData.data || []);
      if (conceptData.success) setConcepts(conceptData.data || []);
      if (roomData.success) {
        // Lọc bỏ phòng đình chỉ - không hiển thị cho customer
        const availableRooms = (roomData.data || []).filter(
          (room: any) => room.trang_thai !== 'dinh_chi' && room.trang_thai !== 'bao_tri'
        );
        setAllRooms(availableRooms);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = allRooms;

    // Luôn loại bỏ phòng đình chỉ và bảo trì (double-check safety)
    filtered = filtered.filter(r => r.trang_thai !== 'dinh_chi' && r.trang_thai !== 'bao_tri');

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.trang_thai === statusFilter);
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(r => r.loai_phong?.id_co_so === selectedLocation);
    }

    // Filter by concept
    if (selectedConcept !== 'all') {
      filtered = filtered.filter(r => r.id_loai_phong === selectedConcept);
    }

    // Filter by price range
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



  const getStatusBadge = (status: string) => {
    const badges: any = {
      'trong': { label: 'Còn trống', color: 'bg-green-100 text-green-800' },
      'dang_dung': { label: 'Đang dùng', color: 'bg-red-100 text-red-800' },
      'sap_nhan': { label: 'Sắp nhận', color: 'bg-yellow-100 text-yellow-800' },
      'sap_tra': { label: 'Sắp trả', color: 'bg-[rgba(15,112,114,0.1)] text-[#0f7072]' },
      'bao_tri': { label: 'Bảo trì', color: 'bg-gray-100 text-gray-800' }
    };

    const badge = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const calculateTotal = () => {
    if (!selectedRoom) return 0;

    if (bookingType === 'ngay' && selectedDate) {
      // Đặt theo ngày: luôn 1 ngày
      return selectedRoom.loai_phong?.gia_dem || 0;
    } else if (bookingType === 'gio' && selectedTimeSlots) {
      // Đặt theo giờ: tính số giờ
      const start = new Date(selectedTimeSlots.start);
      const end = new Date(selectedTimeSlots.end);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const price = selectedRoom.loai_phong?.gia_gio || 0;
      return price * Math.ceil(hours);
    } else if (checkIn && checkOut) {
      // Fallback cho datetime inputs (legacy)
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const price = bookingType === 'gio' ? selectedRoom.loai_phong?.gia_gio : selectedRoom.loai_phong?.gia_dem;

      if (bookingType === 'gio') {
        return price * Math.ceil(hours);
      } else {
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        return price * nights;
      }
    }

    return 0;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!selectedRoom) {
        toast.error('Bạn phải chọn phòng trước khi tiếp tục.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validation cho đặt theo ngày
      if (bookingType === 'ngay') {
        if (!selectedDate) {
          toast.error('Bạn phải chọn ngày nhận phòng.');
          return;
        }

        const selectedDateTime = new Date(selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDateTime < today) {
          toast.error('Không thể đặt phòng cho ngày trong quá khứ.');
          return;
        }

        // Check if day booking is available for selected date
        if (!(await isDayBookingAvailable(selectedDate))) {
          toast.error('Phòng đã được đặt cho ngày này. Vui lòng chọn ngày khác.');
          return;
        }

        // Set check-in và check-out cho ngày mode
        const checkInDateTime = new Date(selectedDate);
        checkInDateTime.setHours(14, 0, 0, 0); // 14:00

        const checkOutDateTime = new Date(selectedDate);
        checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);
        checkOutDateTime.setHours(12, 0, 0, 0); // 12:00 trưa hôm sau

        setCheckIn(checkInDateTime.toISOString().slice(0, 16));
        setCheckOut(checkOutDateTime.toISOString().slice(0, 16));

      } else if (bookingType === 'gio') {
        // Validation cho đặt theo giờ
        if (!selectedTimeSlots) {
          toast.error('Bạn phải chọn khung giờ thuê phòng.');
          return;
        }

        // Set check-in và check-out từ selectedTimeSlots
        setCheckIn(selectedTimeSlots.start);
        setCheckOut(selectedTimeSlots.end);
      }

      if (numberOfGuests < 1) {
        toast.error('Số khách phải ít nhất là 1.');
        return;
      }
      if (numberOfGuests > 10) {
        toast.error('Số khách vượt quá giới hạn phòng (tối đa 10).');
        return;
      }

      setStep(3);
    } else if (step === 3) {
      handleSubmitBooking();
    }
  };

  const handleCccdUpload = (file: File, side: 'front' | 'back') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File ảnh không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') {
        setCccdFront(file);
        setCccdFrontPreview(reader.result as string);
      } else {
        setCccdBack(file);
        setCccdBackPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCccdImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      setCccdFront(null);
      setCccdFrontPreview('');
    } else {
      setCccdBack(null);
      setCccdBackPreview('');
    }
  };

  const handleSubmitBooking = async () => {
    if (!fullName) {
      toast.error('Bạn phải nhập họ tên.');
      return;
    }
    if (!phone) {
      toast.error('Bạn phải nhập số điện thoại.');
      return;
    }

    // Validate số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)
    const phoneRegex = /^0[0-9]{9,10}$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Số điện thoại không hợp lệ (phải có 10-11 số và bắt đầu bằng 0).');
      return;
    }

    // Validate email nếu có
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Email không hợp lệ.');
        return;
      }
    }

    setLoading(true);
    try {
      // Upload CCCD images first if provided
      let cccdFrontUrl = null;
      let cccdBackUrl = null;

      if (cccdFront || cccdBack) {
        setUploadingCccd(true);
        toast.info('Đang upload ảnh CCCD...');

        try {
          if (cccdFront) {
            cccdFrontUrl = await uploadToCloudinary(cccdFront, 'cccd');
          }
          if (cccdBack) {
            cccdBackUrl = await uploadToCloudinary(cccdBack, 'cccd');
          }
          toast.success('Upload ảnh CCCD thành công!');
        } catch (error) {
          console.error('Error uploading CCCD:', error);
          toast.error('Không thể upload ảnh CCCD. Vui lòng thử lại.');
          setUploadingCccd(false);
          setLoading(false);
          return;
        } finally {
          setUploadingCccd(false);
        }
      }

      // Send booking data with customer info - server will handle customer creation
      const bookingData = {
        // Customer info (server will find or create customer)
        ho_ten: fullName,
        sdt: phone,
        email: email || null,
        cccd_mat_truoc: cccdFrontUrl,
        cccd_mat_sau: cccdBackUrl,

        // Booking info
        id_phong: selectedRoom.id,
        thoi_gian_nhan: checkIn,
        thoi_gian_tra: checkOut,
        so_khach: numberOfGuests,
        tong_tien: calculateTotal(),
        coc_csvc: DEPOSIT_AMOUNT,
        kenh_dat: 'website',
        // Do not set `trang_thai` here — let server default to 'cho_coc' (Chờ cọc)
        ghi_chu: notes || null,
        // also send legacy field name to be safe
        ghi_chu_khach: notes || null
      };

      console.log('Creating booking with data:', bookingData);
      console.log('CCCD URLs - Front:', cccdFrontUrl, 'Back:', cccdBackUrl);

      // DEBUG: Verify CCCD data before sending
      if (cccdFrontUrl || cccdBackUrl) {
        console.log('✅ CCCD data is being sent to server');
      } else {
        console.log('⚠️ No CCCD data to send');
      }

      const createBookingRes = await fetch(`${API_URL}/dat-phong`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(bookingData)
      });

      const bookingResult = await createBookingRes.json();
      console.log('Booking result:', bookingResult);

      if (bookingResult.success) {
        const bookingCode = bookingResult.data.ma_dat;

        // Store booking data for QR dialog
        setBookingData({
          bookingCode: bookingCode,
          // Show deposit amount for payment QR (customer should pay deposit)
          amount: DEPOSIT_AMOUNT,
          bookingDetails: {
            roomName: `${selectedRoom.loai_phong?.ten_loai} - ${selectedRoom.ma_phong}`,
            checkIn: new Date(checkIn).toLocaleString('vi-VN'),
            checkOut: new Date(checkOut).toLocaleString('vi-VN')
          }
        });

        // Show payment QR dialog
        setShowPaymentDialog(true);

        // Show success toast
        toast.success('Đặt phòng thành công! Vui lòng thanh toán để hoàn tất.');
      } else {
        throw new Error(bookingResult.error || 'Không thể tạo đơn đặt phòng');
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  style={{
                    backgroundColor: step >= s ? '#0f7072' : '#d1d5db',
                    color: step >= s ? 'white' : '#4b5563'
                  }}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className="w-24 h-1 mx-2"
                    style={{ backgroundColor: step > s ? '#0f7072' : '#d1d5db' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-20 mt-2 text-sm">
            <span style={{ color: step >= 1 ? '#0f7072' : '#4b5563' }}>Chọn phòng</span>
            <span style={{ color: step >= 2 ? '#0f7072' : '#4b5563' }}>Thời gian</span>
            <span style={{ color: step >= 3 ? '#0f7072' : '#4b5563' }}>Thông tin</span>
          </div>
        </div>

        {/* Step 1: Choose Room */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-gray-900 mb-6">Chọn phòng</h2>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Cơ sở</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                  >
                    <option value="all">Tất cả cơ sở</option>
                    {(Array.isArray(locations) ? locations.slice(0, 3) : []).map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.ten_co_so}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Loại phòng</label>
                  <select
                    value={selectedConcept}
                    onChange={(e) => setSelectedConcept(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                  >
                    <option value="all">Tất cả loại</option>
                    {concepts.map(concept => (
                      <option key={concept.id} value={concept.id}>
                        {concept.ten_loai} - {concept.co_so?.ten_co_so}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Khoảng giá</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="low">Dưới 200k</option>
                    <option value="mid">200k - 500k</option>
                    <option value="high">Trên 500k</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Trạng thái</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="trong">Còn trống</option>
                    <option value="dang_dung">Đang dùng</option>
                    <option value="sap_nhan">Sắp nhận</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">Tìm thấy {filteredRooms.length} phòng</p>
                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 transition-colors"
                  style={{ color: '#0f7072' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0d5f61'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#0f7072'}
                >
                  <RefreshCw className="w-4 h-4" />
                  Làm mới
                </button>
              </div>

              {/* Room Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#0f7072' }} />
                  <p className="text-gray-600">Đang tải phòng...</p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Không tìm thấy phòng phù hợp</p>
                  <p className="text-sm text-gray-500 mt-2">Thử thay đổi bộ lọc hoặc vào /setup để tạo dữ liệu mẫu</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => room.trang_thai === 'trong' && setSelectedRoom(room)}
                      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedRoom?.id === room.id ? 'ring-2' : ''
                        } ${room.trang_thai !== 'trong' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      style={selectedRoom?.id === room.id ? { borderColor: '#0f7072', boxShadow: '0 0 0 2px #0f7072' } : {}}
                    >
                      <div className="relative">
                        <RoomImageCarousel
                          images={(() => {
                            // Lọc ảnh từ server (loại bỏ null, undefined, chuỗi rỗng)
                            const serverImages = [room.anh_chinh, ...(room.anh_phu || [])]
                              .filter(img => img && typeof img === 'string' && img.trim().length > 0);

                            // Nếu có ảnh từ server thì dùng, không thì dùng ảnh random
                            return serverImages.length > 0
                              ? serverImages
                              : getRoomImages(room.id, 4);
                          })()}
                          alt={room.ma_phong || 'Phòng LaLa House'}
                        />
                        <div className="absolute top-3 right-3 z-10">
                          {getStatusBadge(room.trang_thai)}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-gray-900 mb-1">
                          {room.loai_phong?.ten_loai} - Phòng {room.ma_phong}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          {room.loai_phong?.co_so?.ten_co_so}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Giá giờ</p>
                            <p style={{ color: '#0f7072' }}>{formatCurrency(room.loai_phong?.gia_gio || 0)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Giá ngày</p>
                            <p style={{ color: '#0f7072' }}>{formatCurrency(room.loai_phong?.gia_dem || 0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Time Selection */}
        {step === 2 && selectedRoom && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-6">Thời gian thuê</h2>

            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(15, 112, 114, 0.1)' }}>
              <h3 className="text-gray-900 mb-2">Phòng đã chọn</h3>
              <p className="text-gray-700">
                {selectedRoom.loai_phong?.ten_loai} - Phòng {selectedRoom.ma_phong}
              </p>
              <p className="text-sm text-gray-600">{selectedRoom.loai_phong?.co_so?.ten_co_so}</p>
            </div>

            {/* Booking Type Selection */}
            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-4">Chọn hình thức đặt phòng</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setBookingType('ngay')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${bookingType === 'ngay'
                    ? 'border-[#0f7072] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 mr-2" style={{ color: '#0f7072' }} />
                    <span className="font-medium text-gray-900">Đặt theo ngày</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    🗓️ Check-in: 14:00, Check-out: 12:00 trưa hôm sau
                  </p>
                  <p className="text-sm font-medium" style={{ color: '#0f7072' }}>
                    {formatCurrency(selectedRoom.loai_phong?.gia_dem || 0)}/ngày
                  </p>
                </div>

                <div
                  onClick={() => setBookingType('gio')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${bookingType === 'gio'
                    ? 'border-[#0f7072] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 mr-2" style={{ color: '#0f7072' }} />
                    <span className="font-medium text-gray-900">Đặt theo giờ</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    ⏰ Linh hoạt theo khung giờ 24h
                  </p>
                  <p className="text-sm font-medium" style={{ color: '#0f7072' }}>
                    {formatCurrency(selectedRoom.loai_phong?.gia_gio || 0)}/giờ
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Số khách</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={numberOfGuests}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setNumberOfGuests(isNaN(value) ? 1 : value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                />
              </div>

              {bookingType === 'ngay' ? (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ngày nhận phòng</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                  />
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-2">Chọn khung giờ</label>
                  <div className="text-sm text-gray-600 mb-2">
                    Chọn khoảng thời gian bạn muốn thuê phòng
                  </div>
                  {selectedDate ? (
                    <TimeSlotSelector
                      roomId={selectedRoom.id}
                      selectedDate={selectedDate}
                      selectedSlots={selectedTimeSlots}
                      onSlotsChange={setSelectedTimeSlots}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: '#0f7072' }} />
                      <p className="text-gray-600">Đang tải lịch...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Booking Summary */}
            {(bookingType === 'ngay' && selectedDate) && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(15, 112, 114, 0.05)', border: '2px solid rgba(15, 112, 114, 0.2)' }}>
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700 font-medium">Thời gian thuê:</span>
                    <span className="text-sm font-semibold" style={{ color: '#0f7072' }}>
                      1 ngày (14:00 → 12:00 trưa hôm sau)
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    📅 {new Date(selectedDate).toLocaleDateString('vi-VN')} 14:00 → {new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')} 12:00
                  </div>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Tiền phòng:</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(selectedRoom.loai_phong?.gia_dem || 0)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Cọc cơ sở vật chất:</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(DEPOSIT_AMOUNT)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2" style={{ borderColor: 'rgba(15, 112, 114, 0.3)' }}>
                  <span className="text-gray-900 font-semibold">Tổng thanh toán:</span>
                  <span className="text-2xl font-bold" style={{ color: '#0f7072' }}>{formatCurrency((selectedRoom.loai_phong?.gia_dem || 0) + DEPOSIT_AMOUNT)}</span>
                </div>
                <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
                  💳 Thanh toán trước {formatCurrency(DEPOSIT_AMOUNT)} để giữ phòng
                </div>
              </div>
            )}

            {bookingType === 'gio' && selectedTimeSlots && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(15, 112, 114, 0.05)', border: '2px solid rgba(15, 112, 114, 0.2)' }}>
                {(() => {
                  const start = new Date(selectedTimeSlots.start);
                  const end = new Date(selectedTimeSlots.end);
                  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  const roundedHours = Math.ceil(hours);
                  const price = selectedRoom.loai_phong?.gia_gio || 0;
                  const roomTotal = price * roundedHours;

                  return (
                    <>
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-700 font-medium">Thời gian thuê:</span>
                          <span className="text-sm font-semibold" style={{ color: '#0f7072' }}>
                            {roundedHours} giờ
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          🕐 {start.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                          {' → '}
                          {end.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Tiền phòng:</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(roomTotal)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Cọc cơ sở vật chất:</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(DEPOSIT_AMOUNT)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t-2" style={{ borderColor: 'rgba(15, 112, 114, 0.3)' }}>
                        <span className="text-gray-900 font-semibold">Tổng thanh toán:</span>
                        <span className="text-2xl font-bold" style={{ color: '#0f7072' }}>{formatCurrency(roomTotal + DEPOSIT_AMOUNT)}</span>
                      </div>
                      <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
                        💳 Thanh toán trước {formatCurrency(DEPOSIT_AMOUNT)} để giữ phòng
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer Info */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-6">Thông tin khách hàng</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Họ tên *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Yêu cầu đặc biệt..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f7072] outline-none"
                />
              </div>
            </div>

            {/* CCCD Upload Section */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-gray-900 mb-4 font-medium">Upload ảnh CCCD/CMND (Tùy chọn)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload ảnh CCCD để xác minh nhanh hơn khi check-in. Ảnh sẽ được lưu trữ an toàn.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CCCD Mặt trước */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">CCCD Mặt trước</label>
                  {cccdFrontPreview ? (
                    <div className="relative">
                      <img
                        src={cccdFrontPreview}
                        alt="CCCD mặt trước"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        onClick={() => removeCccdImage('front')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click để chọn ảnh</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG (max 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleCccdUpload(e.target.files[0], 'front')}
                      />
                    </label>
                  )}
                </div>

                {/* CCCD Mặt sau */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">CCCD Mặt sau</label>
                  {cccdBackPreview ? (
                    <div className="relative">
                      <img
                        src={cccdBackPreview}
                        alt="CCCD mặt sau"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        onClick={() => removeCccdImage('back')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click để chọn ảnh</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG (max 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleCccdUpload(e.target.files[0], 'back')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {(cccdFront || cccdBack) && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Đã upload ảnh CCCD. Bạn vẫn cần mang theo CCCD gốc khi check-in.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại
          </button>

          <button
            onClick={handleNextStep}
            disabled={loading || uploadingCccd || (step === 1 && !selectedRoom)}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: '#0f7072' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#0d5f61')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#0f7072')}
          >
            {step === 3 ? (
              uploadingCccd ? 'Đang upload CCCD...' :
                loading ? 'Đang xử lý...' :
                  'Xác nhận đặt phòng'
            ) : 'Tiếp tục'}
            {step < 3 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Payment QR Dialog */}
      {bookingData && (
        <PaymentQRDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          bookingCode={bookingData.bookingCode}
          amount={bookingData.amount}
          bookingDetails={bookingData.bookingDetails}
        />
      )}
    </div>
  );
}
