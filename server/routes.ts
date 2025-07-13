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

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    console.log('✅ Serializing user:', { id: user.id, email: user.email });
    // Store the full user object in session
    done(null, user);
  });

  passport.deserializeUser(async (user: any, done) => {
    try {
      console.log('✅ Deserializing user (full object):', { id: user.id, email: user.email });

      // Validate tokens are present for Google users
      if (user.googleId && (!user.accessToken || user.accessToken === 'undefined')) {
        console.log('⚠️ Google user missing valid tokens, creating dev tokens');
        user.accessToken = 'dev-access-token-' + Date.now();
        user.refreshToken = 'dev-refresh-token-' + Date.now();
      }

      done(null, user);
    } catch (error) {
      console.error('❌ Deserialization error:', error);
      done(error, null);
    }
  });

  // Session debugging middleware (minimal logging)
  app.use((req, res, next) => {
    // Only log session debug for specific endpoints and occasionally to reduce spam
    if (req.path.startsWith('/api/') && !req.path.includes('/auth/status') && Math.random() < 0.1) {
      console.log(`🔍 Session Debug [${req.method} ${req.path}]: User=${!!req.user}, Session=${req.sessionID.slice(0,8)}...`);
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
      ],
      accessType: 'offline',
      prompt: 'consent'
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

      req.logIn(user, { session: true }, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/?error=auth_failed&details=" + encodeURIComponent(err.message));
        }
        
        console.log("Google OAuth callback successful - User logged in:", user.email);
        console.log("Session ID:", req.sessionID);
        console.log("User in req.user:", !!req.user);
        console.log("Session passport:", !!req.session.passport);

        // Manually ensure session data is set correctly
        req.session.passport = { user: user };
        req.user = user;

        // Force session save with extended timeout
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.redirect("/?error=session_save_failed");
          }
          
          console.log("✅ Session saved successfully");
          console.log("✅ Final session check - User:", !!req.user);
          console.log("✅ Final session check - Passport:", !!req.session.passport);
          
          // Longer delay to ensure session persistence
          setTimeout(() => {
            res.redirect("/?connected=true");
          }, 500);
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

  // Development login endpoint
  app.post("/api/auth/dev-login", async (req, res) => {
    try {
      console.log('🔍 Session Debug [POST /api/auth/dev-login]: User=' + (req.user ? 'true' : 'false') + ', Session=' + req.sessionID?.substring(0, 8) + '...');

      // Create a development user with valid tokens
      const devUser = {
        id: '8',
        googleId: 'dev-google-id',
        email: 'dev@test.com',
        name: 'Development User',
        accessToken: 'dev-access-token-' + Date.now(),
        refreshToken: 'dev-refresh-token-' + Date.now()
      };

      // Store user in session manually
      req.session.passport = {
        user: devUser
      };

      // Also set req.user directly
      req.user = devUser;

      // Save session
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }

        console.log('Development user logged in:', devUser.email);
        console.log('Session after dev login:', req.sessionID);
        console.log('User object in session:', !!req.user);

        res.json({ 
          success: true, 
          user: devUser,
          sessionId: req.sessionID
        });
      });

    } catch (error) {
      console.error('Dev login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Simple login endpoint for testing
  app.get("/api/auth/test-login", (req, res) => {
    const testUser = {
      id: '8',
      googleId: 'test-google-id',
      email: 'dev@test.com',
      name: 'Test User',
      accessToken: 'test-access-token-' + Date.now(),
      refreshToken: 'test-refresh-token-' + Date.now()
    };

    req.logIn(testUser, { session: true }, (err) => {
      if (err) {
        console.error('Test login error:', err);
        return res.status(500).json({ error: 'Test login failed', details: err.message });
      }

      // Ensure session data is set
      req.session.passport = { user: testUser };
      req.user = testUser;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Test session save error:', saveErr);
          return res.status(500).json({ error: 'Session save failed' });
        }

        console.log('✅ Test user logged in successfully:', testUser.email);
        res.json({ 
          success: true, 
          user: testUser,
          sessionId: req.sessionID,
          message: 'Test login successful'
        });
      });
    });
  });

  // Middleware to ensure authentication for calendar routes
  const requireAuth = (req: any, res: any, next: any) => {
    console.log('Calendar events requested - checking authentication...');
    console.log('Session user:', !!req.user);
    console.log('Session passport user:', !!req.session?.passport?.user);

    // Check both req.user and session passport user
    const user = req.user || req.session?.passport?.user;

    if (!user) {
      console.log('No authenticated user found');
      return res.status(401).json({ 
        error: 'Session authentication required. Please login first.',
        sessionId: req.sessionID,
        hasSession: !!req.session
      });
    }

    // Ensure req.user is set
    if (!req.user && req.session?.passport?.user) {
      req.user = req.session.passport.user;
    }

    console.log('✅ User authenticated:', user.email);
    next();
  };

  // Get SimplePractice events from all calendars
  app.get("/api/simplepractice/events", requireAuth, async (req, res) => {
    console.log('🔍 SimplePractice events requested');

    try {
      const user = req.user as any;
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }

      // Only use development mode for specific development user in development environment
      if (user.email === 'dev@test.com' && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development user - returning empty SimplePractice events');
        return res.json({ 
          events: [],
          calendars: [{
            id: 'simplepractice',
            name: 'SimplePractice',
            color: '#6495ED'
          }]
        });
      }

      if (!user.accessToken || user.accessToken === 'undefined') {
        console.log('❌ Invalid tokens for SimplePractice events');
        return res.status(401).json({ 
          error: 'Invalid authentication tokens. Please re-authenticate.',
          needsReauth: true 
        });
      }

      console.log('Fetching SimplePractice events from all Google Calendars...');

      const calendar = google.calendar({ version: 'v3' });

      // First get all available calendars
      const calendarListResponse = await calendar.calendarList.list({
        access_token: user.accessToken
      });

      const calendars = calendarListResponse.data.items || [];
      console.log(`📅 Found ${calendars.length} calendars to search`);

      let allSimplePracticeEvents = [];
      let simplePracticeCalendars = [];

      // Search through all calendars for SimplePractice events
      for (const cal of calendars) {
        try {
          console.log(`🔍 Searching calendar: ${cal.summary} (${cal.id})`);
          
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
            console.log(`✅ Found ${simplePracticeEvents.length} SimplePractice events in ${cal.summary}`);
            
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
          console.warn(`⚠️ Could not access calendar ${cal.summary}: ${calendarError.message}`);
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
        return res.status(401).json({ 
          error: 'SimplePractice calendar authentication failed. Please re-authenticate.',
          needsReauth: true 
        });
      }

      res.status(500).json({ 
        error: 'Failed to fetch SimplePractice events',
        details: error.message 
      });
    }
  });

  // Get calendar events with enhanced debugging
  app.get("/api/calendar/events", requireAuth, async (req, res) => {
    console.log('🔍 Session Debug [GET /api/calendar/events]: User=' + (req.user ? 'true' : 'false') + ', Session=' + req.sessionID?.substring(0, 8) + '...');

    try {
      const user = req.user as any;

    // Only use development mode for specific development user
    if (user.email === 'dev@test.com' && process.env.NODE_ENV === 'development') {
      console.log('🔧 Development user detected, returning mock events');
      const mockEvents = [
        {
          id: 'dev-event-1',
          title: 'Development Meeting',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          description: 'Mock event for development',
          location: 'Development Office',
          source: 'google',
          calendarId: 'primary'
        }
      ];

      const mockCalendars = [
        {
          id: 'primary',
          name: 'Primary Calendar',
          color: '#4285f4'
        },
        {
          id: 'simplepractice',
          name: 'SimplePractice',
          color: '#6495ED'
        }
      ];

      return res.json({ 
        events: mockEvents,
        calendars: mockCalendars
      });
    }

      if (!user.accessToken || user.accessToken === 'undefined') {
        console.log('❌ Invalid tokens in session - please re-authenticate');
        return res.status(401).json({ 
          error: 'Invalid authentication tokens. Please re-authenticate.',
          needsReauth: true 
        });
      }

      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }

      console.log('Fetching Google Calendar events...');
      console.log('Date range:', start, 'to', end);
      console.log('User tokens present:', !!user.accessToken, !!user.refreshToken);

      const calendar = google.calendar({ version: 'v3' });

      // Get the calendar list first to fetch from all calendars
      const calendarListResponse = await calendar.calendarList.list({
        access_token: user.accessToken
      });

      const calendars = (calendarListResponse.data.items || []).map(cal => ({
        id: cal.id || 'primary',
        name: cal.summary || 'Calendar',
        color: cal.backgroundColor || '#4285f4'
      }));

      console.log(`📅 Found ${calendars.length} calendars to fetch from`);

      let allGoogleEvents = [];

      // Fetch events from all calendars
      for (const cal of calendars) {
        try {
          console.log(`🔍 Fetching from calendar: ${cal.name} (${cal.id})`);
          
          const response = await calendar.events.list({
            calendarId: cal.id,
            timeMin: start as string,
            timeMax: end as string,
            singleEvents: true,
            orderBy: 'startTime',
            access_token: user.accessToken
          });

          const events = response.data.items || [];
          
          // Filter out events that look like SimplePractice appointments (they'll be handled separately)
          const googleEvents = events.filter(event => {
            const title = event.summary || '';
            const description = event.description || '';
            
            // Exclude SimplePractice-looking events
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
            console.log(`✅ Found ${googleEvents.length} Google Calendar events in ${cal.name}`);
          }
        } catch (calendarError) {
          console.warn(`⚠️ Could not access calendar ${cal.name}: ${calendarError.message}`);
          // Continue with other calendars
        }
      }

      console.log(`🎯 Total Google Calendar events found: ${allGoogleEvents.length}`);

      // Add SimplePractice calendar to the list
      const allCalendars = [
        ...calendars,
        {
          id: 'simplepractice',
          name: 'SimplePractice',
          color: '#6495ED'
        }
      ];

      // Return in the expected format with events array and actual calendars
      res.json({ 
        events: allGoogleEvents,
        calendars: allCalendars.length > 0 ? allCalendars : [{
          id: 'primary',
          name: 'Primary Calendar',
          color: '#4285f4'
        }]
      });

    } catch (error) {
      console.error('Calendar events error:', error);

      if (error.code === 401) {
        console.log('❌ Google API authentication failed - tokens may be expired');
        return res.status(401).json({ 
          error: 'Google Calendar authentication failed. Please re-authenticate.',
          needsReauth: true 
        });
      }

      res.status(500).json({ 
        error: 'Failed to fetch calendar events',
        details: error.message 
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

  // Events API
  app.get("/api/events", async (req, res) => {
    console.log('🔍 Session Debug [GET /api/events]: User=' + (req.user ? 'true' : 'false') + ', Session=' + req.sessionID?.substring(0, 8) + '...');
    
    try {
      // Get user from session
      const user = req.user || req.session?.passport?.user;
      
      if (!user) {
        console.log('❌ No authenticated user found for events endpoint');
        return res.status(401).json({ 
          error: "Authentication required", 
          message: "Please authenticate to access events",
          authUrl: "/api/auth/google"
        });
      }

      const userId = parseInt(user.id);
      
      // Validate user ID
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Debug authentication for events endpoint
      console.log("✅ Events endpoint - User authenticated:", user.email);
      console.log("📅 Events endpoint - User ID:", userId);

      const events = await storage.getEvents(userId);

      // Validate events response
      if (!Array.isArray(events)) {
        throw new Error('Invalid events response from storage');
      }

      console.log(`📅 Database events found: ${events.length}`);
      console.log('📊 Event sources breakdown:', events.reduce((acc, event) => {
        const source = event.source || 'manual';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {}));

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