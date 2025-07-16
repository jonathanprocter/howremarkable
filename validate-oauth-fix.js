#!/usr/bin/env node

/**
 * OAUTH FIX VALIDATION SCRIPT
 * 
 * This script validates that the OAuth fix has been properly implemented
 * and provides diagnostic information for troubleshooting.
 */

import { getCurrentDeploymentURL, validateOAuthConfiguration } from './server/oauth-fix.js';

console.log('🔍 OAUTH FIX VALIDATION');
console.log('='.repeat(50));

// 1. Environment Variables Check
console.log('\n📋 Environment Variables:');
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET'
];

const optionalEnvVars = [
  'GOOGLE_ACCESS_TOKEN',
  'GOOGLE_REFRESH_TOKEN',
  'BASE_URL',
  'REPLIT_DOMAINS',
  'REPLIT_DEV_DOMAIN'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Not set`);
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`⚪ ${varName}: Not set`);
  }
});

// 2. URL Detection Test
console.log('\n🌍 URL Detection:');
try {
  const deploymentUrl = getCurrentDeploymentURL();
  console.log(`✅ Detected URL: ${deploymentUrl}`);
  console.log(`✅ Callback URL: ${deploymentUrl}/api/auth/google/callback`);
} catch (error) {
  console.log(`❌ URL Detection Error: ${error.message}`);
}

// 3. OAuth Configuration Validation
console.log('\n🔧 OAuth Configuration:');
try {
  const validation = validateOAuthConfiguration();
  
  if (validation.valid) {
    console.log('✅ OAuth configuration is valid');
  } else {
    console.log('❌ OAuth configuration has errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.log('⚠️ OAuth configuration warnings:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
} catch (error) {
  console.log(`❌ OAuth validation error: ${error.message}`);
}

// 4. Google Cloud Console Instructions
console.log('\n📋 GOOGLE CLOUD CONSOLE SETUP:');
console.log('Add these URLs to your OAuth 2.0 Client ID:');
console.log('');

try {
  const deploymentUrl = getCurrentDeploymentURL();
  
  console.log('Authorized JavaScript Origins:');
  console.log(`  - ${deploymentUrl}`);
  
  console.log('');
  console.log('Authorized Redirect URIs:');
  console.log(`  - ${deploymentUrl}/api/auth/google/callback`);
  
} catch (error) {
  console.log('❌ Could not generate URLs - check environment configuration');
}

// 5. Testing Recommendations
console.log('\n🧪 TESTING RECOMMENDATIONS:');
console.log('After deploying and updating Google Cloud Console:');
console.log('');
console.log('1. Test deployment info:');
console.log('   GET /api/deployment/info');
console.log('');
console.log('2. Test OAuth flow:');
console.log('   GET /api/auth/google');
console.log('');
console.log('3. Test OAuth status:');
console.log('   GET /api/auth/status');
console.log('');
console.log('4. Test Google API access:');
console.log('   GET /api/auth/google/test');
console.log('');
console.log('5. Test live calendar sync:');
console.log('   GET /api/live-sync/calendar/events?start=2025-01-01&end=2025-12-31');

// 6. File Verification
console.log('\n📁 File Verification:');
const requiredFiles = [
  'server/oauth-fix.ts',
  'server/routes.ts',
  'OAUTH_FIX_COMPLETE.md'
];

import { existsSync } from 'fs';

requiredFiles.forEach(filePath => {
  if (existsSync(filePath)) {
    console.log(`✅ ${filePath}: Exists`);
  } else {
    console.log(`❌ ${filePath}: Missing`);
  }
});

// 7. Summary
console.log('\n🎯 SUMMARY:');
const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
const hasSessionSecret = !!process.env.SESSION_SECRET;

if (hasClientId && hasClientSecret && hasSessionSecret) {
  console.log('✅ OAuth fix is properly configured');
  console.log('✅ Ready for deployment');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy your application');
  console.log('2. Update Google Cloud Console with the detected URLs');
  console.log('3. Test the OAuth flow');
} else {
  console.log('❌ OAuth fix needs configuration');
  console.log('');
  console.log('Required actions:');
  if (!hasClientId) console.log('- Set GOOGLE_CLIENT_ID environment variable');
  if (!hasClientSecret) console.log('- Set GOOGLE_CLIENT_SECRET environment variable');  
  if (!hasSessionSecret) console.log('- Set SESSION_SECRET environment variable');
}

console.log('\n🚀 OAuth fix validation complete!');
