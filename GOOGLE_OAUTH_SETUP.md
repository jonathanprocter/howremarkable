# Google OAuth Configuration for reMarkable Pro Digital Planner

## 403 Error Fix

The 403 error occurs because the Google Cloud Console project needs proper configuration. Here's how to fix it:

### Required Configuration

**Your Replit URL:** `ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev`

### Steps to Configure Google Cloud Console:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your project or create a new one

2. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - Google Calendar API
     - Google Drive API

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: "reMarkable Pro Digital Planner"
     - User support email: your email
     - Developer contact: your email
   - **IMPORTANT**: After configuring, click "PUBLISH APP" (not just save as draft)
   - The app must be "In production" status, not "Testing"

4. **Set Up OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "reMarkable Planner"
   - **Authorized JavaScript origins:** Add this exact URL:
     ```
     https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev
     ```
   - **Authorized redirect URIs:** Add this exact URL:
     ```
     https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback
     ```

   **NOTE:** The above URLs are for the current deployment. The app now automatically detects the correct domain, but you must update your Google Cloud Console OAuth settings to match the current domain.

5. **Copy Client ID and Secret**
   - Copy the Client ID and Client Secret
   - These should already be configured in your Replit secrets

### Required OAuth Scopes:
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/drive.file`
- `profile`
- `email`

### Test After Configuration:
1. Click "Connect Google Calendar" in the app
2. You should see Google's OAuth consent screen
3. After approval, you'll be redirected back to the app
4. The "Refresh Events" button will then load your calendar events

### Troubleshooting:
- If you still get 403, double-check both URIs are added:
  - **JavaScript origins:** `https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev`
  - **Redirect URI:** `https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback`
- Make sure both Calendar and Drive APIs are enabled
- Verify the OAuth consent screen is published (not in testing mode)

### IMPORTANT: You need BOTH URLs configured:
1. **Authorized JavaScript origins** (without /api/auth/google/callback)
2. **Authorized redirect URIs** (with /api/auth/google/callback)