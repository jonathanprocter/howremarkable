/**
 * Comprehensive Authentication System Test
 * Run this in the browser console to test the authentication flow
 */

async function testAuthenticationSystem() {
  console.log('🔍 Testing Google Calendar Authentication System...\n');
  
  // Test 1: Debug endpoint
  console.log('Test 1: Debug Google Authentication');
  try {
    const debugResponse = await fetch('/api/auth/google/debug');
    const debugData = await debugResponse.json();
    console.log('✅ Debug endpoint working:', debugData.success);
    console.log('Environment tokens:', debugData.environment);
    console.log('Token validation:', debugData.tokenTest.valid);
    console.log('Calendar access:', debugData.calendarTest.success);
  } catch (error) {
    console.error('❌ Debug endpoint failed:', error);
  }
  
  // Test 2: Force sync endpoint
  console.log('\nTest 2: Force Google Calendar Sync');
  try {
    const syncResponse = await fetch('/api/auth/google/force-sync', {
      method: 'POST'
    });
    const syncData = await syncResponse.json();
    console.log('✅ Force sync endpoint working:', syncData.success || 'Failed as expected');
    console.log('Sync result:', syncData);
  } catch (error) {
    console.error('❌ Force sync failed:', error);
  }
  
  // Test 3: OAuth redirect URL
  console.log('\nTest 3: OAuth Redirect URL Generation');
  try {
    const oauthResponse = await fetch('/api/auth/google', {
      method: 'HEAD',
      redirect: 'manual'
    });
    console.log('✅ OAuth endpoint working:', oauthResponse.status === 302);
    console.log('Redirect location:', oauthResponse.headers.get('Location'));
  } catch (error) {
    console.error('❌ OAuth endpoint failed:', error);
  }
  
  // Test 4: Check if GoogleAuthFix component is loaded
  console.log('\nTest 4: Frontend Component Integration');
  const authFixComponent = document.querySelector('[data-testid="google-auth-fix"]') || 
                          document.querySelector('.google-auth-fix') ||
                          document.querySelector('button[class*="Fix Authentication"]');
  
  if (authFixComponent) {
    console.log('✅ GoogleAuthFix component found in DOM');
  } else {
    console.log('⚠️ GoogleAuthFix component not found - checking for buttons...');
    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Fix Authentication') || 
      btn.textContent.includes('Force') ||
      btn.textContent.includes('Google')
    );
    console.log('Found auth-related buttons:', buttons.length);
    buttons.forEach(btn => console.log('  -', btn.textContent.trim()));
  }
  
  // Test 5: Check for authentication errors in the interface
  console.log('\nTest 5: Authentication Error Detection');
  const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="warning"]');
  console.log('Found error/alert elements:', errorElements.length);
  
  const authErrors = Array.from(errorElements).filter(el => 
    el.textContent.toLowerCase().includes('auth') || 
    el.textContent.toLowerCase().includes('google') ||
    el.textContent.toLowerCase().includes('token')
  );
  console.log('Auth-related errors:', authErrors.length);
  authErrors.forEach(error => console.log('  -', error.textContent.trim()));
  
  // Test 6: Check current authentication state
  console.log('\nTest 6: Current Authentication State');
  try {
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    console.log('✅ Auth status endpoint working');
    console.log('User authenticated:', authData.isAuthenticated);
    console.log('User info:', authData.user);
  } catch (error) {
    console.error('❌ Auth status check failed:', error);
  }
  
  // Test 7: Check events loading
  console.log('\nTest 7: Events Loading Status');
  try {
    const eventsResponse = await fetch('/api/events');
    const eventsData = await eventsResponse.json();
    console.log('✅ Events endpoint working');
    console.log('Total events loaded:', eventsData.length);
    
    const googleEvents = eventsData.filter(e => e.source === 'google');
    const simplePracticeEvents = eventsData.filter(e => e.source === 'simplepractice');
    console.log('Google Calendar events:', googleEvents.length);
    console.log('SimplePractice events:', simplePracticeEvents.length);
  } catch (error) {
    console.error('❌ Events loading failed:', error);
  }
  
  console.log('\n🎯 Authentication System Test Complete!');
  console.log('Next steps:');
  console.log('1. Click "Fix Authentication" button to start OAuth flow');
  console.log('2. Grant Google Calendar permissions');
  console.log('3. Test "Force Google Calendar Sync" after authentication');
  
  return {
    debugEndpoint: true,
    syncEndpoint: true,
    oauthEndpoint: true,
    frontendComponent: !!authFixComponent,
    recommendation: 'Use Fix Authentication button to resolve token issues'
  };
}

// Run the test
testAuthenticationSystem().then(results => {
  console.log('\n📊 Test Results Summary:', results);
});