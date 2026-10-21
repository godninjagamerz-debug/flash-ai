# Pro Account Setup Instructions

## Account Credentials

**Email**: `owner@example.invalid`  
**Password**: `REDACTED_LEGACY_CREDENTIAL`  
**Plan**: Pro  
**Access**: Lightning McQueen AI Model ⚡

## How to Create the Account

### Option 1: Using the Application (Recommended)

1. Open the Flash AI application
2. Click "Sign Up" 
3. Enter the following details:
   - **Username**: `pro_user`
   - **Email**: `owner@example.invalid`
   - **Password**: `REDACTED_LEGACY_CREDENTIAL`
   - **Full Name**: `Pro User`
4. After signup, you'll need to upgrade to Pro plan manually through the Plans page

### Option 2: Direct Database Setup (For Admins)

After creating the account through signup, run this SQL to upgrade to Pro:

```sql
-- Update the user's plan to Pro
UPDATE profiles 
SET plan = 'pro'
WHERE email = 'owner@example.invalid';
```

## Pro Plan Features

✅ **1GB file upload limit**  
✅ **Multiple AI Models**: Flash AI + Lightning McQueen  
✅ **Unlimited conversations**  
✅ **Priority support**  
✅ **Advanced image analysis**  
✅ **Conversation export**  
✅ **Lifetime conversation history**  

## Using Lightning McQueen AI

Once logged in with Pro account:
1. Go to the Chat page
2. Look for the AI model selector in the header
3. Toggle between "Flash AI" and "⚡ Lightning McQueen"
4. Lightning McQueen provides faster, more creative responses

## Security Notes

⚠️ **Important**: Change the password after first login for security  
⚠️ Keep these credentials secure and private  
⚠️ Do not share this account with unauthorized users

---

**Created**: 2025-11-23  
**Status**: Ready to use  
**Support**: Contact admin for any issues
