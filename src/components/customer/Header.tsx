import { Link, useLocation } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Trang chủ' },
    { path: '/booking', label: 'Đặt phòng' },
    { path: '/lookup', label: 'Tra cứu' },
    { path: '/contact', label: 'Liên hệ' },
  ];

  return (
    <header className="shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#0f7072' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-semibold">LaLa House</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="transition-colors"
                style={{
                  color: location.pathname === item.path ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  fontWeight: location.pathname === item.path ? 600 : 400
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = location.pathname === item.path ? 'white' : 'rgba(255, 255, 255, 0.9)'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block py-2 px-4 transition-colors"
                style={{
                  color: location.pathname === item.path ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
