/**
 * Google Authentication Status and Token Management
 */

import { Request, Response } from 'express';

export async function getAuthStatus(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    const isAuthenticated = !!req.user;
    const user = req.user;
    
    // Check Google tokens
    const googleAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    const hasGoogleTokens = !!(googleAccessToken && googleRefreshToken);
    
    // Test Google token validity if available
    let googleTokenValid = false;
    let googleTokenInfo = null;
    
    if (googleAccessToken) {
      try {
        const tokenResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`
          }
        });
        
        if (tokenResponse.ok) {
          googleTokenValid = true;
          googleTokenInfo = await tokenResponse.json();
        }
      } catch (tokenError) {
        // Token validation failed
        console.log('Google token validation failed:', tokenError.message);
      }
    }
    
    // Try to get calendar count if token is valid
    let calendarCount = 0;
    if (googleTokenValid) {
      try {
        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=10', {
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          calendarCount = calendarData.items?.length || 0;
        }
      } catch (calendarError) {
        console.log('Calendar count fetch failed:', calendarError.message);
      }
    }
    
    res.json({
      isAuthenticated,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name || user.displayName
      } : null,
      google: {
        hasTokens: hasGoogleTokens,
        tokenValid: googleTokenValid,
        tokenInfo: googleTokenInfo,
        calendarCount
      },
      sessionInfo: {
        sessionId: req.sessionID,
        passport: req.session?.passport ? 'Present' : 'Missing'
      }
    });
    
  } catch (error) {
    console.error('Auth status check failed:', error);
    res.status(500).json({
      error: 'Auth status check failed',
      message: error.message
    });
  }
}