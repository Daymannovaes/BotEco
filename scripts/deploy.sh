#!/bin/bash
# Deploy wpp-bot to Oracle Cloud server
# Usage: ./scripts/deploy.sh <server-ip> [ssh-key-path]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="${1}"
SSH_KEY="${2:-}"
REMOTE_USER="ubuntu"
REMOTE_DIR="/home/ubuntu/wpp-bot"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Validate arguments
if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}Error: Server IP required${NC}"
    echo "Usage: $0 <server-ip> [ssh-key-path]"
    echo ""
    echo "Examples:"
    echo "  $0 129.151.xxx.xxx"
    echo "  $0 129.151.xxx.xxx ~/.ssh/oracle_key"
    exit 1
fi

# Build SSH command
SSH_CMD="ssh"
SCP_CMD="scp"
RSYNC_SSH="ssh"
if [ -n "$SSH_KEY" ]; then
    SSH_CMD="ssh -i $SSH_KEY"
    SCP_CMD="scp -i $SSH_KEY"
    RSYNC_SSH="ssh -i $SSH_KEY"
fi

echo -e "${GREEN}=== Deploying wpp-bot to $SERVER_IP ===${NC}"
echo ""

# Step 1: Build locally
echo -e "${YELLOW}[1/4] Building project locally...${NC}"
cd "$LOCAL_DIR"
npm run build

# Step 2: Sync files to server
echo -e "${YELLOW}[2/4] Syncing files to server...${NC}"
rsync -avz --delete \
    -e "$RSYNC_SSH" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'auth_info' \
    --exclude 'cache' \
    --exclude '.claude' \
    "$LOCAL_DIR/" \
    "${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/"

# Step 3: Install dependencies on server
echo -e "${YELLOW}[3/4] Installing dependencies on server...${NC}"
$SSH_CMD "${REMOTE_USER}@${SERVER_IP}" << 'ENDSSH'
cd ~/wpp-bot
npm ci --omit=dev
ENDSSH

# Step 4: Restart PM2
echo -e "${YELLOW}[4/4] Restarting application...${NC}"
$SSH_CMD "${REMOTE_USER}@${SERVER_IP}" << 'ENDSSH'
cd ~/wpp-bot

# Check if app is already running in PM2
if pm2 describe wpp-bot > /dev/null 2>&1; then
    echo "Restarting existing PM2 process..."
    pm2 restart ecosystem.config.cjs --update-env
else
    echo "Starting new PM2 process..."
    pm2 start ecosystem.config.cjs
fi

# Save PM2 process list
pm2 save

# Show status
pm2 status
ENDSSH

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:    $SSH_CMD ${REMOTE_USER}@${SERVER_IP} 'pm2 logs wpp-bot'"
echo "  Check status: $SSH_CMD ${REMOTE_USER}@${SERVER_IP} 'pm2 status'"
echo "  Restart:      $SSH_CMD ${REMOTE_USER}@${SERVER_IP} 'pm2 restart wpp-bot'"
echo ""
echo "First time? Watch logs to scan the WhatsApp QR code:"
echo "  $SSH_CMD ${REMOTE_USER}@${SERVER_IP} 'pm2 logs wpp-bot'"
echo ""
