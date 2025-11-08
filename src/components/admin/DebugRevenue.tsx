import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { RefreshCw, Bug } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-faeb1932`;

export function DebugRevenue() {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/debug/revenue`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setDebugData(result.debug);
        console.log('🐛 DEBUG REVENUE DATA:', result.debug);
      } else {
        console.error('Debug error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

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
      'checkin': 'outline',
      'checkout': 'secondary',
      'da_huy': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (!debugData) {
    return (
      <div className="p-6">
        <Button onClick={fetchDebugData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Tải Debug Data
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Bug className="w-8 h-8" />
            Debug Doanh Thu
          </h1>
          <p className="text-gray-600 mt-2">
            Chi tiết tính toán doanh thu từ database
          </p>
        </div>
        <Button onClick={fetchDebugData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tổng tất cả đơn (kể cả hủy)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(debugData.revenue.total_all_bookings)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {debugData.total_bookings} đơn đặt phòng
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Doanh thu thực (loại trừ hủy)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(debugData.revenue.total_exclude_cancelled)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {debugData.total_bookings - debugData.status_count.da_huy} đơn hợp lệ
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tổng đơn hủy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(debugData.revenue.total_cancelled_bookings_only)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {debugData.status_count.da_huy} đơn đã hủy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bố theo trạng thái</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl">{debugData.status_count.da_coc}</div>
              <div className="text-sm text-gray-600 mt-1">Đã cọc</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl">{debugData.status_count.da_tt}</div>
              <div className="text-sm text-gray-600 mt-1">Đã thanh toán</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl">{debugData.status_count.checkin}</div>
              <div className="text-sm text-gray-600 mt-1">Check-in</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl">{debugData.status_count.checkout}</div>
              <div className="text-sm text-gray-600 mt-1">Check-out</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-2xl text-red-600">{debugData.status_count.da_huy}</div>
              <div className="text-sm text-red-600 mt-1">Đã hủy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết từng đơn đặt phòng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đặt</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead className="text-right">Cọc CSVC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debugData.bookings_detail.map((booking: any, idx: number) => (
                  <TableRow key={idx} className={booking.trang_thai === 'da_huy' ? 'bg-red-50' : ''}>
                    <TableCell className="font-mono text-xs">{booking.ma_dat}</TableCell>
                    <TableCell>{booking.khach}</TableCell>
                    <TableCell>{booking.phong}</TableCell>
                    <TableCell>{booking.ngay}</TableCell>
                    <TableCell>{getStatusBadge(booking.trang_thai)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(booking.tong_tien)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(booking.coc_csvc)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Explanation */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">📊 Giải thích tính toán</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            <strong>Tổng tất cả đơn:</strong> Sum của tong_tien từ tất cả các đơn (kể cả đã hủy)
          </div>
          <div>
            <strong>Doanh thu thực:</strong> Sum của tong_tien từ các đơn có trang_thai !== 'da_huy'
          </div>
          <div className="pt-2 border-t border-blue-200">
            <strong>✅ Công thức đúng:</strong>
            <code className="block mt-1 p-2 bg-white rounded">
              {`totalRevenue = bookings.filter(b => b.trang_thai !== 'da_huy').reduce((sum, b) => sum + b.tong_tien, 0)`}
            </code>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            💡 Nếu bạn thấy số liệu khác nhau giữa các màn hình, có thể do:
            <ul className="list-disc ml-5 mt-1">
              <li>Đang tính cả cọc CSVC (500.000đ/đơn)</li>
              <li>Đang sum từ bảng thanh_toan thay vì dat_phong</li>
              <li>Filter trạng thái sai (vd: 'huy' thay vì 'da_huy')</li>
              <li>Có filter theo ngày khác nhau</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
