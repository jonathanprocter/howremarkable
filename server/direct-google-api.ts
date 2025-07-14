import { Request, Response } from 'express';
import { storage } from './storage';

export async function directGoogleCalendarSync(req: Request, res: Response) {
  console.log('🚀 DIRECT GOOGLE CALENDAR SYNC - NO OAUTH2 CLIENT');
  
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    
    if (!accessToken || accessToken.startsWith('dev-')) {
      console.log('❌ No valid Google access token available');
      return res.status(401).json({ error: 'Valid Google access token required' });
    }

    console.log('🔄 Making direct API calls with access token');
    
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