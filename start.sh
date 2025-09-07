#!/bin/bash

# Frontend development server startup script for Moonbot
# This script starts the React frontend development server

set -e  # Exit on any error

# Source the shared Node.js version checking utility
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/node_version_check.sh"

# Configuration
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
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

# Install dependencies if needed
install_dependencies() {
    log "Checking if dependencies need to be installed..."
    cd "$FRONTEND_DIR"
    
    # Ensure we're using the correct Yarn version via Corepack
    log "Ensuring Corepack Yarn is available..."
    corepack enable
    
    if [[ ! -d "node_modules" ]]; then
        log "Installing dependencies..."
        # Use yarn install which will automatically use the correct version via Corepack
        yarn install
        log "Dependencies installed successfully"
    else
        log "Dependencies already installed"
    fi
}

# Check if port is available
check_port() {
    local port=${1:-$DEFAULT_PORT}
    
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            warn "Port $port is already in use"
            echo "You can specify a different port with: ./start.sh --port <PORT>"
            return 1
        fi
    fi
    
    log "Port $port is available"
    return 0
}

# Start the development server
start_dev_server() {
    local port=${1:-$DEFAULT_PORT}
    
    log "Starting development server on port $port..."
    cd "$FRONTEND_DIR"
    
    # Ensure we're using the correct Yarn version via Corepack
    log "Ensuring Corepack Yarn is available..."
    corepack enable
    
    # Set the port environment variable for Vite
    export VITE_PORT=$port
    
    # Start the development server using the project's Yarn version via Corepack
    yarn dev --port $port --host 0.0.0.0
    
    # Note: The above command will keep running until interrupted
    # This is the expected behavior for a development server
}

# Show help information
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h           Show this help message"
    echo "  --port <PORT>        Specify port to run on (default: $DEFAULT_PORT)"
    echo "  --install-only       Only install dependencies, don't start server"
    echo "  --check-only         Only check dependencies and environment"
    echo ""
    echo "This script starts the Moonbot frontend development server."
    echo "The server will be available at http://localhost:<PORT>"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start on default port $DEFAULT_PORT"
    echo "  $0 --port 3001       # Start on port 3001"
    echo "  $0 --install-only    # Only install dependencies"
}

# Main function
main() {
    local port=$DEFAULT_PORT
    local install_only=false
    local check_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --port)
                if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                    port=$2
                    shift 2
                else
                    error "Invalid port number: $2"
                    exit 1
                fi
                ;;
            --install-only)
                install_only=true
                shift
                ;;
            --check-only)
                check_only=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log "Starting frontend development server..."
    
    check_dependencies
    
    if [[ "$check_only" == true ]]; then
        log "Environment check completed successfully"
        exit 0
    fi
    
    install_dependencies
    
    if [[ "$install_only" == true ]]; then
        log "Dependencies installation completed"
        exit 0
    fi
    
    # Check if port is available
    if ! check_port $port; then
        exit 1
    fi
    
    info "Frontend will be available at: http://localhost:$port"
    info "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the development server
    start_dev_server $port
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    "")
        main "$@"
        ;;
    *)
        main "$@"
        ;;
esac 