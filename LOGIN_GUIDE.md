# 🔐 Login System - Complete Guide

## Overview

Flash AI supports flexible login options, allowing users to sign in with either their **email address** or **username**, making it convenient and user-friendly.

## ✨ Key Features

### 1. **Dual Login Methods**
- ✅ Login with email address
- ✅ Login with username
- ✅ Automatic detection of input type
- ✅ Seamless authentication experience

### 2. **Email Verification**
- ✅ OTP-based email verification for signup
- ✅ 6-digit verification code
- ✅ Secure account creation

### 3. **Unique Constraints**
- ✅ Email addresses must be unique
- ✅ Usernames must be unique
- ✅ Pre-signup validation
- ✅ Clear error messages

## 🎯 How It Works

### Login Process

When a user enters their credentials:

1. **Input Detection**
   - System checks if input contains `@` and `.`
   - If yes → Treated as email address
   - If no → Treated as username

2. **Username Lookup**
   - If username is provided, system queries database
   - Fetches associated email address
   - Uses email for authentication

3. **Authentication**
   - Supabase Auth validates credentials
   - User is logged in on success
   - Error message shown on failure

### Signup Process

1. **Email Validation**
   - Must be valid email format
   - Must not already exist

2. **Username Validation**
   - Only letters, numbers, and underscores
   - Must not already exist

3. **Email Verification**
   - 6-digit OTP sent to email
   - User enters code to verify
   - Account activated on verification

## 📋 User Guide

### How to Login

#### Option 1: Login with Email

1. Go to login page
2. Enter your email address (e.g., `john@example.com`)
3. Enter your password
4. Click "Sign In"

#### Option 2: Login with Username

1. Go to login page
2. Enter your username (e.g., `john_doe`)
3. Enter your password
4. Click "Sign In"

**Note:** The system automatically detects whether you entered an email or username!

### How to Sign Up

1. Go to login page
2. Click "Sign Up" tab
3. Fill in the form:
   - **Full Name**: Your display name
   - **Username**: Unique username (letters, numbers, underscores only)
   - **Email**: Valid email address
   - **Password**: Strong password (min 6 characters)
   - **Confirm Password**: Must match password
4. Click "Create Account"
5. Check your email for verification code
6. Enter the 6-digit code
7. Click "Verify & Continue"
8. Account created! You're logged in

## 🔍 Examples

### Example 1: Login with Email

**Input:**
```
Email or Username: sarah@flashai.com
Password: ••••••••
```

**Process:**
1. System detects `@` in input → Email
2. Authenticates directly with email
3. User logged in

### Example 2: Login with Username

**Input:**
```
Email or Username: sarah_tech
Password: ••••••••
```

**Process:**
1. System detects no `@` → Username
2. Queries database for email associated with `sarah_tech`
3. Finds email: `sarah@flashai.com`
4. Authenticates with email
5. User logged in

### Example 3: Username Not Found

**Input:**
```
Email or Username: nonexistent_user
Password: ••••••••
```

**Result:**
```
❌ User Not Found
No account found with this username. Please check and try again.
```

### Example 4: Invalid Credentials

**Input:**
```
Email or Username: john@example.com
Password: wrong_password
```

**Result:**
```
❌ Invalid Credentials
The email/username or password you entered is incorrect. Please try again.
```

## 🎨 User Interface

### Login Form

```
┌─────────────────────────────────────────────────────┐
│  Flash AI                                           │
│  ⚡ Lightning-Fast AI Conversations                 │
│                                                     │
│  [Login] [Sign Up]                                 │
│                                                     │
│  Email or Username                                 │
│  ┌───────────────────────────────────────────────┐ │
│  │ 👤 email@example.com or username             │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Password                                          │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔒 ••••••••                                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Sign In →]                                       │
│                                                     │
│  Don't have an account? Sign up                   │
└─────────────────────────────────────────────────────┘
```

### Signup Form

```
┌─────────────────────────────────────────────────────┐
│  Flash AI                                           │
│  ⚡ Lightning-Fast AI Conversations                 │
│                                                     │
│  [Login] [Sign Up]                                 │
│                                                     │
│  Full Name                                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ 👤 John Doe                                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Username                                          │
│  ┌───────────────────────────────────────────────┐ │
│  │ 👤 john_doe                                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Email Address                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📧 john@example.com                           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Password                                          │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔒 ••••••••                                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Confirm Password                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔒 ••••••••                                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Create Account →]                                │
│                                                     │
│  Already have an account? Login                   │
└─────────────────────────────────────────────────────┘
```

## 🔒 Security Features

### Password Requirements
- ✅ Minimum 6 characters
- ✅ Stored securely (hashed)
- ✅ Never displayed in plain text

### Email Verification
- ✅ OTP sent to email
- ✅ 6-digit code
- ✅ Prevents fake accounts
- ✅ Confirms email ownership

### Unique Constraints
- ✅ Email must be unique
- ✅ Username must be unique
- ✅ Database-level enforcement
- ✅ Pre-signup validation

