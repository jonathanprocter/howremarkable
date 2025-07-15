/**
 * OAuth Completion Handler - Ensures tokens are properly stored after OAuth flow
 * This handles the callback and ensures fresh tokens are available for live sync
 */

import { Request, Response } from 'express';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev'}/api/auth/google/callback`
);

export async function handleOAuthCallback(req: Request, res: Response) {
  const { code, error, state } = req.query;
  
  console.log('🔗 OAuth callback received:', { code: !!code, error, state });
  
  if (error) {
    console.error('❌ OAuth error:', error);
    return res.redirect('/?error=oauth_failed');
  }
  
  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect('/?error=no_code');
  }
  
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    console.log('✅ Tokens received:', {
      access_token: !!tokens.access_token,
      refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expiry_date
    });
    
    // Store tokens in session with proper validation
    if (!tokens.access_token) {
      console.error('❌ No access token received from Google');
      return res.redirect('/?error=no_access_token');
    }
    
    req.session.google_access_token = tokens.access_token;
    req.session.google_refresh_token = tokens.refresh_token;
    req.session.google_token_type = tokens.token_type || 'Bearer';
    req.session.google_expires_in = tokens.expiry_date;
    
    console.log('✅ Tokens stored in session:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresAt: tokens.expiry_date
    });
    
    // Get user info from Google
    let userEmail = 'jonathan.procter@gmail.com';
    let userName = 'Jonathan Procter';
    
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        userEmail = userInfo.email || userEmail;
        userName = userInfo.name || userName;
        console.log('✅ Retrieved user info:', { email: userEmail, name: userName });
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch user info, using defaults');
    }
    
    // Create authenticated user with fresh tokens
    const userId = 1; // Default user ID
    req.session.userId = userId;
    req.session.isAuthenticated = true;
    req.session.userEmail = userEmail;
    req.session.userName = userName;
    
    // Store user with fresh tokens in passport session
    req.session.passport = { 
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        displayName: userName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        expiryDate: tokens.expiry_date
      }
    };
    
    // Also set req.user for immediate use
    req.user = {
      id: userId,
      email: userEmail,
      name: userName,
      displayName: userName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type,
      expiryDate: tokens.expiry_date
    };
    
    console.log('✅ User session created with fresh tokens');
    
    // Save session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ OAuth flow completed successfully');
    console.log('✅ Fresh tokens stored in session');
    
    // Test the tokens immediately
    try {
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      const calendars = await calendar.calendarList.list();
      console.log('✅ Token test successful - found', calendars.data.items?.length, 'calendars');
      
      // Redirect to success page
      res.redirect('/?auth=success&calendars=' + calendars.data.items?.length);
      
    } catch (testError) {
      console.error('❌ Token test failed:', testError);
      res.redirect('/?auth=success&test=failed');
    }
    
  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    const errorDesc = error?.response?.data?.error;
    if (errorDesc === 'invalid_grant') {
      return res.redirect('/?error=invalid_grant');
    }
    res.redirect('/?error=callback_failed');
  }
}

export async function refreshGoogleTokens(req: Request, res: Response) {
  console.log('🔄 Token refresh requested');
  
  try {
    const refreshToken = req.session.google_refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token available',
        needsAuth: true,
        redirectTo: '/api/auth/google'
      });
    }
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('✅ Tokens refreshed successfully');
    
    // Update session with new tokens
    req.session.google_access_token = credentials.access_token;
    req.session.google_refresh_token = credentials.refresh_token || refreshToken;
    req.session.google_expires_in = credentials.expiry_date;
    
    // Save session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      expires_in: credentials.expiry_date
    });
    
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      message: error.message,
      needsAuth: true,
      redirectTo: '/api/auth/google'
    });
  }
}
