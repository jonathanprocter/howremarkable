# Google OAuth Fix for Deployment

## Problem
Your app was trying to use hardcoded URLs for Google OAuth authentication, causing authentication failures when deployed to different domains.

## Solution Applied
1. **Updated OAuth Configuration**: Fixed OAuth configuration to use the current active domain
2. **Current Domain**: `8dd562d7-fb4c-4966-813d-5a9539b6da21-00-3jakdewsp4cjj.kirk.replit.dev`

## Required Google Cloud Console Configuration

To fix your Google Calendar authentication, you need to update your Google Cloud Console settings:

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com
- Select your project for the reMarkable Pro Digital Planner

### 2. Update OAuth 2.0 Client ID
- Navigate to: **APIs & Services** → **Credentials**
- Find your OAuth 2.0 Client ID for "reMarkable Planner"
- Click **Edit** (pencil icon)

### 3. Update Authorized URLs
Add these EXACT URLs to your OAuth configuration:

**Authorized JavaScript origins:**
```
https://8dd562d7-fb4c-4966-813d-5a9539b6da21-00-3jakdewsp4cjj.kirk.replit.dev
```

**Authorized redirect URIs:**
```
https://8dd562d7-fb4c-4966-813d-5a9539b6da21-00-3jakdewsp4cjj.kirk.replit.dev/api/auth/google/callback
```

### 4. Verify APIs Are Enabled
Make sure these APIs are enabled in your project:
- Google Calendar API
- Google Drive API

### 5. OAuth Consent Screen
- Navigate to: **APIs & Services** → **OAuth consent screen**
- Ensure the app status is **"In production"** (not "Testing")
- If it's in testing mode, click **"PUBLISH APP"**

## Testing After Configuration

1. **Test OAuth Configuration**: Visit `/api/auth/test` to verify credentials
2. **Test Authentication**: Visit `/api/auth/google` to start OAuth flow
3. **Check Status**: Visit `/api/auth/status` to verify authentication state

## What Was Fixed in Code

- ✅ Dynamic OAuth callback URL detection
- ✅ Automatic domain resolution from environment variables
- ✅ Updated all hardcoded URLs to use dynamic baseURL
- ✅ Enhanced error messages with correct URLs
- ✅ Improved debugging output

## Next Steps

1. Update your Google Cloud Console with the URLs above
2. Test the authentication flow
3. Your Google Calendar integration should work correctly after these changes

## Troubleshooting

If you still have issues:
1. Check that both JavaScript origins AND redirect URIs are added
2. Verify the OAuth consent screen is published
3. Ensure API quotas are not exceeded
4. Check that the OAuth client ID and secret are correctly set in your environment variables