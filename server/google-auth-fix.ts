import { Request, Response } from 'express';
import { google } from 'googleapis';

export async function fixGoogleAuthentication(req: Request, res: Response) {
  console.log('🔧 Starting Google Authentication Fix');
  
  try {
    // Check if we have the required OAuth credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ Missing Google OAuth credentials');
      return res.status(500).json({ 
        error: 'Missing OAuth credentials',
        message: 'Google Client ID and Secret are required',
        needsAuth: true
      });
    }

    // Set up OAuth2 client with current domain detection
    const baseURL = process.env.REPLIT_DOMAINS?.split(',')[0] || 
                   'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseURL}/api/auth/google/callback`
    );

    // Test current tokens if they exist
    if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('🔍 Testing existing tokens...');
      
      oauth2Client.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      try {
        // Test token by making a simple API call
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.calendarList.list({ maxResults: 1 });
        
        console.log('✅ Existing tokens are valid');
        return res.json({
          success: true,
          message: 'Google authentication is working properly',
          tokenStatus: 'valid',
          needsAuth: false
        });
      } catch (tokenError) {
        console.log('⚠️ Existing tokens are invalid, need re-authentication');
        
        // Try to refresh the token
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          console.log('✅ Token refresh successful');
          
          return res.json({
            success: true,
            message: 'Tokens refreshed successfully',
            tokenStatus: 'refreshed',
            needsAuth: false,
            newTokens: {
              accessToken: credentials.access_token,
              refreshToken: credentials.refresh_token,
              expiryDate: credentials.expiry_date
            }
          });
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.message);
          
          // Tokens are invalid, need full re-authentication
          const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
              'https://www.googleapis.com/auth/calendar.readonly',
              'https://www.googleapis.com/auth/drive.file',
              'profile',
              'email'
            ],
            prompt: 'consent'
          });

          return res.json({
            success: false,
            message: 'Google authentication required',
            tokenStatus: 'expired',
            needsAuth: true,
            authUrl: authUrl,
            redirectTo: '/api/auth/google'
          });
        }
      }
    } else {
      console.log('❌ No Google tokens found in environment');
      
      // Generate auth URL for fresh authentication
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/drive.file',
          'profile',
          'email'
        ],
        prompt: 'consent'
      });

      return res.json({
        success: false,
        message: 'Google authentication required',
        tokenStatus: 'missing',
        needsAuth: true,
        authUrl: authUrl,
        redirectTo: '/api/auth/google'
      });
    }
  } catch (error) {
    console.error('❌ Google authentication fix failed:', error);
    
    return res.status(500).json({
      error: 'Authentication fix failed',
      message: error.message,
      needsAuth: true,
      redirectTo: '/api/auth/google'
    });
  }
}

export async function getGoogleAuthStatus(req: Request, res: Response) {
  console.log('🔍 Checking Google authentication status');
  
  try {
    const hasTokens = !!(process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN);
    const hasCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    
    let tokenStatus = 'unknown';
    let calendarAccess = false;
    
    if (hasTokens) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      
      oauth2Client.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.calendarList.list({ maxResults: 1 });
        
        tokenStatus = 'valid';
        calendarAccess = true;
        
        console.log('✅ Google Calendar API access confirmed');
      } catch (error) {
        tokenStatus = 'invalid';
        calendarAccess = false;
        
        console.log('❌ Google Calendar API access failed:', error.message);
      }
    } else {
      tokenStatus = 'missing';
    }
    
    return res.json({
      hasCredentials,
      hasTokens,
      tokenStatus,
      calendarAccess,
      needsAuth: !calendarAccess,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Auth status check failed:', error);
    
    return res.status(500).json({
      error: 'Auth status check failed',
      message: error.message,
      needsAuth: true
    });
  }
}
