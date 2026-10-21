# 🔄 Account Reset Feature - Complete Guide

## Overview

The Account Reset feature allows administrators to reset user accounts while preserving their profiles, plans, and roles. This is useful for system maintenance, OAuth updates, or when users need a fresh start.

## ✨ Key Features

### 1. **Reset All Accounts (Except Admins)**
- Resets all non-admin user accounts in one action
- Admin accounts are automatically protected
- Bulk operation with custom notification message

### 2. **Reset Single Account**
- Reset individual user accounts
- Quick action button on each user row
- Personalized notification message

### 3. **Reset Multiple Selected Accounts**
- Select specific users with checkboxes
- Reset only the selected accounts
- Flexible bulk operation

### 4. **User Notification System**
- Custom message from admin to users
- Full-screen notification on next login
- Clear explanation of what was reset
- Users must acknowledge before continuing

## 🎯 What Gets Reset

### Deleted Data
- ✅ All conversations
- ✅ All messages
- ✅ All chat history
- ✅ All session data

### Preserved Data
- ✅ User profile (email, username, full name)
- ✅ Subscription plan (Free, Hero, Pro, Business)
- ✅ Account role (User, Admin)
- ✅ Upload limits
- ✅ Account creation date

## 📋 How to Use

### Reset All Accounts

1. **Navigate to Admin Panel**
   - Go to `/admin` page
   - Click on "Users" tab

2. **Click "Reset All Accounts" Button**
   - Located at the top of the user list
   - Red button with rotating icon

3. **Confirm Action**
   - Review the confirmation dialog
   - Understand what will be deleted
   - Click "Continue"

4. **Enter Message for Users**
   - Write a clear explanation message
   - Example: "Your account has been reset due to OAuth system updates. Your profile and plan remain unchanged. Please start a new conversation to continue using Flash AI."
   - Preview your message
   - Click "Reset Accounts"

5. **Success**
   - See confirmation toast with affected user count
   - Users will see your message on next login

### Reset Single Account

1. **Find the User**
   - Use search bar to find specific user
   - Or scroll through user list

2. **Click Reset Button**
   - Red circular button with rotating icon
   - Located in the Actions column

3. **Confirm and Add Message**
   - Follow steps 3-5 from "Reset All Accounts"

### Reset Multiple Selected Accounts

1. **Select Users**
   - Check the checkbox next to each user you want to reset
   - Or click "Select all users" checkbox at the top
   - See selection count update

2. **Click "Reset Selected" Button**
   - Button appears when users are selected
   - Shows count of selected users

3. **Confirm and Add Message**
   - Follow steps 3-5 from "Reset All Accounts"

4. **Clear Selection**
   - Click "Clear Selection" to deselect all
   - Or uncheck individual users

## 💬 Notification Message Guidelines

### Good Message Examples

**For System Maintenance:**
```
Your account has been reset as part of scheduled system maintenance. 
All your profile information and subscription plan remain active. 
Please start a new conversation to continue using Flash AI. 
Thank you for your patience!
```

**For OAuth Updates:**
```
We've updated our authentication system to improve security. 
Your account has been reset, but your profile and plan are unchanged. 
Simply start a new chat to continue enjoying Flash AI!
```

**For Fresh Start:**
```
Your account has been reset at your request. 
Your subscription plan and profile settings remain the same. 
You can now start fresh with new conversations. 
Welcome back!
```

### Message Best Practices

1. **Be Clear and Concise**
   - Explain why the reset happened
   - Reassure users about preserved data
   - Provide next steps

2. **Be Professional**
   - Use friendly, professional tone
   - Avoid technical jargon
   - Show empathy

3. **Be Helpful**
   - Tell users what to do next
   - Mention what wasn't affected
   - Offer support if needed

## 🔒 Security Features

### Admin-Only Access
- Only users with admin role can reset accounts
- All reset functions require admin authentication
- Database-level security enforcement

### Admin Protection
- Admin accounts cannot be reset
- Checkbox and reset button hidden for admins
- Database functions reject admin account resets

### Audit Trail
- All resets are logged in database
- Tracks which admin performed the reset
- Records timestamp and message sent
- Notification history preserved

## 🎨 User Experience

### Admin View

