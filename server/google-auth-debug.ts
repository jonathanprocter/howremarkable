/**
 * Google Authentication Debug and Manual Sync System
 * Comprehensive system for testing and debugging Google Calendar integration
 */

import { Request, Response } from 'express';
import { storage } from './storage';

export async function debugGoogleAuth(req: Request, res: Response) {
  try {
    console.log('🔍 Starting Google Auth Debug...');
    
    // Check environment variables and session tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    // Check session tokens
    const sessionTokens = (req.session as any)?.googleTokens;
    const accessToken = sessionTokens?.access_token || envAccessToken;
    const refreshToken = sessionTokens?.refresh_token || envRefreshToken;
    
    console.log('Environment Variables:');
    console.log('✓ GOOGLE_CLIENT_ID:', clientId ? 'Present' : 'Missing');
    console.log('✓ GOOGLE_CLIENT_SECRET:', clientSecret ? 'Present' : 'Missing');
    console.log('✓ GOOGLE_ACCESS_TOKEN:', accessToken ? 'Present' : 'Missing');
    console.log('✓ GOOGLE_REFRESH_TOKEN:', refreshToken ? 'Present' : 'Missing');
    
    if (!accessToken || !refreshToken) {
      return res.status(401).json({
        error: 'Google tokens not configured',
        needsAuth: true,
        message: 'Environment variables GOOGLE_ACCESS_TOKEN and GOOGLE_REFRESH_TOKEN are required'
      });
    }
    
    // Test token validation
    console.log('🔍 Testing token validation...');
    const tokenResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    let tokenValid = false;
    let tokenInfo = null;
    
    if (tokenResponse.ok) {
      tokenInfo = await tokenResponse.json();
      tokenValid = true;
      console.log('✅ Token validation successful');
      console.log('Token info:', tokenInfo);
    } else {
      console.log(`❌ Token validation failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }
    
    // Test direct Calendar API call
    console.log('🔍 Testing direct Calendar API call...');
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    let calendarSuccess = false;
    let calendars = [];
    
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      calendars = calendarData.items || [];
      calendarSuccess = true;
      console.log(`✅ Calendar API call successful - Found ${calendars.length} calendars`);
    } else {
      console.log(`❌ Calendar API call failed: ${calendarResponse.status} ${calendarResponse.statusText}`);
      const errorText = await calendarResponse.text();
      console.log('Error details:', errorText);
    }
    
    // Test events fetch from primary calendar
    let eventsSuccess = false;
    let events = [];
    
    if (calendarSuccess && calendars.length > 0) {
      console.log('🔍 Testing events fetch from primary calendar...');
      
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.append('timeMin', new Date('2025-01-01').toISOString());
      url.searchParams.append('timeMax', new Date('2025-12-31').toISOString());
      url.searchParams.append('singleEvents', 'true');
      url.searchParams.append('orderBy', 'startTime');
      url.searchParams.append('maxResults', '10');
      
      const eventsResponse = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        events = eventsData.items || [];
        eventsSuccess = true;
        console.log(`✅ Events fetch successful - Found ${events.length} events`);
      } else {
        console.log(`❌ Events fetch failed: ${eventsResponse.status} ${eventsResponse.statusText}`);
      }
    }
    
    // Return comprehensive debug information
    res.json({
      success: tokenValid && calendarSuccess,
      environment: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      },
      tokenTest: {
        valid: tokenValid,
        info: tokenInfo,
        scope: tokenInfo?.scope || 'Unknown'
      },
      calendarTest: {
        success: calendarSuccess,
        calendarCount: calendars.length,
        calendars: calendars.map(cal => ({
          id: cal.id,
          name: cal.summary,
          primary: cal.primary || false
        }))
      },
      eventsTest: {
        success: eventsSuccess,
        eventCount: events.length,
        sampleEvents: events.slice(0, 3).map(event => ({
          id: event.id,
          title: event.summary,
          start: event.start?.dateTime || event.start?.date
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Google Auth Debug failed:', error);
    res.status(500).json({
      error: 'Debug failed',
      message: error.message
    });
  }
}

export async function forceGoogleCalendarSync(req: Request, res: Response) {
  try {
    console.log('🔄 Starting force Google Calendar sync...');
    
    // Try to get tokens from session first, then fall back to environment
    const sessionTokens = (req.session as any)?.googleTokens;
    const accessToken = sessionTokens?.access_token || process.env.GOOGLE_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(401).json({
        error: 'Google access token not configured',
        needsAuth: true,
        message: 'Please authenticate with Google Calendar first'
      });
    }
    
    // Get calendar list
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!calendarResponse.ok) {
      return res.status(401).json({
        error: 'Failed to fetch calendar list',
        needsAuth: true
      });
    }
    
    const calendarData = await calendarResponse.json();
    const calendars = calendarData.items || [];
    
    console.log(`📅 Found ${calendars.length} calendars`);
    
    const allEvents = [];
    
    // Fetch events from each calendar
    for (const calendar of calendars) {
      try {
        const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`);
        url.searchParams.append('timeMin', new Date('2025-01-01').toISOString());
        url.searchParams.append('timeMax', new Date('2025-12-31').toISOString());
        url.searchParams.append('singleEvents', 'true');
        url.searchParams.append('orderBy', 'startTime');
        url.searchParams.append('maxResults', '2500');
        
        const eventsResponse = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (!eventsResponse.ok) {
          console.warn(`⚠️ Failed to fetch events from ${calendar.summary}: ${eventsResponse.status}`);
          continue;
        }
        
        const eventsData = await eventsResponse.json();
        const events = eventsData.items || [];
        
        // Process and categorize events
        const processedEvents = events.map(event => {
          const title = event.summary || 'Untitled Event';
          const isSimplePractice = title.toLowerCase().includes('appointment');
          
          return {
            id: event.id,
            title,
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            description: event.description || '',
            location: event.location || '',
            source: isSimplePractice ? 'simplepractice' : 'google',
            calendarId: calendar.id,
            calendarName: calendar.summary
          };
        });
        
        allEvents.push(...processedEvents);
        
        if (events.length > 0) {
          console.log(`✅ Found ${events.length} events in ${calendar.summary}`);
        }
        
      } catch (calendarError) {
        console.warn(`⚠️ Error fetching from ${calendar.summary}:`, calendarError.message);
      }
    }
    
    console.log(`📊 Total events found: ${allEvents.length}`);
    
    // Save events to database
    const userId = 1; // Use fallback user ID
    let savedCount = 0;
    
    for (const event of allEvents) {
      try {
        await storage.upsertEvent(userId, event.id, {
          title: event.title,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          description: event.description,
          location: event.location,
          source: event.source,
          calendarId: event.calendarId
        });
        savedCount++;
      } catch (saveError) {
        console.warn(`⚠️ Failed to save event ${event.title}:`, saveError.message);
      }
    }
    
    console.log(`✅ Force sync complete: ${allEvents.length} events fetched, ${savedCount} saved`);
    
    // Categorize events for response
    const simplePracticeEvents = allEvents.filter(e => e.source === 'simplepractice');
    const googleEvents = allEvents.filter(e => e.source === 'google');
    
    res.json({
      success: true,
      message: 'Force sync completed successfully',
      events: allEvents,
      calendars: calendars.map(cal => ({
        id: cal.id,
        name: cal.summary,
        color: cal.backgroundColor || '#4285f4'
      })),
      syncTime: new Date().toISOString(),
      isLiveSync: true,
      stats: {
        totalEvents: allEvents.length,
        simplePracticeEvents: simplePracticeEvents.length,
        googleEvents: googleEvents.length,
        calendarCount: calendars.length,
        savedEvents: savedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Force sync failed:', error);
    res.status(500).json({
      error: 'Force sync failed',
      message: error.message
    });
  }
}