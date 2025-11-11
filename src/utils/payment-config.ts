// Payment configuration
export const PAYMENT_CONFIG = {
    bankAccount: '4860557154',
    bankName: 'BIDV',
    bankCode: '970488', // BIDV bin code
    accountName: 'VU QUANG ANH',

    // VietQR template
    qrTemplate: 'compact2', // compact, compact2, qr_only, print

    // Generate VietQR URL
    generateQRUrl: (amount: number, description: string) => {
        const baseUrl = 'https://img.vietqr.io/image';
        const { bankCode, bankAccount, qrTemplate, accountName } = PAYMENT_CONFIG;

        // Format: https://img.vietqr.io/image/{BANK_CODE}-{ACCOUNT_NO}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={DESCRIPTION}&accountName={ACCOUNT_NAME}
        const qrUrl = `${baseUrl}/${bankCode}-${bankAccount}-${qrTemplate}.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

        return qrUrl;
    },

    // Generate payment description
    generateDescription: (bookingCode: string) => {
        return `Thanh toan ${bookingCode}`;
    }
};
