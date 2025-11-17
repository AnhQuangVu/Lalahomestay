import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, Plus, Edit, RefreshCw, Home, Tag, Building2, Trash2, Upload, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { getRoomImage, getLocationImage } from '../../utils/imageUtils';
import { toast } from 'sonner';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string, type: 'room' | 'concept' | 'location' } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [roomForm, setRoomForm] = useState({
    ma_phong: '',
    id_loai_phong: '',
    trang_thai: 'trong',
    tinh_trang_vesinh: 'sach',
    anh_chinh: '',
    anh_phu: [] as string[],
    ghi_chu: ''
  });

  // Image upload states
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

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
    anh_dai_dien: '',
    anh_phu: [] as string[],
    trang_thai: true
  });

  // Location image upload states
  const [locationImageFile, setLocationImageFile] = useState<File | null>(null);
  const [locationGalleryFiles, setLocationGalleryFiles] = useState<File[]>([]);
  const [locationImagePreview, setLocationImagePreview] = useState<string>('');
  const [locationGalleryPreviews, setLocationGalleryPreviews] = useState<string[]>([]);

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
    // Validation
    if (!roomForm.ma_phong?.trim()) {
      toast.error('Vui lòng nhập mã phòng');
      return;
    }

    if (roomForm.ma_phong.length > 20) {
      toast.error('Mã phòng không được quá 20 ký tự');
      return;
    }

    // Kiểm tra mã phòng trùng (chỉ khi thêm mới hoặc đổi mã khi edit)
    const isDuplicate = rooms.some(r =>
      r.ma_phong.toLowerCase() === roomForm.ma_phong.trim().toLowerCase() &&
      (!editMode || r.id !== selectedItem?.id)
    );

    if (isDuplicate) {
      toast.error(`Mã phòng "${roomForm.ma_phong}" đã tồn tại`);
      return;
    }

    if (!roomForm.id_loai_phong) {
      toast.error('Vui lòng chọn loại phòng');
      return;
    }

    // Validate main image file size (max 10MB)
    if (mainImageFile && mainImageFile.size > 10 * 1024 * 1024) {
      toast.error('Ảnh chính không được vượt quá 10MB');
      return;
    }

    // Validate gallery files
    if (galleryFiles && galleryFiles.length > 0) {
      const maxGallerySize = 10 * 1024 * 1024; // 10MB per file
      const oversizedFile = galleryFiles.find(f => f.size > maxGallerySize);
      if (oversizedFile) {
        toast.error(`File ${oversizedFile.name} vượt quá 10MB`);
        return;
      }

      if (galleryFiles.length > 20) {
        toast.error('Tối đa 20 ảnh gallery');
        return;
      }
    }

    setLoading(true);
    try {
      // prepare payload and upload images if selected
      const payload: any = { ...roomForm };

      if (mainImageFile) {
        try {
          toast.info('Đang upload ảnh chính...');
          const url = await uploadToCloudinary(mainImageFile, 'rooms');
          payload.anh_chinh = url;
        } catch (e) {
          console.error('Error uploading main image:', e);
          toast.error('Không thể upload ảnh chính');
          setLoading(false);
          return;
        }
      }

      if (galleryFiles && galleryFiles.length > 0) {
        try {
          toast.info(`Đang upload ${galleryFiles.length} ảnh gallery...`);
          const urls = await Promise.all(galleryFiles.map((f) => uploadToCloudinary(f, 'rooms')));
          payload.anh_phu = ([...(payload.anh_phu || [])] as string[]).concat(urls);
        } catch (e) {
          console.error('Error uploading gallery images:', e);
          toast.error('Không thể upload ảnh phụ');
          setLoading(false);
          return;
        }
      }

      const url = editMode ? `${API_URL}/phong/${selectedItem?.id}` : `${API_URL}/phong`;
      const method = editMode ? 'PUT' : 'POST';

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
    const room = rooms.find(r => r.id === id);
    const roomName = room?.ma_phong || 'phòng này';

    setDeleteTarget({ id, name: roomName, type: 'room' });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      let endpoint = '';
      let fetchFunction = null;

      switch (deleteTarget.type) {
        case 'room':
          endpoint = `${API_URL}/phong/${deleteTarget.id}`;
          fetchFunction = fetchRooms;
          break;
        case 'concept':
          endpoint = `${API_URL}/loai-phong/${deleteTarget.id}`;
          fetchFunction = fetchConcepts;
          break;
        case 'location':
          endpoint = `${API_URL}/co-so/${deleteTarget.id}`;
          fetchFunction = fetchLocations;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const result = await response.json();
      if (result.success) {
        if (deleteTarget.type === 'room' && result.suspended) {
          toast.warning(`Phòng "${deleteTarget.name}" có giao dịch nên đã chuyển sang trạng thái đình chỉ thay vì xóa hẳn.`, {
            duration: 5000
          });
        } else {
          const typeLabel = deleteTarget.type === 'room' ? 'phòng' : deleteTarget.type === 'concept' ? 'loại phòng' : 'cơ sở';
          toast.success(`Đã xóa ${typeLabel} "${deleteTarget.name}" thành công!`);
        }
        if (fetchFunction) fetchFunction();
      } else {
        toast.error(result.error || 'Không thể xóa.');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Không thể kết nối với server');
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    }
  };  // Concept CRUD
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

  const handleDeleteConceptClick = (concept: any) => {
    setDeleteTarget({ id: concept.id, name: concept.ten_loai, type: 'concept' });
    setShowDeleteDialog(true);
  };

  const handleDeleteConcept = async (id: string) => {

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
      // Upload location image to Cloudinary if provided
      let anhDaiDienUrl = locationForm.anh_dai_dien;
      let anhPhuUrls = locationForm.anh_phu || [];

      if (locationImageFile) {
        toast.info('Đang upload ảnh đại diện cơ sở...');
        anhDaiDienUrl = await uploadToCloudinary(locationImageFile, 'locations');
      }

      if (locationGalleryFiles.length > 0) {
        toast.info('Đang upload ảnh gallery cơ sở...');
        const uploadedUrls = await Promise.all(
          locationGalleryFiles.map(file => uploadToCloudinary(file, 'locations'))
        );
        anhPhuUrls = [...anhPhuUrls, ...uploadedUrls];
      }

      const url = editMode ? `${API_URL}/co-so/${selectedItem.id}` : `${API_URL}/co-so`;
      const method = editMode ? 'PUT' : 'POST';

      const payload = {
        ...locationForm,
        anh_dai_dien: anhDaiDienUrl,
        anh_phu: anhPhuUrls
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

  const handleDeleteLocationClick = (location: any) => {
    setDeleteTarget({ id: location.id, name: location.ten_co_so, type: 'location' });
    setShowDeleteDialog(true);
  };

  const handleDeleteLocation = async (id: string) => {

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
      anh_chinh: '',
      anh_phu: [],
      ghi_chu: ''
    });
    setEditMode(false);
    setSelectedItem(null);
    setMainImageFile(null);
    setGalleryFiles([]);
    setMainImagePreview('');
    setGalleryPreviews([]);
  };

  // Image management helpers
  const removeExistingMainImage = () => {
    // remove stored main image URL
    setRoomForm({ ...roomForm, anh_chinh: '' });
    setMainImageFile(null);
    if (mainImagePreview) {
      try { URL.revokeObjectURL(mainImagePreview); } catch (e) { }
    }
    setMainImagePreview('');
  };

  const removeExistingGalleryImage = (url: string) => {
    const newList = (roomForm.anh_phu || []).filter((u) => u !== url);
    setRoomForm({ ...roomForm, anh_phu: newList });
    // if the url was used as a preview from createObjectURL it would be in galleryPreviews
    const idx = galleryPreviews.indexOf(url);
    if (idx >= 0) {
      try { URL.revokeObjectURL(galleryPreviews[idx]); } catch (e) { }
      const gp = [...galleryPreviews]; gp.splice(idx, 1); setGalleryPreviews(gp);
    }
  };

  const removeSelectedGalleryFile = (index: number) => {
    const files = [...galleryFiles];
    const previews = [...galleryPreviews];
    const p = previews[index];
    if (p) {
      try { URL.revokeObjectURL(p); } catch (e) { }
    }
    files.splice(index, 1);
    previews.splice(index, 1);
    setGalleryFiles(files);
    setGalleryPreviews(previews);
  };

  const removeSelectedMainFile = () => {
    if (mainImagePreview) {
      try { URL.revokeObjectURL(mainImagePreview); } catch (e) { }
    }
    setMainImageFile(null);
    setMainImagePreview('');
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
      anh_dai_dien: '',
      anh_phu: [],
      trang_thai: true
    });
    setLocationImageFile(null);
    setLocationGalleryFiles([]);
    setLocationImagePreview('');
    setLocationGalleryPreviews([]);
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
      'bao_tri': 'secondary',
      'dinh_chi': 'destructive'
    };

    const labels: any = {
      'trong': 'Trống',
      'dang_dung': 'Đang dùng',
      'sap_nhan': 'Sắp nhận',
      'sap_tra': 'Sắp trả',
      'bao_tri': 'Bảo trì',
      'dinh_chi': 'Đình chỉ'
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
                                  anh_chinh: room.anh_chinh || '',
                                  anh_phu: room.anh_phu || [],
                                  ghi_chu: room.ghi_chu || ''
                                });
                                // populate previews from existing urls
                                setMainImageFile(null);
                                setGalleryFiles([]);
                                setMainImagePreview(room.anh_chinh || '');
                                setGalleryPreviews(room.anh_phu || []);
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
                            onClick={() => handleDeleteConceptClick(concept)}
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
                    <TableHead>Ảnh</TableHead>
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
                      <TableCell>
                        <img
                          src={location.anh_dai_dien || getLocationImage(location.id)}
                          alt={location.ten_co_so}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </TableCell>
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
                                anh_dai_dien: location.anh_dai_dien || '',
                                anh_phu: location.anh_phu || [],
                                trang_thai: location.trang_thai
                              });
                              setLocationImageFile(null);
                              setLocationGalleryFiles([]);
                              setLocationImagePreview('');
                              setLocationGalleryPreviews([]);
                              setEditMode(true);
                              setShowLocationDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocationClick(location)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Cập nhật thông tin phòng' : 'Thêm phòng mới vào hệ thống'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Thông tin cơ bản</h3>
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
                <Select value={roomForm.id_loai_phong} onValueChange={(v: string) => setRoomForm({ ...roomForm, id_loai_phong: v })}>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Trạng thái</Label>
                  <Select value={roomForm.trang_thai} onValueChange={(v: string) => setRoomForm({ ...roomForm, trang_thai: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trong">Trống</SelectItem>
                      <SelectItem value="dang_dung">Đang dùng</SelectItem>
                      <SelectItem value="sap_nhan">Sắp nhận</SelectItem>
                      <SelectItem value="sap_tra">Sắp trả</SelectItem>
                      <SelectItem value="bao_tri">Bảo trì</SelectItem>
                      <SelectItem value="dinh_chi">Đình chỉ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vệ sinh</Label>
                  <Select value={roomForm.tinh_trang_vesinh} onValueChange={(v: string) => setRoomForm({ ...roomForm, tinh_trang_vesinh: v })}>
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
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  value={roomForm.ghi_chu}
                  onChange={(e) => setRoomForm({ ...roomForm, ghi_chu: e.target.value })}
                  placeholder="Thông tin thêm về phòng..."
                  rows={3}
                />
              </div>
            </div>

            {/* Right Column - Hình ảnh */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Hình ảnh</h3>

              {/* Ảnh chính */}
              <div>
                <Label className="mb-2 block">Ảnh chính</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="main-image-upload"
                    onChange={(e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setMainImageFile(file);
                        if (mainImagePreview) { try { URL.revokeObjectURL(mainImagePreview); } catch (e) { } }
                        setMainImagePreview(URL.createObjectURL(file));
                        if (roomForm.anh_chinh) setRoomForm({ ...roomForm, anh_chinh: '' });
                      } else {
                        setMainImageFile(null);
                        if (mainImagePreview) { try { URL.revokeObjectURL(mainImagePreview); } catch (e) { } }
                        setMainImagePreview('');
                      }
                    }}
                  />
                  {mainImagePreview || roomForm.anh_chinh ? (
                    <div className="relative">
                      <img
                        src={mainImagePreview || roomForm.anh_chinh}
                        alt="Main"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg"
                        onClick={() => mainImagePreview ? removeSelectedMainFile() : removeExistingMainImage()}
                        type="button"
                      >
                        ✕
                      </button>
                      <label
                        htmlFor="main-image-upload"
                        className="absolute bottom-2 right-2 bg-white text-gray-700 px-3 py-1 rounded-md text-xs cursor-pointer hover:bg-gray-100 shadow"
                      >
                        Đổi ảnh
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="main-image-upload" className="flex flex-col items-center justify-center h-40 cursor-pointer">
                      <div className="text-gray-400 text-center">
                        <svg className="mx-auto h-12 w-12 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm">Click để chọn ảnh chính</p>
                        <p className="text-xs mt-1">PNG, JPG tối đa 10MB</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Ảnh phụ */}
              <div>
                <Label className="mb-2 block">Ảnh phụ (Gallery)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="gallery-upload"
                    onChange={(e: any) => {
                      const files = Array.from(e.target.files || []) as File[];
                      if (files.length > 0) {
                        // Thêm vào danh sách hiện có thay vì thay thế
                        const newFiles = [...galleryFiles, ...files];
                        const newPreviews = files.map((f) => URL.createObjectURL(f));
                        setGalleryFiles(newFiles);
                        setGalleryPreviews([...galleryPreviews, ...newPreviews]);
                      }
                      // Reset input để có thể chọn cùng file lần nữa
                      e.target.value = '';
                    }}
                  />

                  {/* Display existing and new images */}
                  {(roomForm.anh_phu?.length > 0 || galleryPreviews.length > 0) ? (
                    <div className="grid grid-cols-3 gap-2">
                      {/* Existing stored images */}
                      {roomForm.anh_phu?.map((url, idx) => (
                        <div key={`stored-${idx}`} className="relative group">
                          <img src={url} alt={`Stored ${idx}`} className="w-full h-20 object-cover rounded" />
                          <button
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            onClick={() => removeExistingGalleryImage(url)}
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {/* New previews */}
                      {galleryPreviews.map((p, i) => (
                        <div key={`preview-${i}`} className="relative group">
                          <img src={p} alt={`Preview ${i}`} className="w-full h-20 object-cover rounded" />
                          <button
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            onClick={() => removeSelectedGalleryFile(i)}
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <label htmlFor="gallery-upload" className="flex flex-col items-center justify-center h-32 cursor-pointer">
                      <div className="text-gray-400 text-center">
                        <svg className="mx-auto h-10 w-10 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm">Click để chọn nhiều ảnh</p>
                        <p className="text-xs mt-1">Có thể chọn nhiều file</p>
                      </div>
                    </label>
                  )}

                  {(roomForm.anh_phu?.length > 0 || galleryPreviews.length > 0) && (
                    <label
                      htmlFor="gallery-upload"
                      className="block mt-3 text-center bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm cursor-pointer hover:bg-gray-200"
                    >
                      + Thêm ảnh
                    </label>
                  )}
                </div>
              </div>
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
              <Select value={conceptForm.id_co_so} onValueChange={(v: string) => setConceptForm({ ...conceptForm, id_co_so: v })}>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Cập nhật thông tin cơ sở' : 'Thêm địa điểm cơ sở mới'}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
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
                    className="min-h-[120px]"
                    placeholder="Mô tả về cơ sở, vị trí, tiện ích..."
                  />
                </div>
              </div>

              {/* Right Column - Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div>
                  <Label>Ảnh đại diện cơ sở</Label>
                  <div className="mt-2">
                    {locationImagePreview || locationForm.anh_dai_dien ? (
                      <div className="relative border rounded-lg p-2 bg-gray-50">
                        <img
                          src={locationImagePreview || locationForm.anh_dai_dien}
                          alt="Cơ sở"
                          className="w-full h-48 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLocationImageFile(null);
                            setLocationImagePreview('');
                            setLocationForm({ ...locationForm, anh_dai_dien: '' });
                          }}
                          className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all h-48">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600">Tải ảnh đại diện</span>
                        <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Max 10MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error('Kích thước ảnh không được vượt quá 10MB');
                                return;
                              }
                              setLocationImageFile(file);
                              const url = URL.createObjectURL(file);
                              setLocationImagePreview(url);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <Label>Ảnh gallery cơ sở</Label>
                  <div className="mt-2 space-y-2">
                    {/* Existing images */}
                    {locationForm.anh_phu && locationForm.anh_phu.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {locationForm.anh_phu.map((url, idx) => (
                          <div key={idx} className="relative border rounded-lg p-1 bg-gray-50 group">
                            <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => {
                                const newList = locationForm.anh_phu.filter((_, i) => i !== idx);
                                setLocationForm({ ...locationForm, anh_phu: newList });
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New selected files preview */}
                    {locationGalleryPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {locationGalleryPreviews.map((url, idx) => (
                          <div key={idx} className="relative border-2 rounded-lg p-1 border-blue-400 bg-blue-50 group">
                            <img src={url} alt={`New ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => {
                                const files = [...locationGalleryFiles];
                                const previews = [...locationGalleryPreviews];
                                try { URL.revokeObjectURL(previews[idx]); } catch (e) { }
                                files.splice(idx, 1);
                                previews.splice(idx, 1);
                                setLocationGalleryFiles(files);
                                setLocationGalleryPreviews(previews);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-sm font-medium text-gray-600">Thêm ảnh gallery</span>
                      <span className="text-xs text-gray-400">Có thể chọn nhiều ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;

                          const validFiles: File[] = [];
                          for (const file of files) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error(`${file.name} vượt quá 10MB`);
                              continue;
                            }
                            validFiles.push(file);
                          }

                          if (validFiles.length > 0) {
                            setLocationGalleryFiles([...locationGalleryFiles, ...validFiles]);
                            const newPreviews = validFiles.map(f => URL.createObjectURL(f));
                            setLocationGalleryPreviews([...locationGalleryPreviews, ...newPreviews]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xác nhận xóa {deleteTarget?.type === 'room' ? 'phòng' : deleteTarget?.type === 'concept' ? 'loại phòng' : 'cơ sở'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa {deleteTarget?.type === 'room' ? 'phòng' : deleteTarget?.type === 'concept' ? 'loại phòng' : 'cơ sở'} <strong>"{deleteTarget?.name}"</strong>?
              <br /><br />
              {deleteTarget?.type === 'room' && (
                <span className="text-amber-600">⚠️ Lưu ý: Nếu phòng có giao dịch, sẽ chuyển sang trạng thái đình chỉ thay vì xóa.</span>
              )}
              {deleteTarget?.type !== 'room' && (
                <span className="text-red-600">⚠️ Hành động này không thể hoàn tác!</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
