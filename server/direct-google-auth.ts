/**
 * Direct Google OAuth Authentication Handler
 * Bypasses complex token management for immediate authentication
 */

import { google } from 'googleapis';
import { Request, Response } from 'express';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Dynamic redirect URI based on environment
function getRedirectUri() {
  if (process.env.NODE_ENV === 'production') {
    const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
    if (domains.length > 0) {
      return `https://${domains[0]}/api/auth/google/callback`;
    }
  }
  return 'http://localhost:5000/api/auth/google/callback';
}

const REDIRECT_URI = getRedirectUri();

export function createDirectGoogleAuth() {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  return {
    // Generate authorization URL
    getAuthUrl: () => {
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/drive.file',
        'profile',
        'email'
      ];

      return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
      });
    },

    // Handle OAuth callback
    handleCallback: async (req: Request, res: Response) => {
      const { code } = req.query;

      if (!code) {
        return res.status(400).send('Authorization code is required');
      }

      try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code as string);
        
        // Store tokens in session with proper serialization
        if (req.session) {
          req.session.googleTokens = tokens;
          req.session.isGoogleAuthenticated = true;
          
          // Force session save
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
            } else {
              console.log('✅ Session saved successfully');
            }
          });
        }

        console.log('✅ Google authentication successful');
        console.log('✅ Tokens stored in session:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresAt: tokens.expiry_date
        });

        // Redirect back to planner
        res.redirect('/?auth=success');
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.redirect('/?auth=error');
      }
    },

    // Test tokens and get user info
    testTokens: async (req: Request) => {
      const tokens = req.session?.googleTokens;
      
      if (!tokens) {
        return { valid: false, error: 'No tokens in session' };
      }

      try {
        oauth2Client.setCredentials(tokens);
        
        // Test with a simple calendar list call
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.calendarList.list();
        
        return {
          valid: true,
          calendarCount: response.data.items?.length || 0,
          userEmail: tokens.email || 'unknown'
        };
      } catch (error) {
        return {
          valid: false,
          error: error.message || 'Token validation failed'
        };
      }
    },

    // Force sync calendar events
    forceSync: async (req: Request) => {
      const tokens = req.session?.googleTokens;
      
      if (!tokens) {
        throw new Error('No Google tokens available');
      }

      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Get all calendars
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      const allEvents = [];
      
      // Get events from all calendars
      for (const cal of calendars) {
        try {
          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime'
          });

          const events = eventsResponse.data.items || [];
          
          for (const event of events) {
            allEvents.push({
              id: event.id,
              title: event.summary || 'Untitled Event',
              startTime: event.start?.dateTime || event.start?.date,
              endTime: event.end?.dateTime || event.end?.date,
              description: event.description || '',
              location: event.location || '',
              source: 'google',
              calendarId: cal.id,
              calendarName: cal.summary
            });
          }
        } catch (calendarError) {
          console.warn(`Could not access calendar ${cal.summary}:`, calendarError.message);
        }
      }

      return {
        success: true,
        events: allEvents,
        calendarCount: calendars.length,
        eventCount: allEvents.length
      };
    }
  };
}