#!/bin/bash
# ════════════════════════════════════════════════════════════════
# NileCare HTTPS Deployment Script
# Automates HTTPS enforcement setup
# ════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-api.nilecare.com}"
EMAIL="${EMAIL:-admin@nilecare.com}"
STAGING="${STAGING:-true}"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  NileCare HTTPS Enforcement Deployment${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Step 1: Install Nginx
echo ""
echo -e "${BLUE}Step 1: Installing Nginx...${NC}"
if command -v nginx &> /dev/null; then
    print_status "Nginx already installed"
else
    apt update
    apt install nginx -y
    systemctl enable nginx
    systemctl start nginx
    print_status "Nginx installed"
fi

# Step 2: Install Certbot
echo ""
echo -e "${BLUE}Step 2: Installing Certbot...${NC}"
if command -v certbot &> /dev/null; then
    print_status "Certbot already installed"
else
    apt install certbot python3-certbot-nginx -y
    print_status "Certbot installed"
fi

# Step 3: Create directories
echo ""
echo -e "${BLUE}Step 3: Creating directories...${NC}"
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /var/www/certbot
mkdir -p /var/www/nilecare
print_status "Directories created"

# Step 4: Copy Nginx configuration
echo ""
echo -e "${BLUE}Step 4: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/nilecare << 'EOF'
# HTTP → HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.nilecare.com www.api.nilecare.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server (will be updated with SSL cert)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.nilecare.com www.api.nilecare.com;

    # Temporary self-signed cert (will be replaced by Let's Encrypt)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to main orchestrator
    location /api/ {
        proxy_pass http://localhost:7000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:7000/health;
        access_log off;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:7000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }

    location / {
        root /var/www/nilecare;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/nilecare /etc/nginx/sites-enabled/
print_status "Nginx configured"

# Step 5: Test Nginx configuration
echo ""
echo -e "${BLUE}Step 5: Testing Nginx configuration...${NC}"
if nginx -t; then
    print_status "Nginx configuration valid"
else
    print_error "Nginx configuration invalid"
    exit 1
fi

# Step 6: Reload Nginx
echo ""
echo -e "${BLUE}Step 6: Reloading Nginx...${NC}"
systemctl reload nginx
print_status "Nginx reloaded"

# Step 7: Obtain SSL certificate
echo ""
echo -e "${BLUE}Step 7: Obtaining SSL certificate...${NC}"
if [ "$STAGING" = "true" ]; then
    print_warning "Using Let's Encrypt STAGING (for testing)"
    certbot --nginx --staging \
        -d $DOMAIN -d www.$DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --non-interactive
else
    print_warning "Using Let's Encrypt PRODUCTION"
    certbot --nginx \
        -d $DOMAIN -d www.$DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --non-interactive
fi
print_status "SSL certificate obtained"

# Step 8: Test certificate renewal
echo ""
echo -e "${BLUE}Step 8: Testing certificate renewal...${NC}"
certbot renew --dry-run
print_status "Certificate renewal tested"

# Step 9: Summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ HTTPS Enforcement Deployed Successfully!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "📋 Configuration Summary:"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo "   Mode: $([ "$STAGING" = "true" ] && echo "STAGING" || echo "PRODUCTION")"
echo ""
echo "📁 Important Files:"
echo "   Nginx Config: /etc/nginx/sites-available/nilecare"
echo "   SSL Cert: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "   SSL Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update service environment variables (HTTPS_ENABLED=true)"
echo "   2. Update frontend API_BASE_URL to https://$DOMAIN"
echo "   3. Test HTTPS endpoint: curl -I https://$DOMAIN/health"
echo "   4. Test WebSocket: Check browser console"
echo "   5. Run SSL Labs test: https://www.ssllabs.com/ssltest/"
echo ""
echo "📊 Monitoring:"
echo "   Nginx logs: tail -f /var/log/nginx/nilecare-error.log"
echo "   Certificate expiry: certbot certificates"
echo "   Test renewal: certbot renew --dry-run"
echo ""
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo ""

