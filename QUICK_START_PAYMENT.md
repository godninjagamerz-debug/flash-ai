# 🚀 Quick Start: Payment System

## ⚡ 3-Minute Setup

### Step 1: Update Payment Details (2 minutes)

Open `src/config/payment.ts` and replace with your details:

```typescript
export const PAYMENT_CONFIG = {
  upi: {
    id: 'yourname@paytm',           // ← YOUR UPI ID HERE
    name: 'John Doe',                // ← YOUR NAME HERE
  },
  netbanking: {
    accountName: 'Flash AI Pvt Ltd', // ← YOUR COMPANY NAME
    accountNumber: '9876543210',     // ← YOUR ACCOUNT NUMBER
    ifscCode: 'HDFC0001234',         // ← YOUR IFSC CODE
    bankName: 'HDFC Bank',           // ← YOUR BANK NAME
    branch: 'Mumbai Main',           // ← YOUR BRANCH
  },
  plans: {
    pro: {
      price: 499,                    // ← PRO PLAN PRICE
      currency: '₹',
      duration: 'month',
    },
    business: {
      price: 999,                    // ← BUSINESS PLAN PRICE
      currency: '₹',
      duration: 'month',
    },
  },
};
```

### Step 2: Test It (1 minute)

**Test as User:**
```
1. Login as regular user
2. Go to /plans
3. Click "Subscribe" on Pro plan
4. You'll see your payment details!
```

**Test as Admin:**
```
1. Login as admin (admin@flashai.com / AdminFlash2024!)
2. Go to /admin
3. Click "Payment Verification" tab
4. Review and approve payments
```

## 🎯 That's It!

Your payment system is now live and ready to accept payments!

## 📱 User Flow

```
User clicks "Subscribe" 
    ↓
Sees payment page with your UPI/Bank details
    ↓
Makes payment in their app
    ↓
Uploads screenshot
    ↓
Submits request
    ↓
Admin approves
    ↓
User's plan upgraded automatically! 🎉
```

## 🔧 Common Customizations

### Change Prices
```typescript
// In src/config/payment.ts
plans: {
  pro: { price: 999 },      // Change to any amount
  business: { price: 1999 }, // Change to any amount
}
```

### Add WhatsApp Support
```typescript
// In src/config/payment.ts
upi: {
  id: 'yourname@paytm',
  name: 'Your Name',
  whatsapp: '+919876543210',  // Add this line
}
```

Then update `src/pages/Payment.tsx` to display WhatsApp number.

## 🎨 Features Included

✅ UPI Payment Support
✅ Net Banking Support
✅ Screenshot Upload (max 1MB)
✅ Copy-to-Clipboard for payment details
✅ Admin Verification Panel
✅ Automatic Plan Upgrade
✅ Payment History Tracking
✅ Email/Username Display
✅ Status Badges (Pending/Approved/Rejected)
✅ Admin Notes System
✅ Responsive Design
✅ Dark Mode Support

## 🔒 Security

✅ File size validation (1MB max)
✅ File type validation (JPEG/PNG only)
✅ Admin-only approval
✅ Secure storage in Supabase
✅ Atomic plan upgrades
✅ Complete audit trail

## 📊 Admin Panel Features

- **Pending Queue**: See all payments awaiting review
- **Screenshot Viewer**: Full-size image preview
- **User Details**: Name, email, plan, amount
- **One-Click Actions**: Approve or reject instantly
- **Admin Notes**: Add notes for record-keeping
- **Payment History**: View all past payments
- **Status Filters**: Pending, Approved, Rejected

## 💡 Pro Tips

1. **Test First**: Always test with a small amount first
2. **Clear Instructions**: Tell users to include their email in payment notes
3. **Quick Approval**: Approve payments within 24 hours for best UX
4. **Add Notes**: Always add notes when rejecting payments
5. **Monitor Daily**: Check the admin panel daily for new requests

## 🆘 Need Help?

Check these files:
- `PAYMENT_SETUP.md` - Detailed setup guide
- `PAYMENT_SYSTEM_SUMMARY.md` - Feature overview
- `src/pages/Payment.tsx` - Payment page code
- `src/components/admin/PaymentVerification.tsx` - Admin panel code

## ✨ What Users See

### Payment Page
- Clean, modern interface
- Your payment details prominently displayed
- Copy buttons for easy copying
- Drag-and-drop screenshot upload
- Real-time validation
- Success confirmation

### After Submission
- "Payment request submitted" message
- "Under review" status
- Notification when approved
- Instant plan upgrade

## 🎉 You're All Set!

Your payment system is production-ready. Just update the config file and you're good to go!

---

**Questions?** Check `PAYMENT_SETUP.md` for detailed documentation.

**Status**: ✅ Ready to Accept Payments
**Version**: 2.0.0
