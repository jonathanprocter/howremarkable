/**
 * Browser-Based Live Google Calendar Sync Audit System
 * Run this in the browser console to verify live sync functionality
 */

window.runLiveSyncAudit = async function() {
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
    console.error('❌ Authentication test failed:', error);
  }

  // Test 2: Calendar Events Endpoint
  console.log('\n📋 TEST 2: Calendar Events Endpoint');
  try {
    const start = '2024-01-01T05:00:00.000Z';
    const end = '2025-12-31T05:00:00.000Z';
    
    const startTime = Date.now();
    const calendarResponse = await fetch(`/api/calendar/events?start=${start}&end=${end}`);
    const responseTime = Date.now() - startTime;
    
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      
      results.endpointTests.calendar = {
        status: 'PASS',
        eventCount: calendarData.events ? calendarData.events.length : 0,
        hasCalendars: calendarData.calendars ? calendarData.calendars.length : 0,
        isLiveSync: calendarData.isLiveSync || false,
        syncTime: calendarData.syncTime || null,
        responseTime: responseTime
      };
      
      console.log('✅ Calendar Events Test:', results.endpointTests.calendar);
      
      if (!calendarData.isLiveSync) {
        results.issues.push('Calendar endpoint not using live sync');
      }
      
      // Sample some events to verify they're fresh
      if (calendarData.events && calendarData.events.length > 0) {
        const sampleEvents = calendarData.events.slice(0, 3);
        console.log('📅 Sample events:', sampleEvents.map(e => ({
          title: e.title,
          startTime: e.startTime,
          source: e.source
        })));
      }
    } else {
      const errorText = await calendarResponse.text();
      results.endpointTests.calendar = { 
        status: 'FAIL', 
        error: `HTTP ${calendarResponse.status}: ${errorText}`,
        responseTime: responseTime
      };
      results.issues.push('Calendar events endpoint failed');
    }
  } catch (error) {
    results.endpointTests.calendar = { status: 'FAIL', error: error.message };
    results.issues.push('Calendar events endpoint failed');
    console.error('❌ Calendar events test failed:', error);
  }

  // Test 3: SimplePractice Events Endpoint
  console.log('\n📋 TEST 3: SimplePractice Events Endpoint');
  try {
    const spResponse = await fetch('/api/simplepractice/events');
    
    if (spResponse.ok) {
      const spData = await spResponse.json();
      
      results.endpointTests.simplepractice = {
        status: 'PASS',
        eventCount: spData.events ? spData.events.length : 0,
        hasCalendars: spData.calendars ? spData.calendars.length : 0,
        isLiveSync: spData.isLiveSync || false
      };
      
      console.log('✅ SimplePractice Events Test:', results.endpointTests.simplepractice);
    } else {
      const errorText = await spResponse.text();
      results.endpointTests.simplepractice = { 
        status: 'FAIL', 
        error: `HTTP ${spResponse.status}: ${errorText}` 
      };
      results.issues.push('SimplePractice events endpoint failed');
    }
  } catch (error) {
    results.endpointTests.simplepractice = { status: 'FAIL', error: error.message };
    results.issues.push('SimplePractice events endpoint failed');
    console.error('❌ SimplePractice events test failed:', error);
  }

  // Test 4: Data Source Verification
  console.log('\n📋 TEST 4: Data Source Verification');
  try {
    const eventsResponse = await fetch('/api/events');
    
    if (eventsResponse.ok) {
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
    } else {
      results.dataIntegrity = { status: 'FAIL', error: `HTTP ${eventsResponse.status}` };
      results.issues.push('Data source verification failed');
    }
  } catch (error) {
    results.dataIntegrity = { status: 'FAIL', error: error.message };
    results.issues.push('Data source verification failed');
    console.error('❌ Data source verification failed:', error);
  }

  // Test 5: Live Sync Force Test
  console.log('\n📋 TEST 5: Live Sync Force Test');
  try {
    const timestamp = Date.now();
    const forceSyncResponse = await fetch(`/api/calendar/events?start=2024-01-01T05:00:00.000Z&end=2025-12-31T05:00:00.000Z&force=true&timestamp=${timestamp}`);
    
    if (forceSyncResponse.ok) {
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
      
      console.log('✅ Live Sync Force Test:', results.syncVerification);
    } else {
      const errorText = await forceSyncResponse.text();
      results.syncVerification = { 
        forceSyncWorking: false, 
        status: forceSyncResponse.status,
        error: errorText
      };
      results.issues.push('Force sync request failed');
    }
  } catch (error) {
    results.syncVerification = { status: 'FAIL', error: error.message };
    results.issues.push('Live sync force test failed');
    console.error('❌ Live sync force test failed:', error);
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
};

// Auto-load the audit function
console.log('🔍 Live Sync Audit System loaded. Run runLiveSyncAudit() to start testing.');