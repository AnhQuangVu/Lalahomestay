import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wifi, Tv, Wind, Coffee, Sparkles, Camera, MapPin, Settings, Home } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getRoomImage, getLocationImage, formatCurrency } from '../../utils/imageUtils';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

const amenities = [
  { icon: Wifi, name: 'Wifi tốc độ cao' },
  { icon: Tv, name: 'Netflix & Máy chiếu' },
  { icon: Wind, name: 'Điều hòa 2 chiều' },
  { icon: Coffee, name: 'Minibar & Ấm đun' },
  { icon: Sparkles, name: 'Bồn tắm thư giãn' },
  { icon: Camera, name: 'An ninh 24/7' }
];

export default function HomePage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch locations
      const locResponse = await fetch(`${API_URL}/co-so`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const locResult = await locResponse.json();
      console.log('Locations API result:', locResult);

      // Fetch rooms
      const roomsResponse = await fetch(`${API_URL}/phong`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const roomsResult = await roomsResponse.json();
      console.log('Rooms API result:', roomsResult);

      if (locResult.success) {
        // Lọc cơ sở đang hoạt động
        const activeLocations = (locResult.data || []).filter((loc: any) => loc.trang_thai === true);
        // Count rooms per location
        const locationsWithRoomCount = activeLocations.map((loc: any) => {
          const roomCount = roomsResult.data?.filter(
            (room: any) => room.loai_phong?.id_co_so === loc.id && room.trang_thai !== 'dinh_chi'
          ).length || 0;

          return {
            ...loc,
            roomCount
          };
        });
        setLocations(locationsWithRoomCount);
      }

      if (roomsResult.success && roomsResult.data) {
        // Get 6 featured rooms (không phải dinh_chi hoặc bao_tri)
        const availableRooms = roomsResult.data.filter(
          (room: any) => room.trang_thai !== 'dinh_chi' && room.trang_thai !== 'bao_tri'
        ).slice(0, 6);
        setFeaturedRooms(availableRooms);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div>

      {/* Hero Section */}
      <section className="relative h-[600px]" style={{ backgroundColor: '#0f7072' }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1654075309556-14a41021eedb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lc3RheSUyMGV4dGVyaW9yfGVufDF8fHx8MTc2MjYxOTYwMHww&ixlib=rb-4.1.0&q=80&w=1080)' }}
        />

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-white mb-4">
              Lala House - Chuỗi Homestay đa sắc màu dành cho giới trẻ
            </h1>
            <p className="text-xl text-gray-100 mb-8">
              LaLa House - Hệ thống homestay cao cấp tại Hà Nội với đầy đủ tiện nghi,
              phong cách độc đáo và vị trí đắc địa.
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center px-8 py-4 bg-white font-semibold rounded-lg hover:bg-gray-100 transition-colors space-x-2"
              style={{ color: '#0f7072' }}
            >
              <span>Đặt phòng ngay</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">Phòng nổi bật</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Khám phá các phòng với concept độc đáo và tiện nghi hiện đại
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ borderBottom: '2px solid #0f7072' }}></div>
              <p className="text-gray-600">Đang tải phòng...</p>
            </div>
          ) : featuredRooms.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Chưa có phòng nào. Liên hệ quản trị để khởi tạo dữ liệu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map((room) => (
                <div key={room.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={room.anh_chinh || getRoomImage(room.id)}
                      alt={room.ma_phong || 'Phòng LaLa House'}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        // prevent infinite loop if fallback also fails
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = '1';
                          img.src = getRoomImage(room.id); // fallback to consistent random image
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                      Còn trống
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-900">{room.loai_phong?.ten_loai || 'N/A'} - {room.ma_phong}</h3>
                    </div>
                    <div className="flex items-start space-x-2 text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{room.loai_phong?.co_so?.ten_co_so || 'N/A'}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Từ</p>
                        <p className="font-semibold" style={{ color: '#0f7072' }}>{formatCurrency(room.loai_phong?.gia_gio || 0)}/giờ</p>
                      </div>
                      <Link
                        to="/booking"
                        className="px-4 py-2 text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#0f7072' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d5f61'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f7072'}
                      >
                        Đặt ngay
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/booking"
              className="inline-flex items-center px-6 py-3 border-2 rounded-lg transition-colors"
              style={{ borderColor: '#0f7072', color: '#0f7072' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f7072';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#0f7072';
              }}
            >
              Xem tất cả phòng
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">Cơ sở của chúng tôi</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Các cơ sở tại các vị trí đắc địa ở Hà Nội, mang đến sự lựa chọn tối ưu cho khách hàng
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ borderBottom: '2px solid #0f7072' }}></div>
              <p className="text-gray-600">Đang tải cơ sở...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Chưa có cơ sở nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {locations.slice(0, 3).map((location) => (
                <div key={location.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={location.anh_dai_dien || getLocationImage(location.id)}
                      alt={location.ten_co_so}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm">
                      {location.roomCount} phòng
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-gray-900 mb-2">{location.ten_co_so}</h3>
                    <div className="flex items-start space-x-2 text-gray-600 mb-2">
                      <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p>{location.dia_chi}</p>
                    </div>
                    {location.hotline && (
                      <p className="text-sm mt-2" style={{ color: '#0f7072' }}>📞 {location.hotline}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">Tiện nghi nổi bật</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Đầy đủ tiện nghi hiện đại mang đến trải nghiệm thoải mái nhất cho khách hàng
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {amenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(15, 112, 114, 0.1)' }}>
                    <Icon className="w-8 h-8" style={{ color: '#0f7072' }} />
                  </div>
                  <p className="text-gray-700">{amenity.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{ backgroundColor: '#0f7072' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-white mb-4">Sẵn sàng trải nghiệm?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Đặt phòng ngay hôm nay để nhận ưu đãi đặc biệt và trải nghiệm không gian sống tuyệt vời
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/booking"
              className="px-8 py-4 bg-white rounded-lg transition-colors font-semibold"
              style={{ color: '#0f7072' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Đặt phòng ngay
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white text-white rounded-lg transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>
    </div>
    
  );
}
