import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Search, Plus, Edit, Eye, RefreshCw, Phone, Mail, MapPin } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    ho_ten: '',
    sdt: '',
    email: '',
    dia_chi: '',
    ghi_chu: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(c => 
        c.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sdt.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/khach-hang`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setCustomers(result.data || []);
        setFilteredCustomers(result.data || []);
      } else {
        toast.error('Lỗi khi tải danh sách khách hàng');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBookings = async (customerId: string) => {
    try {
      const response = await fetch(`${API_URL}/dat-phong/khach-hang/${customerId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setCustomerBookings(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
    }
  };

  const handleAdd = async () => {
    if (!formData.ho_ten || !formData.sdt) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/khach-hang`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Thêm khách hàng thành công!');
        setShowAddDialog(false);
        resetForm();
        fetchCustomers();
      } else {
        toast.error(result.error || 'Không thể thêm khách hàng');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.ho_ten || !formData.sdt) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/khach-hang/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Cập nhật khách hàng thành công!');
        setShowEditDialog(false);
        resetForm();
        fetchCustomers();
      } else {
        toast.error(result.error || 'Không thể cập nhật khách hàng');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (customer: any) => {
    setSelectedCustomer(customer);
    setShowViewDialog(true);
    await fetchCustomerBookings(customer.id);
  };

  const handleEditClick = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      ho_ten: customer.ho_ten,
      sdt: customer.sdt,
      email: customer.email || '',
      dia_chi: customer.dia_chi || '',
      ghi_chu: customer.ghi_chu || ''
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      ho_ten: '',
      sdt: '',
      email: '',
      dia_chi: '',
      ghi_chu: ''
    });
    setSelectedCustomer(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      'da_coc': 'secondary',
      'da_tt': 'default',
      'checkin': 'default',
      'checkout': 'default',
      'huy': 'destructive'
    };
    
    const labels: any = {
      'da_coc': 'Đã cọc',
      'da_tt': 'Đã TT',
      'checkin': 'Check-in',
      'checkout': 'Check-out',
      'huy': 'Đã hủy'
    };
    
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Quản lý khách hàng</h1>
        <p className="text-gray-600 mt-2">
          Quản lý thông tin khách hàng và lịch sử đặt phòng
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách khách hàng</CardTitle>
              <CardDescription>Tổng số: {filteredCustomers.length} khách hàng</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchCustomers} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm khách hàng
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên, SĐT, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Đang tải...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Chưa có khách hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.ho_ten}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.sdt}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {customer.dia_chi ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {customer.dia_chi}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{formatDate(customer.ngay_tao)}</TableCell>
                      <TableCell className="max-w-xs truncate">{customer.ghi_chu || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleView(customer)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(customer)}>
                            <Edit className="w-4 h-4" />
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin khách hàng mới vào hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ho_ten">Họ tên *</Label>
              <Input
                id="ho_ten"
                value={formData.ho_ten}
                onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <Label htmlFor="sdt">Số điện thoại *</Label>
              <Input
                id="sdt"
                value={formData.sdt}
                onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
                placeholder="0912345678"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="dia_chi">Địa chỉ</Label>
              <Input
                id="dia_chi"
                value={formData.dia_chi}
                onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                placeholder="Hà Nội"
              />
            </div>
            <div>
              <Label htmlFor="ghi_chu">Ghi chú</Label>
              <Textarea
                id="ghi_chu"
                value={formData.ghi_chu}
                onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                placeholder="Ghi chú về khách hàng..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleAdd} disabled={loading}>
              {loading ? 'Đang thêm...' : 'Thêm khách hàng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin khách hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_ho_ten">Họ tên *</Label>
              <Input
                id="edit_ho_ten"
                value={formData.ho_ten}
                onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_sdt">Số điện thoại *</Label>
              <Input
                id="edit_sdt"
                value={formData.sdt}
                onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_dia_chi">Địa chỉ</Label>
              <Input
                id="edit_dia_chi"
                value={formData.dia_chi}
                onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_ghi_chu">Ghi chú</Label>
              <Textarea
                id="edit_ghi_chu"
                value={formData.ghi_chu}
                onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và lịch sử đặt phòng
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin khách hàng</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Họ tên</Label>
                    <p className="mt-1">{selectedCustomer.ho_ten}</p>
                  </div>
                  <div>
                    <Label>SĐT</Label>
                    <p className="mt-1">{selectedCustomer.sdt}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="mt-1">{selectedCustomer.email || '-'}</p>
                  </div>
                  <div>
                    <Label>Địa chỉ</Label>
                    <p className="mt-1">{selectedCustomer.dia_chi || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Ghi chú</Label>
                    <p className="mt-1">{selectedCustomer.ghi_chu || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Booking History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lịch sử đặt phòng ({customerBookings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {customerBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Chưa có lịch sử đặt phòng</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đặt</TableHead>
                          <TableHead>Phòng</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Tổng tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>{booking.ma_dat}</TableCell>
                            <TableCell>{booking.phong?.ma_phong || '-'}</TableCell>
                            <TableCell>{formatDate(booking.thoi_gian_nhan)}</TableCell>
                            <TableCell>{formatDate(booking.thoi_gian_tra)}</TableCell>
                            <TableCell>{getStatusBadge(booking.trang_thai)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(booking.tong_tien)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
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
