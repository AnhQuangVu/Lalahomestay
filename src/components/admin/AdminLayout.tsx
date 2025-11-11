import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Home, Calendar, UserCog, FileBarChart, LogOut, Building2, Bell, Search, Settings, Database, Bug } from 'lucide-react';
import { AuthUser } from '../../App';
import AdminDashboard from './AdminDashboard';
import CustomerManagement from './CustomerManagement';
import RoomManagement from './RoomManagement';
import BookingManagement from './BookingManagement';
import AccountManagement from './AccountManagement';
import Reports from './Reports';
import SystemSetup from './SystemSetup';
import { DatabaseViewer } from './DatabaseViewer';
import { DebugRevenue } from './DebugRevenue';

interface AdminLayoutProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    // { path: '/admin/database', icon: Database, label: 'Xem Database', highlight: true },
    // { path: '/admin/debug-revenue', icon: Bug, label: '🐛 Debug Doanh Thu', highlight: true },
    { path: '/admin/customers', icon: Users, label: 'Quản lý khách hàng' },
    { path: '/admin/rooms', icon: Home, label: 'Quản lý phòng' },
    { path: '/admin/bookings', icon: Calendar, label: 'Quản lý đặt phòng' },
    { path: '/admin/accounts', icon: UserCog, label: 'Quản lý tài khoản' },
    { path: '/admin/reports', icon: FileBarChart, label: 'Báo cáo - Thống kê' },
    // { path: '/admin/setup', icon: Settings, label: 'Thiết lập hệ thống' }
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-900">LaLa House</p>
              <p className="text-xs text-gray-500">Quản trị</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-6 px-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${active
                    ? 'bg-purple-50 text-purple-600'
                    : item.highlight
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">{user.name?.[0] || user.email[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{user.name || user.email}</p>
              <p className="text-xs text-gray-500">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 ml-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/database" element={<DatabaseViewer />} />
            <Route path="/debug-revenue" element={<DebugRevenue />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/rooms" element={<RoomManagement />} />
            <Route path="/bookings" element={<BookingManagement />} />
            <Route path="/accounts" element={<AccountManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/setup" element={<SystemSetup />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
