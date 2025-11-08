import { Building2, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white">LaLa House Homestay</span>
            </div>
            <p className="text-sm leading-relaxed">
              Hệ thống homestay cao cấp tại Hà Nội với 3 cơ sở: Dương Quảng Hàm, Kim Mã, và Nghi Tàm.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white mb-4">Liên hệ</h3>
            <div className="space-y-3">
              <a href="tel:0912345678" className="flex items-center space-x-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span>0912 345 678</span>
              </a>
              <a href="mailto:info@lalahouse.vn" className="flex items-center space-x-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span>info@lalahouse.vn</span>
              </a>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span className="text-sm">Hà Nội, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white mb-4">Liên kết nhanh</h3>
            <div className="space-y-2">
              <Link to="/booking" className="block hover:text-white transition-colors">
                Đặt phòng
              </Link>
              <Link to="/lookup" className="block hover:text-white transition-colors">
                Tra cứu đặt phòng
              </Link>
              <a href="#" className="block hover:text-white transition-colors">
                Quy định lưu trú
              </a>
              <a href="#" className="block hover:text-white transition-colors">
                Hướng dẫn check-in
              </a>
              <a href="#" className="block hover:text-white transition-colors">
                Chính sách hoàn hủy
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white mb-4">Mạng xã hội</h3>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-6">
              <p className="text-sm">Giờ hỗ trợ:</p>
              <p className="text-white">8:00 - 22:00 hàng ngày</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 LaLa House Homestay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
