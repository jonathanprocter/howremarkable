/**
 * Fresh Google Calendar Authentication System
 * Provides immediate OAuth flow for Google Calendar access
 */

import { google } from 'googleapis';
import { Request, Response } from 'express';

export class FreshGoogleAuth {
  private static oauth2Client: any;
  
  static getOAuth2Client() {
    if (!this.oauth2Client) {
      // Use the current domain for callback
      const baseURL = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
      
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${baseURL}/api/auth/google/fresh-callback`
      );
    }
    return this.oauth2Client;
  }
  
  static generateAuthUrl(): string {
    const oauth2Client = this.getOAuth2Client();
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar'
      ],
      prompt: 'consent' // Force consent screen to get refresh token
    });
  }
  
  static async handleCallback(code: string, req: Request): Promise<boolean> {
    try {
      const oauth2Client = this.getOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('✅ Fresh Google tokens received:', {
        access_token: tokens.access_token ? 'Present' : 'Missing',
        refresh_token: tokens.refresh_token ? 'Present' : 'Missing',
        expiry_date: tokens.expiry_date
      });
      
      // Store tokens in session
      req.session.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      };
      
      // Test the token immediately
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      const test = await calendar.calendarList.list();
      console.log(`✅ Token test successful - found ${test.data.items?.length || 0} calendars`);
      
      return true;
    } catch (error) {
      console.error('❌ Fresh Google auth callback failed:', error);
      return false;
    }
  }
  
  static async getValidTokens(req: Request): Promise<any> {
    const tokens = req.session.googleTokens;
    if (!tokens) {
      return null;
    }
    
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    
    // Check if token needs refresh
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date - 60000) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        req.session.googleTokens = {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokens.refresh_token,
          expiry_date: credentials.expiry_date
        };
        oauth2Client.setCredentials(credentials);
        console.log('✅ Token refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        return null;
      }
    }
    
    return oauth2Client;
  }
  
  static async fetchCalendarEvents(req: Request, startDate: string, endDate: string): Promise<any[]> {
    const oauth2Client = await this.getValidTokens(req);
    if (!oauth2Client) {
      throw new Error('No valid Google tokens available');
    }
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    try {
      // Get calendar list
      const calendarList = await calendar.calendarList.list();
      const calendars = calendarList.data.items || [];
      
      console.log(`📅 Found ${calendars.length} calendars`);
      
      const allEvents = [];
      
      // Fetch events from each calendar
      for (const cal of calendars) {
        try {
          const events = await calendar.events.list({
            calendarId: cal.id,
            timeMin: new Date(startDate).toISOString(),
            timeMax: new Date(endDate).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 2500
          });
          
          const calendarEvents = events.data.items || [];
          console.log(`📋 Calendar "${cal.summary}": ${calendarEvents.length} events`);
          
          // Add calendar info to events
          for (const event of calendarEvents) {
            allEvents.push({
              ...event,
              calendarId: cal.id,
              calendarName: cal.summary,
              calendarColor: cal.backgroundColor
            });
          }
        } catch (eventError) {
          console.error(`❌ Failed to fetch events from calendar "${cal.summary}":`, eventError.message);
        }
      }
      
      console.log(`✅ Total events fetched: ${allEvents.length}`);
      return allEvents;
      
    } catch (error) {
      console.error('❌ Calendar fetch failed:', error);
      throw error;
    }
  }
}