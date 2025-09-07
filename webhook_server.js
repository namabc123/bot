#!/usr/bin/env node

/**
 * GitHub Webhook Server for Moonbot Frontend
 * 
 * This server listens for GitHub webhook events and automatically
 * triggers deployment when changes are pushed to the master branch.
 * 
 * Features:
 * - Validates GitHub webhook signatures for security
 * - Only triggers on master branch pushes
 * - Logs all webhook events and deployment attempts
 * - Runs deploy.sh in the background
 * - Provides deployment status endpoint
 */

import { createServer } from 'http';
import { spawn } from 'child_process';
import { createHash, createHmac } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
    port: process.env.WEBHOOK_PORT || 3001,
    secret: process.env.GITHUB_WEBHOOK_SECRET || 'your-webhook-secret-here',
    deployScript: join(__dirname, 'deploy.sh'),
    logFile: '/var/log/moonbot-webhook.log',
    maxPayloadSize: 1024 * 1024 // 1MB
};

// Deployment state tracking
let deploymentState = {
    lastDeployment: null,
    isDeploying: false,
    lastError: null,
    deploymentCount: 0
};

// Logging function
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logMessage);
    
    // Also write to log file if possible
    try {
        require('fs').appendFileSync(CONFIG.logFile, logMessage + '\n');
    } catch (err) {
        // Ignore log file errors
    }
}

// Validate GitHub webhook signature
function validateSignature(payload, signature) {
    if (!CONFIG.secret || CONFIG.secret === 'your-webhook-secret-here') {
        log('WARNING: Using default webhook secret. Please set GITHUB_WEBHOOK_SECRET environment variable.', 'WARN');
        return true; // Allow in development
    }
    
    const expectedSignature = 'sha256=' + createHmac('sha256', CONFIG.secret)
        .update(payload)
        .digest('hex');
    
    return signature === expectedSignature;
}

// Execute deploy script
function executeDeploy() {
    if (deploymentState.isDeploying) {
        log('Deployment already in progress, skipping...', 'WARN');
        return { success: false, message: 'Deployment already in progress' };
    }
    
    deploymentState.isDeploying = true;
    deploymentState.deploymentCount++;
    
    log(`Starting deployment #${deploymentState.deploymentCount}...`);
    
    return new Promise((resolve) => {
        const deployProcess = spawn('bash', [CONFIG.deployScript], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        deployProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        deployProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        deployProcess.on('close', (code) => {
            deploymentState.isDeploying = false;
            deploymentState.lastDeployment = new Date();
            
            if (code === 0) {
                log(`Deployment #${deploymentState.deploymentCount} completed successfully`);
                deploymentState.lastError = null;
                resolve({ success: true, message: 'Deployment completed successfully' });
            } else {
                const errorMsg = `Deployment #${deploymentState.deploymentCount} failed with code ${code}`;
                log(errorMsg, 'ERROR');
                log(`STDOUT: ${stdout}`, 'DEBUG');
                log(`STDERR: ${stderr}`, 'ERROR');
                deploymentState.lastError = { code, stdout, stderr };
                resolve({ success: false, message: errorMsg, code, stdout, stderr });
            }
        });
        
        deployProcess.on('error', (err) => {
            deploymentState.isDeploying = false;
            const errorMsg = `Failed to start deployment: ${err.message}`;
            log(errorMsg, 'ERROR');
            deploymentState.lastError = { error: err.message };
            resolve({ success: false, message: errorMsg, error: err.message });
        });
    });
}

// Handle GitHub webhook
async function handleWebhook(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }
    
    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString();
        if (body.length > CONFIG.maxPayloadSize) {
            req.destroy();
        }
    });
    
    req.on('end', async () => {
        try {
            // Parse the webhook payload
            const payload = JSON.parse(body);
            const event = req.headers['x-github-event'];
            const signature = req.headers['x-hub-signature-256'];
            
            log(`Received ${event} webhook from GitHub`);
            
            // Validate signature
            if (!validateSignature(body, signature)) {
                log('Invalid webhook signature', 'ERROR');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid signature' }));
                return;
            }
            
            // Only process push events to master branch
            if (event === 'push' && payload.ref === 'refs/heads/master') {
                log(`Push to master branch detected. Commit: ${payload.head_commit?.id?.substring(0, 8) || 'unknown'}`);
                
                // Trigger deployment
                const result = await executeDeploy();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: 'Webhook processed successfully',
                    deployment: result
                }));
            } else {
                log(`Ignoring ${event} event (not a push to master)`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Webhook received but no action taken' }));
            }
            
        } catch (err) {
            log(`Error processing webhook: ${err.message}`, 'ERROR');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid webhook payload' }));
        }
    });
}

// Handle status endpoint
function handleStatus(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'running',
        deployment: deploymentState,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    }));
}

// Create HTTP server
const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-GitHub-Event, X-Hub-Signature-256');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (url.pathname === '/webhook') {
        handleWebhook(req, res);
    } else if (url.pathname === '/status') {
        handleStatus(req, res);
    } else if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start server
server.listen(CONFIG.port, () => {
    log(`GitHub webhook server started on port ${CONFIG.port}`);
    log(`Webhook endpoint: http://localhost:${CONFIG.port}/webhook`);
    log(`Status endpoint: http://localhost:${CONFIG.port}/status`);
    log(`Health endpoint: http://localhost:${CONFIG.port}/health`);
    
    if (CONFIG.secret === 'your-webhook-secret-here') {
        log('WARNING: Please set GITHUB_WEBHOOK_SECRET environment variable for production use', 'WARN');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully...');
    server.close(() => {
        log('Server closed');
        process.exit(0);
    });
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    log(`Uncaught Exception: ${err.message}`, 'ERROR');
    log(err.stack, 'ERROR');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
    process.exit(1);
});
