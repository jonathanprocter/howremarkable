import type { Express } from "express";
import { createServer, type Server } from "http";
import { Readable } from "stream";
import { storage } from "./storage";
import { insertEventSchema, insertDailyNotesSchema } from "@shared/schema";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { google } from "googleapis";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure Google OAuth2 Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    console.log("=== GOOGLE OAUTH STRATEGY CALLED ===");
    console.log("Profile ID:", profile.id);
    console.log("Profile Name:", profile.displayName);
    console.log("Profile Email:", profile.emails?.[0]?.value);
    console.log("Access Token:", accessToken ? "RECEIVED" : "MISSING");
    console.log("Refresh Token:", refreshToken ? "RECEIVED" : "MISSING");
    
    try {
      // Check if user exists in database
      let dbUser = await storage.getUserByGoogleId(profile.id);
      
      if (!dbUser) {
        // Create new user in database
        dbUser = await storage.createGoogleUser(
          profile.id,
          profile.emails?.[0]?.value || '',
          profile.displayName || ''
        );
        console.log("Created new user in database:", dbUser.id);
      } else {
        console.log("Found existing user in database:", dbUser.id);
      }
      
      // Store tokens and database user ID in session
      const user = {
        id: dbUser.id.toString(), // Use database ID instead of Google ID
        googleId: profile.id, // Keep Google ID for reference
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        accessToken,
        refreshToken
      };
      
      console.log("Returning user object:", { id: user.id, email: user.email, name: user.name });
      return done(null, user);
    } catch (error) {
      console.error("Error in Google OAuth strategy:", error);
      return done(error, false);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Routes
  app.get("/api/auth/google", (req, res, next) => {
    console.log("Starting Google OAuth flow...");
    passport.authenticate("google", { 
      scope: [
        "profile", 
        "email", 
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/calendar.readonly"
      ]
    })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    console.log("Google OAuth callback received", req.query);
    
    if (req.query.error) {
      const error = req.query.error as string;
      const errorDescription = req.query.error_description as string;
      console.error("OAuth error:", error, errorDescription);
      return res.redirect("/?error=auth_failed&details=" + encodeURIComponent(errorDescription || error));
    }

    passport.authenticate("google", { 
      failureRedirect: "/?error=auth_failed",
      session: true
    }, (err, user, info) => {
      if (err) {
        console.error("Passport authentication error:", err);
        return res.redirect("/?error=auth_failed&details=" + encodeURIComponent(err.message));
      }
      if (!user) {
        console.error("No user returned from authentication:", info);
        return res.redirect("/?error=auth_failed&details=no_user");
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/?error=auth_failed&details=" + encodeURIComponent(err.message));
        }
        console.log("Google OAuth callback successful", user.email);
        res.redirect("/?connected=true");
      });
    })(req, res, next);
  });

  // Error handling for failed authentication
  app.get("/api/auth/error", (req, res) => {
    res.status(403).json({ 
      error: "authentication_failed",
      message: "Google OAuth authentication failed. Please check your Google Cloud Console configuration.",
      instructions: [
        "1. Go to Google Cloud Console (console.cloud.google.com)",
        "2. Enable Google Calendar API and Google Drive API",
        "3. Configure OAuth consent screen",
        "4. Add authorized redirect URI: " + (process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000') + "/api/auth/google/callback"
      ]
    });
  });

  app.get("/api/auth/status", (req, res) => {
    console.log("Auth status check - Session ID:", req.sessionID);
    console.log("Auth status check - User:", !!req.user, req.user?.email);
    console.log("Auth status check - Session data:", req.session);
    res.json({ 
      authenticated: !!req.user,
      user: req.user || null
    });
  });

  // Test endpoint to verify Google credentials
  app.get("/api/auth/test", (req, res) => {
    console.log("=== AUTH TEST ENDPOINT ===");
    console.log("Environment check:");
    console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING");
    console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING");
    console.log("REPLIT_DEV_DOMAIN:", process.env.REPLIT_DEV_DOMAIN);
    
    res.json({
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      domain: process.env.REPLIT_DEV_DOMAIN,
      callbackUrl: `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Google Calendar API - Fetch Events
  app.get("/api/calendar/events", async (req, res) => {
    // Since API usage stats show authentication is working, try to fetch with stored credentials
    console.log("Calendar events requested - checking authentication...");
    console.log("Session user:", !!req.user);
    
    if (!req.user) {
      console.log("No session user found, but API calls are working based on usage stats");
      return res.status(401).json({ 
        error: "Session authentication required",
        message: "Please authenticate with Google first"
      });
    }

    try {
      const { timeMin, timeMax } = req.query;
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

      // Get calendar list first
      const calendarList = await calendar.calendarList.list();
      const calendars = calendarList.data.items || [];

      // First, get existing database events for the user
      const dbEvents = await storage.getEvents(parseInt(user.id));
      
      // Fetch events from all calendars and sync to database
      const allEvents: any[] = [];
      const allCalendarEvents: any[] = [];
      
      console.log(`Starting calendar sync from January 1, 2025 for ${calendars.length} calendars...`);
      
      for (const cal of calendars) {
        try {
          if (!cal.id) continue;
          
          // Fetch events from January 1, 2025 to now for comprehensive sync
          const startOfYear = new Date('2025-01-01T00:00:00Z').toISOString();
          const currentDate = new Date().toISOString();
          
          const events = await calendar.events.list({
            calendarId: cal.id,
            timeMin: (timeMin as string) || startOfYear,
            timeMax: (timeMax as string) || currentDate,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 2500 // Increase max results to handle full year
          });

          console.log(`Calendar ${cal.summary}: Found ${events.data.items?.length || 0} events from Jan 1, 2025 to now`);
          
          const calendarEvents = (events.data.items || []).map((event: any) => {
            // Detect all-day events - Google Calendar uses 'date' for all-day, 'dateTime' for timed
            const isAllDay = !event.start?.dateTime && !!event.start?.date;
            
            let startTime, endTime;
            if (isAllDay) {
              // For all-day events, interpret the date in EST timezone
              // Google Calendar provides dates like "2025-07-01" for all-day events
              startTime = new Date(event.start.date + 'T00:00:00-05:00'); // EST offset
              endTime = new Date(event.end.date + 'T00:00:00-05:00'); // EST offset
            } else {
              startTime = event.start?.dateTime || event.start?.date;
              endTime = event.end?.dateTime || event.end?.date;
            }
            
            const eventData = {
              id: event.id,
              title: event.summary || 'No Title',
              description: event.description,
              startTime,
              endTime,
              source: 'google',
              sourceId: event.id,
              color: cal.backgroundColor || '#38a169',
              calendarName: cal.summary,
              calendarId: cal.id,
              isAllDay
            };
            
            return eventData;
          });

          // Sync Google Calendar events to database
          let newEventCount = 0;
          for (const googleEvent of calendarEvents) {
            try {
              // Check if event already exists in database
              const existingEvent = dbEvents.find(e => e.sourceId === googleEvent.id && e.source === 'google');
              
              if (!existingEvent) {
                // Create new event in database
                await storage.createEvent({
                  userId: parseInt(user.id),
                  title: googleEvent.title,
                  description: googleEvent.description || '',
                  startTime: new Date(googleEvent.startTime),
                  endTime: new Date(googleEvent.endTime),
                  source: 'google',
                  sourceId: googleEvent.id,
                  calendarId: googleEvent.calendarId, // Store the actual calendar ID
                  color: googleEvent.color,
                  notes: '',
                  actionItems: ''
                });
                newEventCount++;
              }
            } catch (error) {
              console.error(`Error syncing Google event ${googleEvent.id} to database:`, error);
            }
          }
          
          console.log(`Calendar ${cal.summary}: Synced ${newEventCount} new events to database`);

          allEvents.push(...calendarEvents);
          allCalendarEvents.push(...calendarEvents);
        } catch (error) {
          console.error(`Error fetching events from calendar ${cal.summary}:`, error);
        }
      }

      // After syncing, get all database events (both Google and manual)
      const updatedDbEvents = await storage.getEvents(parseInt(user.id));
      
      console.log(`Calendar sync complete: Total events in database: ${updatedDbEvents.length}`);
      
      // Map database events to the expected format
      const dbEventsMapped = updatedDbEvents.map(e => ({
        id: e.sourceId || e.id.toString(),
        title: e.title,
        description: e.description,
        startTime: e.startTime,
        endTime: e.endTime,
        source: e.source,
        sourceId: e.sourceId,
        color: e.color,
        notes: e.notes,
        actionItems: e.actionItems,
        calendarId: e.source === 'google' ? e.calendarId : undefined
      }));

      // Replace Google Calendar events with database-persisted versions
      const googleEventIds = new Set(allCalendarEvents.map(e => e.id));
      const persistedGoogleEvents = dbEventsMapped.filter(e => e.source === 'google' && googleEventIds.has(e.sourceId));
      const manualEvents = dbEventsMapped.filter(e => e.source !== 'google');

      // Use persisted Google events if available, otherwise use fresh Google events
      const finalGoogleEvents = persistedGoogleEvents.length > 0 ? persistedGoogleEvents : allCalendarEvents;

      allEvents.splice(0, allEvents.length); // Clear existing events
      allEvents.push(...finalGoogleEvents, ...manualEvents);

      res.json({ 
        events: allEvents,
        calendars: calendars.map(cal => ({
          id: cal.id,
          name: cal.summary,
          color: cal.backgroundColor
        }))
      });

    } catch (error) {
      console.error('Calendar fetch error:', error);
      
      // Check if it's an authentication error
      if (error.message?.includes('invalid_grant') || error.message?.includes('unauthorized')) {
        return res.status(401).json({ 
          error: "Authentication expired",
          message: "Please re-authenticate with Google",
          requiresReauth: true
        });
      }
      
      // Fallback: return database events if Google Calendar fails
      try {
        if (!req.user) {
          console.log("No authenticated user for fallback");
          return res.status(401).json({ 
            error: "Authentication required",
            message: "Please authenticate with Google first to access calendar events"
          });
        }
        const fallbackUser = req.user as any;
        console.log(`Attempting database fallback for user ${fallbackUser.id}`);
        const dbEvents = await storage.getEvents(parseInt(fallbackUser.id));
        const dbEventsMapped = dbEvents.map(e => ({
          id: e.sourceId || e.id.toString(),
          title: e.title,
          description: e.description,
          startTime: e.startTime,
          endTime: e.endTime,
          source: e.source,
          sourceId: e.sourceId,
          color: e.color,
          notes: e.notes,
          actionItems: e.actionItems,
          calendarId: e.source === 'google' ? e.calendarId : undefined
        }));
        
        console.log(`Database fallback successful: ${dbEventsMapped.length} events`);
        res.json({ 
          events: dbEventsMapped,
          calendars: [],
          fallback: true,
          message: "Loaded events from database (Google Calendar unavailable)"
        });
      } catch (dbError) {
        console.error('Database fallback error:', dbError);
        res.status(500).json({ 
          error: "Failed to fetch calendar events",
          message: "Both Google Calendar and database access failed",
          details: error.message
        });
      }
    }
  });

  // Update Google Calendar Event
  app.put("/api/calendar/events/:eventId", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
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
      res.status(500).json({ error: "Failed to update calendar event" });
    }
  });

  // Google Drive PDF Upload
  app.post("/api/drive/upload", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
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
      res.status(500).json({ error: "Failed to upload to Google Drive" });
    }
  });

  // Events API
  app.get("/api/events/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const events = await storage.getEvents(userId);
      
      // Map database events to the expected format
      const eventsFormatted = events.map(e => ({
        id: e.sourceId || e.id.toString(),
        title: e.title,
        description: e.description,
        startTime: e.startTime,
        endTime: e.endTime,
        source: e.source,
        sourceId: e.sourceId,
        color: e.color,
        notes: e.notes,
        actionItems: e.actionItems,
        calendarId: e.source === 'google' ? e.calendarId : undefined
      }));
      
      res.json(eventsFormatted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const updates = req.body;
      const event = await storage.updateEvent(eventId, updates);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.deleteEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete event" });
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
      res.status(500).json({ error: "Failed to fetch daily note" });
    }
  });

  app.post("/api/daily-notes", async (req, res) => {
    try {
      const noteData = insertDailyNotesSchema.parse(req.body);
      const note = await storage.createOrUpdateDailyNote(noteData);
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
