import { Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import SystemSetup from './admin/SystemSetup';
import DebugAuth from './DebugAuth';

export default function PublicSetup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">LaLa House Homestay</h1>
                <p className="text-sm text-gray-500">Thiết lập hệ thống lần đầu</p>
              </div>
            </div>
            
            <Link 
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl mb-2">🚀 Chào mừng đến với LaLa House!</h2>
          <p className="text-gray-600">
            Đây là trang thiết lập hệ thống. Vui lòng làm theo các bước dưới đây để khởi tạo hệ thống lần đầu.
          </p>
          
          <div className="mt-6 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>📍 Bước 1:</strong> Cuộn xuống và click nút <strong>"Test Connection"</strong> để kiểm tra kết nối
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <strong>📍 Bước 2:</strong> Click nút <strong>"Khởi tạo tài khoản"</strong> để tạo admin & staff
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                <strong>📍 Bước 3:</strong> Click nút <strong>"Khởi tạo dữ liệu cơ sở"</strong> để tạo cơ sở và phòng
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <strong>📍 Bước 4:</strong> Click nút <strong>"Khởi tạo đơn đặt phòng mẫu"</strong> để có dữ liệu cho Dashboard
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900">
                <strong>📍 Bước 5:</strong> Dùng <strong>"Debug Authentication"</strong> để test đăng nhập
              </p>
            </div>
          </div>
          
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Lưu ý:</strong> Trang này chỉ dành cho thiết lập ban đầu. 
              Sau khi hoàn thành, bạn nên xóa route này khỏi production.
            </p>
          </div>

          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900">
              🆘 <strong>Gặp lỗi "Invalid login credentials"?</strong> Xem file <code>FIX_LOGIN_ERROR.md</code> để biết cách sửa.
            </p>
          </div>
        </div>

        <SystemSetup />

        <div className="mt-8">
          <DebugAuth />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg mb-3">📋 Sau khi hoàn thành thiết lập:</h3>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">1</span>
              <span>Truy cập <Link to="/login" className="text-purple-600 hover:underline">/login</Link></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">2</span>
              <span>Đăng nhập bằng: <strong>admin@lalahouse.vn</strong> / <strong>admin123</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">3</span>
              <span>Bạn sẽ được chuyển đến trang quản trị tại <strong>/admin</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">4</span>
              <span>Bắt đầu sử dụng hệ thống!</span>
            </li>
          </ol>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm mb-2 text-gray-700">Tài khoản demo đã tạo:</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-purple-50 rounded p-3">
                <p className="text-purple-900"><strong>Quản trị viên (Admin)</strong></p>
                <p className="text-purple-700">Email: admin@lalahouse.vn</p>
                <p className="text-purple-700">Mật khẩu: admin123</p>
              </div>
              <div className="bg-blue-50 rounded p-3">
                <p className="text-blue-900"><strong>Nhân viên lễ tân (Staff)</strong></p>
                <p className="text-blue-700">Email: staff@lalahouse.vn</p>
                <p className="text-blue-700">Mật khẩu: staff123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
