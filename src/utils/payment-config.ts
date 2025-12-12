// Payment configuration
import paymentQrImage from '../assets/payment-qr.jpg';

export const PAYMENT_CONFIG = {
    bankAccount: '4860557154',
    bankName: 'BIDV',
    bankCode: '970488', // BIDV bin code
    accountName: 'VU QUANG ANH',

    // Fixed QR code image URL - imported as asset for Vite build
    qrImageUrl: paymentQrImage,

    // Generate payment description
    generateDescription: (bookingCode: string) => {
        return `Thanh toan ${bookingCode}`;
    }
};
