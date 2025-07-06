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
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    // Store tokens in session for later use
    const user = {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      accessToken,
      refreshToken
    };
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
  app.get("/api/auth/google", 
    passport.authenticate("google", { 
      scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file"] 
    })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/?connected=true");
    }
  );

  app.get("/api/auth/status", (req, res) => {
    res.json({ 
      authenticated: !!req.user,
      user: req.user || null
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
