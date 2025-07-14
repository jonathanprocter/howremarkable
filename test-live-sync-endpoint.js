/**
 * Live Sync Endpoint Test Script
 * Verifies the /api/live-sync/calendar/events endpoint is working correctly
 */

async function testLiveSyncEndpoint() {
  console.log('🚀 Testing Live Sync Endpoint...');
  
  try {
    const startTime = new Date('2024-01-01T05:00:00.000Z').toISOString();
    const endTime = new Date('2025-12-31T05:00:00.000Z').toISOString();
    
    const response = await fetch(`http://localhost:5000/api/live-sync/calendar/events?start=${startTime}&end=${endTime}`);
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', errorText);
      return false;
    }
    
    const data = await response.json();
    
    console.log('✅ Live Sync Response:', {
      eventsCount: data.events?.length || 0,
      calendarsCount: data.calendars?.length || 0,
      syncTime: data.syncTime,
      isLiveSync: data.isLiveSync
    });
    
    if (data.events && data.events.length > 0) {
      console.log('📅 Sample events:');
      data.events.slice(0, 3).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title} (${event.startTime})`);
      });
    }
    
    if (data.calendars && data.calendars.length > 0) {
      console.log('📋 Available calendars:');
      data.calendars.forEach((calendar, index) => {
        console.log(`  ${index + 1}. ${calendar.name} (${calendar.id})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testLiveSyncEndpoint().then(success => {
  if (success) {
    console.log('🎉 Live Sync Endpoint Test: PASSED');
  } else {
    console.log('💥 Live Sync Endpoint Test: FAILED');
  }
});