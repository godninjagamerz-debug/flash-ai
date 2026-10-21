# Auto-Launch AI Chat Implementation Guide

## Overview
This implementation enables Flash AI to automatically display the AI chat interface when users visit the index page (/) with support for both anonymous and authenticated users.

## Changes Made

### 1. **App.tsx** - Added Anonymous User Whitelist
**File:** `src/App.tsx`

Updated the `RequireAuth` whitelist to include `'/'` so anonymous users can access the home route:
```tsx
<RequireAuth whiteList={['/login', '/plans', '/']}>
```

This allows the chat page to load for both authenticated and unauthenticated users.

### 2. **Anonymous Session Service** - New File
**File:** `src/services/anonSessionService.ts` ✅ CREATED

Manages anonymous user sessions with localStorage-based tracking:
- `getOrCreateAnonSession()` - Creates or retrieves anonymous session
- `getCurrentAnonSession()` - Gets current session info
- `hasAnonCredits()` - Checks remaining daily credits (5/day)
- `trackAnonCredits()` - Records credit usage
- `getAnonRemainingCredits()` - Returns remaining credits

**Key Features:**
- 5 free messages per day for anonymous users
- 24-hour session expiry
- Daily credit reset at midnight
- localStorage fallback for offline support

### 3. **Chat Component Updates** - Anonymous Mode Support
**File:** `src/pages/Chat.tsx`

Added anonymous mode detection and credit checking:

#### Imports Added:
```tsx
import { 
  getOrCreateAnonSession, 
  hasAnonCredits, 
  getAnonRemainingCredits,
  trackAnonCredits 
} from '@/services/anonSessionService';
```

#### State Added:
```tsx
const [isAnonMode, setIsAnonMode] = useState(false);
const [anonCreditsRemaining, setAnonCreditsRemaining] = useState(5);
```

#### Anonymous Mode Detection:
```tsx
useEffect(() => {
  const isAnon = !profile || profile.id.startsWith('guest_') || profile.id.startsWith('anon_');
  setIsAnonMode(isAnon);
  if (isAnon) {
    getOrCreateAnonSession();
    setAnonCreditsRemaining(getAnonRemainingCredits());
  }
}, [profile]);
```

#### handleSend Updates:
- Checks anonymous credit balance before sending messages
- Blocks image generation for anonymous users
- Tracks credit usage after successful messages
- Shows appropriate prompts to sign up

### 4. **Anonymous Chat Wrapper Component** - Optional
**File:** `src/components/chat/AnonymousChatWrapper.tsx` ✅ CREATED

Optional wrapper component that displays:
- Anonymous mode banner at top with remaining credits
- Sign-up prompt when credits run low
- Sticky credit warning at bottom

**Usage (Optional):**
```tsx
import { AnonymousChatWrapper } from '@/components/chat/AnonymousChatWrapper';

// In App.tsx routes
<Route path="/" element={<AnonymousChatWrapper><Chat /></AnonymousChatWrapper>} />
```

## Current State

✅ **COMPLETED:**
- Anonymous session management service
- Chat component anonymous mode detection
- Credit checking in handleSend
- Anonymous feature restrictions

⚠️ **REQUIRES BACKEND CONFIGURATION:**
- API endpoints must support anonymous message handling
- Credit tracking must be persisted server-side for paid features
- Your AI model provider integration (currently uses Google Gemini)

⚠️ **OPTIONAL ENHANCEMENTS:**
- AnonymousChatWrapper component (UI banner/prompts)
- Server-side credit validation
- Rate limiting per IP for anonymous users

## How It Works

### User Visit Flow

1. **User opens index.html**
   ```
   User opens https://flash-ai.app/
   ↓
   App.tsx renders with Router
   ↓
   Route "/" → Chat component loaded
   ↓
   ```

2. **Chat Component Initialization**
   ```
   Chat.tsx useEffect fires
   ↓
   Detects if user profile exists
   ↓
   If NO profile → isAnonMode = true
   ↓
   Creates anonymous session via anonSessionService
   ↓
   Chat UI displays with anonymous restrictions
   ```

