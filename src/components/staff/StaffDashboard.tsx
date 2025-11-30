import { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import {
  Clock, UserCheck, LogOut, Sparkles,
  FileText, Settings, User, Plus, X,
  CreditCard, MapPin, Phone, StickyNote, AlertCircle,
  LayoutGrid, BarChart2, Home, CheckCircle, XCircle, TrendingUp, BarChart3, PieChart as PieChartIcon,
  ChevronDown, Edit, Save
} from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, differenceInHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// --- CONFIG ---
const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

// --- HELPER FUNCTIONS ---
const getBookingStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    'da_coc': 'Đã đặt cọc', 'da_tra': 'Đã trả phòng', 'dang_o': 'Đang ở',
    'dang_dung': 'Đang sử dụng', 'da_huy': 'Đã hủy', 'cho_xac_nhan': 'Chờ xác nhận',
    'checkout': 'Đã checkout', 'sap_nhan': 'Sắp nhận', 'sap_tra': 'Sắp trả',
    'trong': 'Trống', '': 'Không xác định'
  };
  return map[status] || status;
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount || 0);

// --- INTERFACES ---
interface Room {
  id: string; number: string; concept: string; location: string;
  status: 'available' | 'occupied' | 'checkout-soon' | 'checkin-soon' | 'overdue' | 'maintenance';
  cleanStatus: 'clean' | 'dirty' | 'cleaning';
  price2h: number; priceNight: number;
  currentBooking?: {
    code: string; customerName: string; checkIn: string; checkOut: string;
    source: string; note: string; totalPrice: number; deposit: number;
  };
}

interface ReportData {
  totalRooms: number; occupiedRooms: number; availableRooms: number;
  occupancyRate: number; totalNights: number;
  topRooms: Array<{ name: string; bookings: number; revenue: number; }>;
  roomUsageDetails: Array<{
    branch: string; room: string; type: string;
    usedDays: number; availableDays: number; occupancy: number; bookings: number;
    originalRoom: Room;
  }>;
}

