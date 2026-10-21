# Payment System Setup Guide

## Overview

Flash AI now includes a complete payment system that allows users to upgrade their plans by paying via UPI or Net Banking. The system includes:

- **Payment Page**: Users can submit payment requests with screenshots
- **Admin Verification**: Admins can review and approve/reject payments
- **Auto Plan Upgrade**: Users automatically get upgraded upon payment approval
- **Payment History**: Complete tracking of all payment requests

## Payment Configuration

### Step 1: Update Payment Details

Edit the file: `src/config/payment.ts`

```typescript
export const PAYMENT_CONFIG = {
  upi: {
    id: 'yourname@upi',              // ← Update with your UPI ID
    name: 'Your Name',                // ← Update with your name
    qrCode: '/payment-qr.png',        // Optional: Add QR code image
  },
  netbanking: {
    accountName: 'Your Company Name', // ← Update with account name
    accountNumber: '1234567890',      // ← Update with account number
    ifscCode: 'BANK0001234',          // ← Update with IFSC code
    bankName: 'Your Bank Name',       // ← Update with bank name
    branch: 'Main Branch',            // ← Update with branch name
  },
  plans: {
    pro: {
      price: 499,                     // ← Update Pro plan price
      currency: '₹',
      duration: 'month',
    },
    business: {
      price: 999,                     // ← Update Business plan price
      currency: '₹',
      duration: 'month',
    },
  },
};
```

### Step 2: Add UPI QR Code (Optional)

If you want to display a UPI QR code:

1. Generate your UPI QR code
2. Save it as `payment-qr.png` in the `public` folder
3. The payment page will automatically display it

## How It Works

### For Users

1. **Select a Plan**: User clicks "Subscribe" on Pro or Business plan
2. **Choose Payment Method**: Select UPI or Net Banking
3. **View Payment Details**: Copy UPI ID or bank account details
4. **Make Payment**: Complete payment using their preferred app
5. **Upload Screenshot**: Upload proof of payment (max 1MB, JPEG/PNG)
6. **Submit Request**: Payment request is sent to admin for verification
7. **Wait for Approval**: Admin reviews and approves within 24 hours
8. **Auto Upgrade**: Plan is automatically upgraded upon approval

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` (admin role required)
2. **Payment Verification Tab**: Click on "Payment Verification" tab
3. **Review Pending Payments**: See all pending payment requests
4. **View Screenshot**: Click "Review" to see payment proof
5. **Verify Details**: Check user info, amount, and screenshot
6. **Approve/Reject**: 
   - **Approve**: User's plan is upgraded automatically
   - **Reject**: Add notes explaining why (user is notified)
7. **Payment History**: View all processed payments

## Database Structure

The payment system uses the following database tables:

### payment_requests Table

```sql
- id: UUID (primary key)
- user_id: UUID (references profiles)
- plan_id: TEXT (pro, business)
- payment_method: TEXT (upi, netbanking)
- screenshot_url: TEXT (Supabase Storage URL)
- amount: NUMERIC
- status: TEXT (pending, approved, rejected)
- admin_notes: TEXT (optional)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Storage Bucket

- **Bucket Name**: `app-7r35kmgp19mp_payment_screenshots`
- **Purpose**: Store payment screenshot images
- **Max File Size**: 1MB per image
- **Allowed Formats**: JPEG, PNG
- **Access**: Public read (for admin verification)

## Security Features

1. **File Validation**: 
   - Max size: 1MB
   - Allowed formats: JPEG, PNG only
   - Filename sanitization

2. **Admin-Only Verification**: 
   - Only users with admin role can approve/reject
   - All actions are logged with timestamps

3. **Secure Storage**: 
   - Screenshots stored in Supabase Storage
   - Public URLs for admin review only

4. **Automatic Plan Upgrade**: 
   - Plan upgrade happens atomically with approval
   - No manual intervention needed

## Testing the Payment Flow

### Test as Regular User

1. Login with a regular user account
2. Go to Plans page (`/plans`)
3. Click "Subscribe" on Pro or Business plan
4. Select payment method (UPI or Net Banking)
5. Upload a test screenshot
6. Submit payment request
7. Check that you see a success message

### Test as Admin

1. Login with admin account (admin@flashai.com / AdminFlash2024!)
2. Go to Admin panel (`/admin`)
3. Click "Payment Verification" tab
4. You should see the pending payment request
5. Click "Review" to view details
6. Add admin notes (optional)
7. Click "Approve Payment"
8. Verify that user's plan is upgraded

## Customization Options

### Change Plan Prices

Edit `src/config/payment.ts`:

```typescript
plans: {
  pro: {
    price: 999,  // Change to your price
    currency: '₹',
    duration: 'month',
  },
}
```

### Add More Payment Methods

To add more payment methods:

1. Update `PaymentMethod` type in `src/types/types.ts`
2. Add new method in payment config
3. Update Payment page UI to show new method
4. Update database enum if needed

### Customize Approval Workflow

Edit `src/db/api.ts` - `paymentsApi.approvePayment()`:

```typescript
// Add custom logic before/after approval
// Example: Send email notification
// Example: Add bonus features
// Example: Log to analytics
```

## Troubleshooting

### Payment Screenshot Upload Fails

**Problem**: User can't upload screenshot

**Solutions**:
- Check file size (must be < 1MB)
- Check file format (must be JPEG or PNG)
- Verify Supabase Storage bucket exists
- Check bucket permissions

### Admin Can't See Payments

**Problem**: Admin panel doesn't show payments

**Solutions**:
- Verify user has admin role in database
- Check RLS policies on payment_requests table
- Verify database connection

### Plan Not Upgrading After Approval

**Problem**: User's plan doesn't change after approval

**Solutions**:
- Check `approvePayment` function in `src/db/api.ts`
- Verify profiles table update permissions
- Check browser console for errors

## Important Notes

⚠️ **Before Going Live**:

1. ✅ Update all payment details in `src/config/payment.ts`
2. ✅ Test the complete payment flow
3. ✅ Verify admin can approve/reject payments
4. ✅ Check that plan upgrades work correctly
5. ✅ Add your actual UPI ID and bank details
6. ✅ Set correct plan prices
7. ✅ Test with real payment screenshots

## Support

For issues or questions about the payment system:

1. Check this guide first
2. Review the code in:
   - `src/pages/Payment.tsx` - Payment page
   - `src/components/admin/PaymentVerification.tsx` - Admin panel
   - `src/db/api.ts` - Payment API functions
   - `src/config/payment.ts` - Payment configuration

---

**Status**: ✅ Payment System Fully Implemented
**Version**: 2.0.0
**Last Updated**: 2025-11-23
