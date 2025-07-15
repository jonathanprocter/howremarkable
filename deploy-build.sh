#!/bin/bash

echo "🔧 Building application for deployment..."

# Step 1: Build client files to server/public
echo "Building client..."
npx vite build --outDir=server/public --emptyOutDir

# Check if client build was successful
if [ $? -eq 0 ]; then
    echo "✅ Client build successful"
else
    echo "❌ Client build failed"
    exit 1
fi

# Step 2: Build server files
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Check if server build was successful
if [ $? -eq 0 ]; then
    echo "✅ Server build successful"
else
    echo "❌ Server build failed"
    exit 1
fi

# Step 3: Verify files exist
if [ -d "server/public" ]; then
    echo "✅ Client files available in server/public"
    ls -la server/public/
else
    echo "❌ server/public directory not found"
    exit 1
fi

if [ -f "dist/index.js" ]; then
    echo "✅ Server files available in dist/"
    ls -la dist/
else
    echo "❌ dist/index.js not found"
    exit 1
fi

echo "🚀 Build complete! Ready for deployment."