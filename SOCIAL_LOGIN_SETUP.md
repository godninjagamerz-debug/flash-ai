# Social Login Quick Setup Guide

## 🚀 Quick Start

This guide will help you configure Google, Discord, and Apple OAuth providers in Supabase.

---

## 📋 Prerequisites

- Supabase project created
- Access to Supabase dashboard
- Developer accounts for each provider you want to enable

---

## 1️⃣ Google OAuth Setup

### Step 1: Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Library**
4. Search for **"Google+ API"** and click **Enable**

### Step 2: Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - User Type: **External**
   - App name: **AI Assistant**
   - User support email: Your email
   - Developer contact: Your email
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **AI Assistant**
   - Authorized redirect URIs:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
     Replace `[YOUR-PROJECT-REF]` with your actual Supabase project reference
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### Step 3: Configure in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click to expand
4. Toggle **Enable Sign in with Google**
5. Paste:
   - **Client ID** from Google Console
   - **Client Secret** from Google Console
6. Click **Save**

### ✅ Test Google Login
- Go to your login page
- Click the Google button
- You should be redirected to Google login
- After authentication, you should be redirected back to your app

---

## 2️⃣ Discord OAuth Setup

### Step 1: Discord Developer Portal
1. Go to https://discord.com/developers/applications
2. Click **New Application**
3. Name: **AI Assistant**
4. Accept Terms of Service
5. Click **Create**

