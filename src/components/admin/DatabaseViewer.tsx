import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, Download, Database } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

export function DatabaseViewer() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('co-so');

  // State for all tables
  const [coSo, setCoSo] = useState<any[]>([]);
  const [loaiPhong, setLoaiPhong] = useState<any[]>([]);
  const [phong, setPhong] = useState<any[]>([]);
  const [khachHang, setKhachHang] = useState<any[]>([]);
  const [datPhong, setDatPhong] = useState<any[]>([]);
  const [thanhToan, setThanhToan] = useState<any[]>([]);
  const [taiKhoan, setTaiKhoan] = useState<any[]>([]);
  const [phanHoi, setPhanHoi] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  const fetchData = async (endpoint: string, setter: Function) => {
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setter(result.data || []);
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchData('co-so', setCoSo),
        fetchData('loai-phong', setLoaiPhong),
        fetchData('phong', setPhong),
        fetchData('khach-hang', setKhachHang),
        fetchData('dat-phong', setDatPhong),
        fetchData('thanh-toan', setThanhToan),
        fetchData('tai-khoan', setTaiKhoan),
        fetchData('phan-hoi', setPhanHoi),
        fetchData('admin/statistics', setStatistics)
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'object' ? JSON.stringify(val) : val
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Database className="w-8 h-8" />
            Xem Dữ Liệu Database
          </h1>
          <p className="text-gray-600 mt-2">
            Hiển thị tất cả dữ liệu từ các bảng PostgreSQL trong Supabase
          </p>
        </div>
        <Button onClick={loadAllData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tổng đặt phòng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{statistics.totalBookings}</div>
              <p className="text-xs text-gray-600 mt-1">
                {statistics.confirmedBookings} hoàn tất, {statistics.cancelledBookings} hủy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tổng doanh thu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{formatCurrency(statistics.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tỷ lệ lấp đầy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{statistics.occupancyRate}%</div>
              <p className="text-xs text-gray-600 mt-1">
                {statistics.occupiedRooms}/{statistics.totalRooms} phòng
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tổng khách hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{statistics.totalCustomers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Tables */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
              <TabsTrigger value="co-so">Cơ sở</TabsTrigger>
              <TabsTrigger value="loai-phong">Loại phòng</TabsTrigger>
              <TabsTrigger value="phong">Phòng</TabsTrigger>
              <TabsTrigger value="khach-hang">Khách hàng</TabsTrigger>
              <TabsTrigger value="dat-phong">Đặt phòng</TabsTrigger>
              <TabsTrigger value="thanh-toan">Thanh toán</TabsTrigger>
              <TabsTrigger value="tai-khoan">Tài khoản</TabsTrigger>
              <TabsTrigger value="phan-hoi">Phản hồi</TabsTrigger>
            </TabsList>

            {/* Cơ sở */}
            <TabsContent value="co-so" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3>Bảng: co_so ({coSo.length} bản ghi)</h3>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(coSo, 'co_so')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tên cơ sở</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Hotline</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coSo.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.ten_co_so}</TableCell>
                        <TableCell>{item.dia_chi}</TableCell>
                        <TableCell>{item.hotline}</TableCell>
                        <TableCell>{item.mo_ta || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={item.trang_thai ? 'default' : 'secondary'}>
                            {item.trang_thai ? 'Hoạt động' : 'Không'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Loại phòng */}
            <TabsContent value="loai-phong" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3>Bảng: loai_phong ({loaiPhong.length} bản ghi)</h3>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(loaiPhong, 'loai_phong')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tên loại</TableHead>
                      <TableHead>Cơ sở</TableHead>
                      <TableHead>Giá giờ</TableHead>
                      <TableHead>Giá ngày</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loaiPhong.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.ten_loai}</TableCell>
                        <TableCell>{item.co_so?.ten_co_so || '-'}</TableCell>
                        <TableCell>{formatCurrency(item.gia_gio)}</TableCell>
                        <TableCell>{formatCurrency(item.gia_dem)}</TableCell>
                        <TableCell>{item.mo_ta || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={item.trang_thai ? 'default' : 'secondary'}>
                            {item.trang_thai ? 'Hoạt động' : 'Không'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Phòng */}
            <TabsContent value="phong" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3>Bảng: phong ({phong.length} bản ghi)</h3>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(phong, 'phong')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Mã phòng</TableHead>
                      <TableHead>Loại phòng</TableHead>
                      <TableHead>Cơ sở</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Vệ sinh</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phong.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.ma_phong}</TableCell>
                        <TableCell>{item.loai_phong?.ten_loai || '-'}</TableCell>
                        <TableCell>{item.loai_phong?.co_so?.ten_co_so || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.trang_thai === 'trong' ? 'default' :
                              item.trang_thai === 'dang_dung' ? 'destructive' :
                                'secondary'
                          }>
                            {item.trang_thai}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.tinh_trang_vesinh}</TableCell>
                        <TableCell>{item.ghi_chu || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Khách hàng */}
            <TabsContent value="khach-hang" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3>Bảng: khach_hang ({khachHang.length} bản ghi)</h3>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(khachHang, 'khach_hang')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>SĐT</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {khachHang.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.ho_ten}</TableCell>
                        <TableCell>{item.sdt}</TableCell>
                        <TableCell>{item.email || '-'}</TableCell>
                        <TableCell>{item.dia_chi || '-'}</TableCell>
                        <TableCell>{item.ghi_chu || '-'}</TableCell>
                        <TableCell>{formatDateTime(item.ngay_tao)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Đặt phòng */}
            <TabsContent value="dat-phong" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3>Bảng: dat_phong ({datPhong.length} bản ghi)</h3>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(datPhong, 'dat_phong')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Mã đặt</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Phòng</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Số khách</TableHead>
                      <TableHead>Kênh đặt</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Cọc CSVC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datPhong.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.ma_dat}</TableCell>
                        <TableCell>{item.khach_hang?.ho_ten || '-'}</TableCell>
                        <TableCell>{item.phong?.ma_phong || '-'}</TableCell>
                        <TableCell>{formatDateTime(item.thoi_gian_nhan)}</TableCell>
                        <TableCell>{formatDateTime(item.thoi_gian_tra)}</TableCell>
                        <TableCell>{item.so_khach}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.kenh_dat}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            item.trang_thai === 'checkout' ? 'default' :
                              item.trang_thai === 'da_huy' ? 'destructive' :
                                'secondary'
                          }>
                            {item.trang_thai}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(item.tong_tien)}</TableCell>
                        <TableCell>{formatCurrency(item.coc_csvc)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Thanh toán */}
            <TabsContent value="thanh-toan" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3>Bảng: thanh_toan ({thanhToan.length} bản ghi)</h3>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(thanhToan, 'thanh_toan')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Mã đặt phòng</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Ngày TT</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {thanhToan.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.dat_phong?.ma_dat || '-'}</TableCell>
                        <TableCell>{item.dat_phong?.khach_hang?.ho_ten || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.phuong_thuc}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(item.so_tien)}</TableCell>
                        <TableCell>{formatDateTime(item.ngay_tt)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.trang_thai === 'thanh_cong' ? 'default' :
                              item.trang_thai === 'that_bai' ? 'destructive' :
                                'secondary'
                          }>
                            {item.trang_thai}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Tài khoản */}
            <TabsContent value="tai-khoan" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3>Bảng: tai_khoan ({taiKhoan.length} bản ghi)</h3>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(taiKhoan, 'tai_khoan')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>SĐT</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taiKhoan.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.ho_ten}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.sdt || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.vai_tro === 'quan_tri' ? 'default' :
                              item.vai_tro === 'le_tan' ? 'secondary' :
                                'outline'
                          }>
                            {item.vai_tro}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.trang_thai ? 'default' : 'secondary'}>
                            {item.trang_thai ? 'Hoạt động' : 'Không'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(item.ngay_tao)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Phản hồi */}
            <TabsContent value="phan-hoi" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3>Bảng: phan_hoi ({phanHoi.length} bản ghi)</h3>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(phanHoi, 'phan_hoi')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Đánh giá</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phanHoi.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.khach_hang?.ho_ten || '-'}</TableCell>
                        <TableCell className="max-w-md truncate">{item.noi_dung}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={i < item.danh_gia ? 'text-yellow-500' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(item.ngay_gui)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
