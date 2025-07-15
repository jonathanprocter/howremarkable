/**
 * Comprehensive Google Calendar Authentication Fix
 * This module provides robust token management and calendar integration
 */

import { google } from 'googleapis';
import { Request, Response } from 'express';
import { storage } from './storage';

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export class GoogleCalendarAuth {
  private static oauth2Client: any;
  
  static getOAuth2Client() {
    if (!this.oauth2Client) {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        this.getCallbackURL()
      );
    }
    return this.oauth2Client;
  }
  
  private static getCallbackURL(): string {
    const baseURL = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
    return `${baseURL}/api/auth/google/callback`;
  }
  
  static async refreshAccessToken(refreshToken: string): Promise<GoogleTokens | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token refresh failed:', errorData);
        return null;
      }

      const tokenData = await response.json();
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expiry_date: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
  
  static async getValidAccessToken(req?: any): Promise<string | null> {
    // First try to get tokens from session (for authenticated users)
    let accessToken = req?.session?.google_access_token || req?.user?.accessToken;
    let refreshToken = req?.session?.google_refresh_token || req?.user?.refreshToken;
    
    // Fall back to environment tokens
    if (!accessToken || !refreshToken) {
      accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      console.log('Using environment tokens as fallback');
    }
    
    if (!accessToken || !refreshToken) {
      console.log('No access or refresh tokens available');
      return null;
    }
    
    console.log('🔍 Testing Google access token...');
    
    // Test current token first
    try {
      const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (testResponse.ok) {
        const tokenInfo = await testResponse.json();
        console.log('✅ Current access token is valid');
        console.log('Token scope:', tokenInfo.scope);
        console.log('Token expiry:', tokenInfo.expires_in);
        return accessToken;
      } else {
        console.log(`Token validation failed: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      console.log('Current token validation failed:', error.message);
    }
    
    // Try direct calendar API call to double-check
    console.log('⚠️ Token validation failed, trying direct API call...');
    
    try {
      const calendarTestResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (calendarTestResponse.ok) {
        console.log('✅ Direct Calendar API call successful - token is working');
        return accessToken;
      } else {
        console.log(`Direct Calendar API call failed: ${calendarTestResponse.status}`);
        const errorData = await calendarTestResponse.text();
        console.log('Error details:', errorData);
      }
    } catch (directError) {
      console.log('Direct API call error:', directError.message);
    }
    
    // If both validations failed, attempt to refresh the token
    console.log('🔄 Attempting to refresh access token...');
    
    try {
      const refreshedTokens = await this.refreshAccessToken(refreshToken);
      if (refreshedTokens && refreshedTokens.access_token) {
        console.log('✅ Successfully refreshed access token');
        
        // Update session with new tokens if req is provided
        if (req && req.session) {
          req.session.google_access_token = refreshedTokens.access_token;
          if (refreshedTokens.refresh_token) {
            req.session.google_refresh_token = refreshedTokens.refresh_token;
          }
          req.session.google_token_expiry = refreshedTokens.expiry_date;
          
          // Update user object if present
          if (req.user) {
            req.user.accessToken = refreshedTokens.access_token;
            if (refreshedTokens.refresh_token) {
              req.user.refreshToken = refreshedTokens.refresh_token;
            }
          }
          
          console.log('✅ Updated session with new tokens');
        }
        
        // Test the new token
        const newTestResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
          headers: {
            'Authorization': `Bearer ${refreshedTokens.access_token}`,
            'Accept': 'application/json'
          }
        });
        
        if (newTestResponse.ok) {
          console.log('✅ Refreshed token is working');
          return refreshedTokens.access_token;
        } else {
          console.log(`❌ Refreshed token still not working: ${newTestResponse.status}`);
        }
      } else {
        console.log('❌ Token refresh failed - no new token received');
      }
    } catch (refreshError) {
      console.log('❌ Token refresh error:', refreshError.message);
    }
    
    console.log('❌ All token validation and refresh attempts failed');
    return null;
  }
  
  static async fetchCalendarEvents(startDate: string, endDate: string, req?: any): Promise<any[]> {
    const accessToken = await this.getValidAccessToken(req);
    if (!accessToken) {
      throw new Error('No valid access token available');
    }
    
    // Get calendar list
    const calendarListResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!calendarListResponse.ok) {
      throw new Error(`Calendar list fetch failed: ${calendarListResponse.status}`);
    }
    
    const calendarListData = await calendarListResponse.json();
    const calendars = calendarListData.items || [];
    
    console.log(`📅 Found ${calendars.length} calendars`);
    
    const allEvents = [];
    
    // Fetch events from each calendar
    for (const calendar of calendars) {
      try {
        const eventsResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          body: null
        });
        
        // Add query parameters properly
        const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`);
        url.searchParams.append('timeMin', new Date(startDate).toISOString());
        url.searchParams.append('timeMax', new Date(endDate).toISOString());
        url.searchParams.append('singleEvents', 'true');
        url.searchParams.append('orderBy', 'startTime');
        url.searchParams.append('maxResults', '2500');
        
        const eventsResponse2 = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (!eventsResponse2.ok) {
          console.warn(`⚠️ Failed to fetch events from ${calendar.summary}: ${eventsResponse2.status}`);
          continue;
        }
        
        const eventsData = await eventsResponse2.json();
        const events = eventsData.items || [];
        
        // Filter out SimplePractice events (handled separately)
        const googleEvents = events.filter(event => {
          const title = event.summary || '';
          return !title.toLowerCase().includes('appointment');
        });
        
        const formattedEvents = googleEvents.map(event => ({
          id: event.id,
          title: event.summary || 'Untitled Event',
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date,
          description: event.description || '',
          location: event.location || '',
          source: 'google',
          calendarId: calendar.id
        }));
        
        allEvents.push(...formattedEvents);
        
        if (googleEvents.length > 0) {
          console.log(`✅ Found ${googleEvents.length} events in ${calendar.summary}`);
        }
        
      } catch (calendarError) {
        console.warn(`⚠️ Error fetching from ${calendar.summary}:`, calendarError.message);
      }
    }
    
    return allEvents;
  }
}

