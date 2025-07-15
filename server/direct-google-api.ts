import { Request, Response } from 'express';
import { storage } from './storage';

export async function directGoogleCalendarSync(req: Request, res: Response) {
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
          } else {
            return res.status(401).json({ 
              error: 'Token refresh failed', 
              needsAuth: true,
              redirectTo: '/api/auth/google'
            });
          }
        } catch (refreshError) {
          return res.status(401).json({ 
            error: 'Token refresh failed', 
            needsAuth: true,
            redirectTo: '/api/auth/google'
          });
        }
      } else {
        return res.status(401).json({ 
          error: 'Authentication required', 
          needsAuth: true,
          redirectTo: '/api/auth/google'
        });
      }
    }

    // Making direct API calls with valid access token
    
    // Get calendar list directly via HTTP
    const calendarListResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!calendarListResponse.ok) {
      // Fall back to cached events if calendar list fails
      const cachedEvents = await storage.getEvents(parseInt((req.user as any)?.id) || 1);
      return res.json({
        events: cachedEvents || [],
        calendars: []
      });
    }

    const calendarListData = await calendarListResponse.json();
    const calendars = calendarListData.items || [];
    
    const allGoogleEvents = [] as any[];

    // Fetch events from all calendars via direct API calls
    for (const cal of calendars) {
      try {
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

      } catch (calendarError) {
        // Skip calendar if there's an error
        continue;
      }
    }

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
    // Fall back to cached events if direct API fails
    const cachedEvents = await storage.getEvents(parseInt((req.user as any)?.id) || 1);
    
    return res.json({
      events: cachedEvents || [],
      calendars: [],
      syncTime: new Date().toISOString(),
      isLiveSync: false,
      method: 'fallback'
    });
  }
}
