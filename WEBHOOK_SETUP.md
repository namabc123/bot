# GitHub Webhook Deployment Setup

This guide explains how to set up automatic deployment for your Moonbot frontend using GitHub webhooks. When you push changes to the master branch, the webhook will automatically trigger your `deploy.sh` script on the server.

## Overview

The system consists of:
1. **Webhook Server** (`webhook_server.js`) - Node.js server that listens for GitHub webhook events
2. **Systemd Service** (`moonbot-webhook.service`) - Runs the webhook server as a background service
3. **Setup Script** (`setup_webhook.sh`) - Automates the installation and configuration
4. **GitHub Actions** (`.github/workflows/deploy.yml`) - Optional CI/CD workflow

## Prerequisites

- Ubuntu/Debian server with root access
- Node.js 18+ installed
- Your frontend code deployed to `/var/www/moonbot`
- `deploy.sh` script working correctly

## Quick Setup

### 1. Upload Files to Server

First, upload these files to your server:
- `webhook_server.js`
- `moonbot-webhook.service`
- `setup_webhook.sh`

### 2. Run Setup Script

```bash
# Make setup script executable
chmod +x setup_webhook.sh

# Run setup as root
sudo ./setup_webhook.sh
```

The setup script will:
- Install Node.js if needed
- Generate a secure webhook secret
- Install the webhook server
- Configure systemd service
- Set up firewall rules
- Configure nginx (if available)
- Start the webhook service

### 3. Copy the Webhook Secret

The setup script will display a webhook secret. Copy this value - you'll need it for GitHub configuration.

### 4. Configure GitHub Webhook

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks**
3. Click **Add webhook**
4. Configure:
   - **Payload URL**: `http://your-server-ip:3001/webhook` (or your domain)
   - **Content type**: `application/json`
   - **Secret**: Paste the secret from step 3
   - **Events**: Select "Just the push event"
   - **Branch**: Select "master" (or "main")

### 5. Test the Setup

Push a change to your master branch:

```bash
git add .
git commit -m "Test webhook deployment"
git push origin master
```

Check the webhook server logs:

```bash
sudo journalctl -u moonbot-webhook -f
```

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs
```

### 2. Install Webhook Server

```bash
# Copy files
sudo cp webhook_server.js /var/www/moonbot/
sudo cp moonbot-webhook.service /etc/systemd/system/

# Set permissions
sudo chown www-data:www-data /var/www/moonbot/webhook_server.js
sudo chmod +x /var/www/moonbot/webhook_server.js

# Generate secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "Webhook secret: $WEBHOOK_SECRET"

# Update service file
sudo sed -i "s/your-webhook-secret-here/$WEBHOOK_SECRET/g" /etc/systemd/system/moonbot-webhook.service
```

### 3. Configure and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable moonbot-webhook.service
sudo systemctl start moonbot-webhook.service

# Check status
sudo systemctl status moonbot-webhook.service
```

### 4. Configure Firewall

```bash
# Allow webhook port
sudo ufw allow 3001/tcp
```

## Configuration Options

### Environment Variables

You can customize the webhook server behavior:

```bash
# In /etc/systemd/system/moonbot-webhook.service
Environment=WEBHOOK_PORT=3001
Environment=GITHUB_WEBHOOK_SECRET=your-secret-here
Environment=NODE_ENV=production
```

### Custom Port

To use a different port, update both the service file and firewall:

```bash
# Update service file
sudo sed -i 's/WEBHOOK_PORT=3001/WEBHOOK_PORT=8080/' /etc/systemd/system/moonbot-webhook.service

# Update firewall
sudo ufw allow 8080/tcp

# Restart service
sudo systemctl restart moonbot-webhook.service
```

## Monitoring and Troubleshooting

### Check Service Status

```bash
sudo systemctl status moonbot-webhook.service
```

### View Logs

```bash
# Follow logs in real-time
sudo journalctl -u moonbot-webhook -f

# View recent logs
sudo journalctl -u moonbot-webhook -n 100

# View logs since last boot
sudo journalctl -u moonbot-webhook -b
```

### Test Webhook Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Status check
curl http://localhost:3001/status

# Test webhook (this won't trigger deployment)
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/master"}'
```

### Common Issues

#### Service Won't Start
```bash
# Check detailed error
sudo systemctl status moonbot-webhook.service

# Check if port is in use
sudo netstat -tlnp | grep :3001

# Check Node.js installation
node --version
```

#### Webhook Not Triggering
```bash
# Check if service is running
sudo systemctl is-active moonbot-webhook.service

# Check webhook logs
sudo journalctl -u moonbot-webhook -f

# Verify GitHub webhook configuration
# Check Payload URL and Secret in GitHub settings
```

#### Permission Issues
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/moonbot

# Fix permissions
sudo chmod +x /var/www/moonbot/webhook_server.js
```

## Security Considerations

### Webhook Secret
- Always use a strong, unique secret
- Never commit the secret to version control
- Rotate the secret periodically

### Network Security
- The webhook server runs on port 3001 by default
- Consider using nginx as a reverse proxy with SSL
- Restrict access to the webhook port if possible

### Service User
- The webhook server runs as `www-data` user
- This user has limited permissions for security
- The service can only access necessary directories

## Advanced Configuration

### Nginx Reverse Proxy with SSL

If you want to use HTTPS for your webhook:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /webhook {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Multiple Webhook Endpoints

You can run multiple webhook servers for different purposes:

```bash
# Copy and modify for different services
sudo cp moonbot-webhook.service /etc/systemd/system/moonbot-webhook-api.service
sudo sed -i 's/moonbot-webhook/moonbot-webhook-api/g' /etc/systemd/system/moonbot-webhook-api.service
sudo sed -i 's/3001/3002/' /etc/systemd/system/moonbot-webhook-api.service
```

## Maintenance

### Update Webhook Server

```bash
# Stop service
sudo systemctl stop moonbot-webhook.service

# Update files
sudo cp webhook_server.js /var/www/moonbot/

# Restart service
sudo systemctl start moonbot-webhook.service
```

### Backup Configuration

```bash
# Backup service file
sudo cp /etc/systemd/system/moonbot-webhook.service /backup/

# Backup webhook secret
sudo grep "GITHUB_WEBHOOK_SECRET" /etc/systemd/system/moonbot-webhook.service > /backup/webhook-secret.txt
```

### Log Rotation

The webhook server logs to both console and `/var/log/moonbot-webhook.log`. Configure logrotate:

```bash
sudo tee /etc/logrotate.d/moonbot-webhook << EOF
/var/log/moonbot-webhook.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF
```

## Support

If you encounter issues:

1. Check the service status and logs
2. Verify GitHub webhook configuration
3. Test webhook endpoints manually
4. Check firewall and network configuration
5. Ensure all dependencies are installed

The webhook server provides detailed logging to help diagnose problems. Most issues can be resolved by checking the logs and service status.