**Bulk Actions Bar:**
```
┌─────────────────────────────────────────────────────────┐
│ ☐ Select all users  │  [Reset All] [Reset Selected (3)] │
└─────────────────────────────────────────────────────────┘
```

**User Row:**
```
┌──────────────────────────────────────────────────────────┐
│ ☐  John Doe                                              │
│    john@example.com                                      │
│    [Plan ▼] [Role ▼] [View Chats] [🔄]                  │
└──────────────────────────────────────────────────────────┘
```

### User View

**Reset Notification (Full Screen):**
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  Account Reset Notice                          [X]  │
│                                                          │
│  Your account was reset on Nov 23, 2025, 2:30 PM       │
│                                                          │
│  Message from Administrator:                            │
│  ┌────────────────────────────────────────────────┐    │
│  │ Your account has been reset due to system      │    │
│  │ maintenance. Your profile and plan remain      │    │
│  │ unchanged. Please start a new conversation.    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  What was reset:                                        │
│  • All conversations and chat history                   │
│  • All messages                                         │
│                                                          │
│  What was preserved:                                    │
│  • Your profile and account settings                    │
│  • Your subscription plan                               │
│  • Your account role and permissions                    │
│                                                          │
│  [I Understand]                                         │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Technical Implementation

### Database Functions

**1. reset_user_account(user_id, message, admin_id)**
- Resets single user account
- Validates admin permissions
- Prevents admin account resets
- Creates notification

**2. reset_all_accounts_except_admins(message, admin_id)**
- Resets all non-admin accounts
- Returns count of affected users
- Bulk notification creation
- Admin protection built-in

**3. reset_multiple_accounts(user_ids[], message, admin_id)**
- Resets selected user accounts
- Skips admin accounts automatically
- Returns count of affected users
- Efficient batch processing

**4. get_reset_notification(user_id)**
- Retrieves user's latest notification
- Returns unread notifications only
- Used on login to show message

**5. mark_notification_read(notification_id)**
- Marks notification as read
- Prevents showing same message again
- User-triggered action

### Database Tables

**reset_notifications:**
```sql
CREATE TABLE reset_notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  message text NOT NULL,
  reset_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);
```

### API Functions

**accountResetApi:**
- `resetUserAccount(userId, message)` - Reset single user
- `resetAllAccountsExceptAdmins(message)` - Reset all users
- `resetMultipleAccounts(userIds, message)` - Reset selected users
- `getResetNotification(userId)` - Get user notification
- `markNotificationRead(notificationId)` - Mark as read

### UI Components

**Admin.tsx:**
- Bulk action buttons
- User selection checkboxes
- Reset confirmation dialog
- Message input dialog
- Individual reset buttons

**ResetNotification.tsx:**
- Full-screen notification overlay
- Message display
- What was reset/preserved info
- Dismiss button

## 📊 Use Cases

### 1. OAuth System Updates
**Scenario:** You're updating from one OAuth provider to another

**Steps:**
1. Announce maintenance window to users
2. Perform OAuth system updates
3. Reset all accounts with message explaining the change
4. Users log in with new OAuth system
5. Users see notification and start fresh

### 2. System Maintenance
**Scenario:** Database migration or major system update

**Steps:**
1. Schedule maintenance
2. Perform system updates
3. Reset affected accounts
4. Notify users of completion
5. Users continue with clean slate

### 3. Individual User Request
**Scenario:** User wants to start over with fresh conversations

**Steps:**
1. User contacts support
2. Admin finds user in panel
3. Reset single account with personalized message
4. User logs in and sees notification
5. User starts fresh conversations

### 4. Bulk User Management
**Scenario:** Need to reset specific group of users (e.g., test accounts)

**Steps:**
1. Search/filter for target users
2. Select users with checkboxes
3. Reset selected accounts
4. Provide group-specific message
5. Selected users get notification

## ⚠️ Important Notes

### Before Resetting

1. **Communicate with Users**
   - Announce planned resets in advance
   - Explain why reset is necessary
   - Provide timeline

2. **Backup Important Data**
   - Export critical conversations if needed
   - Document any important information
   - Consider user data retention policies

3. **Plan Your Message**
   - Write clear, helpful message
   - Review for tone and clarity
   - Include next steps for users

### After Resetting

1. **Monitor User Feedback**
   - Watch for user questions
   - Be ready to provide support
   - Address concerns promptly

