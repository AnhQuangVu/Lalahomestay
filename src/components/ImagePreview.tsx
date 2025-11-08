import { ROOM_IMAGES, LOCATION_IMAGES } from '../utils/imageUtils';

export default function ImagePreview() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">🖼️ Preview Tất Cả Ảnh</h1>
          <p className="text-gray-600">Xem trước 18 ảnh phòng + 8 ảnh cơ sở đang được dùng trong hệ thống</p>
        </div>

        {/* Room Images */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-gray-900 mb-4">
            Ảnh Phòng ({ROOM_IMAGES.length} ảnh)
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Mỗi phòng sẽ được gán ngẫu nhiên 1 trong {ROOM_IMAGES.length} ảnh này dựa trên hash của ID
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ROOM_IMAGES.map((url, index) => (
              <div key={index} className="group relative">
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm z-10">
                  #{index + 1}
                </div>
                <div className="relative h-48 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <img
                    src={url}
                    alt={`Room ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800';
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 truncate">
                  {url.split('/').pop()?.substring(0, 30)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Images */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-gray-900 mb-4">
            Ảnh Cơ Sở ({LOCATION_IMAGES.length} ảnh)
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Mỗi cơ sở sẽ được gán ngẫu nhiên 1 trong {LOCATION_IMAGES.length} ảnh này dựa trên hash của ID
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {LOCATION_IMAGES.map((url, index) => (
              <div key={index} className="group relative">
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm z-10">
                  #{index + 1}
                </div>
                <div className="relative h-48 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <img
                    src={url}
                    alt={`Location ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1654075309556-14a41021eedb?w=1080';
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 truncate">
                  {url.split('/').pop()?.substring(0, 30)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
          <h3 className="text-gray-900 mb-3">💡 Cách Hoạt Động</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ <strong>18 ảnh phòng</strong> được random assign cho 14 phòng trong DB</li>
            <li>✅ <strong>8 ảnh cơ sở</strong> được random assign cho 3 cơ sở</li>
            <li>✅ <strong>Hash-based selection</strong>: Mỗi ID luôn map về cùng 1 ảnh (consistent)</li>
            <li>✅ Ảnh được import từ <code className="bg-blue-100 px-2 py-0.5 rounded">/utils/imageUtils.tsx</code></li>
            <li>✅ Dùng functions: <code className="bg-blue-100 px-2 py-0.5 rounded">getRoomImage(id)</code> và <code className="bg-blue-100 px-2 py-0.5 rounded">getLocationImage(id)</code></li>
          </ul>
        </div>

        {/* Usage Example */}
        <div className="bg-gray-800 text-gray-100 rounded-xl p-6 mt-8">
          <h3 className="mb-3">📝 Code Example</h3>
          <pre className="text-sm overflow-x-auto">
{`// Import
import { getRoomImage, getLocationImage } from '../utils/imageUtils';

// Sử dụng trong component
<img 
  src={getRoomImage(room.id)} 
  alt={room.ma_phong} 
/>

<img 
  src={getLocationImage(location.id)} 
  alt={location.ten_co_so} 
/>`}
          </pre>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl mb-2">🏠</div>
            <div className="text-3xl text-blue-600 mb-1">{ROOM_IMAGES.length}</div>
            <div className="text-sm text-gray-600">Ảnh Phòng</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl mb-2">🏢</div>
            <div className="text-3xl text-green-600 mb-1">{LOCATION_IMAGES.length}</div>
            <div className="text-sm text-gray-600">Ảnh Cơ Sở</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl mb-2">🎨</div>
            <div className="text-3xl text-purple-600 mb-1">{ROOM_IMAGES.length + LOCATION_IMAGES.length}</div>
            <div className="text-sm text-gray-600">Tổng Ảnh</div>
          </div>
        </div>
      </div>
    </div>
  );
}
