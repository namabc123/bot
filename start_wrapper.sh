#!/bin/bash

# Wrapper script for starting the frontend production server
# This script sets up the proper environment for systemd

# Set up environment variables
export HOME=/root
export USER=root

# Add common Node.js installation paths to PATH
export PATH="/usr/local/bin:/usr/local/sbin:/usr/bin:/usr/sbin:/bin:/sbin:$PATH"

# Add NVM paths if they exist
if [[ -d "/root/.nvm" ]]; then
    export NVM_DIR="/root/.nvm"
    echo "NVM directory found: /root/.nvm"
    
    # List what's in the NVM directory for debugging
    echo "Contents of NVM directory:"
    ls -la /root/.nvm/ 2>/dev/null || echo "Cannot list NVM directory"
    
    if [[ -d "/root/.nvm/versions" ]]; then
        echo "Contents of NVM versions directory:"
        ls -la /root/.nvm/versions/ 2>/dev/null || echo "Cannot list versions directory"
        
        if [[ -d "/root/.nvm/versions/node" ]]; then
            echo "Contents of NVM node versions directory:"
            ls -la /root/.nvm/versions/node/ 2>/dev/null || echo "Cannot list node versions directory"
        fi
    fi
    
    # Check if the current symlink exists and points to a valid Node.js installation
    if [[ -L "/root/.nvm/versions/node/current" ]] && [[ -d "/root/.nvm/versions/node/current" ]]; then
        export PATH="/root/.nvm/versions/node/current/bin:$PATH"
        echo "NVM current symlink found and valid"
    else
        echo "NVM current symlink is broken or missing"
        
        # Try to find any available Node.js version in NVM
        for node_version in /root/.nvm/versions/node/*; do
            if [[ -d "$node_version" ]] && [[ -x "$node_version/bin/node" ]]; then
                echo "Found NVM Node.js version: $node_version"
                export PATH="$node_version/bin:$PATH"
                break
            fi
        done
    fi
fi

# Add other common Node.js installation paths
for node_path in "/usr/local/node/bin" "/opt/node/bin" "/opt/nodejs/bin"; do
    if [[ -d "$node_path" ]]; then
        export PATH="$node_path:$PATH"
        echo "Added Node.js path: $node_path"
    fi
done

# Try to find Node.js in common system locations
echo "Searching for Node.js in system..."
for search_path in "/usr/bin" "/usr/local/bin" "/opt/homebrew/bin" "/snap/bin"; do
    if [[ -x "$search_path/node" ]]; then
        echo "Found Node.js in system path: $search_path"
        export PATH="$search_path:$PATH"
        break
    fi
done

# Check if Node.js is available in current PATH
if command -v node >/dev/null 2>&1; then
    echo "Node.js found in PATH: $(which node)"
else
    echo "Node.js still not found, trying to locate it manually..."
    
    # Search for node binary in common locations (excluding /home for performance)
    for search_dir in /usr /usr/local /opt /root/.nvm; do
        if [[ -d "$search_dir" ]]; then
            found_node=$(find "$search_dir" -maxdepth 3 -name "node" -type f -executable -quit 2>/dev/null)
            if [[ -n "$found_node" ]]; then
                echo "Found Node.js at: $found_node"
                export PATH="$(dirname "$found_node"):$PATH"
                break
            fi
        fi
    done
    
    # Only search /home if not found in other locations (slower)
    if ! command -v node >/dev/null 2>&1; then
        echo "Searching /home directory (this may take longer)..."
        for search_dir in /home; do
            if [[ -d "$search_dir" ]]; then
                found_node=$(find "$search_dir" -maxdepth 3 -name "node" -type f -executable -quit 2>/dev/null)
                if [[ -n "$found_node" ]]; then
                    echo "Found Node.js at: $found_node"
                    export PATH="$(dirname "$found_node"):$PATH"
                    break
                fi
            fi
        done
    fi
fi

# Add Yarn and Corepack paths
if [[ -d "/root/.node/corepack" ]]; then
    export PATH="/root/.node/corepack:$PATH"
fi

if [[ -d "/usr/local/lib/node_modules/corepack/dist" ]]; then
    export PATH="/usr/local/lib/node_modules/corepack/dist:$PATH"
fi

# Set NODE_PATH
export NODE_PATH="/usr/local/lib/node_modules:/root/.npm-global/lib/node_modules"

# Debug: Show what we found
echo "Environment setup:"
echo "PATH: $PATH"
echo "NODE_PATH: $NODE_PATH"
echo "NVM_DIR: $NVM_DIR"

# Check if Node.js is available
if command -v node >/dev/null 2>&1; then
    echo "Node.js found: $(node --version)"
    echo "Node.js path: $(which node)"
else
    echo "ERROR: Node.js not found in PATH"
    echo "Available in PATH:"
    echo "$PATH" | tr ':' '\n' | grep -i node || echo "No node directories found"
    exit 1
fi

# Check if Yarn is available
if command -v yarn >/dev/null 2>&1; then
    echo "Yarn found: $(yarn --version)"
    echo "Yarn path: $(which yarn)"
else
    echo "ERROR: Yarn not found in PATH"
    exit 1
fi

# Change to frontend directory (directory containing this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Run the production script
exec "$SCRIPT_DIR/start_production.sh"
