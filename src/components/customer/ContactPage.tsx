import { MapPin, Phone, Mail, Clock, Facebook, Instagram, MessageCircle } from 'lucide-react';

const locations = [
  {
    name: 'LaLa House - Dương Quảng Hàm',
    address: 'Phường Nghĩa Đô, Cầu Giấy, Hà Nội',
    phone: '0912 345 678',
    email: 'duongquangham@lalahouse.vn'
  },
  {
    name: 'LaLa House - Kim Mã',
    address: 'Phường Giảng Võ, Ba Đình, Hà Nội',
    phone: '0912 345 679',
    email: 'kimma@lalahouse.vn'
  },
  {
    name: 'LaLa House - Nghi Tàm',
    address: 'Phường Yên Phụ, Tây Hồ, Hà Nội',
    phone: '0912 345 680',
    email: 'nghitam@lalahouse.vn'
  }
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-gray-900 mb-4">Liên hệ với chúng tôi</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh dưới đây.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {locations.map((location, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="text-gray-900 mb-4">{location.name}</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600">{location.address}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <a href={`tel:${location.phone}`} className="text-gray-600 hover:text-blue-600">
                    {location.phone}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <a href={`mailto:${location.email}`} className="text-gray-600 hover:text-blue-600">
                    {location.email}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* General Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Business Hours */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-gray-900">Giờ hỗ trợ</h3>
            </div>
            <div className="space-y-2 text-gray-600">
              <p>Thứ 2 - Chủ nhật: 8:00 - 22:00</p>
              <p className="text-sm text-gray-500">
                * Hỗ trợ khẩn cấp 24/7 qua hotline
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-gray-900">Mạng xã hội</h3>
            </div>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/lalahousehomestay"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="https://instagram.com/lalahousehomestay"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center text-white hover:bg-pink-700 transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://zalo.me/lalahousehomestay"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Theo dõi chúng tôi để cập nhật thông tin mới nhất và nhận ưu đãi đặc biệt
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-gray-900 mb-6">Gửi tin nhắn cho chúng tôi</h2>
          
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0912345678"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Chủ đề
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option>Tư vấn đặt phòng</option>
                <option>Thắc mắc về dịch vụ</option>
                <option>Khiếu nại</option>
                <option>Góp ý</option>
                <option>Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Nhập nội dung tin nhắn của bạn..."
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Gửi tin nhắn
            </button>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 text-center">
          <h3 className="text-gray-900 mb-2">Cần hỗ trợ ngay?</h3>
          <p className="text-gray-600 mb-4">
            Liên hệ hotline để được hỗ trợ nhanh nhất
          </p>
          <a
            href="tel:0912345678"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span>0912 345 678</span>
          </a>
        </div>
      </div>
    </div>
  );
}
