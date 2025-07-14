import { Request, Response } from 'express';
import { google } from 'googleapis';

export async function forceLiveGoogleCalendarSync(req: Request, res: Response) {
  console.log('🚀 FORCE LIVE SYNC ACTIVATED - ENVIRONMENT TOKEN VERSION');
  console.log('🔍 Calendar events requested for user:', req.user?.email);

  try {
    const user = req.user as any;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // ALWAYS use fresh Google Calendar API calls - prioritize environment tokens
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN || user.accessToken;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || user.refreshToken;
    
    if (!accessToken || accessToken.startsWith('dev-')) {
      console.log('❌ No valid Google tokens for live sync');
      return res.status(401).json({ error: 'Valid Google tokens required for live sync' });
    }

    console.log('🔄 FORCING LIVE GOOGLE CALENDAR SYNC');
    console.log('✅ Using tokens for live sync:', {
      accessToken: accessToken.substring(0, 20) + '...',
      isEnvironmentToken: !!process.env.GOOGLE_ACCESS_TOKEN
    });

    const calendar = google.calendar({ version: 'v3' });

    // Get all calendars using environment tokens
    const calendarListResponse = await calendar.calendarList.list({
      access_token: accessToken
    });

    const calendars = calendarListResponse.data.items || [];
    console.log(`📅 Found ${calendars.length} calendars to fetch from`);

    const allGoogleEvents = [];

    // Fetch events from all calendars
    for (const cal of calendars) {
      try {
        console.log(`🔍 Fetching from calendar: ${cal.summary} (${cal.id})`);
        
        const eventsResponse = await calendar.events.list({
          calendarId: cal.id,
          timeMin: start as string,
          timeMax: end as string,
          maxResults: 2500,
          singleEvents: true,
          orderBy: 'startTime',
          access_token: accessToken
        });

        const events = eventsResponse.data.items || [];
        
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
        
        if (googleEvents.length > 0) {
          console.log(`✅ Found ${googleEvents.length} Google Calendar events in ${cal.summary}`);
        }
      } catch (calendarError) {
        console.warn(`⚠️ Could not access calendar ${cal.summary}: ${calendarError.message}`);
      }
    }

    console.log(`🎯 Total live Google Calendar events found: ${allGoogleEvents.length}`);

    // Return fresh data from Google Calendar API
    res.json({ 
      events: allGoogleEvents,
      calendars: calendars.map(cal => ({
        id: cal.id,
        name: cal.summary,
        color: cal.backgroundColor || '#4285f4'
      })),
      syncTime: new Date().toISOString(),
      isLiveSync: true
    });

  } catch (error) {
    console.error('❌ Live Google Calendar sync failed:', error);
    return res.status(500).json({
      error: 'Live Google Calendar sync failed',
      message: error.message,
      isLiveSync: false
    });
  }
}