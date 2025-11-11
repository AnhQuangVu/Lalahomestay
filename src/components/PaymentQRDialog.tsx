import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Copy, Check, Download } from 'lucide-react';
import { PAYMENT_CONFIG } from '../utils/payment-config';
import { toast } from 'sonner';

interface PaymentQRDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingCode: string;
    amount: number;
    bookingDetails?: {
        roomName?: string;
        checkIn?: string;
        checkOut?: string;
    };
}

export default function PaymentQRDialog({
    open,
    onOpenChange,
    bookingCode,
    amount,
    bookingDetails
}: PaymentQRDialogProps) {
    const [copiedContent, setCopiedContent] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState(false);

    const paymentDescription = PAYMENT_CONFIG.generateDescription(bookingCode);
    // Use fixed QR code image
    const qrUrl = PAYMENT_CONFIG.qrImageUrl;

    const handleCopyContent = () => {
        navigator.clipboard.writeText(paymentDescription);
        setCopiedContent(true);
        toast.success('Đã copy nội dung chuyển khoản');
        setTimeout(() => setCopiedContent(false), 2000);
    };

    const handleCopyAccount = () => {
        navigator.clipboard.writeText(PAYMENT_CONFIG.bankAccount);
        setCopiedAccount(true);
        toast.success('Đã copy số tài khoản');
        setTimeout(() => setCopiedAccount(false), 2000);
    };

    const handleDownloadQR = async () => {
        try {
            // For local images, we can use a simpler approach
            const link = document.createElement('a');
            link.href = qrUrl;
            link.download = `QR-${bookingCode}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Đã tải QR code thành công!');
        } catch (error) {
            console.error('Error downloading QR:', error);
            toast.error('Không thể tải QR code. Vui lòng chụp màn hình.');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">✅ Đặt phòng thành công!</DialogTitle>
                    <DialogDescription>
                        Vui lòng chuyển khoản để hoàn tất đặt phòng
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Booking Info */}
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã đặt phòng:</span>
                                    <span className="font-semibold font-mono">{bookingCode}</span>
                                </div>
                                {bookingDetails?.roomName && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Phòng:</span>
                                        <span className="font-semibold">{bookingDetails.roomName}</span>
                                    </div>
                                )}
                                {bookingDetails?.checkIn && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nhận phòng:</span>
                                        <span className="font-semibold">{bookingDetails.checkIn}</span>
                                    </div>
                                )}
                                {bookingDetails?.checkOut && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Trả phòng:</span>
                                        <span className="font-semibold">{bookingDetails.checkOut}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Code */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-2">Quét mã QR để thanh toán</h3>
                            <p className="text-sm text-gray-600">
                                Mở app ngân hàng và quét mã QR bên dưới
                            </p>
                        </div>

                        <Card className="p-4 bg-white">
                            <img
                                src={qrUrl}
                                alt="QR Code"
                                className="w-64 h-64 object-contain"
                                onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect fill="%23f0f0f0" width="256" height="256"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3EKhông thể tải QR%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        </Card>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadQR}
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Tải QR Code
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(qrUrl, '_blank')}
                                className="gap-2"
                            >
                                🔗 Xem ảnh gốc
                            </Button>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-semibold text-lg mb-4">Thông tin chuyển khoản</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <div>
                                        <div className="text-sm text-gray-600">Ngân hàng</div>
                                        <div className="font-semibold">{PAYMENT_CONFIG.bankName}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <div>
                                        <div className="text-sm text-gray-600">Số tài khoản</div>
                                        <div className="font-semibold font-mono">{PAYMENT_CONFIG.bankAccount}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyAccount}
                                        className="gap-2"
                                    >
                                        {copiedAccount ? (
                                            <>
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span className="text-green-500">Đã copy</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <div>
                                        <div className="text-sm text-gray-600">Chủ tài khoản</div>
                                        <div className="font-semibold">{PAYMENT_CONFIG.accountName}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                                    <div>
                                        <div className="text-sm text-gray-600">Số tiền</div>
                                        <div className="font-bold text-lg text-blue-600">{formatCurrency(amount)}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-200">
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-600 mb-1">Nội dung chuyển khoản</div>
                                        <div className="font-semibold font-mono text-yellow-800">{paymentDescription}</div>
                                        <div className="text-xs text-yellow-600 mt-1">
                                            ⚠️ Vui lòng ghi chính xác nội dung này
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyContent}
                                        className="gap-2 ml-2"
                                    >
                                        {copiedContent ? (
                                            <>
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span className="text-green-500">Đã copy</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Instructions */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <h4 className="font-semibold mb-3 text-blue-900">📌 Lưu ý quan trọng:</h4>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li>✓ Vui lòng chuyển khoản <strong>đúng số tiền</strong> và <strong>đúng nội dung</strong></li>
                                <li>✓ Sau khi chuyển khoản, đặt phòng của bạn sẽ được xác nhận trong vòng <strong>15-30 phút</strong></li>
                                <li>✓ Bạn có thể tra cứu trạng thái đặt phòng bằng mã: <strong>{bookingCode}</strong></li>
                                <li>✓ Nếu có thắc mắc, vui lòng liên hệ: <strong>0123456789</strong></li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Đóng
                        </Button>
                        <Button
                            onClick={() => {
                                window.location.href = '/lookup';
                            }}
                            className="flex-1"
                        >
                            Tra cứu đặt phòng
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
