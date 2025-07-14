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
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN || user?.accessToken;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || user?.refreshToken;

    if (!accessToken || accessToken.startsWith('dev-')) {
      console.log('❌ No valid Google tokens for live sync');
      return res.status(401).json({ error: 'Valid Google tokens required for live sync' });
    }

    console.log('🔄 FORCING LIVE GOOGLE CALENDAR SYNC');
    console.log('✅ Using tokens for live sync:', {
      accessToken: accessToken.substring(0, 20) + '...',
      isEnvironmentToken: !!process.env.GOOGLE_ACCESS_TOKEN
    });

    // Set up OAuth2 client with the tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Test token and refresh if needed
    try {
      await oauth2Client.getAccessToken();
      console.log('✅ Token validation successful');
    } catch (tokenError) {
      console.log('⚠️ Token validation failed, using cached events immediately');

      // Import db here to avoid circular dependency issues
      const { db } = await import('./db');
      const { events } = await import('@shared/schema');
      const { and, gte, lte } = await import('drizzle-orm');

      // Return cached events from database as fallback
      const fallbackEvents = await db.select().from(events).where(
        and(
          gte(events.startTime, new Date(start as string)),
          lte(events.startTime, new Date(end as string))
        )
      );

      const formattedFallbackEvents = fallbackEvents
        .filter(event => event.source === 'google' || event.source === 'simplepractice')
        .map(event => ({
          id: event.id,
          title: event.title,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          description: event.description || '',
          location: event.location || '',
          source: event.source,
          calendarId: event.calendarId || 'fallback'
        }));

      console.log(`✅ Fallback: Using ${formattedFallbackEvents.length} cached events`);

      return res.json({
        events: formattedFallbackEvents,
        calendars: [
          { id: 'fallback', name: 'Cached Events', color: '#4285f4' }
        ],
        syncTime: new Date().toISOString(),
        isLiveSync: false,
        isFallback: true,
        message: 'Using cached events due to token validation failure'
      });
    }

    // Get all calendars using OAuth2 client
    const calendarListResponse = await calendar.calendarList.list();

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
          orderBy: 'startTime'
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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });

    return res.status(500).json({
      error: 'Live Google Calendar sync failed',
      message: error.message,
      details: error.response?.data || error.code,
      isLiveSync: false
    });
  }
}