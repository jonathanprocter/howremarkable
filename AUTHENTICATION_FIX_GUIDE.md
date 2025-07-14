# Authentication Fix Guide

## Current Issue
The Google OAuth tokens have expired and the token refresh is failing with "invalid_grant" error. This causes:
- Export functionality to fail
- System to fall back to development mode
- Unable to access real Google Calendar data

## Solution Steps

### 1. Re-authenticate with Google
1. Visit your app at: https://HowreMarkable.replit.app
2. Click "Force Google Reconnect" button (blue button in the interface)
3. Complete the Google OAuth flow
4. Grant all requested permissions

### 2. Verify Authentication
After reconnecting, you should see:
- "Connected with tokens" status
- Real Google Calendar events loading
- Export functionality working

### 3. If Still Having Issues
The refresh token may be permanently expired. This happens when:
- The app hasn't been used for 7 days
- Google revoked the refresh token
- OAuth consent screen was modified

**Solution**: Complete fresh authentication by clicking "Force Google Reconnect"

## Technical Details
- The app is configured for domain: https://HowreMarkable.replit.app
- OAuth callback URL: https://HowreMarkable.replit.app/api/auth/google/callback
- Required scopes: calendar.readonly, drive.file, profile, email

## After Fix
Once authentication is restored:
- ✅ Google Calendar events will load properly
- ✅ PDF exports will work with real data
- ✅ No more "invalid_grant" errors
- ✅ System will stop falling back to dev mode

## Test Commands
You can test authentication status by running in browser console:
```javascript
fetch('/api/auth/status').then(r => r.json()).then(console.log)
```

Should show `isAuthenticated: true` and `hasTokens: true` with real tokens.