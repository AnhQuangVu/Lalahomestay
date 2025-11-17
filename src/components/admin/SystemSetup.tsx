import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle2, AlertCircle, Database, Users, Building2, Calendar } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export default function SystemSetup() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users?: { success: boolean; message?: string; error?: string };
    data?: { success: boolean; message?: string; error?: string; data?: any };
    bookings?: { success: boolean; message?: string; error?: string; bookingCodes?: string[] };
    demoData?: { success: boolean; message?: string; error?: string; summary?: any };
  }>({});

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

  const initializeUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/admin/init-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      console.log('Init users result:', result);
      setResults(prev => ({ ...prev, users: result }));
    } catch (error) {
      console.error('Error initializing users:', error);
      setResults(prev => ({
        ...prev,
        users: { success: false, error: 'Không thể kết nối với server' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/admin/init-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      setResults(prev => ({ ...prev, data: result }));
    } catch (error) {
      console.error('Error initializing data:', error);
      setResults(prev => ({
        ...prev,
        data: { success: false, error: 'Không thể kết nối với server' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const initializeDemoBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/admin/init-demo-bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      console.log('Init demo bookings result:', result);
      setResults(prev => ({ ...prev, bookings: result }));
    } catch (error) {
      console.error('Error initializing demo bookings:', error);
      setResults(prev => ({
        ...prev,
        bookings: { success: false, error: 'Không thể kết nối với server' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const initializeDemoDataSQL = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/admin/init-demo-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      console.log('Init demo data result:', result);
      setResults(prev => ({ ...prev, demoData: result }));
    } catch (error) {
      console.error('Error initializing demo data:', error);
      setResults(prev => ({
        ...prev,
        demoData: { success: false, error: 'Không thể kết nối với server' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      if (result.status === 'ok') {
        toast.success('✅ Kết nối thành công với Supabase!');
        console.log('Server response:', result);
      } else {
        toast.warning('⚠️ Server phản hồi nhưng có vấn đề');
        console.log('Server response:', result);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('❌ Không thể kết nối với server');
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Thiết lập hệ thống</h2>
        <p className="text-gray-600 mt-2">
          Khởi tạo dữ liệu và tài khoản demo cho hệ thống LaLa House
        </p>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Kiểm tra kết nối
          </CardTitle>
          <CardDescription>
            Kiểm tra kết nối với Supabase backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testConnection}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Đang kiểm tra...' : 'Test Connection'}
          </Button>
          <div className="mt-4 text-sm text-gray-600">
            <p>Server URL: <code className="bg-gray-100 px-2 py-1 rounded">{serverUrl}</code></p>
          </div>
        </CardContent>
      </Card>

      {/* Initialize Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Khởi tạo tài khoản
          </CardTitle>
          <CardDescription>
            Tạo tài khoản demo cho Admin và Lễ tân
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm">Tài khoản sẽ được tạo:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Admin:</strong> admin@lalahouse.vn / admin123</li>
              <li>• <strong>Lễ tân:</strong> staff@lalahouse.vn / staff123</li>
            </ul>
          </div>

          <Button
            onClick={initializeUsers}
            disabled={loading}
          >
            {loading ? 'Đang khởi tạo...' : 'Khởi tạo tài khoản'}
          </Button>

          {results.users && (
            <Alert variant={results.users.success ? 'default' : 'destructive'}>
              {results.users.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {results.users.message || results.users.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Initialize Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Khởi tạo dữ liệu cơ sở
          </CardTitle>
          <CardDescription>
            Tạo dữ liệu demo cho cơ sở, loại phòng và danh sách phòng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm">Dữ liệu sẽ được tạo:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• 2 cơ sở (Dương Quảng Hàm, Tố Hữu)</li>
              <li>• 3 loại phòng (Matcha, Pastel, Minimalist)</li>
              <li>• 7 phòng mẫu</li>
            </ul>
          </div>

          <Button
            onClick={initializeData}
            disabled={loading}
          >
            {loading ? 'Đang khởi tạo...' : 'Khởi tạo dữ liệu cơ sở'}
          </Button>

          {results.data && (
            <Alert variant={results.data.success ? 'default' : 'destructive'}>
              {results.data.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {results.data.message || results.data.error}
                {results.data.data && (
                  <div className="mt-2 text-sm">
                    <p>Đã tạo: {results.data.data.locations} cơ sở, {results.data.data.concepts} loại phòng, {results.data.data.rooms} phòng</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Initialize Demo Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Khởi tạo dữ liệu đặt phòng mẫu
          </CardTitle>
          <CardDescription>
            Tạo đơn đặt phòng mẫu để test báo cáo và thống kê
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm">Dữ liệu sẽ được tạo:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• 5 đơn đặt phòng mẫu với thông tin khách hàng</li>
              <li>• Các đơn có trạng thái đã xác nhận và đã thanh toán</li>
              <li>• Ngày tạo random trong 7 ngày gần đây</li>
              <li>• Dữ liệu này sẽ hiển thị trong Dashboard và Reports</li>
            </ul>
          </div>

          <Button
            onClick={initializeDemoBookings}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Đang khởi tạo...' : 'Khởi tạo đơn đặt phòng mẫu'}
          </Button>

          {results.bookings && (
            <Alert variant={results.bookings.success ? 'default' : 'destructive'}>
              {results.bookings.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {results.bookings.message || results.bookings.error}
                {results.bookings.bookingCodes && (
                  <div className="mt-2 text-xs bg-white p-2 rounded border">
                    <p className="mb-1">Mã đơn đã tạo:</p>
                    <ul className="space-y-0.5">
                      {results.bookings.bookingCodes.map((code, i) => (
                        <li key={i}>• {code}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Initialize Complete Demo Data (SQL) */}
      <Card className="border-2 border-green-300 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Database className="w-5 h-5" />
            🚀 Khởi tạo TOÀN BỘ dữ liệu SQL Demo
          </CardTitle>
          <CardDescription className="text-green-700">
            Khởi tạo tất cả dữ liệu mẫu vào các bảng SQL PostgreSQL (CHO GIÁO VIÊN XEM)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white border-2 border-green-300 rounded-lg p-4">
            <p className="text-sm">Dữ liệu sẽ được tạo trong các bảng SQL:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>✓ <strong>co_so:</strong> 3 cơ sở (Dương Quảng Hàm, Tố Hữu, Trần Duy Hưng)</li>
              <li>✓ <strong>loai_phong:</strong> 5 loại phòng (Matcha, Pastel, Minimalist, Vintage, Luxury)</li>
              <li>✓ <strong>phong:</strong> 14 phòng cụ thể</li>
              <li>✓ <strong>tien_ich:</strong> 10 tiện ích phòng</li>
              <li>✓ <strong>phong_tienich:</strong> Liên kết phòng-tiện ích</li>
              <li>✓ <strong>khach_hang:</strong> 6 khách hàng mẫu</li>
              <li>✓ <strong>tai_khoan:</strong> 4 tài khoản (admin, lễ tân, kế toán)</li>
              <li>✓ <strong>dat_phong:</strong> 6 đơn đặt phòng với nhiều trạng thái khác nhau</li>
              <li>✓ <strong>thanh_toan:</strong> 6 giao dịch thanh toán</li>
              <li>✓ <strong>phan_hoi:</strong> 4 phản hồi từ khách hàng</li>
            </ul>
          </div>

          <Button
            onClick={initializeDemoDataSQL}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 w-full"
            size="lg"
          >
            {loading ? 'Đang khởi tạo dữ liệu SQL...' : '🎯 Khởi tạo TOÀN BỘ dữ liệu SQL'}
          </Button>

          {results.demoData && (
            <Alert variant={results.demoData.success ? 'default' : 'destructive'} className="border-green-300">
              {results.demoData.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {results.demoData.message || results.demoData.error}
                {results.demoData.summary && (
                  <div className="mt-3 text-sm bg-white p-3 rounded border border-green-200">
                    <p className="mb-2"><strong>Tổng kết dữ liệu đã tạo:</strong></p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>• Cơ sở: <strong>{results.demoData.summary.co_so}</strong></div>
                      <div>• Loại phòng: <strong>{results.demoData.summary.loai_phong}</strong></div>
                      <div>• Phòng: <strong>{results.demoData.summary.phong}</strong></div>
                      <div>• Tiện ích: <strong>{results.demoData.summary.tien_ich}</strong></div>
                      <div>• Liên kết: <strong>{results.demoData.summary.phong_tienich}</strong></div>
                      <div>• Khách hàng: <strong>{results.demoData.summary.khach_hang}</strong></div>
                      <div>• Tài khoản: <strong>{results.demoData.summary.tai_khoan}</strong></div>
                      <div>• Đặt phòng: <strong>{results.demoData.summary.dat_phong}</strong></div>
                      <div>• Thanh toán: <strong>{results.demoData.summary.thanh_toan}</strong></div>
                      <div>• Phản hồi: <strong>{results.demoData.summary.phan_hoi}</strong></div>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Bước 1:</strong> Kiểm tra kết nối với Supabase</p>
            <p><strong>Bước 2:</strong> Khởi tạo tài khoản demo (chỉ chạy 1 lần)</p>
            <p><strong>Bước 3:</strong> Khởi tạo dữ liệu cơ sở (chỉ chạy 1 lần)</p>
            <p><strong>Bước 4:</strong> Khởi tạo đơn đặt phòng mẫu (có thể chạy nhiều lần để thêm dữ liệu test)</p>
            <p><strong>Bước 5:</strong> Đăng nhập với tài khoản admin để xem Dashboard và Reports</p>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Lưu ý:</strong> Nếu tài khoản hoặc dữ liệu đã tồn tại, việc khởi tạo lại có thể báo lỗi. Điều này là bình thường.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
