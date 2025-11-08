import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export default function DebugAuth() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testLogin = async (email: string, password: string) => {
    setTesting(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setResult({
          success: false,
          error: error.message,
          email
        });
      } else {
        setResult({
          success: true,
          user: data.user,
          session: data.session,
          email
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
        email
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Debug Authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={() => testLogin('admin@lalahouse.vn', 'admin123')}
            disabled={testing}
            variant="outline"
            className="w-full"
          >
            Test Admin Login
          </Button>
          
          <Button
            onClick={() => testLogin('staff@lalahouse.vn', 'staff123')}
            disabled={testing}
            variant="outline"
            className="w-full"
          >
            Test Staff Login
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Email:</strong> {result.email}
              </p>
              
              {result.success ? (
                <>
                  <p className="text-sm text-green-700">
                    ✅ <strong>Login successful!</strong>
                  </p>
                  <div className="text-xs bg-white p-2 rounded border overflow-auto max-h-60">
                    <pre>{JSON.stringify(result.user, null, 2)}</pre>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-700">
                  ❌ <strong>Error:</strong> {result.error}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
          <p><strong>Common errors:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Invalid login credentials" = User không tồn tại hoặc password sai</li>
            <li>"Email not confirmed" = Email chưa được xác nhận</li>
            <li>"User already registered" = User đã tồn tại (khi tạo mới)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
