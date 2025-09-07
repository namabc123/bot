#!/bin/bash

# Quick fix script for webhook service Node.js path issue
# Run this on your server to fix the Node.js path

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

log "Fixing webhook service Node.js path..."

# Stop the service first
systemctl stop moonbot-webhook.service 2>/dev/null || true

# Find Node.js executable path
NODE_PATH=$(which node 2>/dev/null || echo "/usr/bin/node")
log "Found Node.js at: $NODE_PATH"

# Check if it's an NVM installation
if [[ "$NODE_PATH" == *"/.nvm/"* ]]; then
    log "Detected NVM installation, creating wrapper script..."
    
    # Create a wrapper script that sources NVM
    cat > /root/frontend/run_webhook.sh << 'EOF'
#!/bin/bash
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
exec node /root/frontend/webhook_server.js
EOF
    
    chmod +x /root/frontend/run_webhook.sh
    log "Created NVM wrapper script at /root/frontend/run_webhook.sh"
    
    # Update the service file to use the wrapper script
    if [[ -f "/etc/systemd/system/moonbot-webhook.service" ]]; then
        # Create a backup
        cp /etc/systemd/system/moonbot-webhook.service /etc/systemd/system/moonbot-webhook.service.backup
        
        # Update the ExecStart line to use the wrapper script
        sed -i "s|ExecStart=.*|ExecStart=/root/frontend/run_webhook.sh|g" /etc/systemd/system/moonbot-webhook.service
        
        log "Updated service file to use NVM wrapper script"
    else
        error "Service file not found at /etc/systemd/system/moonbot-webhook.service"
        exit 1
    fi
else
    # Regular Node.js installation
    if [[ -f "/etc/systemd/system/moonbot-webhook.service" ]]; then
        # Create a backup
        cp /etc/systemd/system/moonbot-webhook.service /etc/systemd/system/moonbot-webhook.service.backup
        
        # Update the ExecStart line
        sed -i "s|ExecStart=.*|ExecStart=$NODE_PATH /root/frontend/webhook_server.js|g" /etc/systemd/system/moonbot-webhook.service
        
        log "Updated service file with Node.js path: $NODE_PATH"
    else
        error "Service file not found at /etc/systemd/system/moonbot-webhook.service"
        exit 1
    fi
fi

# Reload systemd
systemctl daemon-reload

# Start the service
systemctl start moonbot-webhook.service

# Check service status
sleep 2
if systemctl is-active --quiet moonbot-webhook.service; then
    log "Webhook service started successfully!"
    log "Service status:"
    systemctl status moonbot-webhook.service --no-pager -l
else
    error "Failed to start webhook service"
    log "Service logs:"
    journalctl -u moonbot-webhook.service --no-pager -l -n 20
    exit 1
fi

log "Fix completed successfully!"
