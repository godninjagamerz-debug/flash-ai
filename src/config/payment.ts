export const PAYMENT_CONFIG = {
  upi: {
    id: 'yourname@upi',
    name: 'Your Name',
    qrCode: '/payment-qr.png', // Optional: Add QR code image
  },
  netbanking: {
    accountName: 'Your Company Name',
    accountNumber: '1234567890',
    ifscCode: 'BANK0001234',
    bankName: 'Your Bank Name',
    branch: 'Main Branch',
  },
  plans: {
    pro: {
      price: 499,
      currency: '₹',
      duration: 'month',
    },
    business: {
      price: 999,
      currency: '₹',
      duration: 'month',
    },
  },
};
