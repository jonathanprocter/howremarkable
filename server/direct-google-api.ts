import { Request, Response } from 'express';
import { storage } from './storage';

export async function directGoogleCalendarSync(req: Request, res: Response) {
  console.log('🚀 DIRECT GOOGLE CALENDAR SYNC WITH TOKEN REFRESH');
  
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // Get fresh access token from session or environment
    let accessToken = req.session?.google_access_token || process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = req.session?.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN;
    
    // If no valid token, try to refresh
    if (!accessToken || accessToken.startsWith('dev-')) {
      if (refreshToken) {
        console.log('🔄 Attempting to refresh expired access token...');
        
        try {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
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

          if (refreshResponse.ok) {
            const tokenData = await refreshResponse.json();
            accessToken = tokenData.access_token;
            
            // Update session
            if (req.session) {
              req.session.google_access_token = accessToken;
              if (tokenData.refresh_token) {
                req.session.google_refresh_token = tokenData.refresh_token;
              }
            }
            
            console.log('✅ Token refresh successful');
          } else {
            const errorData = await refreshResponse.json();
            console.error('❌ Token refresh failed:', errorData);
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
        console.log('❌ No valid tokens available');
        return res.status(401).json({ 
          error: 'Authentication required', 
          needsAuth: true,
          redirectTo: '/api/auth/google'
        });
      }
    }

    console.log('🔄 Making direct API calls with valid access token');
    
    // Get calendar list directly via HTTP
    const calendarListResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!calendarListResponse.ok) {
      const errorData = await calendarListResponse.json();
      console.error('❌ Calendar list fetch failed:', errorData);
      return res.status(calendarListResponse.status).json({
        error: 'Failed to fetch calendar list',
        details: errorData
      });
    }

    const calendarListData = await calendarListResponse.json();
    const calendars = calendarListData.items || [];
    
    console.log(`📅 Found ${calendars.length} calendars via direct API`);

    const allGoogleEvents = [] as any[];

    // Fetch events from all calendars via direct API calls
    for (const cal of calendars) {
      try {
        console.log(`🔍 Fetching from calendar: ${cal.summary} (${cal.id})`);
        
        const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?` +
          `timeMin=${encodeURIComponent(start as string)}&` +
          `timeMax=${encodeURIComponent(end as string)}&` +
          `maxResults=2500&` +
          `singleEvents=true&` +
          `orderBy=startTime`;

        const eventsResponse = await fetch(eventsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (!eventsResponse.ok) {
          console.warn(`⚠️ Could not access calendar ${cal.summary}: ${eventsResponse.status}`);
          continue;
        }

        const eventsData = await eventsResponse.json();
        const events = eventsData.items || [];

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

        // Persist events for offline access
        const userId = parseInt((req.user as any)?.id) || 1;
        for (const evt of formattedEvents) {
          await storage.upsertEvent(userId, evt.id, {
            title: evt.title,
            startTime: new Date(evt.startTime),
            endTime: new Date(evt.endTime),
            description: evt.description,
            location: evt.location,
            source: 'google',
            calendarId: evt.calendarId,
          });
        }

        if (googleEvents.length > 0) {
          console.log(`✅ Found ${googleEvents.length} Google Calendar events in ${cal.summary}`);
        }
      } catch (calendarError) {
        console.warn(`⚠️ Error fetching calendar ${cal.summary}: ${calendarError.message}`);
      }
    }

    console.log(`🎯 Total Google Calendar events found via direct API: ${allGoogleEvents.length}`);

    // Return fresh data from direct Google Calendar API calls
    res.json({ 
      events: allGoogleEvents,
      calendars: calendars.map(cal => ({
        id: cal.id,
        name: cal.summary,
        color: cal.backgroundColor || '#4285f4'
      })),
      syncTime: new Date().toISOString(),
      isLiveSync: true,
      method: 'direct-api'
    });

  } catch (error) {
    console.error('❌ Direct Google Calendar sync failed:', error);
    
    return res.status(500).json({
      error: 'Direct Google Calendar sync failed',
      message: error.message,
      method: 'direct-api'
    });
  }
}
