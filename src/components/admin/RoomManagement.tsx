import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, Plus, Edit, RefreshCw, Home, Tag, Building2, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

export default function RoomManagement() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [loading, setLoading] = useState(false);

  // Data states
  const [rooms, setRooms] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Dialog states
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showConceptDialog, setShowConceptDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [roomForm, setRoomForm] = useState({
    ma_phong: '',
    id_loai_phong: '',
    trang_thai: 'trong',
    tinh_trang_vesinh: 'sach',
    ghi_chu: ''
  });

  const [conceptForm, setConceptForm] = useState({
    ten_loai: '',
    mo_ta: '',
    gia_gio: '',
    gia_dem: '',
    id_co_so: '',
    trang_thai: true
  });

  const [locationForm, setLocationForm] = useState({
    ten_co_so: '',
    dia_chi: '',
    hotline: '',
    mo_ta: '',
    trang_thai: true
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([
      fetchRooms(),
      fetchConcepts(),
      fetchLocations()
    ]);
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/phong`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const result = await response.json();
      console.log('Fetch rooms result:', result);
      if (result.success) {
        console.log('Total rooms fetched:', result.data?.length);
        setRooms(result.data || []);
      } else {
        console.error('Failed to fetch rooms:', result.error);
        toast.error(result.error || 'Không thể tải danh sách phòng');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchConcepts = async () => {
    try {
      const response = await fetch(`${API_URL}/loai-phong`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const result = await response.json();
      if (result.success) {
        setConcepts(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching concepts:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_URL}/co-so`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const result = await response.json();
      if (result.success) {
        setLocations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Room CRUD
  const handleSaveRoom = async () => {
    if (!roomForm.ma_phong || !roomForm.id_loai_phong) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const url = editMode ? `${API_URL}/phong/${selectedItem.id}` : `${API_URL}/phong`;
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(roomForm)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editMode ? 'Cập nhật phòng thành công!' : 'Thêm phòng thành công!');
        setShowRoomDialog(false);
        resetRoomForm();
        fetchRooms();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa phòng này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/phong/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Xóa phòng thành công!');
        fetchRooms();
      } else {
        toast.error(result.error || 'Không thể xóa phòng');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  // Concept CRUD
  const handleSaveConcept = async () => {
    if (!conceptForm.ten_loai || !conceptForm.gia_gio || !conceptForm.gia_dem || !conceptForm.id_co_so) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const url = editMode ? `${API_URL}/loai-phong/${selectedItem.id}` : `${API_URL}/loai-phong`;
      const method = editMode ? 'PUT' : 'POST';

      const payload = {
        ...conceptForm,
        gia_gio: parseInt(conceptForm.gia_gio),
        gia_dem: parseInt(conceptForm.gia_dem)
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editMode ? 'Cập nhật loại phòng thành công!' : 'Thêm loại phòng thành công!');
        setShowConceptDialog(false);
        resetConceptForm();
        fetchConcepts();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving concept:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConcept = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa loại phòng này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/loai-phong/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Xóa loại phòng thành công!');
        fetchConcepts();
      } else {
        toast.error(result.error || 'Không thể xóa loại phòng');
      }
    } catch (error) {
      console.error('Error deleting concept:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  // Location CRUD
  const handleSaveLocation = async () => {
    if (!locationForm.ten_co_so || !locationForm.dia_chi) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const url = editMode ? `${API_URL}/co-so/${selectedItem.id}` : `${API_URL}/co-so`;
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(locationForm)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editMode ? 'Cập nhật cơ sở thành công!' : 'Thêm cơ sở thành công!');
        setShowLocationDialog(false);
        resetLocationForm();
        fetchLocations();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa cơ sở này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/co-so/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Xóa cơ sở thành công!');
        fetchLocations();
      } else {
        toast.error(result.error || 'Không thể xóa cơ sở');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
    }
  };

  // Reset forms
  const resetRoomForm = () => {
    setRoomForm({
      ma_phong: '',
      id_loai_phong: '',
      trang_thai: 'trong',
      tinh_trang_vesinh: 'sach',
      ghi_chu: ''
    });
    setEditMode(false);
    setSelectedItem(null);
  };

  const resetConceptForm = () => {
    setConceptForm({
      ten_loai: '',
      mo_ta: '',
      gia_gio: '',
      gia_dem: '',
      id_co_so: '',
      trang_thai: true
    });
    setEditMode(false);
    setSelectedItem(null);
  };

  const resetLocationForm = () => {
    setLocationForm({
      ten_co_so: '',
      dia_chi: '',
      hotline: '',
      mo_ta: '',
      trang_thai: true
    });
    setEditMode(false);
    setSelectedItem(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getRoomStatusBadge = (status: string) => {
    const variants: any = {
      'trong': 'default',
      'dang_dung': 'destructive',
      'sap_nhan': 'secondary',
      'sap_tra': 'secondary',
      'bao_tri': 'secondary'
    };

    const labels: any = {
      'trong': 'Trống',
      'dang_dung': 'Đang dùng',
      'sap_nhan': 'Sắp nhận',
      'sap_tra': 'Sắp trả',
      'bao_tri': 'Bảo trì'
    };

    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const getCleanStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'sach': 'Sạch',
      'dang_don': 'Đang dọn',
      'chua_don': 'Chưa dọn'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Quản lý phòng</h1>
        <p className="text-gray-600 mt-2">
          Quản lý phòng, loại phòng và cơ sở
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="rooms">Phòng ({rooms.length})</TabsTrigger>
          <TabsTrigger value="concepts">Loại phòng ({concepts.length})</TabsTrigger>
          <TabsTrigger value="locations">Cơ sở ({locations.length})</TabsTrigger>
        </TabsList>

        {/* ROOMS TAB */}
        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Danh sách phòng</CardTitle>
                  <CardDescription>Quản lý phòng và trạng thái</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchRooms} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                  </Button>
                  <Button onClick={() => { setEditMode(false); setShowRoomDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm phòng
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã phòng</TableHead>
                    <TableHead>Loại phòng</TableHead>
                    <TableHead>Cơ sở</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Vệ sinh</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && rooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">Đang tải...</p>
                      </TableCell>
                    </TableRow>
                  ) : rooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Home className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">Chưa có phòng nào</p>
                        <p className="text-sm text-gray-400 mt-2">Vào /setup để khởi tạo dữ liệu mẫu</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>{room.ma_phong}</TableCell>
                        <TableCell>{room.loai_phong?.ten_loai || '-'}</TableCell>
                        <TableCell>{room.loai_phong?.co_so?.ten_co_so || '-'}</TableCell>
                        <TableCell>{getRoomStatusBadge(room.trang_thai)}</TableCell>
                        <TableCell>{getCleanStatusLabel(room.tinh_trang_vesinh)}</TableCell>
                        <TableCell className="max-w-xs truncate">{room.ghi_chu || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(room);
                                setRoomForm({
                                  ma_phong: room.ma_phong,
                                  id_loai_phong: room.id_loai_phong,
                                  trang_thai: room.trang_thai,
                                  tinh_trang_vesinh: room.tinh_trang_vesinh,
                                  ghi_chu: room.ghi_chu || ''
                                });
                                setEditMode(true);
                                setShowRoomDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRoom(room.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONCEPTS TAB */}
        <TabsContent value="concepts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Danh sách loại phòng</CardTitle>
                  <CardDescription>Quản lý concept và giá phòng</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchConcepts} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                  </Button>
                  <Button onClick={() => { setEditMode(false); setShowConceptDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm loại phòng
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên loại</TableHead>
                    <TableHead>Cơ sở</TableHead>
                    <TableHead>Giá giờ</TableHead>
                    <TableHead>Giá ngày</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {concepts.map((concept) => (
                    <TableRow key={concept.id}>
                      <TableCell>{concept.ten_loai}</TableCell>
                      <TableCell>{concept.co_so?.ten_co_so || '-'}</TableCell>
                      <TableCell>{formatCurrency(concept.gia_gio)}</TableCell>
                      <TableCell>{formatCurrency(concept.gia_dem)}</TableCell>
                      <TableCell className="max-w-xs truncate">{concept.mo_ta || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={concept.trang_thai ? 'default' : 'secondary'}>
                          {concept.trang_thai ? 'Hoạt động' : 'Không'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(concept);
                              setConceptForm({
                                ten_loai: concept.ten_loai,
                                mo_ta: concept.mo_ta || '',
                                gia_gio: concept.gia_gio.toString(),
                                gia_dem: concept.gia_dem.toString(),
                                id_co_so: concept.id_co_so,
                                trang_thai: concept.trang_thai
                              });
                              setEditMode(true);
                              setShowConceptDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConcept(concept.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOCATIONS TAB */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Danh sách cơ sở</CardTitle>
                  <CardDescription>Quản lý chi nhánh LaLa House</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchLocations} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                  </Button>
                  <Button onClick={() => { setEditMode(false); setShowLocationDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm cơ sở
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cơ sở</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Hotline</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>{location.ten_co_so}</TableCell>
                      <TableCell>{location.dia_chi}</TableCell>
                      <TableCell>{location.hotline || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{location.mo_ta || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={location.trang_thai ? 'default' : 'secondary'}>
                          {location.trang_thai ? 'Hoạt động' : 'Không'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(location);
                              setLocationForm({
                                ten_co_so: location.ten_co_so,
                                dia_chi: location.dia_chi,
                                hotline: location.hotline || '',
                                mo_ta: location.mo_ta || '',
                                trang_thai: location.trang_thai
                              });
                              setEditMode(true);
                              setShowLocationDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Room Dialog */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Cập nhật thông tin phòng' : 'Thêm phòng mới vào hệ thống'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mã phòng *</Label>
              <Input
                value={roomForm.ma_phong}
                onChange={(e) => setRoomForm({ ...roomForm, ma_phong: e.target.value })}
                placeholder="101"
              />
            </div>
            <div>
              <Label>Loại phòng *</Label>
              <Select value={roomForm.id_loai_phong} onValueChange={(v) => setRoomForm({ ...roomForm, id_loai_phong: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại phòng" />
                </SelectTrigger>
                <SelectContent>
                  {concepts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.ten_loai} - {c.co_so?.ten_co_so}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={roomForm.trang_thai} onValueChange={(v) => setRoomForm({ ...roomForm, trang_thai: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trong">Trống</SelectItem>
                  <SelectItem value="dang_dung">Đang dùng</SelectItem>
                  <SelectItem value="sap_nhan">Sắp nhận</SelectItem>
                  <SelectItem value="sap_tra">Sắp trả</SelectItem>
                  <SelectItem value="bao_tri">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tình trạng vệ sinh</Label>
              <Select value={roomForm.tinh_trang_vesinh} onValueChange={(v) => setRoomForm({ ...roomForm, tinh_trang_vesinh: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sach">Sạch</SelectItem>
                  <SelectItem value="dang_don">Đang dọn</SelectItem>
                  <SelectItem value="chua_don">Chưa dọn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea
                value={roomForm.ghi_chu}
                onChange={(e) => setRoomForm({ ...roomForm, ghi_chu: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRoomDialog(false); resetRoomForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleSaveRoom} disabled={loading}>
              {loading ? 'Đang lưu...' : editMode ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Concept Dialog */}
      <Dialog open={showConceptDialog} onOpenChange={setShowConceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Chỉnh sửa loại phòng' : 'Thêm loại phòng mới'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Cập nhật thông tin loại phòng' : 'Thêm loại phòng mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên loại phòng *</Label>
              <Input
                value={conceptForm.ten_loai}
                onChange={(e) => setConceptForm({ ...conceptForm, ten_loai: e.target.value })}
                placeholder="Matcha, Pastel, ..."
              />
            </div>
            <div>
              <Label>Cơ sở *</Label>
              <Select value={conceptForm.id_co_so} onValueChange={(v) => setConceptForm({ ...conceptForm, id_co_so: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cơ sở" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.ten_co_so}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giá giờ (VND) *</Label>
                <Input
                  type="number"
                  value={conceptForm.gia_gio}
                  onChange={(e) => setConceptForm({ ...conceptForm, gia_gio: e.target.value })}
                  placeholder="150000"
                />
              </div>
              <div>
                <Label>Giá ngày (VND) *</Label>
                <Input
                  type="number"
                  value={conceptForm.gia_dem}
                  onChange={(e) => setConceptForm({ ...conceptForm, gia_dem: e.target.value })}
                  placeholder="500000"
                />
              </div>
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={conceptForm.mo_ta}
                onChange={(e) => setConceptForm({ ...conceptForm, mo_ta: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowConceptDialog(false); resetConceptForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleSaveConcept} disabled={loading}>
              {loading ? 'Đang lưu...' : editMode ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Cập nhật thông tin cơ sở' : 'Thêm địa điểm cơ sở mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên cơ sở *</Label>
              <Input
                value={locationForm.ten_co_so}
                onChange={(e) => setLocationForm({ ...locationForm, ten_co_so: e.target.value })}
                placeholder="LaLa House Dương Quảng Hàm"
              />
            </div>
            <div>
              <Label>Địa chỉ *</Label>
              <Input
                value={locationForm.dia_chi}
                onChange={(e) => setLocationForm({ ...locationForm, dia_chi: e.target.value })}
                placeholder="123 Dương Quảng Hàm, Hà Nội"
              />
            </div>
            <div>
              <Label>Hotline</Label>
              <Input
                value={locationForm.hotline}
                onChange={(e) => setLocationForm({ ...locationForm, hotline: e.target.value })}
                placeholder="0987654321"
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={locationForm.mo_ta}
                onChange={(e) => setLocationForm({ ...locationForm, mo_ta: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowLocationDialog(false); resetLocationForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleSaveLocation} disabled={loading}>
              {loading ? 'Đang lưu...' : editMode ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
