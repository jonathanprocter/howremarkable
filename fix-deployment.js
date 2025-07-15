#!/usr/bin/env node
/**
 * Fix Deployment Script
 * Builds the application with correct directory structure for deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing deployment build structure...');

try {
  // Create server/public directory if it doesn't exist
  const serverPublicDir = 'server/public';
  if (!fs.existsSync(serverPublicDir)) {
    fs.mkdirSync(serverPublicDir, { recursive: true });
    console.log('📁 Created server/public directory');
  }

  // Build client to server/public
  console.log('🔨 Building client...');
  execSync('npx vite build --outDir=server/public --emptyOutDir', { 
    stdio: 'inherit',
    timeout: 120000 // 2 minutes timeout
  });
  
  console.log('✅ Client built successfully');
  
  // Build server
  console.log('🔨 Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    stdio: 'inherit',
    timeout: 60000 // 1 minute timeout
  });
  
  console.log('✅ Server built successfully');
  
  // Verify files exist
  const clientIndex = path.join(serverPublicDir, 'index.html');
  const serverIndex = path.join('dist', 'index.js');
  
  if (fs.existsSync(clientIndex)) {
    console.log('✅ Client index.html found');
  } else {
    throw new Error('❌ Client index.html not found');
  }
  
  if (fs.existsSync(serverIndex)) {
    console.log('✅ Server index.js found');
  } else {
    throw new Error('❌ Server index.js not found');
  }
  
  console.log('🚀 Deployment build complete!');
  console.log('📁 Client files: server/public/');
  console.log('📁 Server files: dist/');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}