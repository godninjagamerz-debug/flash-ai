# Account Deletion System Guide

## Overview

The AI Assistant application now includes a comprehensive account deletion system with two distinct flows:
1. **User Self-Deletion**: Users can delete their own accounts with OTP verification
2. **Admin Deletion**: Administrators can delete user accounts with audit trail

## Features

### 1. User Self-Deletion Flow

#### Access
- Navigate to **Settings** → **Password** tab
- Scroll down to the **Danger Zone** section
- Click the **Delete Account** button

#### Process
1. **Initial Confirmation**
   - User sees a warning dialog explaining what will be deleted
   - Lists all data that will be permanently removed:
     - All conversations and chat history
     - Profile and account settings
     - Subscription and payment history
     - All associated data and preferences

2. **OTP Verification**
   - Click "Yes, Send Verification Code"
   - System sends a 6-digit OTP code to the user's email
   - Code expires in 10 minutes

3. **Code Entry**
   - Enter the 6-digit verification code
   - Click "Verify & Delete Account"
   - System verifies the code and completes deletion

4. **Completion**
   - Account is permanently deleted
   - User is automatically signed out
   - Redirected to login page

#### Security Features
- **OTP Verification**: Ensures the user has access to their email
- **10-Minute Expiration**: Limits the time window for code usage
- **Permanent Action**: Clear warnings that deletion cannot be undone
- **Audit Trail**: Deletion is logged for compliance

### 2. Admin Deletion Flow

#### Access
- Navigate to **Admin Panel**
- Find the user in the **User Management** tab
- Click the **Trash** icon (🗑️) in the Actions column

#### Process
1. **User Selection**
   - Admin clicks the delete button for a specific user
   - Cannot delete admin accounts (including self)

2. **Reason Entry**
   - Dialog appears requesting deletion reason
   - Reason is **required** for audit compliance
   - Shows user details (username/email)

3. **Confirmation**
   - Admin reviews the warning about permanent deletion
   - Enters a detailed reason
   - Clicks "Yes, Delete This Account"

4. **Completion**
   - Account is permanently deleted
   - Deletion is logged with admin ID and reason
   - User list is refreshed

#### Admin Features
- **Audit Trail**: All deletions are logged with:
  - User ID and username
  - Admin who performed the deletion

### Disable or Delete Notifications

Admin disable and delete actions require a reason. The action endpoint sends that reason to the email address on the user's account and records delivery status in `account_action_log`. Disabled users are banned from signing in and see the recorded reason if an existing session refreshes.

To enable delivery, apply the Supabase migrations, deploy `supabase/functions/account-action`, and set these function secrets:

```powershell
supabase secrets set RESEND_API_KEY=<your-resend-api-key> ACCOUNT_EMAIL_FROM="Flash AI <no-reply@your-verified-domain>"
```

`ACCOUNT_EMAIL_FROM` must be a sender verified with Resend. If the provider is missing or rejects a message, the account action still completes and Admin displays a delivery warning.
  - Timestamp
  - Reason for deletion
- **Protection**: Admins cannot delete:
  - Their own account
  - Other admin accounts
- **Immediate Effect**: Deletion happens instantly

## Database Structure

### Tables

#### `account_deletion_requests`
Tracks user-initiated deletion requests with OTP verification.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | User requesting deletion |
| `otp_code` | text | 6-digit verification code |
| `otp_expires_at` | timestamptz | Code expiration time |
| `requested_at` | timestamptz | Request timestamp |
| `requested_by` | uuid | Who initiated (user or admin) |
| `status` | text | pending/verified/cancelled/completed |

#### `deleted_accounts_log`
Audit trail for all deleted accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Deleted user's ID |
| `username` | text | Deleted user's username |
| `email` | text | Deleted user's email |
| `deleted_by` | uuid | Admin who deleted (or user self) |
| `deleted_at` | timestamptz | Deletion timestamp |
| `deletion_reason` | text | Reason for deletion |

### RPC Functions

#### `request_account_deletion()`
- Generates 6-digit OTP
- Creates deletion request record
- Returns OTP for email sending
- Cancels any existing pending requests

#### `verify_deletion_otp(p_otp text)`
- Validates OTP code
- Checks expiration (10 minutes)
- Marks request as verified
- Returns success/error status

#### `complete_account_deletion(p_user_id uuid, p_reason text)`
- Verifies authorization (admin or verified user)
- Logs deletion to audit table
- Deletes user profile (cascades to related data)
- Deletes auth user
- Returns success/error status

#### `admin_delete_user_account(p_user_id uuid, p_reason text)`
- Admin-only function
- Prevents self-deletion
- Logs deletion with admin ID and reason
- Deletes user profile and auth user
- Returns success/error status

## Security Considerations

### User Self-Deletion
1. **Email Verification**: OTP sent to registered email
2. **Time Limit**: 10-minute expiration on OTP codes
3. **Single Use**: OTP codes are invalidated after use
4. **Clear Warnings**: Multiple confirmations required

### Admin Deletion
1. **Role Check**: Only admins can delete accounts
2. **Self-Protection**: Admins cannot delete themselves
3. **Admin Protection**: Cannot delete other admin accounts
4. **Audit Trail**: All deletions logged with reason
5. **Required Reason**: Deletion reason is mandatory

