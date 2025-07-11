import type { Express } from "express";
import { createServer, type Server } from "http";
import { Readable } from "stream";
import { storage } from "./storage";
import { insertEventSchema, insertDailyNotesSchema } from "@shared/schema";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { google } from "googleapis";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize passport BEFORE configuring strategies
  app.use(passport.initialize());
  app.use(passport.session());

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
        try {
          // Create new user in database
          dbUser = await storage.createGoogleUser(
            profile.id,
            profile.emails?.[0]?.value || '',
            profile.displayName || ''
          );
          console.log("Created new user in database:", dbUser.id);
        } catch (createError) {
          // If user creation fails due to duplicate email, find existing user
          console.log("User creation failed, looking for existing user with this email");
          dbUser = await storage.getUserByUsername(profile.emails?.[0]?.value || '');
          if (!dbUser) {
            // Still no user found, use fallback user ID 1
            console.log("Using fallback user ID 1");
            dbUser = { id: 1, googleId: profile.id, username: profile.emails?.[0]?.value || '', displayName: profile.displayName || '', email: profile.emails?.[0]?.value || '', name: profile.displayName || '', password: null };
          }
          console.log("Using existing user in database:", dbUser.id);
        }
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
    console.log("✅ Serializing user:", { id: user.id, email: user.email });
    done(null, user.id); // Store only user ID in session for security
  });

  // Cache for user sessions to reduce database calls
  const userCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  passport.deserializeUser(async (id: string, done) => {
    // Check cache first
    const cached = userCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return done(null, cached.user);
    }

    try {
      // For development, always return user object for ID 1
      if (id === '1') {
        const user = {
          id: '1',
          googleId: '116610633375195855574',
          email: 'jonathan.procter@gmail.com',
          name: 'Jonathan Procter',
          accessToken: 'dev-access-token',
          refreshToken: 'dev-refresh-token'
        };
        
        // Cache the user
        userCache.set(id, { user, timestamp: Date.now() });
        done(null, user);
      } else {
        // For production, fetch user from database
        const dbUser = await storage.getUserById(parseInt(id));
        if (dbUser) {
          const user = {
            id: dbUser.id.toString(),
            googleId: dbUser.googleId,
            email: dbUser.email,
            name: dbUser.name,
            accessToken: 'stored-access-token',
            refreshToken: 'stored-refresh-token'
          };
          
          // Cache the user
          userCache.set(id, { user, timestamp: Date.now() });
          done(null, user);
        } else {
          done(null, false);
        }
      }
    } catch (error) {
      console.error("❌ Error deserializing user:", error);
      done(error, false);
    }
  });

  // Session debugging middleware (minimal logging)
  app.use((req, res, next) => {
    // Only log critical session issues, not every request
    if (req.path.startsWith('/api/') && !req.user && req.path !== '/api/auth/status') {
      console.log(`⚠️ Unauthenticated API call: ${req.method} ${req.path}`);
    }
    next();
  });



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
        console.log("Google OAuth callback successful - User logged in:", user.email);
        console.log("Session after login:", req.sessionID);
        console.log("User object in session:", !!req.user);
        
        // Force session save before redirect with additional verification
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          } else {
            console.log("Session saved successfully");
            console.log("Session user after save:", !!req.user);
            console.log("Session passport after save:", !!req.session.passport);
          }
          res.redirect("/?connected=true");
        });
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
    console.log("=== AUTH STATUS DEBUG ===");
    console.log("Session ID:", req.sessionID);
    console.log("Session exists:", !!req.session);
    console.log("User in request:", !!req.user);
    console.log("User details:", req.user ? { id: req.user.id, email: req.user.email } : null);
    console.log("Session passport:", req.session.passport);
    console.log("Session cookie:", req.session.cookie);
    
    res.json({ 
      authenticated: !!req.user,
      user: req.user || null,
      debug: {
        sessionId: req.sessionID,
        hasSession: !!req.session,
        hasPassport: !!req.session.passport
      },
      note: "To authenticate, visit /api/auth/google to start OAuth flow"
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

  // Test session persistence endpoint
  app.get("/api/auth/session-test", (req, res) => {
    console.log("=== SESSION TEST ===");
    console.log("Session ID:", req.sessionID);
    console.log("Session exists:", !!req.session);
    
    // Initialize test counter if not exists
    if (!req.session.testCounter) {
      req.session.testCounter = 0;
    }
    
    req.session.testCounter++;
    console.log("Test counter:", req.session.testCounter);
    
    res.json({
      sessionId: req.sessionID,
      testCounter: req.session.testCounter,
      message: `Session test #${req.session.testCounter}`
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

  // Development authentication bypass
  app.post("/api/auth/dev-login", async (req, res) => {
    try {
      console.log("🔧 DEV LOGIN: Creating development user session...");
      
      // Use hardcoded user ID 1 for development (known to exist)
      console.log("Using existing user ID 1 for development login");
      
      // Create user object for session without database lookup
      const user = {
        id: '1',
        googleId: '116610633375195855574',
        email: 'jonathan.procter@gmail.com',
        name: 'Jonathan Procter',
        accessToken: 'dev-access-token',
        refreshToken: 'dev-refresh-token'
      };
      
      // Log in the user using passport
      req.logIn(user, (err) => {
        if (err) {
          console.error("Dev login error:", err);
          return res.status(500).json({ error: "Failed to log in development user" });
        }
        
        console.log("✅ DEV LOGIN: User logged in successfully");
        console.log("Session ID:", req.sessionID);
        console.log("User in session:", !!req.user);
        
        // Force session save
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }
          
          console.log("✅ DEV LOGIN: Session saved successfully");
          res.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name },
            sessionId: req.sessionID
          });
        });
      });
    } catch (error) {
      console.error("Development login error:", error);
      res.status(500).json({ error: "Failed to create development session" });
    }
  });

  // Google Calendar API - Fetch Events
  app.get("/api/calendar/events", async (req, res) => {
    try {
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
          // Don't break the loop, continue with next calendar
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
      
      // Fallback: return database events if Google Calendar fails
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const fallbackUser = req.user as any;
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
        
        res.json({ 
          events: dbEventsMapped,
          calendars: [],
          fallback: true,
          message: "Loaded events from database (Google Calendar unavailable)"
        });
      } catch (dbError) {
        console.error('Database fallback error:', dbError);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to fetch calendar events" });
        }
      }
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

  // Events API
  app.get("/api/events/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Validate user ID
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Debug authentication for events endpoint
      console.log("Events endpoint - User authenticated:", !!req.user);
      console.log("Events endpoint - Requested user ID:", userId);
      if (req.user) {
        console.log("Events endpoint - Session user ID:", req.user.id);
        
        // If user is authenticated, ensure they can only access their own events
        if (req.user.id !== userId.toString()) {
          return res.status(403).json({ 
            error: "Access denied", 
            message: "You can only access your own events" 
          });
        }
      } else {
        // For development: allow access to user 1 when not authenticated
        if (userId !== 1) {
          return res.status(401).json({ 
            error: "Authentication required", 
            message: "Please authenticate to access events",
            authUrl: "/api/auth/google"
          });
        }
        console.log("Allowing unauthenticated access to user 1 for development");
      }
      
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
      const eventId = parseInt(req.params.id);
      const updates = req.body;
      
      // Validate event ID
      if (isNaN(eventId) || eventId <= 0) {
        return res.status(400).json({ error: "Invalid event ID" });
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
      
      const event = await storage.updateEvent(eventId, updates);
      
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

  const httpServer = createServer(app);

  return httpServer;
}
