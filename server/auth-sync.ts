import { Request, Response } from 'express';
import { google } from 'googleapis';
import { storage } from './storage';

// Force Google Calendar authentication and sync all events
export async function forceGoogleCalendarSync(req: Request, res: Response) {
  console.log('🔄 FORCE GOOGLE CALENDAR SYNC INITIATED');
  
  try {
    const user = req.user as any;
    
    // Check if we have valid Google tokens
    if (!user || !user.accessToken || user.accessToken.startsWith('dev-')) {
      console.log('❌ No valid Google tokens found - redirecting to OAuth');
      return res.status(401).json({
        error: 'Authentication required',
        needsAuth: true,
        redirectTo: '/api/auth/google'
      });
    }
    
    console.log('✅ Valid Google tokens found for:', user.email);
    console.log('🔍 Access token preview:', user.accessToken.substring(0, 20) + '...');
    
    const calendar = google.calendar({ version: 'v3' });
    
    // Test token validity by fetching calendar list
    let calendarListResponse;
    try {
      calendarListResponse = await calendar.calendarList.list({
        access_token: user.accessToken
      });
      console.log('✅ Token validation successful');
    } catch (authError: any) {
      console.log('❌ Token validation failed:', authError.message);
      
      // Try to refresh token
      if (authError.code === 401 && user.refreshToken) {
        console.log('🔄 Attempting token refresh...');
        try {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              refresh_token: user.refreshToken,
              grant_type: 'refresh_token'
            })
          });

          if (refreshResponse.ok) {
            const tokenData = await refreshResponse.json();
            console.log('✅ Token refresh successful');
            
            // Update user tokens
            user.accessToken = tokenData.access_token;
            if (tokenData.refresh_token) {
              user.refreshToken = tokenData.refresh_token;
            }
            
            // Update session
            req.session.passport = { user };
            req.session.save();
            
            // Retry calendar list fetch
            calendarListResponse = await calendar.calendarList.list({
              access_token: user.accessToken
            });
          } else {
            console.log('❌ Token refresh failed');
            return res.status(401).json({
              error: 'Token refresh failed',
              needsAuth: true,
              redirectTo: '/api/auth/google'
            });
          }
        } catch (refreshError) {
          console.error('❌ Token refresh error:', refreshError);
          return res.status(401).json({
            error: 'Token refresh failed',
            needsAuth: true,
            redirectTo: '/api/auth/google'
          });
        }
      } else {
        return res.status(401).json({
          error: 'Authentication failed',
          needsAuth: true,
          redirectTo: '/api/auth/google'
        });
      }
    }
    
    const calendars = calendarListResponse.data.items || [];
    console.log(`📅 Found ${calendars.length} calendars to sync`);
    
    let allGoogleEvents = [];
    let allSimplePracticeEvents = [];
    
    // Sync events from all calendars
    for (const cal of calendars) {
      try {
        console.log(`🔍 Syncing calendar: ${cal.summary} (${cal.id})`);
        
        const response = await calendar.events.list({
          calendarId: cal.id,
          timeMin: new Date(2024, 0, 1).toISOString(),
          timeMax: new Date(2025, 11, 31).toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 2500,
          access_token: user.accessToken
        });

        const events = response.data.items || [];
        console.log(`📋 Found ${events.length} events in ${cal.summary}`);
        
        // Categorize events
        const googleEvents = [];
        const simplePracticeEvents = [];
        
        for (const event of events) {
          const title = event.summary || '';
          const description = event.description || '';
          
          // Check if this is a SimplePractice event
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
          
          const formattedEvent = {
            id: event.id,
            title: event.summary || 'Untitled Event',
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            description: event.description || '',
            location: event.location || '',
            source: isSimplePractice ? 'simplepractice' : 'google',
            calendarId: cal.id
          };
          
          if (isSimplePractice) {
            simplePracticeEvents.push(formattedEvent);
          } else {
            googleEvents.push(formattedEvent);
          }
        }
        
        allGoogleEvents.push(...googleEvents);
        allSimplePracticeEvents.push(...simplePracticeEvents);
        
      } catch (calendarError) {
        console.warn(`⚠️ Could not sync calendar ${cal.summary}: ${calendarError.message}`);
      }
    }
    
    console.log(`🎯 Total Google Calendar events: ${allGoogleEvents.length}`);
    console.log(`🎯 Total SimplePractice events: ${allSimplePracticeEvents.length}`);
    
    // Save all events to database
    const userId = parseInt(user.id) || 1;
    let savedCount = 0;
    
    for (const event of [...allGoogleEvents, ...allSimplePracticeEvents]) {
      try {
        await storage.upsertEvent(userId, event.id, {
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          description: event.description,
          location: event.location,
          source: event.source,
          calendarId: event.calendarId
        });
        savedCount++;
      } catch (saveError) {
        console.warn(`⚠️ Could not save event ${event.title}: ${saveError.message}`);
      }
    }
    
    console.log(`💾 Saved ${savedCount} events to database`);
    
    return res.json({
      success: true,
      message: 'Google Calendar sync completed successfully',
      stats: {
        calendars: calendars.length,
        googleEvents: allGoogleEvents.length,
        simplePracticeEvents: allSimplePracticeEvents.length,
        savedEvents: savedCount
      },
      user: {
        email: user.email,
        hasValidTokens: true
      }
    });
    
  } catch (error) {
    console.error('❌ Google Calendar sync failed:', error);
    return res.status(500).json({
      error: 'Google Calendar sync failed',
      details: error.message
    });
  }
}