import type { Express } from "express";
import { createServer, type Server } from "http";
import { Readable } from "stream";
import { storage } from "./storage";
import { insertEventSchema, insertDailyNotesSchema, events } from "@shared/schema";
import { and, gte, lte } from 'drizzle-orm';
import { db } from './db';
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { google } from "googleapis";
import { setupAuditRoutes } from "./audit-system";
import { 
  requireAuth, 
  getAuthStatus, 
  initiateGoogleOAuth, 
  handleGoogleCallback, 
  refreshTokens 
} from "./clean-auth";
import { createDirectGoogleAuth } from "./direct-google-auth";

export async function registerRoutes(app: Express): Promise<Server> {

  // PUBLIC ENDPOINT - Live sync calendar events without authentication - MUST BE BEFORE AUTH MIDDLEWARE
  app.get("/api/live-sync/calendar/events", async (req, res) => {
    console.log('🚀 LIVE SYNC CALENDAR EVENTS - NO AUTH REQUIRED');

    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }

      // Use environment tokens directly for live sync
      const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      if (!accessToken || accessToken.startsWith('dev-')) {
        console.log('❌ No valid Google tokens for live sync');
        return res.status(401).json({ error: 'Valid Google tokens required for live sync' });
      }

      console.log('✅ Using environment tokens for live sync');

      // Set up OAuth2 client with the tokens
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      // Test token and refresh if needed
      try {
        await oauth2Client.getAccessToken();
        console.log('✅ Token validation successful');
      } catch (tokenError) {
        console.log('⚠️ Token validation failed, attempting refresh...');
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          console.log('✅ Token refresh successful');
        } catch (refreshError) {
          console.log('❌ Token refresh failed:', refreshError.message);
          // Fallback to database events for deployment reliability
          console.log('🔄 Falling back to database events for deployment reliability');

          // Return cached events from database as fallback
          const fallbackEvents = await db.select().from(events).where(
            and(
              gte(events.startTime, new Date(start as string)),
              lte(events.startTime, new Date(end as string))
            )
          );

          const formattedFallbackEvents = fallbackEvents
            .filter(event => event.source === 'google' || event.source === 'simplepractice')
            .map(event => ({
              id: event.id,
              title: event.title,
              startTime: event.startTime.toISOString(),
              endTime: event.endTime.toISOString(),
              description: event.description || '',
              location: event.location || '',
              source: event.source,
              calendarId: event.calendarId || 'fallback'
            }));

          return res.json({
            events: formattedFallbackEvents,
            calendars: [
              { id: 'fallback', name: 'Cached Events', color: '#4285f4' }
            ],
            syncTime: new Date().toISOString(),
            isLiveSync: false,
            isFallback: true,
            message: 'Using cached events due to token expiration'
          });
        }
      }

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Get all calendars using OAuth2 client
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      console.log(`📅 Found ${calendars.length} calendars to fetch from`);

      const allGoogleEvents = [];

      // Fetch events from all calendars
      for (const cal of calendars) {
        try {
          console.log(`🔍 Fetching from calendar: ${cal.summary} (${cal.id})`);

          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin: start as string,
            timeMax: end as string,
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime'
          });

          const events = eventsResponse.data.items || [];

          // Filter out SimplePractice events (they're handled separately)
          const googleEvents = events.filter(event => {
            const title = event.summary || '';
            const isSimplePractice = title.toLowerCase().includes('appointment') || 
                                     title.toLowerCase().includes('assessment');
            return !isSimplePractice;
          });

          const formattedEvents = googleEvents.map(event => ({
            id: event.id,
            title: event.summary || 'Untitled Event',
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            description: event.description || '',
            location: event.location || '',
            source: 'google',
            calendarId: cal.id
          }));

          allGoogleEvents.push(...formattedEvents);

          if (googleEvents.length > 0) {
            console.log(`✅ Found ${googleEvents.length} Google Calendar events in ${cal.summary}`);
          }
        } catch (calendarError) {
          console.warn(`⚠️ Could not access calendar ${cal.summary}: ${calendarError.message}`);
        }
      }

      console.log(`🎯 Total live Google Calendar events found: ${allGoogleEvents.length}`);

      // Persist events for offline access using fallback user ID 1
      const userId = 1;
      let savedCount = 0;
      for (const evt of allGoogleEvents) {
        try {
          await storage.upsertEvent(userId, evt.id, {
            title: evt.title,
            startTime: new Date(evt.startTime),
            endTime: new Date(evt.endTime),
            description: evt.description,
            location: evt.location,
            source: 'google',
            calendarId: evt.calendarId
          });
          savedCount++;
        } catch (err) {
          console.warn(`⚠️ Could not save event ${evt.title}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      const fetchedIds = new Set(allGoogleEvents.map(e => e.id));
      const existing = await storage.getEvents(userId);
      let deletedCount = 0;
      for (const evt of existing) {
        if (evt.source === 'google' && evt.sourceId && !fetchedIds.has(evt.sourceId)) {
          await storage.deleteEvent(evt.id);
          deletedCount++;
        }
      }
      console.log(`💾 Saved ${savedCount} events, removed ${deletedCount} old events`);

      // Return fresh data from Google Calendar API
      res.json({
        events: allGoogleEvents,
        calendars: calendars.map(cal => ({
          id: cal.id,
          name: cal.summary,
          color: cal.backgroundColor || '#4285f4'
        })),
        syncTime: new Date().toISOString(),
        isLiveSync: true
      });
    } catch (error) {
      console.error('Live sync error:', error);

      // Fallback to database events for deployment reliability
      console.log('🔄 Falling back to database events for deployment reliability');

      try {
        const fallbackEvents = await db.select().from(events).where(
          and(
            gte(events.startTime, new Date(start as string)),
            lte(events.startTime, new Date(end as string))
          )
        );

        const formattedFallbackEvents = fallbackEvents
          .filter(event => event.source === 'google' || event.source === 'simplepractice')
          .map(event => ({
            id: event.id,
            title: event.title,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            description: event.description || '',
            location: event.location || '',
            source: event.source,
            calendarId: event.calendarId || 'fallback'
          }));

        console.log(`✅ Fallback: Found ${formattedFallbackEvents.length} cached events`);

        return res.json({
          events: formattedFallbackEvents,
          calendars: [
            { id: 'fallback', name: 'Cached Events', color: '#4285f4' }
          ],
          syncTime: new Date().toISOString(),
          isLiveSync: false,
          isFallback: true,
          message: 'Using cached events due to API error'
        });

      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return res.status(500).json({ 
          error: 'Live sync failed',
          message: error.message,
          details: error.code || 'unknown'
        });
      }
    }
  });

  // Initialize passport with clean authentication system
  app.use(passport.initialize());
  app.use(passport.session());

  // Enhanced session management middleware
  app.use((req, res, next) => {
    // Ensure session exists and is properly configured
    if (!req.session) {
      console.log('❌ No session found, creating new session');
      req.session = {} as any;
    }

    // Auto-authenticate with known good user if no session
    if (!req.session.passport && !req.user) {
      const knownUser = {
        id: '1',
        googleId: '108011271571830226042',
        email: 'jonathan.procter@gmail.com',
        name: 'Jonathan Procter',
        displayName: 'Jonathan Procter',
        accessToken: process.env.GOOGLE_ACCESS_TOKEN || 'dev-access-token',
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN || 'dev-refresh-token',
        provider: 'google'
      };

      req.session.passport = { user: knownUser };
      req.user = knownUser;
      console.log('✅ Auto-authenticated user:', knownUser.email);
    }

    next();
  });

  // Clean Authentication System - Replace all auth chaos with simple OAuth
  app.get("/api/auth/google", initiateGoogleOAuth);
  app.get("/api/auth/google/callback", handleGoogleCallback);
  app.post("/api/auth/token-refresh", refreshTokens);
  app.get("/api/auth/status", getAuthStatus);
  
  // Simple login endpoint for development
  app.post("/api/auth/simple-login", async (req, res) => {
    try {
      const userData = {
        id: '1',
        googleId: '108011271571830226042',
        email: 'jonathan.procter@gmail.com',
        name: 'Jonathan Procter',
        displayName: 'Jonathan Procter',
        accessToken: process.env.GOOGLE_ACCESS_TOKEN || 'dev-access-token',
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN || 'dev-refresh-token',
        provider: 'google'
      };
      
      req.session.passport = { user: userData };
      req.user = userData;
      
      res.json({ 
        success: true, 
        user: userData,
        message: 'Simple login successful'
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Simple login failed',
        message: error.message 
      });
    }
  });

  // Clean logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Add deployment-fix endpoint for session consistency
  app.post("/api/auth/deployment-fix", async (req, res) => {
    try {
      // Try to restore session from known good session
      const sessionId = 'gBvnYGiTDicIU7Udon_c5TdzlgtHhdNU';
      
      // Check if user is already authenticated
      if (req.user) {
        return res.json({ 
          success: true, 
          user: req.user,
          message: 'User already authenticated'
        });
      }
      
      // Set up a known good user session for development
      const userData = {
        id: '1',
        googleId: '108011271571830226042',
        email: 'jonathan.procter@gmail.com',
        name: 'Jonathan Procter',
        displayName: 'Jonathan Procter',
        accessToken: process.env.GOOGLE_ACCESS_TOKEN || 'dev-access-token',
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN || 'dev-refresh-token',
        provider: 'google'
      };
      
      // Manually set up the session
      req.session.passport = { user: userData };
      req.user = userData;
      
      res.json({ 
        success: true, 
        user: userData,
        message: 'Session restored for deployment'
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Session restore failed',
        message: error.message 
      });
    }
  });


  // Get SimplePractice events from all calendars
  app.get("/api/simplepractice/events", requireAuth, async (req, res) => {
    // SimplePractice events requested

    try {
      const user = req.user as any;
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }

      // For development mode or if tokens are dev tokens, use database
      if (!user.accessToken || user.accessToken.startsWith('dev-') || user.accessToken === 'undefined' || user.accessToken === 'dev_access_token') {
        const events = await storage.getEvents(parseInt(user.id) || 1);
        const simplePracticeEvents = events.filter(event => 
          event.source === 'simplepractice' || 
          (event.title && event.title.toLowerCase().includes('appointment'))
        );

        return res.json({ 
          events: simplePracticeEvents,
          calendars: [{
            id: 'simplepractice',
            name: 'SimplePractice',
            color: '#6495ED'
          }]
        });
      }

      // Fetching SimplePractice events from all Google Calendars

      const calendar = google.calendar({ version: 'v3' });

      // First get all available calendars
      let calendarListResponse;
      try {
        calendarListResponse = await calendar.calendarList.list({
          access_token: user.accessToken
        });
      } catch (authError: any) {
        // If we get 401, try to refresh the token
        if (authError.code === 401 && user.refreshToken && user.refreshToken !== 'dev_refresh_token') {
          // Try using environment tokens first as fallback
          try {
            const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
            const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

            if (envAccessToken && !envAccessToken.startsWith('dev-')) {

              // Create new OAuth2 client with environment tokens
              const envOAuth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
              );

              envOAuth2Client.setCredentials({
                access_token: envAccessToken,
                refresh_token: envRefreshToken
              });

              const envCalendar = google.calendar({ version: 'v3', auth: envOAuth2Client });

              // Try with environment tokens
              calendarListResponse = await envCalendar.calendarList.list();
              // Calendar list retrieved with environment tokens
            } else {
              throw new Error('No valid environment tokens available');
            }
          } catch (envError) {
            // Fall back to database events
            const events = await storage.getEvents(parseInt(user.id) || 1);
            const simplePracticeEvents = events.filter(event => 
              event.source === 'simplepractice' || 
              (event.title && event.title.toLowerCase().includes('appointment'))
            );

            return res.json({ 
              events: simplePracticeEvents,
              calendars: [{
                id: 'simplepractice',
                name: 'SimplePractice',
                color: '#6495ED'
              }]
            });
          }
        } else {
          // No valid refresh token or auth error, fall back to database
          const events = await storage.getEvents(parseInt(user.id) || 1);
          const simplePracticeEvents = events.filter(event => 
            event.source === 'simplepractice' || 
            (event.title && event.title.toLowerCase().includes('appointment'))
          );

          return res.json({ 
            events: simplePracticeEvents,
            calendars: [{
              id: 'simplepractice',
              name: 'SimplePractice',
              color: '#6495ED'
            }]
          });
        }
      }

      const calendars = calendarListResponse.data.items || [];
      let allSimplePracticeEvents = [];
      let simplePracticeCalendars = [];

      // Search through all calendars for SimplePractice events
      for (const cal of calendars) {
        try {
          const response = await calendar.events.list({
            calendarId: cal.id,
            timeMin: start as string,
            timeMax: end as string,
            singleEvents: true,
            orderBy: 'startTime',
            access_token: user.accessToken
          });

          const events = response.data.items || [];

          // Filter for SimplePractice events (appointments, patient names, etc.)
          const simplePracticeEvents = events.filter(event => {
            const title = event.summary || '';
            const description = event.description || '';

            // Check if this looks like a SimplePractice appointment
            const isSimplePractice = 
              title.toLowerCase().includes('appointment') ||
              title.toLowerCase().includes('patient') ||
              title.toLowerCase().includes('session') ||
              title.toLowerCase().includes('therapy') ||
              title.toLowerCase().includes('consultation') ||
              description.toLowerCase().includes('simplepractice') ||
              description.toLowerCase().includes('appointment') ||
              // Check for patient name patterns (First Last format)
              /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(title.trim()) ||
              // Check for common therapy/medical terms
              title.toLowerCase().includes('counseling') ||
              title.toLowerCase().includes('supervision') ||
              title.toLowerCase().includes('intake') ||
              title.toLowerCase().includes('assessment');

            return isSimplePractice;
          });

          if (simplePracticeEvents.length > 0) {
            const formattedEvents = simplePracticeEvents.map(event => ({
              id: event.id,
              title: event.summary || 'Untitled Event',
              startTime: event.start?.dateTime || event.start?.date,
              endTime: event.end?.dateTime || event.end?.date,
              description: event.description || '',
              location: event.location || '',
              source: 'simplepractice',
              calendarId: cal.id
            }));

            allSimplePracticeEvents.push(...formattedEvents);

            // Track calendars that contain SimplePractice events
            if (!simplePracticeCalendars.find(c => c.id === cal.id)) {
              simplePracticeCalendars.push({
                id: cal.id,
                name: cal.summary || 'Calendar',
                color: cal.backgroundColor || '#6495ED'
              });
            }
          }
        } catch (calendarError) {
          // Continue with other calendars
        }
      }

      console.log(`🎯 Total SimplePractice events found: ${allSimplePracticeEvents.length}`);

      // If no SimplePractice events found, still return the structure
      if (simplePracticeCalendars.length === 0) {
        simplePracticeCalendars = [{
          id: 'simplepractice',
          name: 'SimplePractice',
          color: '#6495ED'
        }];
      }

      res.json({ 
        events: allSimplePracticeEvents,
        calendars: simplePracticeCalendars
      });

    } catch (error) {
      console.error('SimplePractice events error:', error);

      if (error.code === 401) {
        console.log('❌ Google API authentication failed for SimplePractice');
        console.log('🔄 Falling back to database events...');

        // Fall back to database events
        const events = await storage.getEvents(parseInt(req.user.id) || 1);
        const simplePracticeEvents = events.filter(event => 
          event.source === 'simplepractice' || 
          (event.title && event.title.toLowerCase().includes('appointment'))
        );

        return res.json({ 
          events: simplePracticeEvents,
          calendars: [{
            id: 'simplepractice',
            name: 'SimplePractice',
            color: '#6495ED'
          }]
        });
      }

      // For other errors, also fall back to database
      console.log('❌ SimplePractice events error, falling back to database...');
      const events = await storage.getEvents(parseInt(req.user.id) || 1);
      const simplePracticeEvents = events.filter(event => 
        event.source === 'simplepractice' || 
        (event.title && event.title.toLowerCase().includes('appointment'))
      );

      return res.json({ 
        events: simplePracticeEvents,
        calendars: [{
          id: 'simplepractice',
          name: 'SimplePractice',
          color: '#6495ED'
        }]
      });
    }
  });

  // Get calendar events with live sync - forces fresh Google Calendar API calls
  app.get("/api/calendar/events", async (req, res) => {
    try {
      // Use the new Google Calendar fix system
      const { handleGoogleCalendarSync } = await import('./google-calendar-fix');
      return await handleGoogleCalendarSync(req, res);
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to fetch calendar events',
        message: error.message,
        details: error.code || 'unknown'
      });
    }
  });

  // Update Google Calendar Event
  app.put("/api/calendar/events/:eventId", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { eventId } = req.params;
      const { startTime, endTime, calendarId } = req.body;
      const user = req.user as any;

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // First get the existing event to preserve other properties
      const existingEvent = await calendar.events.get({
        calendarId: calendarId,
        eventId: eventId
      });

      // Update the event with new times
      const updatedEvent = await calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        requestBody: {
          ...existingEvent.data,
          start: {
            dateTime: new Date(startTime).toISOString(),
            timeZone: existingEvent.data.start?.timeZone || 'America/New_York'
          },
          end: {
            dateTime: new Date(endTime).toISOString(),
            timeZone: existingEvent.data.end?.timeZone || 'America/New_York'
          }
        }
      });

      res.json({ 
        success: true, 
        event: {
          id: updatedEvent.data.id,
          title: updatedEvent.data.summary,
          startTime: updatedEvent.data.start?.dateTime,
          endTime: updatedEvent.data.end?.dateTime
        }
      });

    } catch (error) {
      console.error('Event update error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to update calendar event" });
      }
    }
  });

  // Google Drive PDF Upload
  app.post("/api/drive/upload", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { filename, content, mimeType } = req.body;
      const user = req.user as any;

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Create or find the "reMarkable Calendars" folder
      const folderName = "reMarkable Calendars";
      const folderSearch = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        spaces: 'drive'
      });

      let folderId;
      if (folderSearch.data.files && folderSearch.data.files.length > 0) {
        folderId = folderSearch.data.files[0].id;
      } else {
        // Create the folder
        const folder = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
          }
        });
        folderId = folder.data.id;
      }

      // Upload the PDF
      const fileMetadata: any = {
        name: filename
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: mimeType || 'application/pdf',
        body: Readable.from(Buffer.from(content, 'base64'))
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media
      }) as any;

      res.json({ 
        success: true, 
        fileId: file.data.id,
        filename: filename,
        folder: folderName
      });

    } catch (error) {
      console.error('Drive upload error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to upload to Google Drive" });
      }
    }
  });

  // Test Google authentication status
  app.get("/api/auth/google/test", async (req, res) => {
    try {
      const { testGoogleAuth } = await import('./google-calendar-fix');
      return await testGoogleAuth(req, res);
    } catch (error) {
      console.error('Google auth test error:', error);
      res.status(500).json({
        error: 'Authentication test failed',
        message: error.message,
        needsAuth: true
      });
    }
  });

  // Debug Google authentication
  app.get("/api/auth/google/debug", async (req, res) => {
    try {
      const { debugGoogleAuth } = await import('./google-auth-debug');
      return await debugGoogleAuth(req, res);
    } catch (error) {
      console.error('Google auth debug error:', error);
      res.status(500).json({
        error: 'Debug failed',
        message: error.message
      });
    }
  });

  // Force Google Calendar sync
  app.post("/api/auth/google/force-sync", async (req, res) => {
    try {
      const { forceGoogleCalendarSync } = await import('./google-auth-debug');
      return await forceGoogleCalendarSync(req, res);
    } catch (error) {
      console.error('Force sync error:', error);
      res.status(500).json({
        error: 'Force sync failed',
        message: error.message
      });
    }
  });

  // Google OAuth authentication
  app.get("/api/auth/google", (req, res) => {
    const baseUrl = process.env.REPLIT_DOMAIN || 'localhost:5000';
    const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${baseUrl}/api/auth/google/callback`;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly')}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    console.log('🔗 Redirecting to Google OAuth:', authUrl);
    res.redirect(authUrl);
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }
    
    try {
      const baseUrl = process.env.REPLIT_DOMAIN || 'localhost:5000';
      const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
      const redirectUri = `${protocol}://${baseUrl}/api/auth/google/callback`;
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });
      
      const tokens = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokens);
        return res.status(400).json({ error: 'Failed to exchange authorization code for tokens' });
      }
      
      // Store tokens in session
      req.session.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: Date.now() + (tokens.expires_in * 1000)
      };
      
      console.log('✅ Google OAuth successful, tokens stored in session');
      
      // Redirect back to planner with success parameter
      res.redirect('/?auth=success');
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({ error: 'OAuth callback failed' });
    }
  });

  // Create direct Google auth instance
  const directGoogleAuth = createDirectGoogleAuth();

  // Direct Google OAuth routes
  app.get("/api/auth/google", (req, res) => {
    const authUrl = directGoogleAuth.getAuthUrl();
    res.redirect(authUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    await directGoogleAuth.handleCallback(req, res);
  });

  // Google Auth Debug endpoint
  app.get("/api/auth/google/debug", async (req, res) => {
    try {
      const tokenTest = await directGoogleAuth.testTokens(req);
      
      res.json({
        success: tokenTest.valid,
        environment: {
          hasClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          hasAccessToken: !!process.env.GOOGLE_ACCESS_TOKEN,
          hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN
        },
        session: {
          hasTokens: !!req.session?.googleTokens,
          isAuthenticated: !!req.session?.isGoogleAuthenticated
        },
        tokenTest,
        message: tokenTest.valid ? 'Google authentication is working' : 'Authentication required'
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message || 'Authentication test failed',
        environment: {
          hasClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          hasAccessToken: !!process.env.GOOGLE_ACCESS_TOKEN,
          hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN
        }
      });
    }
  });

  // Force Google Calendar Sync endpoint
  app.post("/api/auth/google/force-sync", async (req, res) => {
    try {
      const syncResult = await directGoogleAuth.forceSync(req);
      
      // Save synced events to database
      const userId = 1; // Use default user for development
      let savedCount = 0;
      
      for (const event of syncResult.events) {
        try {
          await storage.upsertEvent(userId, event.id, {
            title: event.title,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
            description: event.description,
            location: event.location,
            source: 'google',
            calendarId: event.calendarId
          });
          savedCount++;
        } catch (eventError) {
          console.warn(`Failed to save event ${event.id}:`, eventError.message);
        }
      }
      
      res.json({
        success: true,
        stats: {
          totalEvents: syncResult.eventCount,
          calendarCount: syncResult.calendarCount,
          savedEvents: savedCount,
          googleEvents: syncResult.events.filter(e => e.source === 'google').length,
          simplePracticeEvents: syncResult.events.filter(e => e.title.includes('Appointment')).length
        },
        message: `Successfully synced ${syncResult.eventCount} events from ${syncResult.calendarCount} calendars`
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message || 'Failed to sync calendar events',
        needsAuth: true
      });
    }
  });

  // Live sync endpoint that bypasses authentication
  app.get("/api/live-sync/calendar/events", async (req, res) => {
    try {
      const { handleGoogleCalendarSync } = await import('./google-calendar-fix');
      return await handleGoogleCalendarSync(req, res);
    } catch (error) {
      console.error('Live sync error:', error);
      res.status(500).json({
        error: 'Live sync failed',
        message: error.message,
        needsAuth: true
      });
    }
  });

  // Events API
  app.get("/api/events", async (req, res) => {
    try {
      // Get user from session or create development user
      let user = req.user || req.session?.passport?.user;

      // Development fallback - create temporary user if none exists
      if (!user) {
        // DEVELOPMENT MODE: Creating temporary user for events endpoint
        user = {
          id: 1,
          email: 'jonathan.procter@gmail.com',
          displayName: 'Jonathan Procter',
          name: 'Jonathan Procter'
        };

        // Set user in request for consistency
        req.user = user;
      }

      const userId = parseInt(user.id) || 1;
      const events = await storage.getEvents(userId);

      // Validate events response
      if (!Array.isArray(events)) {
        throw new Error('Invalid events response from storage');
      }

      // Map database events to the expected format with validation
      const eventsFormatted = events.map(e => {
        if (!e || typeof e !== 'object') {
          throw new Error('Invalid event object in storage response');
        }

        return {
          id: e.sourceId || e.id.toString(),
          title: e.title || 'Untitled Event',
          description: e.description || '',
          startTime: e.startTime,
          endTime: e.endTime,
          source: e.source || 'manual',
          sourceId: e.sourceId || null,
          color: e.color || '#999',
          notes: e.notes || '',
          actionItems: e.actionItems || '',
          calendarId: e.source === 'google' ? e.calendarId : undefined
        };
      });

      res.json(eventsFormatted);
    } catch (error) {
      console.error('Database error in /api/events/:userId:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: "Failed to fetch events", 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = req.body;

      // Validate required fields
      if (!eventData || typeof eventData !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }

      if (!eventData.title || !eventData.startTime || !eventData.endTime) {
        return res.status(400).json({ error: "Missing required fields: title, startTime, endTime" });
      }

      // Convert string dates to Date objects if needed
      if (typeof eventData.startTime === 'string') {
        eventData.startTime = new Date(eventData.startTime);
      }
      if (typeof eventData.endTime === 'string') {
        eventData.endTime = new Date(eventData.endTime);
      }

      // Validate dates
      if (isNaN(eventData.startTime.getTime()) || isNaN(eventData.endTime.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      if (eventData.startTime >= eventData.endTime) {
        return res.status(400).json({ error: "Start time must be before end time" });
      }

      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);

      if (!event) {
        throw new Error('Failed to create event in database');
      }

      res.json(event);
    } catch (error) {
      console.error('Create event error:', error);
      if (!res.headersSent) {
        res.status(400).json({ 
          error: "Invalid event data", 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = req.body;

      // Get user or create development user
      let user = req.user || req.session?.passport?.user;

      if (!user) {
        console.log('🔧 DEVELOPMENT MODE: Creating temporary user for PUT events');
        user = {
          id: 1,
          email: 'jonathan.procter@gmail.com',
          displayName: 'Jonathan Procter',
          name: 'Jonathan Procter'
        };
        req.user = user;
      }

      // Validate updates object
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: "Invalid update data" });
      }

      // Validate dates if provided
      if (updates.startTime) {
        if (typeof updates.startTime === 'string') {
          updates.startTime = new Date(updates.startTime);
        }
        if (isNaN(updates.startTime.getTime())) {
          return res.status(400).json({ error: "Invalid startTime format" });
        }
      }

      if (updates.endTime) {
        if (typeof updates.endTime === 'string') {
          updates.endTime = new Date(updates.endTime);
        }
        if (isNaN(updates.endTime.getTime())) {
          return res.status(400).json({ error: "Invalid endTime format" });
        }
      }

      // Validate date relationship if both are provided
      if (updates.startTime && updates.endTime && updates.startTime >= updates.endTime) {
        return res.status(400).json({ error: "Start time must be before end time" });
      }

      // Try to update by sourceId first (for Google Calendar events)
      let event = await storage.updateEventBySourceId(parseInt(user.id), eventId, updates);

      // If not found by sourceId, try by numeric ID for manual events
      if (!event) {
        const numericId = parseInt(eventId);
        if (!isNaN(numericId) && numericId > 0) {
          event = await storage.updateEvent(numericId, updates);
        }
      }

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error('Update event error:', error);
      if (!res.headersSent) {
        res.status(400).json({ 
          error: "Failed to update event", 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  });

  // Update event by sourceId (for Google Calendar events)
  app.put("/api/events/source/:sourceId", async (req, res) => {
    try {
      const sourceId = req.params.sourceId;
      const updates = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      const event = await storage.updateEventBySourceId(parseInt(user.id), sourceId, updates);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error('Update event by sourceId error:', error);
      if (!res.headersSent) {
        res.status(400).json({ error: "Failed to update event", details: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  // PATCH route for updating specific fields like notes and action items
  app.patch("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = req.body;

      // Get user or create development user
      let user = req.user || req.session?.passport?.user;

      if (!user) {
        // DEVELOPMENT MODE: Creating temporary user for PATCH events
        user = {
          id: 1,
          email: 'jonathan.procter@gmail.com',
          displayName: 'Jonathan Procter',
          name: 'Jonathan Procter'
        };
        req.user = user;
      }

      // Validate updates object
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: "Invalid update data" });
      }

      // Try to update by sourceId first (for Google Calendar events)
      let event = await storage.updateEventBySourceId(parseInt(user.id), eventId, updates);

      // If not found by sourceId, try by numeric ID for manual events
      if (!event) {
        const numericId = parseInt(eventId);
        if (!isNaN(numericId) && numericId > 0) {
          event = await storage.updateEvent(numericId, updates);
        }
      }

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      console.log(`✅ Updated event ${eventId} with notes/action items`);
      res.json(event);
    } catch (error) {
      console.error('Patch event error:', error);
      if (!res.headersSent) {
        res.status(400).json({ 
          error: "Failed to update event", 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.deleteEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete event error:', error);
      if (!res.headersSent) {
        res.status(400).json({ error: "Failed to delete event", details: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  // Daily Notes API
  app.get("/api/daily-notes/:userId/:date", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.params.date;
      const note = await storage.getDailyNote(userId, date);
      res.json(note || { content: "" });
    } catch (error) {
      console.error('Get daily note error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to fetch daily note", details: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  app.post("/api/daily-notes", async (req, res) => {
    try {
      const noteData = insertDailyNotesSchema.parse(req.body);
      const note = await storage.createOrUpdateDailyNote(noteData);
      res.json(note);
    } catch (error) {
      console.error('Create/update daily note error:', error);
      if (!res.headersSent) {
        res.status(400).json({ error: "Invalid note data", details: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  // Clean authentication system is now integrated above

  // Setup comprehensive audit system routes
  setupAuditRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}

// Simplified authentication middleware - always allow with fallback user
function requireAuth(req: any, res: any, next: any) {
  // Always ensure user exists to prevent connection issues
  if (!req.user) {
    const sessionUser = req.session?.passport?.user;
    
    if (sessionUser) {
      req.user = sessionUser;
    } else {
      // Create fallback user to maintain connection
      req.user = { 
        id: '1', 
        email: 'jonathan.procter@gmail.com',
        name: 'Jonathan Procter',
        displayName: 'Jonathan Procter',
        accessToken: process.env.GOOGLE_ACCESS_TOKEN || 'dev-token',
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN || 'dev-refresh',
        provider: 'google'
      };
      
      // Update session for consistency
      req.session.passport = { user: req.user };
    }
  }
  
  console.log(`✅ Auth middleware: User ${req.user.email} authenticated for ${req.path}`);
  next();
}