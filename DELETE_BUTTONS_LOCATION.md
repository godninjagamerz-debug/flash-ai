# Delete Account Buttons - Location Guide

## 🎯 Quick Reference: Where to Find Delete Buttons

### 1. User Self-Deletion Button
**Location**: Settings Page → Password Tab → Danger Zone Section

**Navigation Path**:
```
1. Click your profile/settings icon in the header
2. Navigate to "Settings" page
3. Click on "Password" tab
4. Scroll down to "Danger Zone" section
5. Click the red "Delete Account" button
```

**Visual Location**:
```
┌─────────────────────────────────────────┐
│  Settings Page                          │
├─────────────────────────────────────────┤
│  Tabs: [Security] [Password] [Admin]   │
│                    ^^^^^^^^              │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Change Password Form          │    │
│  │  - Current Password            │    │
│  │  - New Password                │    │
│  │  - Confirm Password            │    │
│  │  [Change Password Button]      │    │
│  └────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  ⚠️ Danger Zone                │    │
│  │  Irreversible actions          │    │
│  │                                 │    │
│  │  ⚠️ Warning: Permanent action  │    │
│  │  Once deleted, no going back   │    │
│  │                                 │    │
│  │  ┌──────────────────────────┐ │    │
│  │  │ 🗑️ Delete Account        │ │    │
│  │  │ Permanently delete your  │ │    │
│  │  │ account and all data     │ │    │
│  │  └──────────────────────────┘ │    │
│  │         ^^^^^^^^^^^^            │    │
│  │      CLICK HERE TO DELETE      │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Button Appearance**:
- 🔴 Red destructive button
- 🗑️ Trash icon on the left
- Text: "Delete Account"
- Subtitle: "Permanently delete your account and all data"

---

### 2. Admin Delete User Button
**Location**: Admin Panel → User Management Tab → Actions Column

**Navigation Path**:
```
1. Navigate to Admin Panel (admin users only)
2. Go to "User Management" tab
3. Find the user you want to delete
4. Look in the "Actions" column
5. Click the red trash icon (🗑️)
```

**Visual Location**:
```
┌──────────────────────────────────────────────────────────────┐
│  Admin Panel - User Management                               │
├──────────────────────────────────────────────────────────────┤
│  Tabs: [User Management] [Payment Verification] [Sessions]  │
│         ^^^^^^^^^^^^^^^^^                                     │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  User List                                             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ ☐ John Doe                                       │ │ │
│  │  │    john@example.com                              │ │ │
│  │  │    Plan: [Premium ▼]  Role: [User ▼]           │ │ │
│  │  │    Actions: [👁️ View] [🔄 Reset] [🗑️ Delete]  │ │ │
│  │  │                                    ^^^^^^^^^^^^  │ │ │
│  │  │                                 CLICK TO DELETE  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ ☐ Jane Smith                                     │ │ │
│  │  │    jane@example.com                              │ │ │
│  │  │    Plan: [Free ▼]  Role: [User ▼]              │ │ │
│  │  │    Actions: [👁️ View] [🔄 Reset] [🗑️ Delete]  │ │ │
│  │  │                                    ^^^^^^^^^^^^  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ 🛡️ Admin User (You)                             │ │ │
│  │  │    admin@example.com                             │ │ │
│  │  │    Plan: [Premium ▼]  Role: [Admin ▼]          │ │ │
│  │  │    Actions: [👁️ View]                          │ │ │
│  │  │                   (No delete button for admins) │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Button Appearance**:
- 🔴 Red destructive button
- 🗑️ Trash icon only (no text)
- Small square button
- Tooltip: "Delete Account"
- Only visible for non-admin users

---

## 🔍 Button Visibility Rules

### User Self-Deletion Button
✅ **Always Visible** for all logged-in users in Settings

**Conditions**:
- User must be logged in
- Appears in Settings → Password tab
- No role restrictions

### Admin Delete User Button
✅ **Visible Only** for admin users in Admin Panel

**Conditions**:
- User must have admin role
- Only appears for non-admin users
- Hidden for:
  - Admin users (cannot delete admins)
  - Current user (cannot delete self)

---

## 🎨 Button Styles

### User Self-Deletion Button
```css
/* Full-width button with icon and text */
- Background: Red (destructive variant)
- Icon: Trash2 (🗑️) on left
- Text: "Delete Account"
- Subtitle: "Permanently delete your account and all data"
- Height: Auto (py-4)
- Hover: Scale up slightly (1.02)
```

### Admin Delete User Button
```css
/* Icon-only button */
- Background: Red (destructive variant)
- Icon: Trash2 (🗑️) centered
- Size: Small (h-10)
- Border: Rounded (rounded-xl)
- Hover: Scale up (1.05)
- Tooltip: "Delete Account"
```

---

## 📱 Responsive Behavior

### Desktop (xl: ≥1280px)
- User button: Full width in Danger Zone card
- Admin button: Inline with other action buttons

### Mobile (< 1280px)
- User button: Full width, stacked layout
- Admin button: Stacked vertically with other actions

---

## 🔐 Security Indicators

### User Self-Deletion
- ⚠️ Warning icon in Danger Zone header
- 🔴 Red border on Danger Zone card
- 🔴 Red destructive button color
- Multiple confirmation dialogs

### Admin Delete
- 🗑️ Trash icon indicates destructive action
- 🔴 Red button color
- Requires deletion reason
- Shows user details before deletion

---

## 🎯 Quick Access Summary

| Feature | Location | Button Text | Icon | Color |
|---------|----------|-------------|------|-------|
| **User Self-Delete** | Settings → Password → Danger Zone | "Delete Account" | 🗑️ | Red |
| **Admin Delete User** | Admin → User Management → Actions | (Icon only) | 🗑️ | Red |

---

## 💡 Tips for Finding the Buttons

### For Users
1. Look for the **Settings** link in the navigation
2. Click on the **Password** tab
3. Scroll to the bottom
4. Look for the red **Danger Zone** section
5. The delete button is at the bottom of that section

### For Admins
1. Navigate to the **Admin Panel**
2. Stay on the **User Management** tab (default)
3. Find the user in the list
4. Look at the **Actions** column on the right
5. The trash icon (🗑️) is the last button

---

## ❓ Troubleshooting

### "I can't find the delete button in Settings"
- ✅ Make sure you're logged in
- ✅ Navigate to Settings page
- ✅ Click on "Password" tab (not "Security")
- ✅ Scroll down to see the Danger Zone section

### "I can't see the delete button in Admin Panel"
- ✅ Verify you have admin role
- ✅ Make sure you're looking at a non-admin user
- ✅ Check the Actions column on the right side
- ✅ The button is a small red trash icon

### "The delete button is disabled"
- ✅ User button: Should never be disabled
- ✅ Admin button: Only disabled during deletion process
- ✅ Check browser console for errors

---

**Last Updated**: 2025-01-23  
**Version**: 2.5.0  
**Status**: Production Ready