### Step 2: Configure OAuth2
1. In your application, go to **OAuth2** section
2. Click **Add Redirect** under "Redirects"
3. Add:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   Replace `[YOUR-PROJECT-REF]` with your actual Supabase project reference
4. Click **Save Changes**
5. Copy the **Client ID** (at the top of the page)
6. Click **Reset Secret** to generate a new Client Secret
7. Copy the **Client Secret** (you'll only see this once!)

### Step 3: Configure in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Discord** and click to expand
4. Toggle **Enable Sign in with Discord**
5. Paste:
   - **Client ID** from Discord
   - **Client Secret** from Discord
6. Click **Save**

### ✅ Test Discord Login
- Go to your login page
- Click the Discord button
- You should be redirected to Discord authorization
- After authorization, you should be redirected back to your app

---

## 3️⃣ Apple ID OAuth Setup

### Step 1: Apple Developer Account
1. Go to https://developer.apple.com/account/
2. Sign in with your Apple Developer account
   - **Note:** You need a paid Apple Developer account ($99/year)
3. Navigate to **Certificates, Identifiers & Profiles**

### Step 2: Create App ID
1. Click **Identifiers** > **+** button
2. Select **App IDs** > **Continue**
3. Select **App** > **Continue**
4. Fill in:
   - Description: **AI Assistant**
   - Bundle ID: **com.yourcompany.aiassistant** (use your own)
5. Scroll down and check **Sign in with Apple**
6. Click **Continue** > **Register**

### Step 3: Create Service ID
1. Click **Identifiers** > **+** button
2. Select **Services IDs** > **Continue**
3. Fill in:
   - Description: **AI Assistant Web**
   - Identifier: **com.yourcompany.aiassistant.web** (use your own)
4. Check **Sign in with Apple**
5. Click **Continue** > **Register**
6. Click on the Service ID you just created
7. Check **Sign in with Apple** > **Configure**
8. Fill in:
   - Primary App ID: Select the App ID you created earlier
   - Domains and Subdomains:
     ```
     [YOUR-PROJECT-REF].supabase.co
     ```
   - Return URLs:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
9. Click **Save** > **Continue** > **Register**

### Step 4: Create Private Key
1. Click **Keys** > **+** button
2. Key Name: **AI Assistant Sign in with Apple Key**
3. Check **Sign in with Apple**
4. Click **Configure** next to Sign in with Apple
5. Select your Primary App ID
6. Click **Save** > **Continue** > **Register**
7. Click **Download** to download the .p8 key file
8. **Important:** Save this file securely! You can only download it once
9. Note the **Key ID** (shown on the page)

### Step 5: Get Team ID
1. Go to https://developer.apple.com/account/
2. Your **Team ID** is shown in the top right corner
3. Copy this ID

### Step 6: Configure in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Apple** and click to expand
4. Toggle **Enable Sign in with Apple**
5. Fill in:
   - **Services ID**: The identifier you created (e.g., com.yourcompany.aiassistant.web)
   - **Team ID**: Your Apple Developer Team ID
   - **Key ID**: The Key ID from the private key you created
   - **Private Key**: Open the .p8 file in a text editor and paste the entire contents
6. Click **Save**

### ✅ Test Apple Login
- Go to your login page
- Click the Apple button
- You should be redirected to Apple ID login
- After authentication, you should be redirected back to your app

---

## 🔍 Finding Your Supabase Project Reference

Your Supabase project reference is in your project URL:

```
https://[YOUR-PROJECT-REF].supabase.co
```

**Example:**
If your Supabase URL is `https://abcdefghijklmnop.supabase.co`
Then your project reference is: `abcdefghijklmnop`

**Where to find it:**
1. Go to your Supabase Dashboard
2. Select your project
3. Go to **Settings** > **API**
4. Look for **Project URL**
5. The project reference is the subdomain before `.supabase.co`

---

## 🧪 Testing Your Setup

### Test Each Provider

1. **Open your app in incognito/private mode**
   - This ensures you're testing with a fresh session

2. **Test Google Login**
   - Click Google button
   - Sign in with a Google account
   - Verify you're redirected back to the app
   - Check that your profile is created

3. **Test Discord Login**
   - Sign out from the app
   - Click Discord button
   - Authorize the app
   - Verify you're redirected back to the app
   - Check that your profile is created

4. **Test Apple Login**
   - Sign out from the app
   - Click Apple button
   - Sign in with Apple ID
   - Verify you're redirected back to the app
   - Check that your profile is created

### Verify Profile Creation

After logging in with each provider, check:
1. User appears in Supabase **Authentication** > **Users**
2. Profile is created in your `profiles` table
3. Email is correctly populated
4. Username is generated
5. Full name is extracted from provider

---

## 🐛 Common Issues & Solutions

### Issue: "OAuth provider not configured"
**Solution:** Make sure you've enabled the provider in Supabase and saved the configuration.

### Issue: "Redirect URI mismatch"
**Solution:** 
- Double-check the redirect URL in provider settings
- Make sure it exactly matches: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
- No trailing slashes
- Use HTTPS, not HTTP

### Issue: "Invalid client ID or secret"
**Solution:**
- Verify you copied the correct credentials
- Check for extra spaces or line breaks
- Regenerate credentials if necessary

### Issue: "Access denied" or "Authorization failed"
**Solution:**
- For Google: Make sure Google+ API is enabled
- For Discord: Check that the redirect URL is saved
- For Apple: Verify all IDs match and the private key is correct

### Issue: Buttons not appearing
**Solution:**
- Check browser console for errors
- Verify the Separator component is imported
- Make sure the code is saved and the app is rebuilt

---

## 📊 Verification Checklist

### Google
- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth client ID created
- [ ] Redirect URI configured
- [ ] Client ID and Secret copied
- [ ] Provider enabled in Supabase
- [ ] Credentials entered in Supabase
- [ ] Test login successful

### Discord
- [ ] Discord application created
- [ ] Redirect URI configured
- [ ] Client ID copied
- [ ] Client Secret generated and copied
- [ ] Provider enabled in Supabase
- [ ] Credentials entered in Supabase
- [ ] Test login successful

### Apple
- [ ] Apple Developer account active
- [ ] App ID created
- [ ] Service ID created
- [ ] Domains and Return URLs configured
- [ ] Private key created and downloaded
- [ ] Team ID noted
- [ ] Key ID noted
- [ ] Provider enabled in Supabase
- [ ] All credentials entered in Supabase
- [ ] Test login successful

---

## 🔒 Security Best Practices

1. **Keep Credentials Secret**
   - Never commit credentials to version control
   - Store them securely in Supabase only
   - Rotate credentials periodically

2. **Use HTTPS Only**
   - Always use HTTPS for redirect URLs
   - Never use HTTP in production

3. **Validate Redirect URLs**
   - Only add necessary redirect URLs
   - Remove test URLs in production
   - Keep the list minimal

4. **Monitor Usage**
   - Check Supabase auth logs regularly
   - Monitor for suspicious activity
   - Set up alerts for failed attempts

5. **Review Permissions**
   - Only request necessary scopes
   - Review provider permissions regularly
   - Update privacy policy accordingly

---

## 📱 User Communication

### Inform Your Users

1. **Privacy Policy**
   - Update your privacy policy to mention social login
   - Explain what data is collected from providers
   - Describe how data is used

2. **Terms of Service**
   - Update terms to cover social login
   - Mention provider terms apply
   - Explain account linking (if applicable)

3. **Help Documentation**
   - Create guides for users
   - Explain benefits of social login
   - Provide troubleshooting steps

---

## 🎯 Next Steps

After setup is complete:

1. **Test thoroughly**
   - Test all three providers
   - Test on different devices
   - Test in different browsers

2. **Monitor analytics**
   - Track which providers are most popular
   - Monitor error rates
   - Analyze user preferences

3. **Gather feedback**
   - Ask users about their experience
   - Identify pain points
   - Make improvements based on feedback

4. **Consider additional providers**
   - GitHub for developers
   - Microsoft for enterprise users
   - Twitter/X for social media users

---

## 📞 Support Resources

### Supabase
- Documentation: https://supabase.com/docs/guides/auth/social-login
- Discord: https://discord.supabase.com/
- GitHub: https://github.com/supabase/supabase

### Google
- Console: https://console.cloud.google.com/
- Documentation: https://developers.google.com/identity/protocols/oauth2

### Discord
- Developer Portal: https://discord.com/developers/applications
- Documentation: https://discord.com/developers/docs/topics/oauth2

### Apple
- Developer Portal: https://developer.apple.com/account/
- Documentation: https://developer.apple.com/sign-in-with-apple/

---

## ✅ Setup Complete!

Once you've completed all the steps above, your social login should be fully functional. Users can now sign in using Google, Discord, or Apple ID in addition to email/password authentication.

**Remember:**
- Test each provider thoroughly
- Monitor for errors
- Keep credentials secure
- Update documentation as needed

**Happy coding!** 🚀
