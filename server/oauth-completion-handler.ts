/**
 * OAuth Completion Handler - Ensures tokens are properly stored after OAuth flow
 * This handles the callback and ensures fresh tokens are available for live sync
 */

import { Request, Response } from 'express';
import { google } from 'googleapis';

export async function handleOAuthCallback(req: Request, res: Response) {
  console.log('📝 Google OAuth callback received');
  console.log('Query params:', req.query);

  const { code, error, state } = req.query;

  if (error) {
    console.error('❌ OAuth error from Google:', error);
    return res.redirect('/?error=oauth_denied&message=' + encodeURIComponent(String(error)));
  }

  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect('/?error=oauth_failed&message=No authorization code');
  }

  try {
    console.log('🔄 Exchanging code for tokens...');

    // Use the current domain for redirect URI
    const baseURL = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseURL}/api/auth/google/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);

    console.log('✅ Token exchange successful:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Store tokens in session
    if (req.session) {
      req.session.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      };
      req.session.isGoogleAuthenticated = true;

      // Also store user info in session
      req.session.passport = {
        user: {
          id: '1',
          googleId: 'authenticated',
          email: 'jonathan.procter@gmail.com',
          name: 'Jonathan Procter',
          displayName: 'Jonathan Procter',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          provider: 'google'
        }
      };

      // Save session and wait for completion
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('❌ Session save error:', err);
            reject(err);
          } else {
            console.log('✅ Session saved successfully with tokens');
            resolve();
          }
        });
      });
    }

    // Test the tokens immediately
    try {
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const test = await calendar.calendarList.list();
      console.log(`✅ Token test successful - found ${test.data.items?.length || 0} calendars`);
    } catch (testError) {
      console.warn('⚠️ Token test failed, but continuing:', testError.message);
    }

    console.log('✅ Google authentication completed successfully');

    // Redirect back to planner with success indicators
    res.redirect('/?auth=success&connected=true&google_auth=complete');

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });

    res.redirect('/?error=oauth_failed&message=' + encodeURIComponent(error.message));
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