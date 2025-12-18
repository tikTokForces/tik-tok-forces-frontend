#!/bin/bash

# TikTok Forces Frontend Deployment Script
# This script deploys the frontend on a Linux server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/tik-tok-forces-frontend"
NGINX_CONFIG="/etc/nginx/sites-available/tikforces"
NGINX_ENABLED="/etc/nginx/sites-enabled/tikforces"
API_URL="${API_URL:-http://localhost:8000}"

echo -e "${GREEN}🚀 Starting TikTok Forces Frontend Deployment${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Install/update Node.js dependencies
echo -e "${YELLOW}📦 Installing/updating Node.js dependencies${NC}"
npm install

# Build frontend with API URL
echo -e "${YELLOW}🔨 Building frontend with API_URL=$API_URL${NC}"
export VITE_API_URL="$API_URL"
npm run build

# Setup Nginx configuration if it doesn't exist
if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${YELLOW}🌐 Setting up Nginx configuration${NC}"
    cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /opt/tik-tok-forces-frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Direct backend access (for compatibility)
    location ~ ^/(process|job|jobs|users|proxies|video|assets|browse|quickpaths|serve_video|video_params) {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File upload size limit
    client_max_body_size 2G;
}
EOF
    # Enable Nginx site
    ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"
fi

# Test and reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx${NC}"
nginx -t && systemctl reload nginx

echo -e "${GREEN}✅ Frontend deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Frontend is available at http://$(hostname -I | awk '{print $1}')${NC}"

