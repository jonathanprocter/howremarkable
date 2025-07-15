#!/usr/bin/env node

/**
 * Deployment Build Fix Script
 * 
 * This script fixes the deployment issue by ensuring client files are built
 * to the correct location where the server expects them (server/public)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Fixing deployment build configuration...');

// Function to run commands with error handling
function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Function to ensure directory exists
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  } else {
    console.log(`📁 Directory exists: ${dirPath}`);
  }
}

// Step 1: Create proper directory structure
console.log('\n📁 Setting up directory structure...');
ensureDirectory('server/public');
ensureDirectory('dist');

// Step 2: Build client to server/public (where server expects files)
console.log('\n🔧 Building client application...');
if (!runCommand('npx vite build --outDir=server/public --emptyOutDir', 'Client build')) {
  console.error('❌ Client build failed. Deployment cannot continue.');
  process.exit(1);
}

// Step 3: Build server to dist
console.log('\n🔧 Building server application...');
if (!runCommand('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', 'Server build')) {
  console.error('❌ Server build failed. Deployment cannot continue.');
  process.exit(1);
}

// Step 4: Verify build output
console.log('\n🔍 Verifying build output...');

const clientIndex = path.join('server/public', 'index.html');
const serverIndex = path.join('dist', 'index.js');

let success = true;

if (fs.existsSync(clientIndex)) {
  console.log('✅ Client build verified: server/public/index.html exists');
} else {
  console.error('❌ Client build verification failed: server/public/index.html not found');
  success = false;
}

if (fs.existsSync(serverIndex)) {
  console.log('✅ Server build verified: dist/index.js exists');
} else {
  console.error('❌ Server build verification failed: dist/index.js not found');
  success = false;
}

if (success) {
  console.log('\n🎉 Deployment build fix completed successfully!');
  console.log('\n📋 Build Summary:');
  console.log('   ✅ Client files: server/public/ (where server expects them)');
  console.log('   ✅ Server files: dist/ (where npm start expects them)');
  console.log('\n💡 Your deployment should now work correctly!');
  console.log('   Run: npm start');
} else {
  console.error('\n❌ Deployment build fix failed!');
  process.exit(1);
}