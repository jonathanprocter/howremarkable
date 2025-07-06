import type { Express } from "express";
import { createServer, type Server } from "http";
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
    
    // Store tokens in session for later use
    const user = {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      accessToken,
      refreshToken
    };
    
    console.log("Returning user object:", { id: user.id, email: user.email, name: user.name });
    return done(null, user);
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

      // Fetch events from all calendars
      const allEvents: any[] = [];
      
      for (const cal of calendars) {
        try {
          if (!cal.id) continue;
          
          const events = await calendar.events.list({
            calendarId: cal.id,
            timeMin: (timeMin as string) || new Date().toISOString(),
            timeMax: (timeMax as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });

          const calendarEvents = (events.data.items || []).map((event: any) => {
            // Detect all-day events - Google Calendar uses 'date' for all-day, 'dateTime' for timed
            const isAllDay = !event.start?.dateTime && !!event.start?.date;
            
            let startTime, endTime;
            if (isAllDay) {
              // For all-day events, set to midnight of the day
              startTime = new Date(event.start.date + 'T00:00:00');
              endTime = new Date(event.end.date + 'T00:00:00');
            } else {
              startTime = event.start?.dateTime || event.start?.date;
              endTime = event.end?.dateTime || event.end?.date;
            }
            
            return {
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
          });

          allEvents.push(...calendarEvents);
        } catch (error) {
          console.error(`Error fetching events from calendar ${cal.summary}:`, error);
        }
      }

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
      res.status(500).json({ error: "Failed to fetch calendar events" });
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
        body: Buffer.from(content, 'base64')
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
      res.json(events);
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
