# GitHub OAuth Setup Guide

## 🚀 Quick Setup for GitHub Social Login

GitHub has been added as the fourth social login provider. Follow these steps to configure it.

---

## 📋 Prerequisites

- GitHub account
- Access to Supabase dashboard
- Your Supabase project reference

---

## 🔧 Step-by-Step Setup

### Step 1: Create GitHub OAuth App

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Or navigate: GitHub → Settings → Developer settings → OAuth Apps

2. **Create New OAuth App**
   - Click **"New OAuth App"** button
   - Fill in the application details:

   **Application name:**
   ```
   AI Assistant
   ```

   **Homepage URL:**
   ```
   https://your-domain.com
   ```
   (Or use `http://localhost:3000` for development)

   **Application description:** (Optional)
   ```
   AI-powered question-answering assistant
   ```

   **Authorization callback URL:**
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   
   **Important:** Replace `[YOUR-PROJECT-REF]` with your actual Supabase project reference.
   
   Example: If your Supabase URL is `https://abcdefghijklmnop.supabase.co`, then use:
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```

3. **Register Application**
   - Click **"Register application"**
   - You'll be redirected to your app's settings page

4. **Get Credentials**
   - Copy the **Client ID** (shown at the top)
   - Click **"Generate a new client secret"**
   - Copy the **Client Secret** (you'll only see this once!)
   - Store both securely

---

### Step 2: Configure in Supabase

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **Authentication** → **Providers**

2. **Enable GitHub Provider**
   - Scroll down to find **GitHub**
   - Click to expand the GitHub section
   - Toggle **"Enable Sign in with GitHub"** to ON

3. **Enter Credentials**
   - Paste the **Client ID** from GitHub
   - Paste the **Client Secret** from GitHub
   - Click **"Save"**

---

## ✅ Testing

### Test GitHub Login

1. **Open your application**
   - Go to the login page
   - You should see 4 social login buttons:
     - Google
     - Discord
     - Apple
     - **GitHub** (new!)

2. **Click GitHub button**
   - You'll be redirected to GitHub
   - Authorize the application
   - You'll be redirected back to your app
   - You should be logged in

3. **Verify Profile Creation**
   - Check Supabase **Authentication** → **Users**
   - Your GitHub account should appear
   - Check the `profiles` table
   - A profile should be created with:
     - Email from GitHub
     - Username from GitHub
     - Full name from GitHub

---

## 🎨 UI Layout

### Desktop View (≥640px)
```
┌────────────────────────────────────────────┐
│  ─────── Or continue with ───────          │
│                                            │
│  [Google] [Discord] [Apple] [GitHub]       │
│                                            │
└────────────────────────────────────────────┘
```

### Mobile View (<640px)
```
┌──────────────────────────┐
│  ── Or continue with ──  │
│                          │
│  [Google]  [Discord]     │
│  [Apple]   [GitHub]      │
│                          │
└──────────────────────────┘
```

**Layout Details:**
- **Grid:** 2 columns on mobile, 4 columns on desktop
- **Responsive breakpoint:** 640px (sm)
- **Button height:** 44px (touch-friendly)
- **Gap:** 12px between buttons

---

## 🔍 Finding Your Supabase Project Reference

Your Supabase project reference is the subdomain in your project URL:

```
https://[YOUR-PROJECT-REF].supabase.co
```

**How to find it:**
1. Go to Supabase Dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Look for **Project URL**
5. The project reference is everything before `.supabase.co`

**Example:**
- Project URL: `https://xyzabc123456.supabase.co`
- Project Reference: `xyzabc123456`

---

## 🐛 Troubleshooting

### Issue: "Redirect URI mismatch"

**Problem:** The callback URL doesn't match

**Solution:**
1. Go to GitHub OAuth App settings
2. Check the **Authorization callback URL**
3. Make sure it exactly matches:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
4. No trailing slashes
5. Use HTTPS, not HTTP
6. Save changes and try again

### Issue: "Application suspended"

**Problem:** GitHub has suspended your OAuth app

**Solution:**
1. Check your GitHub email for suspension notice
2. Follow GitHub's instructions to resolve
3. Common reasons:
   - Suspicious activity
   - Terms of service violation
   - Incomplete application information

### Issue: "Invalid client ID or secret"

**Problem:** Wrong credentials entered in Supabase

**Solution:**
1. Go back to GitHub OAuth App settings
2. Verify the Client ID
3. Generate a new Client Secret
4. Update both in Supabase
5. Click Save

### Issue: GitHub button not appearing

**Problem:** UI not updated or cached

