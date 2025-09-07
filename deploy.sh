#!/bin/bash

# Frontend deployment script for Moonbot
# This script builds the React frontend and deploys it to the web server

set -e  # Exit on any error

# Configuration
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$FRONTEND_DIR/dist"
DEPLOY_DIR="/var/www/moonbot"
BACKUP_DIR="/var/www/moonbot_backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if running as root
check_permissions() {
    # Allow running as root for deployment purposes
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root - this is allowed for deployment"
    fi
}

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v yarn &> /dev/null; then
        error "Yarn is not installed"
        exit 1
    fi
    
    # Check and display yarn version
    YARN_VERSION=$(yarn --version)
    log "Yarn version: $YARN_VERSION"
    
    log "Dependencies check passed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    cd "$FRONTEND_DIR"
    yarn install --immutable
    log "Dependencies installed successfully"
}

# Build the frontend
build_frontend() {
    log "Building frontend..."
    cd "$FRONTEND_DIR"
    
    # Clean previous build
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
        log "Cleaned previous build directory"
    fi
    
    # Build the project
    yarn build
    
    if [[ ! -d "$BUILD_DIR" ]]; then
        error "Build failed - dist directory not created"
        exit 1
    fi
    
    log "Frontend built successfully"
}

# Create backup of current deployment
create_backup() {
    if [[ -d "$DEPLOY_DIR" ]]; then
        log "Creating backup of current deployment..."
        
        # Remove old backup if it exists
        if [[ -d "$BACKUP_DIR" ]]; then
            rm -rf "$BACKUP_DIR"
        fi
        
        # Create backup
        cp -r "$DEPLOY_DIR" "$BACKUP_DIR"
        log "Backup created at $BACKUP_DIR"
    else
        warn "No existing deployment found to backup"
    fi
}

# Deploy to web server
deploy_to_server() {
    log "Deploying to web server..."
    
    # Create deploy directory if it doesn't exist
    if [[ ! -d "$DEPLOY_DIR" ]]; then
        sudo mkdir -p "$DEPLOY_DIR"
        log "Created deploy directory"
    fi
    
    # Copy built files to deploy directory
    sudo cp -r "$BUILD_DIR"/* "$DEPLOY_DIR/"
    
    # Set proper permissions
    sudo chown -R www-data:www-data "$DEPLOY_DIR"
    sudo chmod -R 755 "$DEPLOY_DIR"
    
    log "Deployment completed successfully"
}

# Test the deployment
test_deployment() {
    log "Testing deployment..."
    
    # Check if index.html exists
    if [[ ! -f "$DEPLOY_DIR/index.html" ]]; then
        error "Deployment failed - index.html not found"
        return 1
    fi
    
    # Check if assets directory exists
    if [[ ! -d "$DEPLOY_DIR/assets" ]]; then
        warn "Assets directory not found - this might be normal for some builds"
    fi
    
    log "Deployment test passed"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only the most recent backup
    if [[ -d "$BACKUP_DIR" ]]; then
        # Remove backups older than 7 days within backup parent directory pattern
        find "$BACKUP_DIR" -type d -name "moonbot_backup_*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
        log "Old backups cleaned up"
    fi
}

# Main deployment function
main() {
    log "Starting frontend deployment..."
    
    check_permissions
    check_dependencies
    install_dependencies
    build_frontend
    # create_backup  # Disabled in main flow to avoid creating backups on every deployment
    deploy_to_server
    test_deployment
    # cleanup_backups  # Disabled in main flow to avoid removing old backups on every deployment. See --deploy-only mode for usage.
    
    log "Frontend deployment completed successfully!"
    log "The frontend is now available at:"
    log "  - https://moonbot.click"
    log "  - https://tradeonmoonbot.com"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --build-only   Only build the frontend, don't deploy"
        echo "  --deploy-only  Only deploy existing build, don't rebuild"
        echo ""
        echo "This script builds and deploys the Moonbot frontend to the web server."
        exit 0
        ;;
    --build-only)
        log "Build-only mode selected"
        check_permissions
        check_dependencies
        install_dependencies
        build_frontend
        log "Build completed successfully"
        exit 0
        ;;
    --deploy-only)
        log "Deploy-only mode selected"
        if [[ ! -d "$BUILD_DIR" ]]; then
            error "Build directory not found. Run build first or use --build-only"
            exit 1
        fi
        create_backup
        deploy_to_server
        test_deployment
        cleanup_backups
        log "Deployment completed successfully"
        exit 0
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