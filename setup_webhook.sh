#!/bin/bash

# Setup script for Moonbot GitHub Webhook Server
# This script installs and configures the webhook server on your server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEBHOOK_PORT=3001
WEBHOOK_SECRET=""
DEPLOY_DIR="$(pwd)"  # Use current directory instead of /root/frontend
SERVICE_NAME="moonbot-webhook"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check if Node.js is installed
check_nodejs() {
    log "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Installing Node.js 18.x..."
        
        # Add NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        
        # Install Node.js
        apt-get update
        apt-get install -y nodejs
        
        log "Node.js installed successfully"
    else
        NODE_VERSION=$(node --version)
        log "Node.js is already installed: $NODE_VERSION"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Installing npm..."
        apt-get install -y npm
        log "npm installed successfully"
    fi
}

# Generate webhook secret
generate_secret() {
    if [[ -z "$WEBHOOK_SECRET" ]]; then
        WEBHOOK_SECRET=$(openssl rand -hex 32)
        log "Generated webhook secret: $WEBHOOK_SECRET"
    fi
}

# Install webhook server
install_webhook_server() {
    log "Installing webhook server..."
    
    # Copy webhook server to deploy directory
    if [[ ! -d "$DEPLOY_DIR" ]]; then
        mkdir -p "$DEPLOY_DIR"
        log "Created deploy directory: $DEPLOY_DIR"
    fi
    
    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Copy webhook server files (only if they're different from target)
    if [[ "$SCRIPT_DIR/webhook_server.js" != "$DEPLOY_DIR/webhook_server.js" ]]; then
        cp "$SCRIPT_DIR/webhook_server.js" "$DEPLOY_DIR/"
        log "Copied webhook_server.js to $DEPLOY_DIR"
    else
        log "webhook_server.js already in target directory"
    fi
    
    if [[ -f "$SCRIPT_DIR/moonbot-webhook.service" ]]; then
        cp "$SCRIPT_DIR/moonbot-webhook.service" /etc/systemd/system/
        log "Copied moonbot-webhook.service to systemd"
    else
        warn "moonbot-webhook.service not found in script directory"
    fi
    
    # Set proper permissions for root user
    chown -R root:root "$DEPLOY_DIR"
    chmod +x "$DEPLOY_DIR/webhook_server.js"
    
    log "Webhook server files installed"
}

# Configure systemd service
configure_service() {
    log "Configuring systemd service..."
    
    # Find Node.js executable path
    NODE_PATH=$(which node 2>/dev/null || echo "/usr/bin/node")
    log "Found Node.js at: $NODE_PATH"
    
    # Update service file with generated secret
    sed -i "s/your-webhook-secret-here/$WEBHOOK_SECRET/g" /etc/systemd/system/moonbot-webhook.service
    
    # Check if it's an NVM installation
    if [[ "$NODE_PATH" == *"/.nvm/"* ]]; then
        log "Detected NVM installation, creating wrapper script..."
        
        # Create a wrapper script that sources NVM
        cat > "$DEPLOY_DIR/run_webhook.sh" << 'EOF'
#!/bin/bash
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
exec node /root/frontend/webhook_server.js
EOF
        
        chmod +x "$DEPLOY_DIR/run_webhook.sh"
        log "Created NVM wrapper script at $DEPLOY_DIR/run_webhook.sh"
        
        # Update the service file to use the wrapper script
        sed -i "s|ExecStart=.*|ExecStart=$DEPLOY_DIR/run_webhook.sh|g" /etc/systemd/system/moonbot-webhook.service
        
        log "Systemd service configured to use NVM wrapper script"
    else
        # Regular Node.js installation
        sed -i "s|/usr/bin/node|$NODE_PATH|g" /etc/systemd/system/moonbot-webhook.service
        log "Systemd service configured with Node.js path: $NODE_PATH"
    fi
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable service
    systemctl enable moonbot-webhook.service
    
    log "Systemd service configured and enabled"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Check if ufw is active
    if ufw status | grep -q "Status: active"; then
        ufw allow $WEBHOOK_PORT/tcp
        log "Firewall rule added for port $WEBHOOK_PORT"
    else
        warn "UFW is not active. Please configure your firewall to allow port $WEBHOOK_PORT"
    fi
}

# Configure nginx reverse proxy (optional)
configure_nginx() {
    log "Checking nginx configuration..."
    
    if command -v nginx &> /dev/null; then
        info "Nginx detected. Creating reverse proxy configuration..."
        
        cat > /etc/nginx/sites-available/moonbot-webhook << 'EOF'
server {
    listen 80;
    server_name _;  # Accept any domain
    
    location /webhook {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /status {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
        
        # Enable site
        ln -sf /etc/nginx/sites-available/moonbot-webhook /etc/nginx/sites-enabled/
        
        # Test nginx configuration
        if nginx -t; then
            systemctl reload nginx
            log "Nginx configuration updated"
        else
            error "Nginx configuration test failed"
        fi
    else
        warn "Nginx not found. Webhook will only be accessible on localhost:$WEBHOOK_PORT"
    fi
}

# Start webhook service
start_service() {
    log "Starting webhook service..."
    
    systemctl start moonbot-webhook.service
    
    # Wait a moment for service to start
    sleep 3
    
    # Check service status
    if systemctl is-active --quiet moonbot-webhook.service; then
        log "Webhook service started successfully"
    else
        error "Failed to start webhook service"
        systemctl status moonbot-webhook.service
        exit 1
    fi
}

# Display setup summary
display_summary() {
    echo ""
    log "=== Webhook Server Setup Complete ==="
    echo ""
    info "Webhook server is now running on port $WEBHOOK_PORT"
    info "Service name: $SERVICE_NAME"
    echo ""
    info "Important information:"
    echo "  - Webhook secret: $WEBHOOK_SECRET"
    echo "  - Webhook URL: http://your-server-ip:$WEBHOOK_PORT/webhook"
    echo "  - Status URL: http://your-server-ip:$WEBHOOK_PORT/status"
    echo "  - Health URL: http://your-server-ip:$WEBHOOK_PORT/health"
    echo ""
    info "Next steps:"
    echo "  1. Copy the webhook secret above"
    echo "  2. Go to your GitHub repository settings"
    echo "  3. Add a webhook with the URL and secret above"
    echo "  4. Select 'Just the push event' and 'master' branch"
    echo ""
    info "Service management commands:"
    echo "  - Check status: sudo systemctl status $SERVICE_NAME"
    echo "  - View logs: sudo journalctl -u $SERVICE_NAME -f"
    echo "  - Restart: sudo systemctl restart $SERVICE_NAME"
    echo "  - Stop: sudo systemctl stop $SERVICE_NAME"
    echo ""
}

# Main setup function
main() {
    log "Starting webhook server setup..."
    
    check_permissions
    check_nodejs
    generate_secret
    install_webhook_server
    configure_service
    configure_firewall
    configure_nginx
    start_service
    display_summary
    
    log "Setup completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --secret SECRET Use custom webhook secret"
        echo ""
        echo "This script sets up the GitHub webhook server for automatic deployment."
        exit 0
        ;;
    --secret)
        if [[ -n "$2" ]]; then
            WEBHOOK_SECRET="$2"
            shift 2
        else
            error "Missing secret value for --secret option"
            exit 1
        fi
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
