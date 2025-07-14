/**
 * Live Google Calendar Sync Audit System
 * Comprehensive testing to verify real-time sync functionality
 */

async function runLiveSyncAudit() {
  console.log('🔍 LIVE SYNC AUDIT SYSTEM - STARTING COMPREHENSIVE TESTS');
  
  const results = {
    authenticationStatus: {},
    endpointTests: {},
    dataIntegrity: {},
    syncVerification: {},
    issues: [],
    recommendations: []
  };

  // Test 1: Authentication Status
  console.log('\n📋 TEST 1: Authentication Status');
  try {
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    results.authenticationStatus = {
      isAuthenticated: authData.isAuthenticated,
      hasTokens: authData.hasTokens,
      tokenType: authData.hasTokens === true ? 'environment' : authData.hasTokens,
      status: authResponse.status === 200 ? 'PASS' : 'FAIL'
    };
    
    console.log('✅ Authentication Status:', results.authenticationStatus);
  } catch (error) {
    results.authenticationStatus = { status: 'FAIL', error: error.message };
    results.issues.push('Authentication endpoint failed');
  }

  // Test 2: Calendar Events Endpoint
  console.log('\n📋 TEST 2: Calendar Events Endpoint');
  try {
    const start = '2024-01-01T05:00:00.000Z';
    const end = '2025-12-31T05:00:00.000Z';
    
    const calendarResponse = await fetch(`/api/calendar/events?start=${start}&end=${end}`);
    const calendarData = await calendarResponse.json();
    
    results.endpointTests.calendar = {
      status: calendarResponse.status === 200 ? 'PASS' : 'FAIL',
      eventCount: calendarData.events ? calendarData.events.length : 0,
      hasCalendars: calendarData.calendars ? calendarData.calendars.length : 0,
      isLiveSync: calendarData.isLiveSync || false,
      syncTime: calendarData.syncTime || null,
      responseTime: Date.now()
    };
    
    console.log('✅ Calendar Events Test:', results.endpointTests.calendar);
    
    if (!calendarData.isLiveSync) {
      results.issues.push('Calendar endpoint not using live sync');
    }
  } catch (error) {
    results.endpointTests.calendar = { status: 'FAIL', error: error.message };
    results.issues.push('Calendar events endpoint failed');
  }

  // Test 3: SimplePractice Events Endpoint
  console.log('\n📋 TEST 3: SimplePractice Events Endpoint');
  try {
    const spResponse = await fetch('/api/simplepractice/events');
    const spData = await spResponse.json();
    
    results.endpointTests.simplepractice = {
      status: spResponse.status === 200 ? 'PASS' : 'FAIL',
      eventCount: spData.events ? spData.events.length : 0,
      hasCalendars: spData.calendars ? spData.calendars.length : 0,
      isLiveSync: spData.isLiveSync || false
    };
    
    console.log('✅ SimplePractice Events Test:', results.endpointTests.simplepractice);
  } catch (error) {
    results.endpointTests.simplepractice = { status: 'FAIL', error: error.message };
    results.issues.push('SimplePractice events endpoint failed');
  }

  // Test 4: Data Source Verification
  console.log('\n📋 TEST 4: Data Source Verification');
  try {
    // Check if events are coming from live API vs database
    const eventsResponse = await fetch('/api/events');
    const allEvents = await eventsResponse.json();
    
    const now = new Date();
    const recentEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate > now;
    });
    
    results.dataIntegrity = {
      totalEvents: allEvents.length,
      futureEvents: recentEvents.length,
      hasFreshData: recentEvents.length > 0,
      dataSource: 'database', // This endpoint uses database
      lastEventTime: allEvents.length > 0 ? allEvents[allEvents.length - 1].startTime : null
    };
    
    console.log('✅ Data Source Verification:', results.dataIntegrity);
  } catch (error) {
    results.dataIntegrity = { status: 'FAIL', error: error.message };
    results.issues.push('Data source verification failed');
  }

  // Test 5: Live Sync Force Test
  console.log('\n📋 TEST 5: Live Sync Force Test');
  try {
    // Try to force a live sync by calling the calendar endpoint directly
    const timestamp = Date.now();
    const forceSyncResponse = await fetch(`/api/calendar/events?start=2024-01-01T05:00:00.000Z&end=2025-12-31T05:00:00.000Z&force=true&timestamp=${timestamp}`);
    
    if (forceSyncResponse.status === 200) {
      const forceSyncData = await forceSyncResponse.json();
      
      results.syncVerification = {
        forceSyncWorking: true,
        isLiveSync: forceSyncData.isLiveSync || false,
        syncTime: forceSyncData.syncTime,
        eventCount: forceSyncData.events ? forceSyncData.events.length : 0,
        calendarsFound: forceSyncData.calendars ? forceSyncData.calendars.length : 0
      };
      
      if (!forceSyncData.isLiveSync) {
        results.issues.push('Force sync not returning live data');
      }
    } else {
      results.syncVerification = { 
        forceSyncWorking: false, 
        status: forceSyncResponse.status,
        error: await forceSyncResponse.text()
      };
      results.issues.push('Force sync request failed');
    }
    
    console.log('✅ Live Sync Force Test:', results.syncVerification);
  } catch (error) {
    results.syncVerification = { status: 'FAIL', error: error.message };
    results.issues.push('Live sync force test failed');
  }

  // Generate Recommendations
  console.log('\n📋 GENERATING RECOMMENDATIONS');
  
  if (results.issues.length === 0) {
    results.recommendations.push('✅ All tests passed - Live sync is working correctly');
  } else {
    if (results.authenticationStatus.status === 'FAIL') {
      results.recommendations.push('🔧 Fix authentication system');
    }
    
    if (results.endpointTests.calendar?.status === 'FAIL') {
      results.recommendations.push('🔧 Fix calendar events endpoint');
    }
    
    if (!results.endpointTests.calendar?.isLiveSync) {
      results.recommendations.push('🔧 Enable live sync in calendar endpoint');
    }
    
    if (results.syncVerification?.forceSyncWorking === false) {
      results.recommendations.push('🔧 Fix force live sync functionality');
    }
    
    results.recommendations.push('🔧 Check server logs for authentication errors');
    results.recommendations.push('🔧 Verify Google API tokens are valid');
  }

  // Final Report
  console.log('\n🎯 LIVE SYNC AUDIT COMPLETE');
  console.log('='.repeat(50));
  console.log('AUTHENTICATION:', results.authenticationStatus.status);
  console.log('CALENDAR ENDPOINT:', results.endpointTests.calendar?.status);
  console.log('SIMPLEPRACTICE ENDPOINT:', results.endpointTests.simplepractice?.status);
  console.log('LIVE SYNC ACTIVE:', results.syncVerification?.forceSyncWorking);
  console.log('TOTAL ISSUES:', results.issues.length);
  console.log('='.repeat(50));
  
  if (results.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  results.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  
  return results;
}

// Auto-execute audit
runLiveSyncAudit().catch(console.error);