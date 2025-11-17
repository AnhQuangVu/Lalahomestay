import { useState, useEffect } from 'react';
import { Calendar, Users } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

export default function NewBooking() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    location: '',
    concept: '',
    room: '',
    checkIn: '',
    checkOut: '',
    numberOfGuests: 2,
    notes: '',
    bookingSource: 'facebook',
    paymentMethod: 'transfer'
  });

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredConcepts, setFilteredConcepts] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter concepts by selected location
    if (formData.location) {
      const filtered = concepts.filter(c => c.id_co_so === formData.location);
      setFilteredConcepts(filtered);
    } else {
      setFilteredConcepts([]);
    }
    // Reset concept and room when location changes
    setFormData(prev => ({ ...prev, concept: '', room: '' }));
  }, [formData.location, concepts]);

  useEffect(() => {
    // Filter rooms by selected concept and only show available rooms
    if (formData.concept) {
      const filtered = rooms.filter(r =>
        r.id_loai_phong === formData.concept &&
        r.trang_thai === 'trong'
      );
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms([]);
    }
    // Reset room when concept changes
    setFormData(prev => ({ ...prev, room: '' }));
  }, [formData.concept, rooms]);

  const fetchData = async () => {
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
        // Lọc bỏ phòng đình chỉ và bảo trì - staff chỉ đặt phòng hoạt động
        const availableRooms = (roomData.data || []).filter(
          (r: any) => r.trang_thai !== 'dinh_chi' && r.trang_thai !== 'bao_tri'
        );
        setRooms(availableRooms);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the real bookings endpoint (/dat-phong)
      const payload: any = {
        ho_ten: formData.customerName,
        sdt: formData.customerPhone,
        email: formData.customerEmail,
        id_phong: formData.room,
        thoi_gian_nhan: formData.checkIn,
        thoi_gian_tra: formData.checkOut,
        so_khach: formData.numberOfGuests || 1,
        // send both keys for compatibility
        ghi_chu: formData.notes || null,
        ghi_chu_khach: formData.notes || null,
        kenh_dat: formData.bookingSource || 'phone',
        trang_thai: 'da_coc'
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/dat-phong`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        const maDat = data.data?.ma_dat || data.data?.maDat || data.bookingCode || '';
        toast.success(`Đặt phòng thành công! Mã đặt phòng: ${maDat}`);
        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          location: '',
          concept: '',
          room: '',
          checkIn: '',
          checkOut: '',
          numberOfGuests: 2,
          notes: '',
          bookingSource: 'facebook',
          paymentMethod: 'transfer'
        });
      } else {
        toast.error('Đặt phòng thất bại: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Có lỗi xảy ra khi đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-gray-900 mb-6">Tạo đơn đặt phòng mới</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Customer Information */}
        <div>
          <h2 className="text-gray-900 mb-4">Thông tin khách hàng</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="0912345678"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Booking Information */}
        <div>
          <h2 className="text-gray-900 mb-4">Thông tin đặt phòng</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Cơ sở <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">-- Chọn cơ sở --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.ten_co_so}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Loại phòng <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.concept}
                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={!formData.location}
              >
                <option value="">-- Chọn loại phòng --</option>
                {filteredConcepts.map(concept => (
                  <option key={concept.id} value={concept.id}>{concept.ten_loai}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Phòng cụ thể <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={!formData.concept}
              >
                <option value="">-- Chọn phòng --</option>
                {filteredRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.ma_phong} - {room.trang_thai === 'trong' ? 'Còn trống' : 'Đang dùng'}
                  </option>
                ))}
              </select>
              {formData.concept && filteredRooms.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">Không có phòng trống cho loại này</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Số lượng khách <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.numberOfGuests}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, numberOfGuests: isNaN(value) ? 1 : value });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Check-in <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Check-out <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Đặt phòng qua <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.bookingSource}
                onChange={(e) => setFormData({ ...formData, bookingSource: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="facebook">Facebook</option>
                <option value="zalo">Zalo</option>
                <option value="instagram">Instagram</option>
                <option value="phone">Điện thoại</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Hình thức thanh toán <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="vnpay">VNPAY QR</option>
                <option value="momo">Momo QR</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ghi chú yêu cầu đặc biệt..."
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Tạo đơn đặt phòng'}
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
