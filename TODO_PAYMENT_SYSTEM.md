# Payment System Implementation TODO

## Plan
- [ ] Create database schema for payment requests
- [ ] Create payment configuration
- [ ] Create payment page UI
- [ ] Add screenshot upload functionality
- [ ] Create admin payment verification panel
- [ ] Add payment approval/rejection
- [ ] Auto-upgrade user plan on approval
- [ ] Add payment status tracking
- [ ] Test all functionality
- [ ] Run lint check

## Payment Flow
1. User clicks "Subscribe" on a plan
2. Payment page shows:
   - UPI ID
   - Bank account details
   - Upload field for payment screenshot
3. User uploads payment proof
4. Admin verifies payment
5. Admin approves/rejects
6. User plan upgraded automatically on approval

## Database Schema
- payment_requests table:
  - id (uuid)
  - user_id (uuid)
  - plan_id (text)
  - payment_method (text: 'upi' or 'netbanking')
  - screenshot_url (text)
  - amount (numeric)
  - status (text: 'pending', 'approved', 'rejected')
  - admin_notes (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)

## Payment Configuration
- UPI ID
- Bank account details
- Plan prices

## Status: In Progress