2. **Verify Success**
   - Check that reset completed
   - Confirm notifications were sent
   - Test user login experience

3. **Document the Action**
   - Record why reset was performed
   - Note any issues encountered
   - Update procedures if needed

## 🔍 Troubleshooting

### Issue: Reset button not visible
**Solution:** Ensure you're logged in as admin. Only admins can see reset buttons.

### Issue: Can't reset admin accounts
**Solution:** This is by design. Admin accounts are protected from resets.

### Issue: Notification not showing
**Solution:** Check that notification wasn't already marked as read. Each notification shows only once.

### Issue: Message too long
**Solution:** Keep messages concise (under 500 characters recommended). Focus on key information.

### Issue: Reset failed
**Solution:** Check admin permissions, verify user exists, ensure database connection is stable.

## 📈 Best Practices

### For Admins

1. **Always provide clear messages**
   - Users need to understand what happened
   - Explain next steps clearly
   - Be professional and empathetic

2. **Use appropriate reset type**
   - Single: For individual user issues
   - Multiple: For specific user groups
   - All: For system-wide updates only

3. **Test with single user first**
   - Before bulk resets, test with one user
   - Verify notification appears correctly
   - Confirm message is clear

4. **Keep records**
   - Document when and why resets occur
   - Track user feedback
   - Improve processes over time

### For Users

1. **Read the notification carefully**
   - Understand what was reset
   - Note what was preserved
   - Follow admin instructions

2. **Start fresh conversations**
   - Previous chats are gone
   - Create new conversations
   - Your plan and settings remain

3. **Contact support if needed**
   - Ask questions if unclear
   - Report any issues
   - Provide feedback

## 🎓 Examples

### Example 1: OAuth Migration

**Scenario:** Migrating from Google OAuth to multiple providers

**Admin Actions:**
1. Click "Reset All Accounts"
2. Confirm action
3. Enter message:
```
We've upgraded our login system to support multiple sign-in options! 
Your account has been reset to ensure compatibility. Your subscription 
and profile are safe. Log in with your preferred method and start chatting!
```
4. Click "Reset Accounts"
5. 47 accounts reset successfully

**User Experience:**
- User logs in with new OAuth
- Sees full-screen notification
- Reads admin message
- Clicks "I Understand"
- Starts new conversation

### Example 2: Individual User Reset

**Scenario:** User requests fresh start after testing

**Admin Actions:**
1. Search for user "testuser@example.com"
2. Click reset button (🔄) on user row
3. Confirm action
4. Enter message:
```
Your account has been reset as requested. All test conversations 
have been cleared. Your Pro plan is still active. Ready to start 
fresh? Begin a new conversation anytime!
```
5. Click "Reset Accounts"
6. 1 account reset successfully

**User Experience:**
- User logs in
- Sees personalized notification
- Understands reset was requested
- Clicks "I Understand"
- Starts fresh with clean slate

### Example 3: Selected Users Reset

**Scenario:** Reset all trial users after promotion ends

**Admin Actions:**
1. Filter users by "Free" plan
2. Select all free users (checkboxes)
3. Click "Reset Selected (23)"
4. Confirm action
5. Enter message:
```
Thank you for trying Flash AI! Your trial period has ended. 
Your account has been reset, but you can continue using our 
Free plan. Upgrade anytime for more features!
```
6. Click "Reset Accounts"
7. 23 accounts reset successfully

**User Experience:**
- Users log in
- See trial end notification
- Understand they can continue with Free plan
- See upgrade options
- Start new conversations

## 📚 Related Documentation

- **Admin Panel Guide** - Complete admin features
- **User Management** - Managing user accounts
- **Authentication System** - Login and OAuth
- **Database Schema** - Technical details

## ✅ Summary

**Account Reset Feature:**
- ✅ Reset all, single, or multiple accounts
- ✅ Admin-only with security enforcement
- ✅ Custom notification messages
- ✅ Preserves profiles, plans, and roles
- ✅ Full-screen user notifications
- ✅ Audit trail and logging
- ✅ Flexible and user-friendly

**Perfect for:**
- OAuth system updates
- System maintenance
- User fresh starts
- Bulk user management
- Individual user support

---

**Status**: ✅ Feature Complete and Tested
**Version**: 2.3.0
**Last Updated**: 2025-11-23
