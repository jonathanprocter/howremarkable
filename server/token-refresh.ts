
import { Request, Response } from 'express';

export async function forceTokenRefresh(req: Request, res: Response) {
  console.log('🔄 Force token refresh requested');
  
  try {
    const refreshToken = req.session?.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token available',
        needsAuth: true,
        redirectTo: '/api/auth/google'
      });
    }

    console.log('🔄 Attempting to refresh tokens...');
    
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json();
      console.error('❌ Token refresh failed:', errorData);
      
      if (errorData.error === 'invalid_grant') {
        return res.status(401).json({
          error: 'Refresh token expired - please re-authenticate',
          needsAuth: true,
          redirectTo: '/api/auth/google'
        });
      }
      
      return res.status(500).json({
        error: 'Token refresh failed',
        details: errorData
      });
    }

    const tokenData = await refreshResponse.json();
    console.log('✅ Token refresh successful');

    // Update session with new tokens
    if (req.session) {
      req.session.google_access_token = tokenData.access_token;
      if (tokenData.refresh_token) {
        req.session.google_refresh_token = tokenData.refresh_token;
      }
      req.session.google_expires_in = tokenData.expires_in ? 
        Date.now() + (tokenData.expires_in * 1000) : undefined;
    }

    // Test the new token
    try {
      const testResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      if (testResponse.ok) {
        console.log('✅ New token validated successfully');
        
        return res.json({
          success: true,
          message: 'Tokens refreshed and validated successfully',
          tokenInfo: {
            hasAccessToken: !!tokenData.access_token,
            hasRefreshToken: !!tokenData.refresh_token,
            expiresIn: tokenData.expires_in
          }
        });
      } else {
        console.warn('⚠️ New token validation failed');
        return res.status(401).json({
          error: 'Token validation failed',
          needsAuth: true,
          redirectTo: '/api/auth/google'
        });
      }
    } catch (testError) {
      console.error('❌ Token validation error:', testError);
      return res.status(500).json({
        error: 'Token validation failed',
        details: testError.message
      });
    }

  } catch (error) {
    console.error('❌ Force token refresh failed:', error);
    return res.status(500).json({
      error: 'Force token refresh failed',
      details: error.message
    });
  }
}
