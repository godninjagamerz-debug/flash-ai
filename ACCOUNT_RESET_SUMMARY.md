# 🔄 Account Reset Feature - Quick Summary

## What is it?

The Account Reset feature allows administrators to reset user accounts while keeping their profiles, plans, and roles intact. Perfect for OAuth updates, system maintenance, or giving users a fresh start.

## Key Features

✅ **Reset All Accounts** - Reset all non-admin users at once  
✅ **Reset Single Account** - Reset individual user accounts  
✅ **Reset Multiple Accounts** - Select and reset specific users  
✅ **Custom Messages** - Send personalized notifications to users  
✅ **User Notifications** - Full-screen alerts on next login  
✅ **Admin Protection** - Admin accounts cannot be reset  

## What Gets Reset?

### ❌ Deleted
- All conversations
- All messages
- All chat history
- All session data

### ✅ Preserved
- User profile (email, username, name)
- Subscription plan (Free, Hero, Pro, Business)
- Account role (User, Admin)
- Upload limits
- Account creation date

## Quick Start

### Reset All Accounts

1. Go to Admin Panel → Users tab
2. Click **"Reset All Accounts"** button
3. Confirm the action
4. Enter a message for users (e.g., "System maintenance complete. Your profile and plan are safe.")
5. Click **"Reset Accounts"**
6. Done! Users will see your message on next login

### Reset Single Account

1. Find the user in the list
2. Click the **🔄 reset button** in their row
3. Confirm and enter message
4. Done!

### Reset Multiple Accounts

1. Check the boxes next to users you want to reset
2. Click **"Reset Selected (X)"** button
3. Confirm and enter message
4. Done!

## User Experience

When a user logs in after their account is reset:

1. **Full-screen notification appears**
2. Shows admin's custom message
3. Explains what was reset and what was preserved
4. User clicks "I Understand" to continue
5. User can start fresh conversations

## Example Messages

**For OAuth Updates:**
```
We've upgraded our authentication system! Your account has been 
reset for compatibility. Your profile and plan remain unchanged. 
Log in and start chatting!
```

**For Maintenance:**
```
System maintenance complete! Your account has been reset. All 
your settings and subscription are safe. Start a new conversation 
to continue using Flash AI.
```

**For User Request:**
```
Your account has been reset as requested. Your Pro plan is still 
active. Ready for a fresh start? Begin a new conversation anytime!
```

## Security

- ✅ Admin-only access
- ✅ Admin accounts protected
- ✅ Database-level security
- ✅ Audit trail maintained
- ✅ Notification history preserved

## Technical Details

**Database Functions:**
- `reset_user_account()` - Reset single user
- `reset_all_accounts_except_admins()` - Reset all users
- `reset_multiple_accounts()` - Reset selected users
- `get_reset_notification()` - Get user notification
- `mark_notification_read()` - Mark as read

**UI Components:**
- Bulk action buttons in Admin panel
- User selection checkboxes
- Reset confirmation dialog
- Message input dialog with preview
- Full-screen user notification

**API Functions:**
- `accountResetApi.resetUserAccount()`
- `accountResetApi.resetAllAccountsExceptAdmins()`
- `accountResetApi.resetMultipleAccounts()`
- `accountResetApi.getResetNotification()`
- `accountResetApi.markNotificationRead()`

## Use Cases

1. **OAuth System Updates** - Reset all accounts when changing auth providers
2. **System Maintenance** - Clean slate after major updates
3. **User Requests** - Individual users want fresh start
4. **Bulk Management** - Reset specific user groups (e.g., test accounts)

## Best Practices

### For Admins

✅ Always provide clear, helpful messages  
✅ Announce resets in advance when possible  
✅ Test with single user before bulk resets  
✅ Keep messages concise and professional  
✅ Monitor user feedback after resets  

### For Users

✅ Read the notification carefully  
✅ Understand what was reset vs preserved  
✅ Start fresh conversations  
✅ Contact support if you have questions  

## Troubleshooting

**Q: Can't see reset buttons?**  
A: Only admins can see reset buttons. Check your role.

**Q: Can't reset admin accounts?**  
A: By design. Admin accounts are protected.

**Q: Notification not showing?**  
A: Each notification shows only once. Check if already read.

**Q: Reset failed?**  
A: Verify admin permissions and database connection.

## Documentation

For complete details, see:
- **ACCOUNT_RESET_GUIDE.md** - Full feature documentation
- **TODO.md** - Implementation tracking

## Status

✅ **Feature Complete**  
✅ **Fully Tested**  
✅ **Production Ready**  

**Version**: 2.3.0  
**Last Updated**: 2025-11-23

---

**Need Help?** Check the full guide in ACCOUNT_RESET_GUIDE.md
