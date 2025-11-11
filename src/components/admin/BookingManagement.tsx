import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Search, Eye, RefreshCw, Calendar, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

export default function BookingManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchTerm, statusFilter, bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dat-phong`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const result = await response.json();

      if (result.success) {
        setBookings(result.data || []);
      } else {
        toast.error('Lỗi khi tải danh sách đặt phòng');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.trang_thai === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.ma_dat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.khach_hang?.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.khach_hang?.sdt.includes(searchTerm) ||
        b.phong?.ma_phong.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dat-phong/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ trang_thai: newStatus })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Cập nhật trạng thái thành công!');
        fetchBookings();
      } else {
        toast.error(result.error || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Bạn có chắc muốn xóa đơn đặt phòng này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dat-phong/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Xóa đơn đặt phòng thành công!');
        fetchBookings();
      } else {
        toast.error(result.error || 'Không thể xóa đơn đặt phòng');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    if (!confirm('Xác nhận đã nhận được tiền cọc?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dat-phong/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ trang_thai: 'da_coc' })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Xác nhận thanh toán thành công!');
        fetchBookings();
      } else {
        toast.error(result.error || 'Không thể xác nhận thanh toán');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      // Trạng thái mới
      'cho_coc': {
        label: 'Chờ cọc',
        variant: 'outline',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-300'
      },
      'da_coc': {
        label: 'Đã cọc',
        variant: 'default',
        className: 'bg-green-50 text-green-700 border-green-300'
      },
      'da_nhan_phong': {
        label: 'Đã nhận phòng',
        variant: 'default',
        className: 'bg-blue-50 text-blue-700 border-blue-300'
      },
      'da_tra_phong': {
        label: 'Đã trả phòng',
        variant: 'secondary',
        className: 'bg-gray-50 text-gray-700 border-gray-300'
      },
      'da_huy': {
        label: 'Đã hủy',
        variant: 'destructive',
        className: 'bg-red-50 text-red-700 border-red-300'
      },
      // Trạng thái cũ (backward compatibility)
      'da_tt': {
        label: 'Đã thanh toán',
        variant: 'default',
        className: 'bg-green-50 text-green-700 border-green-300'
      },
      'checkin': {
        label: 'Đã check-in',
        variant: 'default',
        className: 'bg-blue-50 text-blue-700 border-blue-300'
      },
      'checkout': {
        label: 'Đã check-out',
        variant: 'secondary',
        className: 'bg-gray-50 text-gray-700 border-gray-300'
      },
      'huy': {
        label: 'Đã hủy',
        variant: 'destructive',
        className: 'bg-red-50 text-red-700 border-red-300'
      }
    };

    const config = statusConfig[status] || statusConfig['cho_coc'];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getChannelBadge = (channel: string) => {
    const labels: any = {
      'website': 'Website',
      'facebook': 'Facebook',
      'zalo': 'Zalo',
      'khac': 'Khác'
    };

    return <Badge variant="outline">{labels[channel] || channel}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Quản lý đặt phòng</h1>
        <p className="text-gray-600 mt-2">
          Quản lý tất cả đơn đặt phòng
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách đặt phòng</CardTitle>
              <CardDescription>Tổng số: {filteredBookings.length} đơn</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchBookings} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT, phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="cho_coc">Chờ cọc</SelectItem>
                <SelectItem value="da_coc">Đã cọc</SelectItem>
                <SelectItem value="da_nhan_phong">Đã nhận phòng</SelectItem>
                <SelectItem value="da_tra_phong">Đã trả phòng</SelectItem>
                <SelectItem value="da_huy">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Số khách</TableHead>
                  <TableHead>Kênh đặt</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Đang tải...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Chưa có đơn đặt phòng nào</p>
                      <p className="text-sm text-gray-400 mt-2">Vào /setup để khởi tạo dữ liệu mẫu</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono">{booking.ma_dat}</TableCell>
                      <TableCell>
                        <div>
                          <div>{booking.khach_hang?.ho_ten || '-'}</div>
                          <div className="text-xs text-gray-500">{booking.khach_hang?.sdt || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{booking.phong?.ma_phong || '-'}</div>
                          <div className="text-xs text-gray-500">{booking.phong?.loai_phong?.ten_loai || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(booking.thoi_gian_nhan)}</TableCell>
                      <TableCell className="text-sm">{formatDate(booking.thoi_gian_tra)}</TableCell>
                      <TableCell>{booking.so_khach}</TableCell>
                      <TableCell>{getChannelBadge(booking.kenh_dat)}</TableCell>
                      <TableCell>
                        <Select
                          value={booking.trang_thai}
                          onValueChange={(v: string) => handleUpdateStatus(booking.id, v)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cho_coc">Chờ cọc</SelectItem>
                            <SelectItem value="da_coc">Đã cọc</SelectItem>
                            <SelectItem value="da_nhan_phong">Đã nhận phòng</SelectItem>
                            <SelectItem value="da_tra_phong">Đã trả phòng</SelectItem>
                            <SelectItem value="da_huy">Đã hủy</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(booking.tong_tien)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowViewDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {booking.trang_thai === 'cho_coc' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirmPayment(booking.id)}
                              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
                            >
                              ✓ Xác nhận
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(booking.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn đặt phòng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn đặt phòng
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã đơn</Label>
                  <p className="mt-1 font-mono">{selectedBooking.ma_dat}</p>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <p className="mt-1">{getStatusBadge(selectedBooking.trang_thai)}</p>
                </div>
                <div>
                  <Label>Khách hàng</Label>
                  <p className="mt-1">{selectedBooking.khach_hang?.ho_ten}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.khach_hang?.sdt}</p>
                </div>
                <div>
                  <Label>Email khách</Label>
                  <p className="mt-1">{selectedBooking.khach_hang?.email || '-'}</p>
                </div>
                <div>
                  <Label>Phòng</Label>
                  <p className="mt-1">{selectedBooking.phong?.ma_phong}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.phong?.loai_phong?.ten_loai}</p>
                </div>
                <div>
                  <Label>Cơ sở</Label>
                  <p className="mt-1">{selectedBooking.phong?.loai_phong?.co_so?.ten_co_so || '-'}</p>
                </div>
                <div>
                  <Label>Check-in</Label>
                  <p className="mt-1">{formatDate(selectedBooking.thoi_gian_nhan)}</p>
                </div>
                <div>
                  <Label>Check-out</Label>
                  <p className="mt-1">{formatDate(selectedBooking.thoi_gian_tra)}</p>
                </div>
                <div>
                  <Label>Số khách</Label>
                  <p className="mt-1">{selectedBooking.so_khach} người</p>
                </div>
                <div>
                  <Label>Kênh đặt</Label>
                  <p className="mt-1">{getChannelBadge(selectedBooking.kenh_dat)}</p>
                </div>
                <div>
                  <Label>Tổng tiền</Label>
                  <p className="mt-1 text-lg">{formatCurrency(selectedBooking.tong_tien)}</p>
                </div>
                <div>
                  <Label>Cọc CSVC</Label>
                  <p className="mt-1">{formatCurrency(selectedBooking.coc_csvc)}</p>
                </div>
                {selectedBooking.ghi_chu && (
                  <div className="col-span-2">
                    <Label>Ghi chú</Label>
                    <p className="mt-1">{selectedBooking.ghi_chu}</p>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              {selectedBooking.thanh_toan && selectedBooking.thanh_toan.length > 0 && (
                <div>
                  <Label>Lịch sử thanh toán</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phương thức</TableHead>
                          <TableHead>Số tiền</TableHead>
                          <TableHead>Ngày TT</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBooking.thanh_toan.map((payment: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{payment.phuong_thuc?.toUpperCase()}</TableCell>
                            <TableCell>{formatCurrency(payment.so_tien)}</TableCell>
                            <TableCell>{formatDate(payment.ngay_tt)}</TableCell>
                            <TableCell>
                              <Badge variant={payment.trang_thai === 'thanh_cong' ? 'default' : 'secondary'}>
                                {payment.trang_thai === 'thanh_cong' ? 'Thành công' : payment.trang_thai}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
