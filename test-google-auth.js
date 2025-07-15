/**
 * Test script to verify Google Calendar authentication and connection
 * Run with: node test-google-auth.js
 */

import { google } from 'googleapis';

async function testGoogleAuth() {
  console.log('🔍 Testing Google Calendar Authentication');
  
  // Check environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  console.log('Environment Variables:');
  console.log('✓ GOOGLE_CLIENT_ID:', clientId ? 'Present' : 'Missing');
  console.log('✓ GOOGLE_CLIENT_SECRET:', clientSecret ? 'Present' : 'Missing');
  console.log('✓ GOOGLE_ACCESS_TOKEN:', accessToken ? 'Present' : 'Missing');
  console.log('✓ GOOGLE_REFRESH_TOKEN:', refreshToken ? 'Present' : 'Missing');
  
  if (!clientId || !clientSecret || !accessToken || !refreshToken) {
    console.error('❌ Missing required environment variables');
    return false;
  }
  
  // Test OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback'
  );
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  
  // Test token validation
  try {
    console.log('🔍 Testing token validation...');
    await oauth2Client.getAccessToken();
    console.log('✅ Token validation successful');
  } catch (tokenError) {
    console.log('⚠️ Token validation failed:', tokenError.message);
    
    // Try to refresh token
    try {
      console.log('🔄 Attempting token refresh...');
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log('✅ Token refresh successful');
      console.log('New access token:', credentials.access_token?.substring(0, 20) + '...');
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError.message);
      return false;
    }
  }
  
  // Test Google Calendar API
  try {
    console.log('🔍 Testing Google Calendar API...');
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Test calendar list
    const calendarListResponse = await calendar.calendarList.list({ maxResults: 10 });
    const calendars = calendarListResponse.data.items || [];
    console.log(`✅ Found ${calendars.length} calendars`);
    
    calendars.forEach(cal => {
      console.log(`  - ${cal.summary} (${cal.id})`);
    });
    
    // Test events from primary calendar
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date('2025-01-01').toISOString(),
      timeMax: new Date('2025-12-31').toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = eventsResponse.data.items || [];
    console.log(`✅ Found ${events.length} events in primary calendar`);
    
    events.slice(0, 5).forEach(event => {
      console.log(`  - ${event.summary} (${event.start?.dateTime || event.start?.date})`);
    });
    
    return true;
    
  } catch (apiError) {
    console.error('❌ Google Calendar API test failed:', apiError.message);
    return false;
  }
}

// Run the test
testGoogleAuth().then(success => {
  if (success) {
    console.log('\n✅ Google Calendar authentication test PASSED');
  } else {
    console.log('\n❌ Google Calendar authentication test FAILED');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n❌ Test script error:', error);
  process.exit(1);
});