#!/bin/bash

# Frontend production server startup script for Moonbot
# This script serves the built React frontend files

set -e  # Exit on any error

# Source the shared Node.js version checking utility
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/node_version_check.sh"

# Configuration
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PORT=3000
BUILD_DIR="$FRONTEND_DIR/dist"

# Logging function (no colors for systemd compatibility)
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

warn() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >&2
}

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    # Use shared utility to setup Corepack and Yarn
    if ! setup_corepack_yarn log; then
        exit 1
    fi
    
    # Verify package.json exists
    if [[ ! -f "package.json" ]]; then
        error "package.json not found in current directory"
        exit 1
    fi
    
    log "Dependencies check passed"
}

# Build the frontend if needed
build_frontend() {
    log "Checking if frontend needs to be built..."
    
    if [[ ! -d "$BUILD_DIR" ]] || [[ ! -f "$BUILD_DIR/index.html" ]]; then
        log "Building frontend..."
        yarn build
        log "Frontend built successfully"
    else
        log "Frontend already built"
    fi
}

# Check if port is available
check_port() {
    local port=${1:-$DEFAULT_PORT}
    
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            warn "Port $port is already in use"
            return 1
        fi
    fi
    
    log "Port $port is available"
    return 0
}

# Start the production server
start_production_server() {
    local port=${1:-$DEFAULT_PORT}
    
    log "Starting production server on port $port..."
    cd "$FRONTEND_DIR"
    
    # Check if build directory exists
    if [[ ! -d "$BUILD_DIR" ]]; then
        error "Build directory not found. Please run 'yarn build' first."
        exit 1
    fi
    
    # Start the production server using Vite preview
    log "Starting Vite preview server..."
    yarn preview --port $port --host 0.0.0.0
}

# Main function
main() {
    local port=${1:-$DEFAULT_PORT}
    
    log "Starting frontend production server..."
    
    check_dependencies
    build_frontend
    
    # Check if port is available
    if ! check_port $port; then
        exit 1
    fi
    
    log "Frontend will be available at: http://0.0.0.0:$port"
    
    # Start the production server
    start_production_server $port
}

# Run main function
main "$@"
