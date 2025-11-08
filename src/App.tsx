import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './components/customer/CustomerLayout';
import StaffLayout from './components/staff/StaffLayout';
import AdminLayout from './components/admin/AdminLayout';
import Login from './components/auth/Login';
import PublicSetup from './components/PublicSetup';
import ImagePreview from './components/ImagePreview';
import TestRoomImages from './components/TestRoomImages';
import { supabase } from './utils/supabase/client';

export type UserRole = 'customer' | 'staff' | 'admin' | null;

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get user role from metadata
        const role = session.user.user_metadata?.role as UserRole || 'customer';
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role,
          name: session.user.user_metadata?.name
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Setup - IMPORTANT: Remove this route in production! */}
        <Route path="/setup" element={<PublicSetup />} />
        
        {/* Image Preview - Development only */}
        <Route path="/images" element={<ImagePreview />} />
        <Route path="/test-images" element={<TestRoomImages />} />
        
        {/* Login */}
        <Route path="/login" element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" /> :
            user.role === 'staff' ? <Navigate to="/staff" /> :
            <Navigate to="/" />
          ) : (
            <Login onLogin={handleLogin} />
          )
        } />
        
        {/* Staff routes */}
        <Route path="/staff/*" element={
          user?.role === 'staff' || user?.role === 'admin' ? (
            <StaffLayout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        } />
        
        {/* Admin routes */}
        <Route path="/admin/*" element={
          user?.role === 'admin' ? (
            <AdminLayout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        } />
        
        {/* Public customer routes */}
        <Route path="/*" element={<CustomerLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
