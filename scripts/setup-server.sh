#!/bin/bash
# Oracle Cloud Server Setup Script for wpp-bot
# Run this once on a fresh Ubuntu 22.04/24.04 ARM instance

set -e

echo "=== wpp-bot Server Setup ==="
echo ""

# Update system
echo "[1/5] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "[2/5] Installing dependencies..."
sudo apt install -y curl git

# Install Node.js 20 via NodeSource
echo "[3/5] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install PM2 globally
echo "[4/5] Installing PM2..."
sudo npm install -g pm2

# Setup PM2 to start on boot
echo "[5/5] Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Create app directory and subdirectories
echo "Creating application directories..."
mkdir -p ~/wpp-bot/logs ~/wpp-bot/auth_info ~/wpp-bot/cache
cd ~/wpp-bot

# Create .env placeholder
if [ ! -f .env ]; then
    echo "Creating .env placeholder..."
    cat > .env << 'EOF'
# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Bot Configuration
BOT_PREFIX=voice:
DAILY_LIMIT=50

# Logging (use 'warn' or 'error' in production for less noise)
LOG_LEVEL=warn

# Production mode
NODE_ENV=production
EOF
    echo "!!! IMPORTANT: Edit ~/wpp-bot/.env with your actual API keys !!!"
fi

# Configure firewall (iptables - required for Oracle Cloud)
echo ""
echo "Configuring iptables firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 22 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit ~/wpp-bot/.env with your API keys:"
echo "     nano ~/wpp-bot/.env"
echo ""
echo "  2. From your LOCAL machine, run the deploy script:"
echo "     ./scripts/deploy.sh <this-server-ip>"
echo ""
echo "  3. After deploy, view logs to scan QR code:"
echo "     pm2 logs wpp-bot"
echo ""