### Authentication
- ✅ Supabase Auth (industry-standard)
- ✅ Secure password hashing
- ✅ Session management
- ✅ Token-based authentication

## 🛠️ Technical Implementation

### API Function

**File:** `src/db/api.ts`

```typescript
async getEmailByUsername(username: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Error fetching email by username:', error);
    return null;
  }

  return data?.email || null;
}
```

### Login Logic

**File:** `src/pages/Login.tsx`

```typescript
// For login mode, check if input is email or username
let email = emailOrUsername;
if (mode === 'login') {
  // Check if input is an email (contains @ and .)
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrUsername);
  
  if (!isEmail) {
    // Input is username, fetch the email
    const fetchedEmail = await profilesApi.getEmailByUsername(emailOrUsername);
    if (!fetchedEmail) {
      toast({
        title: 'User Not Found',
        description: 'No account found with this username. Please check and try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    email = fetchedEmail;
  }
}

// Authenticate with email
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

## 📊 Error Messages

### User Not Found
```
❌ User Not Found
No account found with this username. Please check and try again.
```

**Cause:** Username doesn't exist in database

**Solution:** Check spelling or sign up for new account

### Invalid Credentials
```
❌ Invalid Credentials
The email/username or password you entered is incorrect. Please try again.
```

**Cause:** Wrong password or email/username

**Solution:** Double-check credentials or reset password

### Email Already Exists
```
❌ Email Already Exists
This email address is already registered. Please use a different email or try logging in.
```

**Cause:** Email already used for another account

**Solution:** Use different email or login with existing account

### Username Already Taken
```
❌ Username Already Taken
This username is already in use. Please choose a different username.
```

**Cause:** Username already used by another user

**Solution:** Choose a different username

### Invalid Email
```
❌ Invalid Email
Please enter a valid email address
```

**Cause:** Email format is incorrect

**Solution:** Enter valid email (e.g., user@example.com)

### Invalid Username
```
❌ Invalid Username
Username can only contain letters, numbers, and underscores
```

**Cause:** Username contains invalid characters

**Solution:** Use only letters, numbers, and underscores

## 💡 Best Practices

### For Users

1. **Choose a memorable username**
   - Easy to remember
   - Unique to you
   - Professional (if using for work)

2. **Use a strong password**
   - At least 8 characters
   - Mix of letters, numbers, symbols
   - Don't reuse passwords

3. **Keep credentials secure**
   - Don't share password
   - Don't write down password
   - Use password manager

4. **Verify your email**
   - Check spam folder if code doesn't arrive
   - Enter code within time limit
   - Contact support if issues

### For Developers

1. **Always validate input**
   - Check email format
   - Check username format
   - Sanitize user input

2. **Handle errors gracefully**
   - Clear error messages
   - User-friendly language
   - Helpful suggestions

3. **Secure authentication**
   - Use established libraries (Supabase Auth)
   - Never store plain passwords
   - Implement rate limiting

4. **Test thoroughly**
   - Test email login
   - Test username login
   - Test error cases
   - Test edge cases

## 🎯 Use Cases

### Use Case 1: Quick Login with Username

**Scenario:** User wants to login quickly without typing full email

**Steps:**
1. User enters username: `john_tech`
2. User enters password
3. System looks up email for `john_tech`
4. System authenticates with email
5. User logged in

**Benefit:** Faster, more convenient login

### Use Case 2: Login with Email

**Scenario:** User remembers email but not username

**Steps:**
1. User enters email: `john@example.com`
2. User enters password
3. System authenticates directly
4. User logged in

**Benefit:** Flexibility for users

### Use Case 3: New User Signup

**Scenario:** New user wants to create account

**Steps:**
1. User fills signup form
2. System validates email and username
3. System sends verification code
4. User enters code
5. Account created and verified

**Benefit:** Secure account creation

## 🔄 Comparison with Other Systems

### Traditional (Email Only)

```
❌ Must remember email
❌ Longer to type
❌ Less flexible
```

### Flash AI (Email or Username)

```
✅ Can use email OR username
✅ Faster login with username
✅ More flexible
✅ Better user experience
```

## 📚 Related Documentation

- **EMAIL_VERIFICATION_UPGRADE.md** - Email verification details
- **UNIQUE_CONSTRAINTS_GUIDE.md** - Uniqueness validation
- **ACCOUNT_RESET_GUIDE.md** - Account reset feature

## ✅ Summary

**Login System Features:**
- ✅ Login with email or username
- ✅ Automatic input detection
- ✅ Email verification for signup
- ✅ Unique email and username constraints
- ✅ Secure authentication
- ✅ Clear error messages
- ✅ User-friendly interface

**Perfect for:**
- Quick logins with username
- Flexible authentication
- Secure account management
- Professional applications

---

**Status**: ✅ Feature Complete and Tested
**Version**: 2.4.0
**Last Updated**: 2025-11-23
