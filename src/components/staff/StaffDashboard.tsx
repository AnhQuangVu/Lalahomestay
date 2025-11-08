import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Clock } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Room {
  id: string;
  number: string;
  concept: string;
  location: string;
  status: 'available' | 'occupied' | 'checkout-soon' | 'checkin-soon' | 'overdue' | 'maintenance';
  cleanStatus: 'clean' | 'dirty' | 'cleaning';
  price2h: number;
  priceNight: number;
  currentBooking?: {
    code: string;
    customerName: string;
    checkIn: string;
    checkOut: string;
  };
}

export default function StaffDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
    // Refresh every 30 seconds
    const interval = setInterval(loadRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      // Fetch rooms and active bookings from real backend endpoints
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/phong`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/dat-phong`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);

      const [roomsData, bookingsData] = await Promise.all([roomsRes.json(), bookingsRes.json()]);

      if (!roomsData.success) {
        console.warn('rooms endpoint did not return success, falling back to mock');
        setRooms(getMockRooms());
        return;
      }

      const roomsFromApi = roomsData.data || [];
      const bookingsFromApi = bookingsData.success ? (bookingsData.data || []) : [];

      // Map backend room shape to local Room interface
      const mapped: Room[] = roomsFromApi.map((r: any) => {
        // find current booking for this room (booking where now is between checkin and checkout and not cancelled)
        const now = new Date();
        const currentBooking = bookingsFromApi.find((b: any) => {
          if (!b || !b.id_phong) return false;
          if (b.id_phong !== r.id) return false;
          if (b.trang_thai === 'da_huy') return false;
          const start = new Date(b.thoi_gian_nhan);
          const end = new Date(b.thoi_gian_tra);
          return now >= start && now <= end;
        });

        // map statuses
        const statusMap: any = {
          'trong': 'available',
          'dang_dung': 'occupied',
          'sap_nhan': 'checkin-soon',
          'sap_tra': 'checkout-soon',
          'bao_tri': 'maintenance'
        };

        const cleanMap: any = {
          'sach': 'clean',
          'dang_don': 'cleaning',
          'chua_don': 'dirty'
        };

        return {
          id: r.id,
          number: r.ma_phong,
          concept: r.loai_phong?.ten_loai || '',
          location: r.loai_phong?.co_so?.ten_co_so || '',
          status: statusMap[r.trang_thai] || 'available',
          cleanStatus: cleanMap[r.tinh_trang_vesinh] || 'clean',
          price2h: r.loai_phong?.gia_gio || 0,
          priceNight: r.loai_phong?.gia_dem || 0,
          currentBooking: currentBooking ? {
            code: currentBooking.ma_dat,
            customerName: currentBooking.khach_hang?.ho_ten || currentBooking.ho_ten || '',
            checkIn: currentBooking.thoi_gian_nhan,
            checkOut: currentBooking.thoi_gian_tra
          } : undefined
        } as Room;
      });

      setRooms(mapped);
    } catch (error) {
      console.error('Load rooms error:', error);
      setRooms(getMockRooms());
    } finally {
      setLoading(false);
    }
  };

  const getMockRooms = (): Room[] => {
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    
    return [
      {
        id: '1',
        number: '101',
        concept: 'Matcha',
        location: 'Dương Quảng Hàm',
        status: 'available',
        cleanStatus: 'clean',
        price2h: 200000,
        priceNight: 600000
      },
      {
        id: '2',
        number: '102',
        concept: 'Matcha',
        location: 'Dương Quảng Hàm',
        status: 'occupied',
        cleanStatus: 'dirty',
        price2h: 200000,
        priceNight: 600000,
        currentBooking: {
          code: 'LALA-20251108-0001',
          customerName: 'Nguyễn Văn A',
          checkIn: now.toISOString(),
          checkOut: in4Hours.toISOString()
        }
      },
      {
        id: '3',
        number: '103',
        concept: 'Matcha',
        location: 'Dương Quảng Hàm',
        status: 'checkout-soon',
        cleanStatus: 'dirty',
        price2h: 200000,
        priceNight: 600000,
        currentBooking: {
          code: 'LALA-20251108-0002',
          customerName: 'Trần Thị B',
          checkIn: now.toISOString(),
          checkOut: in2Hours.toISOString()
        }
      },
      {
        id: '4',
        number: '201',
        concept: 'Mellow',
        location: 'Dương Quảng Hàm',
        status: 'maintenance',
        cleanStatus: 'cleaning',
        price2h: 180000,
        priceNight: 550000
      },
      {
        id: '5',
        number: '101',
        concept: 'Andrea',
        location: 'Kim Mã',
        status: 'available',
        cleanStatus: 'clean',
        price2h: 250000,
        priceNight: 700000
      }
    ];
  };

  const getStatusConfig = (status: string) => {
    const configs: { [key: string]: { bg: string; text: string; label: string } } = {
      'available': { bg: 'bg-green-100', text: 'text-green-800', label: 'Trống' },
      'occupied': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang sử dụng' },
      'checkout-soon': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Sắp trả' },
      'checkin-soon': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Sắp nhận' },
      'overdue': { bg: 'bg-red-100', text: 'text-red-800', label: 'Quá giờ trả' },
      'maintenance': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Bảo trì' }
    };
    return configs[status] || configs.available;
  };

  const getCleanStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'clean': 'Sạch',
      'dirty': 'Chưa dọn',
      'cleaning': 'Đang dọn'
    };
    return labels[status] || status;
  };

  const getTimeRemaining = (checkOut: string) => {
    const hours = differenceInHours(new Date(checkOut), new Date());
    if (hours < 0) return 'Quá giờ';
    if (hours < 1) return `${Math.round(hours * 60)} phút`;
    return `${Math.round(hours)} giờ`;
  };

  const filteredRooms = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  const filterButtons = [
    { value: 'all', label: 'Tất cả', color: 'bg-gray-100 text-gray-700' },
    { value: 'available', label: 'Đang trống', color: 'bg-green-100 text-green-700' },
    { value: 'checkin-soon', label: 'Sắp nhận', color: 'bg-orange-100 text-orange-700' },
    { value: 'occupied', label: 'Đang sử dụng', color: 'bg-blue-100 text-blue-700' },
    { value: 'checkout-soon', label: 'Sắp trả', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'overdue', label: 'Quá giờ', color: 'bg-red-100 text-red-700' },
    { value: 'maintenance', label: 'Bảo trì', color: 'bg-gray-100 text-gray-700' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-gray-900 mb-4">Lịch đặt phòng</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === btn.value
                  ? btn.color + ' ring-2 ring-offset-2 ring-blue-500'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const statusConfig = getStatusConfig(room.status);
          return (
            <div
              key={room.id}
              className={`${statusConfig.bg} rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all`}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-gray-900">P.{room.number}</h3>
                  <p className="text-sm text-gray-600">{room.concept}</p>
                </div>
                <button className="p-1 hover:bg-white/50 rounded">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                  <span className="text-xs text-gray-600">
                    {getCleanStatusLabel(room.cleanStatus)}
                  </span>
                </div>

                {room.currentBooking ? (
                  <>
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-sm text-gray-900">{room.currentBooking.customerName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {format(new Date(room.currentBooking.checkIn), 'dd/MM HH:mm', { locale: vi })} 
                        {' → '}
                        {format(new Date(room.currentBooking.checkOut), 'dd/MM HH:mm', { locale: vi })}
                      </p>
                      <div className="flex items-center space-x-1 mt-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>Còn {getTimeRemaining(room.currentBooking.checkOut)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs text-gray-600">
                      {room.price2h.toLocaleString('vi-VN')}đ / 2h
                    </p>
                    <p className="text-xs text-gray-600">
                      {room.priceNight.toLocaleString('vi-VN')}đ / đêm
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Không có phòng nào
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Phòng {selectedRoom.number} - {selectedRoom.concept}</h2>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cơ sở:</p>
                <p className="text-gray-900">{selectedRoom.location}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Trạng thái:</p>
                <span className={`inline-block px-3 py-1 rounded text-sm ${getStatusConfig(selectedRoom.status).bg} ${getStatusConfig(selectedRoom.status).text}`}>
                  {getStatusConfig(selectedRoom.status).label}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Tình trạng dọn phòng:</p>
                <p className="text-gray-900">{getCleanStatusLabel(selectedRoom.cleanStatus)}</p>
              </div>

              {selectedRoom.currentBooking && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Thông tin đặt phòng:</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-900">Mã: {selectedRoom.currentBooking.code}</p>
                    <p className="text-gray-900">Khách: {selectedRoom.currentBooking.customerName}</p>
                    <p className="text-gray-600">
                      Check-in: {format(new Date(selectedRoom.currentBooking.checkIn), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                    <p className="text-gray-600">
                      Check-out: {format(new Date(selectedRoom.currentBooking.checkOut), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex space-x-3">
              {selectedRoom.status === 'available' && (
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Tạo đơn mới
                </button>
              )}
              {selectedRoom.status === 'occupied' && (
                <>
                  <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                    Trả phòng
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                    Chi tiết
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedRoom(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