// Express route handlers
export async function handleGoogleCalendarSync(req: Request, res: Response) {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    console.log('🔄 Starting Google Calendar sync...');
    
    const events = await GoogleCalendarAuth.fetchCalendarEvents(start as string, end as string, req);
    
    // Save events to database
    const userId = 1; // Use fallback user ID for now
    let savedCount = 0;
    
    for (const event of events) {
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
      } catch (saveError) {
        console.warn(`⚠️ Failed to save event ${event.title}:`, saveError.message);
      }
    }
    
    console.log(`✅ Google Calendar sync complete: ${events.length} events fetched, ${savedCount} saved`);
    
    res.json({
      events,
      calendars: [], // Will be populated if needed
      syncTime: new Date().toISOString(),
      isLiveSync: true,
      stats: {
        totalEvents: events.length,
        savedEvents: savedCount
      }
    });
    
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    
    // Fallback to cached events
    try {
      const userId = 1;
      const cachedEvents = await storage.getEvents(userId);
      
      const googleEvents = cachedEvents
        .filter(event => event.source === 'google')
        .map(event => ({
          id: event.sourceId || event.id.toString(),
          title: event.title,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          description: event.description || '',
          location: event.location || '',
          source: 'google',
          calendarId: event.calendarId || 'cached'
        }));
      
      res.json({
        events: googleEvents,
        calendars: [{ id: 'cached', name: 'Cached Events', color: '#4285f4' }],
        syncTime: new Date().toISOString(),
        isLiveSync: false,
        isFallback: true,
        message: 'Using cached events due to authentication error'
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: 'Google Calendar sync failed',
        message: error.message,
        needsAuth: true
      });
    }
  }
}

export async function testGoogleAuth(req: Request, res: Response) {
  try {
    const accessToken = await GoogleCalendarAuth.getValidAccessToken();
    
    if (!accessToken) {
      return res.status(401).json({
        error: 'No valid access token',
        needsAuth: true,
        redirectTo: '/api/auth/google'
      });
    }
    
    // Test calendar access
    const testResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!testResponse.ok) {
      return res.status(401).json({
        error: 'Calendar access test failed',
        needsAuth: true,
        redirectTo: '/api/auth/google'
      });
    }
    
    const testData = await testResponse.json();
    
    res.json({
      success: true,
      message: 'Google Calendar authentication is working',
      calendarCount: testData.items?.length || 0,
      tokenStatus: 'valid'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Authentication test failed',
      message: error.message,
      needsAuth: true
    });
  }
}