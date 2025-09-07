#!/bin/bash

# Shared Node.js version checking utility for Moonbot frontend scripts
# This script provides common functions for checking Node.js version and Corepack support

# Check Node.js version and return version info
check_node_version() {
    if ! command -v node &> /dev/null; then
        echo "ERROR: Node.js is not installed" >&2
        return 1
    fi
    
    # Get Node.js version information
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
    NODE_MINOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f2)
    
    echo "$NODE_VERSION|$NODE_MAJOR|$NODE_MINOR"
}

# Check if Node.js version supports Corepack
check_corepack_support() {
    local node_version_info
    node_version_info=$(check_node_version)
    
    if [[ $? -ne 0 ]]; then
        return 1
    fi
    
    # Parse version info
    IFS='|' read -r NODE_VERSION NODE_MAJOR NODE_MINOR <<< "$node_version_info"
    
    # Check if Corepack is available (Node.js 16.9+ or 14.19+)
    if [[ "$NODE_MAJOR" -ge 16 ]] || [[ "$NODE_MAJOR" -eq 14 && "$NODE_MINOR" -ge 19 ]]; then
        echo "true|$NODE_VERSION|$NODE_MAJOR|$NODE_MINOR"
        return 0
    else
        echo "false|$NODE_VERSION|$NODE_MAJOR|$NODE_MINOR"
        return 1
    fi
}

# Setup Corepack and Yarn
setup_corepack_yarn() {
    local log_func="${1:-echo}"
    
    # Check Corepack support
    local corepack_info
    corepack_info=$(check_corepack_support)
    
    if [[ $? -ne 0 ]]; then
        IFS='|' read -r _ NODE_VERSION NODE_MAJOR NODE_MINOR <<< "$corepack_info"
        $log_func "ERROR: Node.js version $NODE_VERSION does not support Corepack"
        $log_func "Please upgrade to Node.js 16.9+ or 14.19+"
        return 1
    fi
    
    IFS='|' read -r _ NODE_VERSION NODE_MAJOR NODE_MINOR <<< "$corepack_info"
    $log_func "Node.js version: $NODE_VERSION"
    $log_func "Node.js version supports Corepack"
    
    # Enable Corepack
    $log_func "Enabling Corepack..."
    corepack enable
    
    # Refresh PATH to ensure corepack binaries are available
    export PATH="$HOME/.node/corepack:$PATH"
    
    # Also check common Corepack locations
    if [[ -d "$HOME/.node/corepack" ]]; then
        export PATH="$HOME/.node/corepack:$PATH"
    fi
    if [[ -d "/usr/local/lib/node_modules/corepack/dist" ]]; then
        export PATH="/usr/local/lib/node_modules/corepack/dist:$PATH"
    fi
    
    # Verify Yarn is available
    if command -v yarn &> /dev/null; then
        YARN_VERSION=$(yarn --version)
        $log_func "Using Yarn version: $YARN_VERSION (via Corepack)"
        return 0
    else
        $log_func "ERROR: Yarn not available after enabling Corepack"
        $log_func "Trying to find Yarn binary manually..."
        
        # Try to find Yarn in common locations
        local YARN_PATHS=(
            "$HOME/.node/corepack/yarn"
            "/usr/local/lib/node_modules/corepack/dist/yarn"
            "$(which yarn 2>/dev/null || echo '')"
        )
        
        for yarn_path in "${YARN_PATHS[@]}"; do
            if [[ -x "$yarn_path" ]]; then
                $log_func "Found Yarn at: $yarn_path"
                export PATH="$(dirname "$yarn_path"):$PATH"
                break
            fi
        done
        
        # Try again
        if command -v yarn &> /dev/null; then
            YARN_VERSION=$(yarn --version)
            $log_func "Using Yarn version: $YARN_VERSION (found manually)"
            return 0
        else
            $log_func "ERROR: Could not find Yarn binary after Corepack setup"
            return 1
        fi
    fi
}

# Export functions for use in other scripts
export -f check_node_version
export -f check_corepack_support
export -f setup_corepack_yarn
