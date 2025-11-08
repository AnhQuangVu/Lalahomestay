import { useState, useEffect } from 'react';
import { getRoomImage, getLocationImage, formatCurrency } from '../utils/imageUtils';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { RefreshCw } from 'lucide-react';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

export default function TestRoomImages() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomRes, locRes] = await Promise.all([
        fetch(`${API_URL}/phong`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/co-so`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);

      const [roomData, locData] = await Promise.all([
        roomRes.json(),
        locRes.json()
      ]);

      if (roomData.success) setRooms(roomData.data || []);
      if (locData.success) setLocations(locData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">🧪 Test Ảnh Phòng & Cơ Sở Thật</h1>
          <p className="text-gray-600">
            Xem ảnh đang được gán cho 14 phòng và 3 cơ sở từ database
          </p>
          <button
            onClick={fetchData}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Locations */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-gray-900 mb-4">
                🏢 Cơ Sở ({locations.length} cơ sở)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {locations.map((location) => (
                  <div key={location.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="relative h-48">
                      <img
                        src={getLocationImage(location.id)}
                        alt={location.ten_co_so}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        ID: {location.id.substring(0, 8)}...
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-gray-900 mb-1">{location.ten_co_so}</h3>
                      <p className="text-sm text-gray-600">{location.dia_chi}</p>
                      {location.hotline && (
                        <p className="text-sm text-blue-600 mt-2">📞 {location.hotline}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-gray-900 mb-4">
                🏠 Phòng ({rooms.length} phòng)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="relative h-40">
                      <img
                        src={getRoomImage(room.id)}
                        alt={room.ma_phong}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {room.ma_phong}
                      </div>
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${
                        room.trang_thai === 'trong' ? 'bg-green-500 text-white' :
                        room.trang_thai === 'dang_dung' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {room.trang_thai}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm mb-1">
                        {room.loai_phong?.ten_loai || 'N/A'}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {room.loai_phong?.co_so?.ten_co_so || 'N/A'}
                      </p>
                      <div className="flex justify-between text-xs">
                        <div>
                          <span className="text-gray-600">Giờ: </span>
                          <span className="text-blue-600">
                            {formatCurrency(room.loai_phong?.gia_gio || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Đêm: </span>
                          <span className="text-blue-600">
                            {formatCurrency(room.loai_phong?.gia_dem || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                        ID: {room.id.substring(0, 12)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">
              <h3 className="text-gray-900 mb-3">✅ Thông Tin</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Tổng cộng: <strong>{rooms.length} phòng</strong> từ database</li>
                <li>• Mỗi phòng có ID unique → Được gán 1 ảnh cố định từ pool 18 ảnh</li>
                <li>• Cùng phòng luôn hiển thị cùng ảnh (không đổi khi refresh)</li>
                <li>• Ảnh được load từ Unsplash với size optimize (800px)</li>
                <li>• Cơ sở: <strong>{locations.length} cơ sở</strong> từ pool 8 ảnh</li>
              </ul>
            </div>

            {/* Comparison */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
              <h3 className="text-gray-900 mb-3">🔍 So Sánh</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="mb-2">Trước (Hardcoded)</h4>
                  <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`const imageMap = {
  'matcha': 'url1',
  'pastel': 'url2'
};
// Chỉ 6 ảnh cố định`}
                  </pre>
                </div>
                <div>
                  <h4 className="mb-2">Bây giờ (Dynamic)</h4>
                  <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`getRoomImage(room.id)
// 18 ảnh đa dạng
// Hash-based selection
// Consistent rendering`}
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
