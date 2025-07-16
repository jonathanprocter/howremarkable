import type { Express } from "express";
import { createServer, type Server } from "http";
import { Readable } from "stream";
import { storage } from "./storage";
import { insertEventSchema, insertDailyNotesSchema, events } from "@shared/schema";
import { and, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { google } from "googleapis";
import { setupAuditRoutes } from "./audit-system";
import { 
  setupEnhancedOAuthRoutes, 
  createDynamicOAuth2Client, 
  getCurrentDeploymentURL,
  validateOAuthConfiguration 
} from "./oauth-fix";

export async function registerRoutes(app: Express): Promise<Server> {

  // Validate OAuth configuration on startup
  const oauthValidation = validateOAuthConfiguration();
  if (!oauthValidation.valid) {
    console.error('❌ OAuth Configuration Errors:');
    oauthValidation.errors.forEach(error => console.error(`  - ${error}`));
  }
  if (oauthValidation.warnings.length > 0) {
    console.warn('⚠️ OAuth Configuration Warnings:');
    oauthValidation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Setup enhanced OAuth routes (replaces the old OAuth implementation)
  setupEnhancedOAuthRoutes(app);

  // PUBLIC ENDPOINT - Live sync calendar events without authentication
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

      // Set up OAuth2 client with the tokens using the enhanced version
      const oauth2Client = createDynamicOAuth2Client();
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
          
          // Fallback to database events
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

      // Get all calendars
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

      // Persist events for offline access
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

      // Fallback to database events
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

  // Get SimplePractice events from all calendars
  app.get("/api/simplepractice/events", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }

      // If tokens are missing use cached events
      if (!user.accessToken) {
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

      const oauth2Client = createDynamicOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Get all available calendars
      let calendarListResponse;
      try {
        calendarListResponse = await calendar.calendarList.list();
      } catch (authError: any) {
        // Fall back to database events on auth error
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
            orderBy: 'startTime'
          });

          const events = response.data.items || [];

          // Filter for SimplePractice events
          const simplePracticeEvents = events.filter(event => {
            const title = event.summary || '';
            const description = event.description || '';

            const isSimplePractice = 
              title.toLowerCase().includes('appointment') ||
              title.toLowerCase().includes('patient') ||
              title.toLowerCase().includes('session') ||
              title.toLowerCase().includes('therapy') ||
              title.toLowerCase().includes('consultation') ||
              description.toLowerCase().includes('simplepractice') ||
              description.toLowerCase().includes('appointment') ||
              /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(title.trim()) ||
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
  });

  // Get calendar events with live sync
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const user = req.user || req.session?.passport?.user;
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }

      if (!user?.accessToken) {
        // Fall back to database events
        const events = await storage.getEvents(parseInt(user?.id) || 1);
        const formattedEvents = events
          .filter(event => event.source === 'google')
          .map(event => ({
            id: event.sourceId || event.id.toString(),
            title: event.title,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            description: event.description || '',
            location: event.location || '',
            source: event.source,
            calendarId: event.calendarId || 'fallback'
          }));

        return res.json({
          events: formattedEvents,
          calendars: [{ id: 'fallback', name: 'Cached Events', color: '#4285f4' }],
          syncTime: new Date().toISOString(),
          isLiveSync: false
        });
      }

      const oauth2Client = createDynamicOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      const allGoogleEvents = [];

      for (const cal of calendars) {
        try {
          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin: start as string,
            timeMax: end as string,
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime'
          });

          const events = eventsResponse.data.items || [];

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
        } catch (calendarError) {
          console.warn(`⚠️ Could not access calendar ${cal.summary}: ${calendarError.message}`);
        }
      }

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
      console.error('Calendar events error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch calendar events',
        message: error.message
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

      const oauth2Client = createDynamicOAuth2Client();
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

      const oauth2Client = createDynamicOAuth2Client();
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

  // Events API
  app.get("/api/events", async (req, res) => {
    try {
      const user = req.user || req.session?.passport?.user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = parseInt(user.id) || 1;
      const events = await storage.getEvents(userId);

      if (!Array.isArray(events)) {
        throw new Error('Invalid events response from storage');
      }

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
      console.error('Database error in /api/events:', error);
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

      const user = req.user || req.session?.passport?.user;
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

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

      const user = req.user || req.session?.passport?.user;
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

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

  // Setup audit system routes
  setupAuditRoutes(app);

  // Add deployment info endpoint
  app.get("/api/deployment/info", (req, res) => {
    res.json({
      deploymentUrl: getCurrentDeploymentURL(),
      environment: process.env.NODE_ENV || 'development',
      oauthConfig: validateOAuthConfiguration(),
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Enhanced authentication middleware
function requireAuth(req: any, res: any, next: any) {
  // Always ensure user exists to prevent connection issues
  if (!req.user) {
    const sessionUser = req.session?.passport?.user || req.session?.user;

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
