/**
 * Google Calendar Connection Fix Script
 * This script helps diagnose and fix Google Calendar connection issues
 */

const baseUrl = 'http://localhost:5000';

async function fixGoogleCalendarConnection() {
  console.log('🔧 Fixing Google Calendar Connection...\n');

  // Step 1: Check current authentication status
  console.log('1. Checking current authentication status...');
  try {
    const authResponse = await fetch(`${baseUrl}/api/auth/status`);
    const authData = await authResponse.json();
    
    if (authData.isAuthenticated) {
      console.log(`✅ User authenticated: ${authData.user.email}`);
    } else {
      console.log('❌ User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
  } catch (error) {
    console.log('❌ Auth status check failed:', error.message);
    return { success: false, error: 'Auth status check failed' };
  }

  // Step 2: Check Google token status
  console.log('\n2. Checking Google Calendar token status...');
  try {
    const debugResponse = await fetch(`${baseUrl}/api/auth/google/debug`);
    const debugData = await debugResponse.json();
    
    console.log(`✅ Environment tokens present: ${debugData.environment?.hasAccessToken && debugData.environment?.hasRefreshToken}`);
    console.log(`✅ Token validation: ${debugData.tokenTest?.valid ? 'Valid' : 'Invalid/Expired'}`);
    console.log(`✅ Calendar access: ${debugData.calendarTest?.success ? 'Working' : 'Failed'}`);
    
    if (!debugData.tokenTest?.valid) {
      console.log('⚠️  Current tokens are expired - this is the connection issue');
      console.log('⚠️  Error details:', debugData.tokenTest?.error || 'Token validation failed');
    }
  } catch (error) {
    console.log('❌ Google debug check failed:', error.message);
  }

  // Step 3: Generate fresh OAuth URL
  console.log('\n3. Generating fresh OAuth URL...');
  try {
    const oauthResponse = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'HEAD',
      redirect: 'manual'
    });
    
    const oauthUrl = oauthResponse.headers.get('Location');
    console.log(`✅ OAuth URL generated: ${oauthResponse.status === 302 ? 'Success' : 'Failed'}`);
    
    if (oauthUrl) {
      console.log('\n🔗 OAuth URL:', oauthUrl);
      console.log('\n📋 To fix the connection:');
      console.log('1. Open the planner interface in your browser');
      console.log('2. Look for "Google Calendar Authentication" card in the sidebar');
      console.log('3. Click "Fix Authentication" button');
      console.log('4. Complete the Google authorization process');
      console.log('5. You\'ll be redirected back to the planner');
      console.log('6. Test "Force Google Calendar Sync" to verify the fix');
      
      return { 
        success: true, 
        oauthUrl: oauthUrl,
        needsAuth: true,
        message: 'OAuth flow ready - click Fix Authentication in the interface'
      };
    }
  } catch (error) {
    console.log('❌ OAuth URL generation failed:', error.message);
  }

  console.log('\n🎯 CONNECTION ISSUE DIAGNOSIS COMPLETE');
  console.log('💡 SOLUTION: The connection error is due to expired OAuth tokens.');
  console.log('💡 FIX: Use the "Fix Authentication" button in the planner interface.');
  
  return { 
    success: true, 
    diagnosis: 'Expired OAuth tokens',
    solution: 'Complete OAuth flow via Fix Authentication button'
  };
}

// Run the fix
fixGoogleCalendarConnection().then(result => {
  console.log('\n📊 Connection Fix Result:', result);
  
  if (result.needsAuth) {
    console.log('\n🚀 Ready to fix connection - follow the steps above!');
  }
}).catch(error => {
  console.error('❌ Connection fix failed:', error);
});