### Data Protection
1. **Cascade Deletion**: All related data is removed
2. **Audit Retention**: Deletion logs are preserved
3. **Permanent Action**: No recovery mechanism
4. **GDPR Compliance**: Complete data removal

## API Usage

### Frontend API Calls

```typescript
import { accountDeletionApi } from '@/db/api';

// User requests deletion
const result = await accountDeletionApi.requestAccountDeletion();
// Returns: { success: boolean, otp?: string, error?: string }

// User verifies OTP
const verifyResult = await accountDeletionApi.verifyDeletionOtp('123456');
// Returns: { success: boolean, error?: string }

// Complete deletion (user or admin)
const deleteResult = await accountDeletionApi.completeAccountDeletion(
  userId,
  'Optional reason'
);
// Returns: { success: boolean, error?: string }

// Admin deletes user
const adminResult = await accountDeletionApi.adminDeleteUserAccount(
  userId,
  'Required reason'
);
// Returns: { success: boolean, error?: string }
```

## UI Components

### DeleteAccountDialog
**Location**: `src/components/settings/DeleteAccountDialog.tsx`

**Props**:
- `userId`: string - User ID to delete
- `username`: string (optional) - Display name

**Features**:
- Three-step flow (confirm → OTP → deleting)
- Real-time validation
- Loading states
- Error handling
- Auto sign-out after deletion

### Admin Panel Delete Button
**Location**: `src/pages/Admin.tsx`

**Features**:
- Trash icon button in Actions column
- Only visible for non-admin users
- Opens confirmation dialog
- Requires deletion reason
- Shows user details
- Refreshes list after deletion

## Testing Checklist

### User Self-Deletion
- [ ] Delete button appears in Settings → Password tab
- [ ] Warning dialog shows all data to be deleted
- [ ] OTP email is sent successfully
- [ ] OTP code validates correctly
- [ ] Invalid OTP shows error message
- [ ] Expired OTP shows error message
- [ ] Account is deleted after verification
- [ ] User is signed out automatically
- [ ] Redirected to login page
- [ ] Cannot log in with deleted account

### Admin Deletion
- [ ] Delete button appears for non-admin users
- [ ] Delete button hidden for admin users
- [ ] Cannot delete own account
- [ ] Reason field is required
- [ ] Warning dialog shows user details
- [ ] Account is deleted immediately
- [ ] User list refreshes after deletion
- [ ] Deletion is logged in audit table
- [ ] Deleted user cannot log in

### Security Tests
- [ ] Non-admin cannot access admin delete function
- [ ] OTP expires after 10 minutes
- [ ] OTP cannot be reused
- [ ] Admin cannot delete themselves
- [ ] Admin cannot delete other admins
- [ ] All related data is removed
- [ ] Audit log is preserved

## Troubleshooting

### Common Issues

#### OTP Not Received
- Check email spam folder
- Verify email address is correct
- Wait a few minutes for delivery
- Request a new OTP if expired

#### OTP Invalid or Expired
- OTP codes expire after 10 minutes
- Request a new OTP code
- Ensure code is entered correctly (6 digits)

#### Admin Cannot Delete User
- Verify admin role is assigned
- Check if target user is also an admin
- Ensure deletion reason is provided
- Check browser console for errors

#### Deletion Not Completing
- Check network connection
- Verify database permissions
- Check Supabase logs for errors
- Ensure RPC functions are deployed

## Best Practices

### For Users
1. **Backup Data**: Export important conversations before deletion
2. **Verify Email**: Ensure email access before starting
3. **Read Warnings**: Understand that deletion is permanent
4. **Act Quickly**: Complete OTP verification within 10 minutes

### For Admins
1. **Document Reasons**: Provide detailed deletion reasons
2. **Verify User**: Confirm correct user before deletion
3. **Check Activity**: Review user activity before deletion
4. **Audit Review**: Regularly review deletion logs

### For Developers
1. **Test Thoroughly**: Test all deletion scenarios
2. **Monitor Logs**: Check Supabase logs for errors
3. **Backup Database**: Regular backups before major changes
4. **Update Documentation**: Keep this guide current

## Compliance Notes

### GDPR Compliance
- Users can request complete data deletion
- Deletion is permanent and irreversible
- Audit logs maintained for compliance
- No data recovery after deletion

### Data Retention
- Audit logs are retained indefinitely
- Contains: user ID, username, email, deletion timestamp
- Used for compliance and security purposes
- Does not contain personal conversation data

## Future Enhancements

### Potential Improvements
1. **Grace Period**: 30-day account suspension before permanent deletion
2. **Data Export**: Automatic data export before deletion
3. **Bulk Admin Delete**: Delete multiple users at once
4. **Scheduled Deletion**: Schedule deletion for future date
5. **Deletion Analytics**: Dashboard showing deletion trends
6. **Email Notifications**: Notify user before final deletion
7. **Recovery Window**: Limited time to recover deleted accounts

## Support

### Getting Help
- Check this documentation first
- Review Supabase logs for errors
- Check browser console for client errors
- Contact system administrator for assistance

### Reporting Issues
- Provide detailed error messages
- Include steps to reproduce
- Note user role (user/admin)
- Check database migration status

---

**Last Updated**: 2025-01-23  
**Version**: 2.5.0  
**Status**: Production Ready
