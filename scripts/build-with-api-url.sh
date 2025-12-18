#!/bin/bash
# Build with API URL from environment
API_URL=${API_URL:-http://localhost:8000}
echo "Building with API_URL=$API_URL"
VITE_API_URL=$API_URL npm run build
