/**
 * Test Google OAuth URLs and configuration
 */

const baseUrl = process.env.REPLIT_DOMAIN || 'localhost:5000';
const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
const redirectUri = `${protocol}://${baseUrl}/api/auth/google/callback`;

console.log('🔍 Testing Google OAuth Configuration...\n');

// Test OAuth URL generation
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly')}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log('✅ OAuth Configuration:');
console.log('Base URL:', baseUrl);
console.log('Protocol:', protocol);
console.log('Redirect URI:', redirectUri);
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('\n🔗 Generated OAuth URL:');
console.log(authUrl);

// Test token validation
console.log('\n🔍 Testing current tokens...');
const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

console.log('Access Token:', accessToken ? 'Present' : 'Missing');
console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');

if (accessToken) {
  console.log('Access Token (first 20 chars):', accessToken.substring(0, 20) + '...');
}

console.log('\n✅ OAuth Configuration Test Complete!');