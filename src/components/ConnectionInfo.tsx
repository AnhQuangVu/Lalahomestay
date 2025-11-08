import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function ConnectionInfo() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverInfo, setServerInfo] = useState<any>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

  const checkConnection = async () => {
    setStatus('loading');
    try {
      const response = await fetch(`${serverUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setServerInfo(data);
      setStatus('success');
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('error');
      setServerInfo({ error: error.message || 'Không thể kết nối' });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          Trạng thái kết nối Supabase
        </CardTitle>
        <CardDescription>
          Thông tin kết nối với backend server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-gray-600">Project ID:</span>
            <span className="col-span-2 font-mono">{projectId}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-gray-600">Server URL:</span>
            <span className="col-span-2 font-mono text-xs break-all">{serverUrl}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-gray-600">Trạng thái:</span>
            <span className="col-span-2">
              {status === 'loading' && 'Đang kiểm tra...'}
              {status === 'success' && <span className="text-green-600">✅ Kết nối thành công</span>}
              {status === 'error' && <span className="text-red-600">❌ Kết nối thất bại</span>}
              {status === 'idle' && 'Chưa kiểm tra'}
            </span>
          </div>
        </div>

        {serverInfo && (
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm mb-2">Phản hồi từ server:</p>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
              {JSON.stringify(serverInfo, null, 2)}
            </pre>
          </div>
        )}

        <Button 
          onClick={checkConnection} 
          disabled={status === 'loading'}
          variant="outline"
          className="w-full"
        >
          {status === 'loading' ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
        </Button>

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
            <p className="text-red-800 mb-2">Không thể kết nối với server.</p>
            <p className="text-red-700">Vui lòng kiểm tra:</p>
            <ul className="list-disc list-inside text-red-700 mt-1 space-y-1">
              <li>Edge Function đã được deploy chưa</li>
              <li>CORS settings đã được cấu hình đúng chưa</li>
              <li>Environment variables đã được set chưa</li>
            </ul>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
            <p className="text-green-800">✅ Hệ thống đã sẵn sàng!</p>
            <p className="text-green-700 mt-1">
              Backend đang hoạt động bình thường. Bạn có thể tiếp tục sử dụng hệ thống.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
