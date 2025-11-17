import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Search, Plus, Edit, RefreshCw, Shield, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    ho_ten: '',
    email: '',
    sdt: '',
    vai_tro: 'le_tan',
    trang_thai: true
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [searchTerm, roleFilter, accounts]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tai-khoan`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const result = await response.json();

      if (result.success) {
        setAccounts(result.data || []);
      } else {
        toast.error('Lỗi khi tải danh sách tài khoản');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(a => a.vai_tro === roleFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.sdt && a.sdt.includes(searchTerm))
      );
    }

    setFilteredAccounts(filtered);
  };

  const handleAdd = async () => {
    if (!formData.ho_ten || !formData.email) {
      toast.error('Vui lòng nhập họ tên và email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tai-khoan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Thêm tài khoản thành công!');
        setShowAddDialog(false);
        resetForm();
        fetchAccounts();
      } else {
        toast.error(result.error || 'Không thể thêm tài khoản');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.ho_ten || !formData.email) {
      toast.error('Vui lòng nhập họ tên và email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tai-khoan/${selectedAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Cập nhật tài khoản thành công!');
        setShowEditDialog(false);
        resetForm();
        fetchAccounts();
      } else {
        toast.error(result.error || 'Không thể cập nhật tài khoản');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tai-khoan/${accountId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Xóa tài khoản thành công!');
        fetchAccounts();
      } else {
        toast.error(result.error || 'Không thể xóa tài khoản');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (account: any) => {
    setSelectedAccount(account);
    setFormData({
      ho_ten: account.ho_ten,
      email: account.email,
      sdt: account.sdt || '',
      vai_tro: account.vai_tro,
      trang_thai: account.trang_thai
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      ho_ten: '',
      email: '',
      sdt: '',
      vai_tro: 'le_tan',
      trang_thai: true
    });
    setSelectedAccount(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getRoleBadge = (role: string) => {
    const variants: any = {
      'quan_tri': 'default',
      'le_tan': 'secondary',
      'ke_toan': 'secondary'
    };

    const labels: any = {
      'quan_tri': '👑 Quản trị',
      'le_tan': '👤 Lễ tân',
      'ke_toan': '💰 Kế toán'
    };

    return <Badge variant={variants[role] || 'secondary'}>{labels[role] || role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Quản lý tài khoản</h1>
        <p className="text-gray-600 mt-2">
          Quản lý tài khoản người dùng và phân quyền
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách tài khoản</CardTitle>
              <CardDescription>Tổng số: {filteredAccounts.length} tài khoản</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAccounts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm tài khoản
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, email, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="quan_tri">Quản trị</SelectItem>
                <SelectItem value="le_tan">Lễ tân</SelectItem>
                <SelectItem value="ke_toan">Kế toán</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Đang tải...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Chưa có tài khoản nào</p>
                      <p className="text-sm text-gray-400 mt-2">Vào /setup để khởi tạo dữ liệu mẫu</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.ho_ten}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.sdt || '-'}</TableCell>
                      <TableCell>{getRoleBadge(account.vai_tro)}</TableCell>
                      <TableCell>
                        <Badge variant={account.trang_thai ? 'default' : 'secondary'}>
                          {account.trang_thai ? '✓ Hoạt động' : '✗ Không'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(account.ngay_tao)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(account)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(account.id)}>
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tài khoản mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới cho nhân viên hoặc quản lý
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@lalahouse.vn"
              />
            </div>
            <div>
              <Label htmlFor="sdt">Số điện thoại</Label>
              <Input
                id="sdt"
                value={formData.sdt}
                onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
                placeholder="0912345678"
              />
            </div>
            <div>
              <Label htmlFor="vai_tro">Vai trò</Label>
              <Select value={formData.vai_tro} onValueChange={(v) => setFormData({ ...formData, vai_tro: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quan_tri">Quản trị</SelectItem>
                  <SelectItem value="le_tan">Lễ tân</SelectItem>
                  <SelectItem value="ke_toan">Kế toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="trang_thai"
                checked={formData.trang_thai}
                onChange={(e) => setFormData({ ...formData, trang_thai: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="trang_thai" className="cursor-pointer">Tài khoản hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleAdd} disabled={loading}>
              {loading ? 'Đang thêm...' : 'Thêm tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin tài khoản
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
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_sdt">Số điện thoại</Label>
              <Input
                id="edit_sdt"
                value={formData.sdt}
                onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_vai_tro">Vai trò</Label>
              <Select value={formData.vai_tro} onValueChange={(v) => setFormData({ ...formData, vai_tro: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quan_tri">Quản trị</SelectItem>
                  <SelectItem value="le_tan">Lễ tân</SelectItem>
                  <SelectItem value="ke_toan">Kế toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_trang_thai"
                checked={formData.trang_thai}
                onChange={(e) => setFormData({ ...formData, trang_thai: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="edit_trang_thai" className="cursor-pointer">Tài khoản hoạt động</Label>
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
    </div>
  );
}
