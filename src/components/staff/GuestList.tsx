import { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: 'checked-in' | 'checked-out' | 'upcoming';
}

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Load real data from backend: bookings and map to guest list
    const loadGuests = async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932/dat-phong`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        const json = await res.json();
        const bookings = (json && (json.data || json.bookings || json)) || [];

        const now = new Date();
        const mapped: Guest[] = (bookings || []).map((b: any) => {
          const checkIn = b.thoi_gian_nhan || b.checkIn || b.check_in;
          const checkOut = b.thoi_gian_tra || b.checkOut || b.check_out;

          let status: Guest['status'] = 'upcoming';
          try {
            const inDate = new Date(checkIn);
            const outDate = new Date(checkOut);
            if (now >= inDate && now <= outDate) status = 'checked-in';
            else if (now > outDate) status = 'checked-out';
            else status = 'upcoming';
          } catch (err) {
            status = 'upcoming';
          }

          return {
            id: b.id || b.ma_dat || b.id_dat_phong || String(Math.random()),
            name: b.khach_hang?.ho_ten || b.ho_ten || b.ten_khach || 'Khách lạ',
            phone: b.khach_hang?.sdt || b.sdt || b.phone || '',
            email: b.khach_hang?.email || b.email || '',
            room: (b.phong?.loai_phong?.ten_loai ? b.phong.loai_phong.ten_loai + ' ' : '') + (b.phong?.ma_phong || b.ma_phong || b.room || ''),
            checkIn: checkIn || new Date().toISOString(),
            checkOut: checkOut || new Date().toISOString(),
            status
          } as Guest;
        });

        setGuests(mapped);
      } catch (error) {
        console.error('Error loading guests:', error);
        // keep guests empty on error
        setGuests([]);
      }
    };

    loadGuests();
    // refresh every 30s
    const t = setInterval(loadGuests, 30000);
    return () => clearInterval(t);
  }, []);

  const filteredGuests = guests.filter(guest => {
    const q = (searchTerm || '').trim().toLowerCase();
    const qDigits = (searchTerm || '').replace(/\D/g, '');
    const name = (guest.name || '').toLowerCase();
    const email = (guest.email || '').toLowerCase();
    const phone = (guest.phone || '').toString();
    const phoneDigits = phone.replace(/\D/g, '');
    const room = (guest.room || '').toLowerCase();

    const matchesSearch = !q || (
      name.includes(q) ||
      email.includes(q) ||
      room.includes(q) ||
      // match phone either raw or digits-only
      phone.includes(q) ||
      (qDigits && phoneDigits.includes(qDigits))
    );

    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'checked-in': 'bg-green-100 text-green-800',
      'checked-out': 'bg-gray-100 text-gray-800',
      'upcoming': 'bg-blue-100 text-blue-800'
    };
    const labels: { [key: string]: string } = {
      'checked-in': 'Đang ở',
      'checked-out': 'Đã trả phòng',
      'upcoming': 'Sắp đến'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div>
      <h1 className="text-gray-900 mb-6">Khách lưu trú</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, số điện thoại, email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="checked-in">Đang ở</option>
            <option value="upcoming">Sắp đến</option>
            <option value="checked-out">Đã trả phòng</option>
          </select>
        </div>

        {/* Guest List */}
        <div className="space-y-4">
          {filteredGuests.map((guest) => (
            <div key={guest.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-gray-900">{guest.name}</h3>
                    {getStatusBadge(guest.status)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{guest.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{guest.email}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 mb-1">{guest.room}</p>
                  <div className="text-sm text-gray-600">
                    <p>{format(new Date(guest.checkIn), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                    <p>{format(new Date(guest.checkOut), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGuests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy khách hàng nào
          </div>
        )}
      </div>
    </div>
  );
}
