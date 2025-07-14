# 🔧 OAuth Configuration Update Instructions

## Step 1: Access Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Make sure you're in the correct project
3. Navigate to **APIs & Services** > **Credentials**

## Step 2: Find Your OAuth Client
Look for your OAuth 2.0 Client ID:
```
839967078225-sjhemk0h654iv9jbc58lears67ntt877.apps.googleusercontent.com
```

## Step 3: Edit OAuth Configuration
Click on the OAuth client to edit it.

### Add Authorized JavaScript Origins:
In the "Authorized JavaScript origins" section, add these URLs:
```
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev
https://74f7ce88-fe0b-4c1d-8cef-f88cd617484f-00-3j2whcz0hegoz.kirk.replit.dev
```

### Add Authorized Redirect URIs:
In the "Authorized redirect URIs" section, add these URLs:
```
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback
https://74f7ce88-fe0b-4c1d-8cef-f88cd617484f-00-3j2whcz0hegoz.kirk.replit.dev/api/auth/google/callback
```

## Step 4: Save Configuration
Click **Save** to apply the changes.

## Step 5: Test OAuth Flow
After saving, you can test the OAuth flow by clicking the "Fix Authentication" button in your calendar app.

## 📋 Current Configuration Status
- **Development URL**: `https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev`
- **Deployment URL**: `https://74f7ce88-fe0b-4c1d-8cef-f88cd617484f-00-3j2whcz0hegoz.kirk.replit.dev`
- **Client ID**: `839967078225-sjhemk0h654iv9jbc58lears67ntt877.apps.googleusercontent.com`

## ✅ What This Will Fix
- Google Calendar authentication for new users
- Live sync of newly created Google Calendar events
- Fresh token generation for expired tokens
- Complete OAuth flow functionality

The application will work immediately after this configuration update!