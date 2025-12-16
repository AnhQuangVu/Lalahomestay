import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Calendar, CreditCard, User, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Booking {
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  roomConcept: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  createdAt: string;
}

export default function LookupPage() {
  const [searchParams] = useSearchParams();
  const [searchType, setSearchType] = useState<'code' | 'phone'>('code');
  const [searchValue, setSearchValue] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Auto-search if code is provided in URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setSearchValue(code);
      setSearchType('code');
      // Trigger search after a short delay
      setTimeout(() => {
        handleSearchWithValue(code, 'code');
      }, 100);
    }
  }, [searchParams]);

  const handleSearchWithValue = async (value: string, type: 'code' | 'phone') => {
    if (!value.trim()) {
      toast.error('Vui lòng nhập thông tin tra cứu');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/bookings/lookup?${type === 'code' ? 'code=' : 'phone='
        }${value}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      console.log('Lookup response:', data);

      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    handleSearchWithValue(searchValue, searchType);
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'checked-in': 'bg-blue-100 text-blue-800',
      'checked-out': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    const labels: { [key: string]: string } = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'checked-in': 'Đã nhận phòng',
      'checked-out': 'Đã trả phòng',
      'cancelled': 'Đã hủy'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };

    const labels: { [key: string]: string } = {
      'pending': 'Chờ thanh toán',
      'paid': 'Đã thanh toán',
      'failed': 'Thanh toán thất bại'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-gray-900 mb-6">Tra cứu đặt phòng</h1>

          {/* Search Type */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setSearchType('code')}
              className={`px-4 py-2 rounded-lg transition-colors ${searchType === 'code'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Tra cứu theo mã đặt phòng
            </button>
            <button
              onClick={() => setSearchType('phone')}
              className={`px-4 py-2 rounded-lg transition-colors ${searchType === 'phone'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Tra cứu theo số điện thoại
            </button>
          </div>

          {/* Search Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                searchType === 'code'
                  ? 'Nhập mã đặt phòng (VD: LALA-20251108-0001)'
                  : 'Nhập số điện thoại'
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>{loading ? 'Đang tìm...' : 'Tra cứu'}</span>
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tìm kiếm...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">Không tìm thấy đơn đặt phòng nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-gray-900 mb-4">
                  Tìm thấy {bookings.length} đơn đặt phòng
                </h2>

                {bookings.map((booking) => (
                  <div
                    key={booking.code}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-gray-900">Mã: {booking.code}</p>
                        <p className="text-gray-600">
                          {booking.roomConcept} {booking.roomNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.bookingStatus)}
                        {/* Only show payment status if booking is not already pending or cancelled */}
                        {!['pending', 'cancelled'].includes(booking.bookingStatus) && (
                          <div className="mt-1">
                            {getPaymentStatusBadge(booking.paymentStatus)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(booking.checkIn), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <CreditCard className="w-4 h-4" />
                        <span>{booking.totalAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-gray-900">Chi tiết đặt phòng</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Booking Info */}
                <div>
                  <h3 className="text-gray-900 mb-3">Thông tin đặt phòng</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đặt phòng:</span>
                      <span className="text-gray-900">{selectedBooking.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phòng:</span>
                      <span className="text-gray-900">
                        {selectedBooking.roomConcept} {selectedBooking.roomNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="text-gray-900">
                        {format(new Date(selectedBooking.checkIn), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="text-gray-900">
                        {format(new Date(selectedBooking.checkOut), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số khách:</span>
                      <span className="text-gray-900">{selectedBooking.numberOfGuests} người</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      {getStatusBadge(selectedBooking.bookingStatus)}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-gray-900 mb-3">Thông tin khách hàng</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{selectedBooking.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{selectedBooking.customerPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{selectedBooking.customerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-gray-900 mb-3">Thông tin thanh toán</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng tiền:</span>
                      <span className="text-gray-900">
                        {selectedBooking.totalAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
