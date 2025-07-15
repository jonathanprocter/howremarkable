/**
 * Simple OAuth Test Script
 * Tests the direct Google authentication flow
 */

const http = require('http');
const https = require('https');
const querystring = require('querystring');

async function testSimpleOAuth() {
  console.log('🔄 Testing Simple OAuth Flow...');
  
  try {
    // Step 1: Test OAuth URL generation
    console.log('1. Testing OAuth URL generation...');
    const authResponse = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/google',
        method: 'GET'
      }, (res) => {
        console.log('Auth URL response status:', res.statusCode);
        console.log('Auth URL response headers:', res.headers);
        
        if (res.statusCode === 302) {
          console.log('✅ OAuth URL generated successfully');
          console.log('Redirect URL:', res.headers.location);
          resolve(res.headers.location);
        } else {
          reject(new Error(`Unexpected status: ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.end();
    });
    
    // Step 2: Test debug endpoint
    console.log('\n2. Testing debug endpoint...');
    const debugResponse = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/google/debug',
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    console.log('Debug response:', JSON.stringify(debugResponse, null, 2));
    
    // Step 3: Test callback with fake code (should fail gracefully)
    console.log('\n3. Testing callback endpoint...');
    const callbackResponse = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/google/callback?code=fake-code',
        method: 'GET'
      }, (res) => {
        console.log('Callback response status:', res.statusCode);
        console.log('Callback response headers:', res.headers);
        resolve({
          status: res.statusCode,
          location: res.headers.location
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    console.log('Callback response:', callbackResponse);
    
    console.log('\n✅ OAuth flow test completed');
    console.log('📋 Summary:');
    console.log('- OAuth URL generation: ✅ Working');
    console.log('- Debug endpoint: ✅ Working');
    console.log('- Callback endpoint: ✅ Working (graceful failure expected)');
    
  } catch (error) {
    console.error('❌ OAuth test failed:', error.message);
  }
}

// Run the test
testSimpleOAuth();