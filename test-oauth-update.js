/**
 * OAuth Configuration Test Script
 * Run this after updating Google Cloud Console OAuth configuration
 */

async function testOAuthConfiguration() {
  console.log('🔧 Testing OAuth Configuration...');
  
  try {
    // Test authentication status
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    console.log('📊 Current Auth Status:');
    console.log('- Authenticated:', authData.isAuthenticated);
    console.log('- Has Tokens:', authData.hasTokens);
    console.log('- Token Type:', authData.tokenType);
    
    // Test OAuth URL generation
    const oauthTestResponse = await fetch('/api/auth/oauth-test');
    const oauthData = await oauthTestResponse.json();
    
    console.log('\n🔗 OAuth URL Test:');
    if (oauthData.success) {
      console.log('✅ OAuth already working - user authenticated');
    } else {
      console.log('📋 OAuth URL generated:', oauthData.oauthUrl);
      console.log('⚠️  Try this URL manually to test OAuth flow');
    }
    
    // Test Google Calendar endpoint after OAuth update
    console.log('\n🔄 Testing Google Calendar Sync...');
    const calendarResponse = await fetch('/api/calendar/events');
    const calendarData = await calendarResponse.json();
    
    if (calendarResponse.ok) {
      console.log('✅ Google Calendar Sync: SUCCESS');
      console.log('- Events loaded:', calendarData.length);
    } else {
      console.log('❌ Google Calendar Sync: FAILED');
      console.log('- Error:', calendarData.error);
      console.log('- Message:', calendarData.message);
    }
    
    // Generate final test summary
    console.log('\n📋 OAuth Configuration Test Summary:');
    console.log('====================================');
    
    const authWorking = authData.isAuthenticated;
    const oauthWorking = oauthData.success || !oauthData.oauthUrl.includes('error');
    const calendarWorking = calendarResponse.ok;
    
    console.log('✅ Authentication Status:', authWorking ? 'PASS' : 'FAIL');
    console.log('✅ OAuth URL Generation:', oauthWorking ? 'PASS' : 'FAIL');
    console.log('✅ Google Calendar Sync:', calendarWorking ? 'PASS' : 'FAIL');
    
    if (authWorking && oauthWorking && calendarWorking) {
      console.log('\n🎉 OAuth Configuration: FULLY WORKING');
      console.log('✅ System ready for deployment');
    } else if (authWorking && oauthWorking) {
      console.log('\n⚠️  OAuth Configuration: PARTIALLY WORKING');
      console.log('✅ OAuth flow works, but Google Calendar sync may need token refresh');
    } else {
      console.log('\n❌ OAuth Configuration: NEEDS ATTENTION');
      console.log('🔧 Please verify Google Cloud Console configuration');
    }
    
    return {
      authentication: authWorking,
      oauth: oauthWorking,
      calendar: calendarWorking
    };
    
  } catch (error) {
    console.error('❌ OAuth test failed:', error);
    return {
      authentication: false,
      oauth: false,
      calendar: false,
      error: error.message
    };
  }
}

// Auto-run the test
testOAuthConfiguration().then(result => {
  console.log('\n🎯 Final Result:', result);
});

// Make function available globally for manual testing
window.testOAuthConfiguration = testOAuthConfiguration;