3. **User Sends Message**
   ```
   User types message in chat input
   ↓
   Clicks send button → handleSend() called
   ↓
   Checks: hasAnonCredits(1)?
   ↓
   If credits > 0:
     - Sends message to LLM
     - Gets response
     - trackAnonCredits(1) updates counter
   ↓
   If credits = 0:
     - Shows toast: "Daily limit reached"
     - Offers sign-up link
   ```

## Testing Checklist

### Test 1: Anonymous Access
```
[ ] Open index.html in browser (not logged in)
[ ] Chat page loads immediately
[ ] Chat input is available
[ ] Can send first message
[ ] AI responds with streaming chat
[ ] Credits counter updates
```

### Test 2: Credit Limiting
```
[ ] Send 5 messages as anonymous user
[ ] On 6th message, see "Daily limit" toast
[ ] See sign-up prompt
[ ] Can click sign-up link
```

### Test 3: Authenticated Users
```
[ ] Log in with account
[ ] Chat page loads as before
[ ] No credit restrictions
[ ] Can use image generation
[ ] All features available
```

### Test 4: Conversation History
```
[ ] Anonymous: Check localStorage for chat history
[ ] Authenticated: Check server-side conversation storage
[ ] Reload page → history should persist
```

## Backend Requirements

To fully support this feature, your backend needs:

### 1. Anonymous Message Endpoint
```
POST /api/messages
Headers: { X-Anon-Session-Id: "anon_1234..." }
Body: { content: "Hello", model: "f1", effort: "low" }
```

### 2. Credit Validation
```
GET /api/credits/check
Headers: { X-Anon-Session-Id: "anon_1234..." }
Response: { remaining: 4, used: 1, dailyLimit: 5 }
```

### 3. Rate Limiting
```
Implement per-IP rate limiting:
- Anonymous: 5 requests/day OR 1 request/minute
- Authenticated: Per plan limits
```

## Environment Variables

No new environment variables required. Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional additions for future:
```
VITE_ANONYMOUS_DAILY_LIMIT=5
VITE_ANONYMOUS_SESSION_HOURS=24
VITE_ENABLE_ANON_CHAT=true
```

## Feature Restrictions for Anonymous Users

| Feature | Anonymous | Free Account |
|---------|-----------|--------------|
| Chat | ✅ (5 msgs/day) | ✅ Unlimited |
| Image Generation | ❌ | ✅ Limited |
| Video Generation | ❌ | ❌ (Plus+) |
| Conversation History | ✅ (localStorage) | ✅ (server) |
| Model Selection | ✅ (basic) | ✅ (all) |
| Plugins | ❌ | ✅ Limited |
| API Access | ❌ | ❌ (Plus+) |

## Troubleshooting

### Issue: Chat doesn't open on index page
**Solution:** Check `RequireAuth` whitelist includes `'/'` in App.tsx

### Issue: Anonymous mode not detected
**Solution:** Verify `profile` is null or id starts with 'guest_'/'anon_'

### Issue: Credits not tracking
**Solution:** Check `localStorage` in DevTools, look for `flash_anon_session` key

### Issue: TypeScript errors
**Solution:** Run `pnpm install` to ensure all types are available

## Next Steps

1. **Test locally:**
   ```bash
   cd "c:\Users\gshah\Downloads\Flash AI"
   corepack pnpm dev
   # Visit http://localhost:5173
   ```

2. **Verify chat opens immediately** (no login required)

3. **Test message sending** (should work for first 5 messages)

4. **Deploy to production** and monitor anonymous usage

5. **Implement backend validation** for production-ready credit system

## Files Modified/Created

### Created:
- ✅ `src/services/anonSessionService.ts` - Anonymous session management
- ✅ `src/components/chat/AnonymousChatWrapper.tsx` - UI wrapper (optional)

### Modified:
- ✅ `src/App.tsx` - Added '/' to RequireAuth whitelist
- ✅ `src/pages/Chat.tsx` - Added anonymous mode detection and credit checking

## Support

For questions about this implementation, review:
1. Anonymous session service exports
2. Chat component handleSend logic
3. requireAuth whitelist logic
4. localStorage key: `flash_anon_session`

---

**Implementation Status:** ✅ Frontend Complete | ⏳ Awaiting Backend Configuration

**Ready to Test:** Yes, the frontend is ready for testing with mock/dev backend