// --- SUB-COMPONENT: BÁO CÁO (Đã bỏ cột Thao tác) ---
const RoomsReportSection = ({ reportData, onRowClick }: { reportData: ReportData, onRowClick: (room: Room) => void }) => {
  const occupancyData = [
    { name: 'Đang sử dụng', value: reportData.occupiedRooms, color: '#8b5cf6' },
    { name: 'Còn trống', value: reportData.availableRooms, color: '#e5e7eb' }
  ];

  return (
    <div className="space-y-6 mt-12 pt-8 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-6 h-6 text-gray-700"/>
        <h2 className="text-2xl font-bold text-gray-800">Báo cáo hiệu suất & Thống kê</h2>
      </div>

      {/* 1. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex justify-between mb-3"><div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center"><Home className="w-6 h-6 text-white" /></div></div>
          <p className="text-sm text-purple-700">Tổng số phòng</p><p className="text-3xl font-bold text-purple-900">{reportData.totalRooms}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex justify-between mb-3"><div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-white" /></div></div>
          <p className="text-sm text-green-700">Đang sử dụng</p><p className="text-3xl font-bold text-green-900">{reportData.occupiedRooms}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex justify-between mb-3"><div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center"><XCircle className="w-6 h-6 text-white" /></div></div>
          <p className="text-sm text-gray-700">Còn trống</p><p className="text-3xl font-bold text-gray-900">{reportData.availableRooms}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex justify-between mb-3"><div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div></div>
          <p className="text-sm text-blue-700">Công suất</p><p className="text-3xl font-bold text-blue-900">{reportData.occupancyRate}%</p>
        </div>
      </div>

      {/* 2. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-gray-400"/> Tỷ lệ lấp đầy</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-gray-400"/> Hiệu suất doanh thu (Top 5)</h3>
          {reportData.topRooms.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topRooms} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Doanh thu" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[300px] flex items-center justify-center text-gray-400">Chưa có dữ liệu doanh thu</div>}
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-800">Chi tiết trạng thái phòng</h3>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Real-time</span>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Cơ sở / Phòng</th>
                <th className="text-center py-3 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Trạng thái</th>
                <th className="text-center py-3 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Công suất</th>
                <th className="text-center py-3 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Đơn hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.roomUsageDetails.map((room, idx) => (
                <tr 
                    key={idx} 
                    onClick={() => onRowClick(room.originalRoom)} 
                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-6">
                      <div className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{room.room}</div>
                      <div className="text-xs text-gray-500">{room.branch} - {room.type}</div>
                  </td>
                  <td className="py-3 px-6 text-center">
                      {room.occupancy === 100 ? 
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Đang dùng</span> : 
                        (room.occupancy === 50 ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Sắp đến</span> : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Trống</span>)
                      }
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-gray-700">{room.occupancy}%</span>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${room.occupancy === 100 ? 'bg-blue-500' : (room.occupancy === 50 ? 'bg-orange-400' : 'bg-green-500')}`} style={{ width: `${room.occupancy}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-sm text-center font-medium text-gray-700">{room.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function StaffDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State: Edit Room Info (Prices/Number)
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ number: '', concept: '', price2h: 0, priceNight: 0 });

  // State: Loading for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Modal States
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 15000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      setInfoForm({
        number: selectedRoom.number,
        concept: selectedRoom.concept,
        price2h: selectedRoom.price2h,
        priceNight: selectedRoom.priceNight
      });
      setIsEditingInfo(false);
    }
  }, [selectedRoom]);

  const loadRooms = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }),
        fetch(`${API_URL}/dat-phong`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } })
      ]);
      const [roomsData, bookingsData] = await Promise.all([roomsRes.json(), bookingsRes.json()]);

      if (!roomsData.success) { setRooms([]); return; }

      const roomsFromApi = roomsData.data || [];
      const bookingsFromApi = bookingsData.success ? (bookingsData.data || []) : [];
      const activeRooms = roomsFromApi.filter((r: any) => r.trang_thai !== 'dinh_chi');

      const mapped: Room[] = activeRooms.map((r: any) => {
        const now = new Date();
        const currentBooking = bookingsFromApi.find((b: any) => {
          if (!b || !b.id_phong || b.id_phong !== r.id) return false;
          if (['da_huy', 'da_tra', 'checkout'].includes(b.trang_thai)) return false;
          if (b.trang_thai === 'dang_o' || b.trang_thai === 'dang_dung') return true;
          const start = new Date(b.thoi_gian_nhan);
          const end = new Date(b.thoi_gian_tra);
          return now <= end && (now >= start || differenceInHours(start, now) <= 24);
        });

        const statusMap: any = { 'trong': 'available', 'dang_dung': 'occupied', 'sap_nhan': 'checkin-soon', 'sap_tra': 'checkout-soon', 'bao_tri': 'maintenance' };
        const cleanMap: any = { 'sach': 'clean', 'dang_don': 'cleaning', 'chua_don': 'dirty' };
        let derivedStatus = statusMap[r.trang_thai] || 'available';
        
        if (currentBooking) {
             const checkIn = new Date(currentBooking.thoi_gian_nhan);
             const checkOut = new Date(currentBooking.thoi_gian_tra);
             if (r.trang_thai === 'bao_tri') {
                 derivedStatus = 'maintenance';
             } else if (now >= checkIn && now <= checkOut) {
                 derivedStatus = 'occupied';
                 if (differenceInHours(checkOut, now) < 1) derivedStatus = 'checkout-soon';
             } else if (now < checkIn && differenceInHours(checkIn, now) <= 24) {
                 derivedStatus = 'checkin-soon';
             }
        }

        return {
          id: r.id, number: r.ma_phong, concept: r.loai_phong?.ten_loai || '', location: r.loai_phong?.co_so?.ten_co_so || '',
          status: derivedStatus, cleanStatus: cleanMap[r.tinh_trang_vesinh] || 'clean',
          price2h: r.loai_phong?.gia_gio || 0, priceNight: r.loai_phong?.gia_dem || 0,
          currentBooking: currentBooking ? {
            code: currentBooking.ma_dat, customerName: currentBooking.khach_hang?.ho_ten || currentBooking.ho_ten || 'Khách vãng lai',
            checkIn: currentBooking.thoi_gian_nhan, checkOut: currentBooking.thoi_gian_tra,
            source: currentBooking.kenh_dat || 'Khác', note: currentBooking.ghi_chu || '',
            totalPrice: currentBooking.tong_tien || 0, deposit: currentBooking.tien_coc || 0
          } : undefined
        } as Room;
      });
      setRooms(mapped);
    } catch (error) { console.error(error); setRooms([]); } finally { setLoading(false); }
  };

  // --- CALCULATION FOR REPORT ---
  const reportData: ReportData = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => ['occupied', 'checkout-soon'].includes(r.status)).length;
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    const roomUsageDetails = rooms.map(r => {
        const isOccupied = ['occupied', 'checkout-soon'].includes(r.status);
        return {
            branch: r.location, room: r.number, type: r.concept,
            usedDays: isOccupied ? 1 : 0, availableDays: 1,
            occupancy: isOccupied ? 100 : (r.status === 'checkin-soon' ? 50 : 0),
            bookings: r.currentBooking ? 1 : 0,
            originalRoom: r
        };
    });
    const topRooms = rooms.filter(r => r.currentBooking).map(r => ({
            name: r.number, bookings: 1, revenue: r.currentBooking?.totalPrice || 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
        totalRooms, occupiedRooms, availableRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        totalNights: occupiedRooms, topRooms, roomUsageDetails
    };
  }, [rooms]);

  // --- API HELPER & ACTIONS ---
  const updateRoomStatusApi = async (roomId: string, status: string, cleanStatus: string) => {
    const statusMap: any = { 'available': 'trong', 'occupied': 'dang_dung', 'checkout-soon': 'sap_tra', 'checkin-soon': 'sap_nhan', 'maintenance': 'bao_tri' };
    const cleanMap: any = { 'clean': 'sach', 'cleaning': 'dang_don', 'dirty': 'chua_don' };
    await fetch(`${API_URL}/phong/${roomId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ trang_thai: statusMap[status] || 'trong', tinh_trang_vesinh: cleanMap[cleanStatus] || 'sach' })
    });
  };

  const handleUpdateRoomInfo = async () => {
    if (!selectedRoom) return;
    const toastId = toast.loading('Đang cập nhật thông tin...');
    try {
        setActionLoading(true);
        await fetch(`${API_URL}/phong/${selectedRoom.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
            body: JSON.stringify({
                ma_phong: infoForm.number,
            })
        });
        toast.success('Đã cập nhật thông tin phòng!', { id: toastId });
        setIsEditingInfo(false);
        loadRooms(); 
        setSelectedRoom(prev => prev ? ({...prev, number: infoForm.number, concept: infoForm.concept}) : null);
    } catch (e) {
        toast.error('Lỗi cập nhật', { id: toastId });
    } finally {
        setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedRoom?.currentBooking) return;
    if (!window.confirm(`Xác nhận trả phòng cho khách ${selectedRoom.currentBooking.customerName}?`)) return;
    const toastId = toast.loading('Đang xử lý...');
    try {
      setActionLoading(true);
      const bookingRes = await fetch(`${API_URL}/dat-phong/ma/${selectedRoom.currentBooking.code}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      const bookingData = await bookingRes.json();
      if (bookingData.success) {
        await Promise.all([
          fetch(`${API_URL}/dat-phong/${bookingData.data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` }, body: JSON.stringify({ trang_thai: 'da_tra', thoi_gian_tra_thuc_te: new Date().toISOString() }) }),
          updateRoomStatusApi(selectedRoom.id, 'available', 'dirty')
        ]);
        toast.success('Trả phòng thành công!', { id: toastId }); setSelectedRoom(null); loadRooms();
      } else { toast.error('Lỗi tìm đơn', { id: toastId }); }
    } catch (e) { toast.error('Lỗi hệ thống', { id: toastId }); } finally { setActionLoading(false); }
  };

  const handleCleanRoom = async () => { if (!selectedRoom) return; try { setActionLoading(true); await updateRoomStatusApi(selectedRoom.id, 'available', 'clean'); toast.success('Đã dọn xong!'); setSelectedRoom(null); loadRooms(); } catch { toast.error('Lỗi'); } finally { setActionLoading(false); } };
  const handleCheckIn = async () => { if (!selectedRoom) return; try { setActionLoading(true); await updateRoomStatusApi(selectedRoom.id, 'occupied', selectedRoom.cleanStatus); toast.success('Đã nhận phòng!'); setSelectedRoom(null); loadRooms(); } catch { toast.error('Lỗi'); } finally { setActionLoading(false); } };
  const handleShowDetail = async () => { if (!selectedRoom?.currentBooking) return; try { const res = await fetch(`${API_URL}/dat-phong/ma/${selectedRoom.currentBooking.code}`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }); const data = await res.json(); if (data.success) setBookingDetail(data.data); } catch { toast.error('Lỗi'); } };

  // --- STYLES ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: 'Đang ở' };
      case 'available': return { bg: '#ffffff', border: '#bbf7d0', text: '#15803d', label: 'Trống' };
      case 'checkin-soon': return { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', label: 'Sắp nhận' };
      case 'checkout-soon': return { bg: '#fefce8', border: '#fef08a', text: '#a16207', label: 'Sắp trả' };
      case 'maintenance': return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563', label: 'Bảo trì' };
      default: return { bg: '#fff', border: '#e5e7eb', text: '#000', label: 'Unknown' };
    }
  };
  const filteredRooms = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 pt-6 font-sans overflow-x-hidden">
      <Toaster position="top-right" richColors closeButton />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Lịch đặt phòng</h1>
            <p className="text-sm text-gray-500">Quản lý tình trạng phòng và đơn đặt</p>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2 mb-6">
          {[ { val: 'all', label: 'Tất cả', bg: '#1f2937' }, { val: 'available', label: 'Phòng Trống', bg: '#16a34a' }, { val: 'occupied', label: 'Đang ở', bg: '#2563eb' }, { val: 'checkin-soon', label: 'Sắp nhận', bg: '#f97316' }, { val: 'checkout-soon', label: 'Sắp trả', bg: '#eab308' }, { val: 'maintenance', label: 'Bảo trì', bg: '#6b7280' } ].map(btn => (
              <button key={btn.val} onClick={() => setFilter(btn.val)} style={{backgroundColor: filter === btn.val ? btn.bg : '#fff', color: filter === btn.val ? '#fff' : '#4b5563'}} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filter !== btn.val ? 'border-gray-200 hover:bg-gray-50' : 'border-transparent shadow-sm'}`}>{btn.label}</button>
          ))}
      </div>

      {/* GRID ROOMS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map(room => {
          const conf = getStatusColor(room.status);
          const isOccupied = ['occupied', 'checkout-soon'].includes(room.status);
          const isCheckin = room.status === 'checkin-soon';

          return (
              <div key={room.id} onClick={() => { setSelectedRoom(room); setIsEditingInfo(false); }} className="relative overflow-hidden rounded-xl cursor-pointer shadow-sm hover:-translate-y-1 transition-transform duration-200 flex flex-col min-h-[190px]" style={{ backgroundColor: conf.bg, border: `1px solid ${conf.border}` }}>
              
              {/* CARD HEADER */}
              <div className="px-4 py-3 border-b flex justify-between items-start" style={{ borderColor: conf.border, backgroundColor: 'rgba(255,255,255,0.4)' }}>
                  <div><h3 className="text-xl font-bold text-gray-900 leading-none">{room.number}</h3><p className="text-xs font-medium text-gray-500 mt-1">{room.concept}</p></div>
                  <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border" style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(0,0,0,0.05)', color: conf.text }}>{conf.label}</span>
                      {room.currentBooking && <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{room.currentBooking.source === 'facebook' ? 'FB' : room.currentBooking.source}</span>}
                  </div>
              </div>

              {/* CARD BODY */}
              <div className="p-4 flex-1 flex flex-col justify-center">
                  {(isOccupied || isCheckin) && room.currentBooking ? (
                  <>
                      <div className="flex items-center gap-2 mb-3">
                          <User size={16} className="text-gray-500"/>
                          <span className="font-bold text-gray-800 text-sm truncate">{room.currentBooking.customerName}</span>
                          {room.currentBooking.note && <StickyNote size={14} className="text-amber-500 ml-auto" />}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3 bg-white/50 p-2 rounded-lg">
                          <div className="text-center"><div className="text-[9px] uppercase text-gray-400">Đến</div><div className="font-bold">{format(new Date(room.currentBooking.checkIn), 'HH:mm dd/MM')}</div></div>
                          <div className="text-gray-300">➜</div>
                          <div className="text-center"><div className="text-[9px] uppercase text-gray-400">Đi</div><div className="font-bold">{format(new Date(room.currentBooking.checkOut), 'HH:mm dd/MM')}</div></div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 text-green-600 font-semibold"><CreditCard size={12}/> {room.currentBooking.deposit > 0 ? `Cọc: ${formatCurrency(room.currentBooking.deposit)}` : 'Chưa cọc'}</div>
                          <div className="font-bold text-gray-800">{formatCurrency(room.currentBooking.totalPrice)}</div>
                      </div>
                  </>
                  ) : (
                  <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500 border-b border-dashed border-gray-200 pb-1"><span>2h đầu</span><span className="font-bold text-gray-700">{formatCurrency(room.price2h)}</span></div>
                      <div className="flex justify-between text-xs text-gray-500"><span>Qua đêm</span><span className="font-bold text-gray-700">{formatCurrency(room.priceNight)}</span></div>
                      {room.cleanStatus === 'dirty' && <div className="mt-2 bg-red-50 text-red-600 text-xs font-bold text-center py-1.5 rounded-md flex items-center justify-center gap-1"><Sparkles size={12}/> Cần dọn dẹp</div>}
                  </div>
                  )}
              </div>
              {/* Color Strip */}
              <div className={`h-1 w-full ${room.cleanStatus === 'dirty' ? 'bg-red-500' : (isOccupied ? 'bg-blue-500' : (isCheckin ? 'bg-orange-500' : 'bg-green-500'))}`}></div>
              </div>
          );
          })}
      </div>

      {/* --- REPORT SECTION --- */}
      <RoomsReportSection reportData={reportData} onRowClick={(r) => { setSelectedRoom(r); setIsEditingInfo(false); }} />

      {/* MODAL ROOM DETAIL (Tích hợp Edit Info, Bỏ Edit Status) */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Modal Header with Edit Button */}
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-start">
              {isEditingInfo ? (
                  <div className="w-full mr-4">
                      <input 
                        type="text" 
                        value={infoForm.number} 
                        onChange={(e) => setInfoForm({...infoForm, number: e.target.value})}
                        className="w-full font-bold text-xl mb-1 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Số phòng"
                      />
                      <input 
                        type="text" 
                        value={infoForm.concept} 
                        onChange={(e) => setInfoForm({...infoForm, concept: e.target.value})}
                        className="w-full text-sm text-gray-500 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Loại phòng"
                      />
                  </div>
              ) : (
                  <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-800">Phòng {selectedRoom.number}</h2>
                        {/* Edit Button */}
                        <button onClick={() => setIsEditingInfo(true)} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition"><Edit size={14}/></button>
                      </div>
                      <p className="text-sm text-gray-500">{selectedRoom.concept} • {selectedRoom.location}</p>
                  </div>
              )}
              <button onClick={() => setSelectedRoom(null)} className="p-2 rounded-full hover:bg-gray-200 transition"><X size={20} className="text-gray-500" /></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
                
                {/* Editing Prices Section */}
                {isEditingInfo && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 space-y-3 animate-in fade-in">
                        <h4 className="text-xs font-bold uppercase text-yellow-700">Cập nhật thông tin</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Giá 2h</label>
                                <input type="number" value={infoForm.price2h} onChange={(e) => setInfoForm({...infoForm, price2h: parseInt(e.target.value)})} className="w-full p-2 rounded border border-yellow-300 focus:outline-none focus:border-yellow-500 text-sm"/>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Giá đêm</label>
                                <input type="number" value={infoForm.priceNight} onChange={(e) => setInfoForm({...infoForm, priceNight: parseInt(e.target.value)})} className="w-full p-2 rounded border border-yellow-300 focus:outline-none focus:border-yellow-500 text-sm"/>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={handleUpdateRoomInfo} disabled={actionLoading} className="flex-1 bg-yellow-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-yellow-700 flex items-center justify-center gap-1 shadow-sm"><Save size={14}/> Lưu</button>
                            <button onClick={() => setIsEditingInfo(false)} className="flex-1 bg-white text-gray-600 border border-gray-300 py-2 rounded-lg text-sm font-bold hover:bg-gray-50">Hủy</button>
                        </div>
                    </div>
                )}

                {/* Status Badges */}
                <div className="flex gap-3">
                    <div className={`flex-1 p-3 rounded-xl border text-center ${selectedRoom.cleanStatus === 'clean' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Vệ sinh</p><p className="font-bold">{selectedRoom.cleanStatus === 'clean' ? 'Sạch sẽ' : 'Cần dọn'}</p>
                    </div>
                    <div className="flex-1 p-3 rounded-xl border text-center" style={{backgroundColor: getStatusColor(selectedRoom.status).bg, borderColor: getStatusColor(selectedRoom.status).border, color: getStatusColor(selectedRoom.status).text}}>
                        <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Trạng thái</p><p className="font-bold">{getStatusColor(selectedRoom.status).label}</p>
                    </div>
                </div>

                {/* Modal Booking Info */}
                {selectedRoom.currentBooking && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm"><User size={20}/></div>
                            <div><p className="text-[10px] uppercase font-bold text-gray-500">Khách hàng</p><p className="font-bold text-gray-900 text-lg">{selectedRoom.currentBooking.customerName}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-100">
                            <div><p className="text-[10px] uppercase font-bold text-gray-500">Check-in</p><p className="font-semibold text-gray-800 text-sm">{format(new Date(selectedRoom.currentBooking.checkIn), 'HH:mm dd/MM')}</p></div>
                            <div><p className="text-[10px] uppercase font-bold text-gray-500">Check-out</p><p className="font-semibold text-gray-800 text-sm">{format(new Date(selectedRoom.currentBooking.checkOut), 'HH:mm dd/MM')}</p></div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    {selectedRoom.cleanStatus === 'dirty' && selectedRoom.status === 'available' && <button onClick={handleCleanRoom} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition"><Sparkles size={18}/> Xác nhận dọn xong</button>}
                    {selectedRoom.status === 'occupied' && (
                        <>
                            <button onClick={handleCheckout} className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition"><LogOut size={18}/> Trả phòng</button>
                            <button onClick={handleShowDetail} className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 transition"><FileText size={18}/> Xem chi tiết đơn</button>
                        </>
                    )}
                    {selectedRoom.status === 'checkin-soon' && <button onClick={handleCheckIn} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition"><UserCheck size={18}/> Khách nhận phòng</button>}
                    {selectedRoom.status === 'available' && selectedRoom.cleanStatus === 'clean' && <button onClick={() => setShowBookingForm(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition"><Plus size={18}/> Tạo đơn mới</button>}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BOOKING DETAIL */}
      {bookingDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="bg-gray-800 p-5 text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2"><FileText size={18}/> Chi tiết đơn đặt</h3>
                    <p className="text-xs opacity-70 mt-1 font-mono">#{bookingDetail.ma_dat}</p>
                </div>
                <div className="p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"><User size={20}/></div>
                        <div><p className="font-bold text-gray-900">{bookingDetail.khach_hang?.ho_ten || bookingDetail.ho_ten}</p><p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12}/> {bookingDetail.khach_hang?.sdt || bookingDetail.sdt}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-200 text-sm mb-5">
                        <div><p className="text-[10px] uppercase font-bold text-gray-400">Phòng</p><div className="font-semibold flex items-center gap-1"><MapPin size={12}/> {bookingDetail.phong?.ma_phong || selectedRoom?.number}</div></div>
                        <div><p className="text-[10px] uppercase font-bold text-gray-400">Trạng thái</p><span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full text-xs">{getBookingStatusLabel(bookingDetail.trang_thai)}</span></div>
                        <div><p className="text-[10px] uppercase font-bold text-gray-400">Check-in</p><div className="font-semibold">{format(new Date(bookingDetail.thoi_gian_nhan), 'HH:mm dd/MM')}</div></div>
                        <div><p className="text-[10px] uppercase font-bold text-gray-400">Check-out</p><div className="font-semibold">{format(new Date(bookingDetail.thoi_gian_tra), 'HH:mm dd/MM')}</div></div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-2 mb-5">
                        <div className="flex justify-between text-gray-600"><span>Tổng tiền</span><span className="font-bold text-gray-900">{formatCurrency(bookingDetail.tong_tien || 0)}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Đã cọc</span><span className="font-bold text-green-600">{formatCurrency(bookingDetail.tien_coc || 0)}</span></div>
                    </div>
                    {bookingDetail.ghi_chu && <div className="mb-5"><p className="text-[10px] uppercase font-bold text-gray-400">Ghi chú</p><p className="text-sm text-gray-600 italic flex gap-1"><StickyNote size={14}/> {bookingDetail.ghi_chu}</p></div>}
                    <button onClick={() => setBookingDetail(null)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition">Đóng</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL CREATE BOOKING PLACEHOLDER */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl text-center">
                <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4"/>
                <h3 className="font-bold text-lg mb-2">Tạo đơn mới</h3>
                <p className="text-gray-500 text-sm mb-6">Vui lòng chuyển sang trang "Tạo Booking" trên thanh menu để thực hiện thao tác này.</p>
                <button onClick={() => setShowBookingForm(false)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700">Đóng</button>
            </div>
        </div>
      )}
    </div>
  );
}