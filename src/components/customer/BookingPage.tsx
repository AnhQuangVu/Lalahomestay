import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Users, MapPin, Home, Filter, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getRoomImage, formatCurrency } from '../../utils/imageUtils';
import { toast } from 'sonner@2.0.3';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;
const DEPOSIT_AMOUNT = 500000;

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
  const [bookingType, setBookingType] = useState<'gio' | 'dem'>('dem');
  
  // Step 3: Customer Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

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
        setAllRooms(roomData.data || []);
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
      'sap_tra': { label: 'Sắp trả', color: 'bg-blue-100 text-blue-800' },
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
    if (!selectedRoom || !checkIn || !checkOut) return 0;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    const price = bookingType === 'gio' ? selectedRoom.loai_phong?.gia_gio : selectedRoom.loai_phong?.gia_dem;
    const nights = Math.ceil(hours / 24);
    
    return bookingType === 'gio' ? price * Math.ceil(hours) : price * nights;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedRoom) {
        toast.error('Vui lòng chọn phòng');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!checkIn || !checkOut) {
        toast.error('Vui lòng chọn thời gian nhận và trả phòng');
        return;
      }
      if (new Date(checkIn) >= new Date(checkOut)) {
        toast.error('Thời gian trả phòng phải sau thời gian nhận phòng');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      handleSubmitBooking();
    }
  };

  const handleSubmitBooking = async () => {
    if (!fullName || !phone) {
      toast.error('Vui lòng nhập đầy đủ họ tên và số điện thoại');
      return;
    }

    setLoading(true);
    try {
      // Send booking data with customer info - server will handle customer creation
      const bookingData = {
        // Customer info (server will find or create customer)
        ho_ten: fullName,
        sdt: phone,
        email: email || null,
        
        // Booking info
        id_phong: selectedRoom.id,
        thoi_gian_nhan: checkIn,
        thoi_gian_tra: checkOut,
        so_khach: numberOfGuests,
        tong_tien: calculateTotal(),
        coc_csvc: DEPOSIT_AMOUNT,
        kenh_dat: 'website',
        trang_thai: 'da_coc',
        ghi_chu: notes || null,
        // also send legacy field name to be safe
        ghi_chu_khach: notes || null
      };

      console.log('Creating booking with data:', bookingData);

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
        
        // Show detailed success notification
        toast.success(
          <div className="space-y-2">
            <div className="font-semibold">Đặt phòng thành công!</div>
            <div className="text-sm">
              <div>📋 Mã đặt phòng: <span className="font-mono font-semibold">{bookingCode}</span></div>
              <div>🏠 Phòng: {selectedRoom.loai_phong?.ten_loai} - {selectedRoom.ma_phong}</div>
              <div>💰 Tổng tiền: {formatCurrency(calculateTotal() + DEPOSIT_AMOUNT)}</div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Vui lòng lưu lại mã đặt phòng để tra cứu sau
            </div>
          </div>,
          {
            duration: 6000,
          }
        );
        
        // Redirect to lookup page with booking code
        setTimeout(() => {
          navigate(`/lookup?code=${bookingCode}`);
        }, 3000);
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
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-24 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-20 mt-2 text-sm">
            <span className={step >= 1 ? 'text-blue-600' : 'text-gray-600'}>Chọn phòng</span>
            <span className={step >= 2 ? 'text-blue-600' : 'text-gray-600'}>Thời gian</span>
            <span className={step >= 3 ? 'text-blue-600' : 'text-gray-600'}>Thông tin</span>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">Tất cả cơ sở</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.ten_co_so}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Loại phòng</label>
                  <select
                    value={selectedConcept}
                    onChange={(e) => setSelectedConcept(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Làm mới
                </button>
              </div>

              {/* Room Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
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
                      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${
                        selectedRoom?.id === room.id ? 'ring-2 ring-blue-600' : ''
                      } ${room.trang_thai !== 'trong' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="relative h-48">
                        <img
                          src={getRoomImage(room.id)}
                          alt={room.ma_phong || 'Phòng LaLa House'}
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (!img.dataset.fallbackApplied) {
                              img.dataset.fallbackApplied = '1';
                              // Log room info to help debug which records failed
                              try {
                                // eslint-disable-next-line no-console
                                console.warn('Room image failed, applying fallback', { id: room.id, ma_phong: room.ma_phong });
                              } catch {}
                              img.src = getRoomImage(null);
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
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
                            <p className="text-blue-600">{formatCurrency(room.loai_phong?.gia_gio || 0)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Giá đêm</p>
                            <p className="text-blue-600">{formatCurrency(room.loai_phong?.gia_dem || 0)}</p>
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
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-gray-900 mb-2">Phòng đã chọn</h3>
              <p className="text-gray-700">
                {selectedRoom.loai_phong?.ten_loai} - Phòng {selectedRoom.ma_phong}
              </p>
              <p className="text-sm text-gray-600">{selectedRoom.loai_phong?.co_so?.ten_co_so}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Loại thuê</label>
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value as 'gio' | 'dem')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="gio">Theo giờ - {formatCurrency(selectedRoom.loai_phong?.gia_gio || 0)}/giờ</option>
                  <option value="dem">Qua đêm - {formatCurrency(selectedRoom.loai_phong?.gia_dem || 0)}/đêm</option>
                </select>
              </div>
              
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Thời gian nhận phòng</label>
                <input
                  type="datetime-local"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Thời gian trả phòng</label>
                <input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Tiền phòng:</span>
                <span className="text-gray-900">{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Cọc cơ sở vật chất:</span>
                <span className="text-gray-900">{formatCurrency(DEPOSIT_AMOUNT)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-900">Tổng cộng:</span>
                <span className="text-xl text-blue-600">{formatCurrency(calculateTotal() + DEPOSIT_AMOUNT)}</span>
              </div>
            </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Yêu cầu đặc biệt..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Vui lòng mang theo CCCD/CMND khi đến nhận phòng để làm thủ tục check-in
              </p>
            </div>
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
            disabled={loading || (step === 1 && !selectedRoom)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? (loading ? 'Đang xử lý...' : 'Xác nhận đặt phòng') : 'Tiếp tục'}
            {step < 3 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
