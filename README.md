# VoiceReply Bot

A multi-tenant WhatsApp voice bot SaaS platform that transforms any message into a voice message with fun character styles.

## Features

- **Multi-tenant SaaS**: Multiple users with their own WhatsApp connections
- **Web Dashboard**: User registration, QR code scanning, status monitoring
- **15 Voice Styles**: From villain to pirate to sports announcer
- **Rate Limiting**: Per-user daily character limits
- **Session Persistence**: Automatic session restoration on restart
- **Kubernetes Ready**: Deploy on Linode LKE with Terraform

## How It Works

1. Register on the web dashboard
2. Scan QR code to connect your WhatsApp
3. Reply to any message with a style instruction like "say it like a villain"
4. Bot sends back an audio message with the text spoken in that style

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker-compose up -d postgres

# Copy environment file and add your API key
cp .env.example .env
# Edit .env with your ElevenLabs API key and other settings

# Start the bot
npm run dev
```

The API server will be available at `http://localhost:3000`.

## Quick Start (Dashboard)

```bash
cd dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create new account |
| `/auth/login` | POST | Login to get JWT token |
| `/auth/me` | GET | Get current user (requires JWT) |
| `/users/me/qr` | GET | Get QR code for WhatsApp |
| `/users/me/status` | GET | Get connection status |
| `/users/me/disconnect` | POST | Disconnect WhatsApp |
| `/users/me/logout` | POST | Logout from WhatsApp |
| `/health` | GET | Health check |
| `/health/ready` | GET | Kubernetes readiness probe |
| `/health/live` | GET | Kubernetes liveness probe |

## Usage Examples

Reply to any message with:

- `say it like a villain` - Menacing, dramatic delivery
- `read this dramatically` - Epic movie trailer voice
- `voice: pirate` - Arrr matey style
- `whisper this` - Soft ASMR whisper
- `say it excitedly` - High energy, enthusiastic
- `robot voice` - Monotone, mechanical
- `read it like a sports announcer` - Excited commentary

Type `boteco ajuda` in any chat to see all available styles.

## Available Voice Styles

| Style | Description |
|-------|-------------|
| villain | Menacing, slow, dramatic pauses |
| trailer | Epic movie announcer voice |
| pirate | Arrr matey style |
| whisper | Soft, intimate ASMR |
| excited | High energy, enthusiastic |
| robot | Monotone, mechanical |
| drill_sergeant | Loud, commanding |
| nature_documentary | Calm, observational |
| sports | Excited commentary |
| grandma | Sweet, caring |
| sarcastic | Deadpan, ironic |
| angry | Furious, aggressive |
| bored | Disinterested, lazy |
| news | Professional anchor |
| shakespearean | Theatrical, dramatic |

## Configuration

Environment variables (`.env`):

```
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
LOG_LEVEL=info
```

## Project Structure

```
wpp-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Environment config
│   ├── whatsapp/
│   │   ├── client.ts         # Baileys connection
│   │   ├── handlers.ts       # Message handlers
│   │   └── session.ts        # Session persistence
│   ├── voice/
│   │   ├── tts.ts            # ElevenLabs integration
│   │   ├── styles.ts         # Voice style presets
│   │   └── cache.ts          # Audio caching
│   └── ai/
│       └── style-parser.ts   # Parse style instructions
├── auth_info/                # WhatsApp session (gitignored)
├── cache/                    # Audio cache (gitignored)
└── package.json
```

## Scripts

- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run built JavaScript

## Deployment to Linode LKE

### 1. Create Infrastructure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Linode API token

terraform init
terraform apply
```

### 2. Build and Push Docker Images

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build and push bot
docker build -t ghcr.io/USERNAME/wpp-bot:latest .
docker push ghcr.io/USERNAME/wpp-bot:latest

# Build and push dashboard
docker build -t ghcr.io/USERNAME/wpp-dashboard:latest dashboard/
docker push ghcr.io/USERNAME/wpp-dashboard:latest
```

### 3. Deploy to Kubernetes

```bash
# Get kubeconfig
export KUBECONFIG=$(pwd)/terraform/kubeconfig.yaml

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres/

# Update secrets in k8s/wpp-bot/secret.yaml
kubectl apply -f k8s/wpp-bot/

# Deploy dashboard
kubectl apply -f k8s/dashboard/

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

## Project Structure

```
wpp-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Environment config
│   ├── api/                  # HTTP API (Express)
│   │   ├── server.ts
│   │   ├── routes/
│   │   └── middleware/
│   ├── sessions/             # Multi-session management
│   │   ├── manager.ts
│   │   ├── restore.ts
│   │   └── types.ts
│   ├── db/                   # PostgreSQL layer
│   │   ├── client.ts
│   │   └── models/
│   ├── whatsapp/
│   │   ├── client.ts
│   │   ├── handlers.ts
│   │   └── session.ts
│   ├── voice/
│   │   ├── tts.ts
│   │   ├── styles.ts
│   │   └── cache.ts
│   └── ai/
│       └── style-parser.ts
├── dashboard/                # React web dashboard
├── terraform/                # Linode LKE infrastructure
├── k8s/                      # Kubernetes manifests
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Environment Variables

See `.env.example` for all available configuration options.

## Notes

- The bot caches generated audio for 24 hours to save API costs
- ElevenLabs free tier includes ~10,000 characters/month
- WhatsApp sessions are persisted per-user in `auth_info/{userId}/`
- Estimated monthly cost on Linode: ~$50 (8GB node + storage)