**Solution:**
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check browser console for errors
4. Verify the code is deployed

---

## 📊 GitHub OAuth Scopes

By default, Supabase requests these scopes from GitHub:

- **`user:email`** - Access to user's email addresses
- **`read:user`** - Read access to user profile data

These scopes allow the app to:
- Get user's email address
- Get user's name
- Get user's GitHub username
- Get user's profile picture

**Note:** Users will see these permissions when authorizing your app.

---

## 🔒 Security Best Practices

### 1. Keep Client Secret Secure
- Never commit to version control
- Store only in Supabase dashboard
- Regenerate if compromised

### 2. Use HTTPS Only
- Always use HTTPS for callback URLs
- Never use HTTP in production

### 3. Validate Redirect URLs
- Only add necessary callback URLs
- Remove test URLs in production
- Keep the list minimal

### 4. Monitor Usage
- Check GitHub OAuth app analytics
- Monitor for suspicious activity
- Review authorized users regularly

### 5. Update Regularly
- Keep OAuth app information current
- Update callback URLs if domain changes
- Review and update scopes as needed

---

## 📱 User Experience

### Benefits for Users

1. **Familiar Login**
   - Many developers have GitHub accounts
   - No need to create new credentials
   - One-click authentication

2. **Trusted Platform**
   - GitHub is widely trusted
   - Secure OAuth 2.0 flow
   - No password sharing

3. **Quick Access**
   - Faster than email/password
   - No email verification needed
   - Automatic profile creation

### User Flow

```
1. User clicks GitHub button
   ↓
2. Redirected to GitHub
   ↓
3. User authorizes app
   ↓
4. Redirected back to app
   ↓
5. Profile created automatically
   ↓
6. User is logged in
```

---

## 🎯 Why GitHub?

### Perfect for Developer-Focused Apps

- **Developer Community:** Most developers have GitHub accounts
- **Professional Network:** GitHub is a professional platform
- **Trusted Brand:** High trust among technical users
- **Easy Setup:** Simple OAuth configuration
- **Rich Profile Data:** Access to username, email, and more

### Use Cases

1. **Developer Tools**
   - Code editors
   - API platforms
   - Development environments

2. **Technical Communities**
   - Forums
   - Q&A platforms
   - Learning platforms

3. **Open Source Projects**
   - Project management
   - Collaboration tools
   - Documentation sites

---

## 📚 Additional Resources

### GitHub Documentation
- OAuth Apps: https://docs.github.com/en/developers/apps/building-oauth-apps
- Authorizing OAuth Apps: https://docs.github.com/en/developers/apps/authorizing-oauth-apps
- Scopes: https://docs.github.com/en/developers/apps/scopes-for-oauth-apps

### Supabase Documentation
- Social Login: https://supabase.com/docs/guides/auth/social-login
- GitHub Provider: https://supabase.com/docs/guides/auth/social-login/auth-github

### Support
- GitHub Support: https://support.github.com/
- Supabase Discord: https://discord.supabase.com/
- Supabase GitHub: https://github.com/supabase/supabase

---

## ✅ Verification Checklist

### GitHub Setup
- [ ] GitHub OAuth App created
- [ ] Application name set
- [ ] Homepage URL configured
- [ ] Callback URL configured correctly
- [ ] Client ID copied
- [ ] Client Secret generated and copied

### Supabase Configuration
- [ ] GitHub provider enabled in Supabase
- [ ] Client ID entered
- [ ] Client Secret entered
- [ ] Configuration saved

### Testing
- [ ] GitHub button appears on login page
- [ ] GitHub button appears on signup page
- [ ] Button is clickable
- [ ] Redirects to GitHub correctly
- [ ] Authorization works
- [ ] Redirects back to app
- [ ] User is logged in
- [ ] Profile is created in database

### Production
- [ ] Callback URL uses production domain
- [ ] HTTPS is used
- [ ] Client Secret is secure
- [ ] Privacy policy updated
- [ ] Terms of service updated

---

## 🎉 Complete!

GitHub OAuth is now configured! Users can sign in using their GitHub accounts alongside Google, Discord, and Apple.

**Total Social Login Options:** 4
- 🔵 Google
- 💜 Discord
- 🍎 Apple
- ⚫ GitHub (new!)

**Next Steps:**
1. Test thoroughly
2. Monitor usage
3. Gather user feedback
4. Consider adding more providers if needed

---

**Setup Date:** 2025-11-23
**Status:** ✅ Complete
**Provider:** GitHub
**Type:** OAuth 2.0

*More Options. Better Experience. Seamless Authentication.* 🚀
