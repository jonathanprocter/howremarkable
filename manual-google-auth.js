/**
 * Manual Google Authentication Test
 * Provides a direct URL for user to authenticate with Google
 */

import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Use the actual deployment domain for the redirect URI
const REDIRECT_URI = 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback';

console.log('🔐 Manual Google Authentication Setup');
console.log('=====================================');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing Google OAuth credentials');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.file',
  'profile',
  'email'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('\n✅ Authentication URL Generated');
console.log('================================');
console.log('🔗 Please visit this URL to authenticate with Google Calendar:');
console.log('');
console.log(authUrl);
console.log('');
console.log('📋 Instructions:');
console.log('1. Click the URL above (or copy/paste into your browser)');
console.log('2. Sign in with your Google account');
console.log('3. Grant calendar and drive permissions');
console.log('4. You will be redirected back to the application');
console.log('5. Check the application - Google Calendar should now be working!');
console.log('');
console.log('🚀 After completing authentication, try the "Force Google Calendar Sync" button');
console.log('');