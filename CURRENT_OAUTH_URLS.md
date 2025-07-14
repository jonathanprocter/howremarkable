# Current OAuth Configuration Required

## Issue: "accounts.google.com refused to connect"

The Google OAuth connection is failing because your Google Cloud Console needs to be updated with the current domain.

## Current Domain
Your app is now running on: `ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev`

## Fix Instructions

### Step 1: Update Google Cloud Console

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Find your OAuth 2.0 Client ID and click "Edit"

### Step 2: Update URLs

**Add these exact URLs to your OAuth configuration:**

**Authorized JavaScript origins:**
```
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev
```

**Authorized redirect URIs:**
```
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback
```

### Step 3: Save Changes

Click "Save" in the Google Cloud Console after adding both URLs.

### Step 4: Test

After updating the URLs, try clicking "Reconnect to Google Calendar" again. The OAuth flow should now work properly.

## What's Fixed

The system now automatically detects the correct domain and uses:
- Environment tokens for authentication
- Proper fallback when refresh tokens fail
- Correct OAuth callback URL generation

Once you update the Google Cloud Console URLs, the reconnection should work without the "refused to connect" error.