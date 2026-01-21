# WPP-Bot Application Deployment Guide

This guide covers the Kubernetes deployment of the main WPP-Bot application - a WhatsApp bot with text-to-speech capabilities using ElevenLabs.

## Overview

WPP-Bot is the core application that:
- Connects to WhatsApp using the Baileys library
- Converts text messages to voice using ElevenLabs API
- Manages user authentication via JWT tokens
- Tracks daily character usage per user
- Exposes a REST API for the web dashboard

## Files

| File | Purpose |
|------|---------|
| `secret.yaml` | API keys and sensitive credentials |
| `configmap.yaml` | Application configuration |
| `pvc.yaml` | Persistent storage for auth and cache |
| `deployment.yaml` | Application container |
| `service.yaml` | ClusterIP service on port 3000 |

---

## File Breakdown

### 1. `secret.yaml` - Sensitive Credentials

```yaml
stringData:
  ELEVENLABS_API_KEY: CHANGE_ME
  JWT_SECRET: CHANGE_ME_GENERATE_RANDOM_STRING
  DB_PASSWORD: CHANGE_ME_MATCH_POSTGRES_SECRET
```

| Key | Description |
|-----|-------------|
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key for text-to-speech |
| `JWT_SECRET` | Random string for signing JWT tokens (min 32 chars recommended) |
| `DB_PASSWORD` | Must match `POSTGRES_PASSWORD` in postgres secret |

### 2. `configmap.yaml` - Application Configuration

```yaml
data:
  NODE_ENV: production
  LOG_LEVEL: info
  API_PORT: "3000"
  CORS_ORIGINS: "https://dashboard.yourdomain.com"
  DB_HOST: postgres
  DB_PORT: "5432"
  DB_USER: wppbot
  DB_NAME: wppbot
  BOT_PREFIX: "voice:"
  DAILY_LIMIT: "10000"
  JWT_ACCESS_EXPIRY: "15m"
  JWT_REFRESH_EXPIRY: "7d"
  ELEVENLABS_VOICE_ID: "21m00Tcm4TlvDq8ikWAM"
```

| Key | Description | Default |
|-----|-------------|---------|
| `NODE_ENV` | Runtime environment | `production` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `API_PORT` | HTTP server port | `3000` |
| `CORS_ORIGINS` | Allowed origins for dashboard | Update with your domain |
| `DB_HOST` | PostgreSQL service name | `postgres` |
| `BOT_PREFIX` | Message prefix to trigger TTS | `voice:` |
| `DAILY_LIMIT` | Daily character limit per user | `10000` |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` |
| `ELEVENLABS_VOICE_ID` | Default ElevenLabs voice | Rachel voice |

### 3. `pvc.yaml` - Persistent Storage

Two PVCs are created:

**Auth Info PVC (1GB, retain):**
```yaml
name: wpp-bot-auth-pvc
storage: 1Gi
storageClassName: linode-block-storage-retain
```
Stores WhatsApp session credentials. Uses `retain` policy to preserve login across PVC deletion.

**Cache PVC (5GB):**
```yaml
name: wpp-bot-cache-pvc
storage: 5Gi
storageClassName: linode-block-storage
```
Stores temporary audio files and message cache. Uses standard storage (can be deleted).

### 4. `deployment.yaml` - Container Configuration

**Image:** `ghcr.io/YOUR_USERNAME/wpp-bot:latest`

**Strategy: `Recreate`**

This is critical - only one instance can connect to a WhatsApp session at a time. Rolling updates would cause connection conflicts.

**Resource limits:**
- Requests: 384Mi memory, 200m CPU
- Limits: 1Gi memory, 500m CPU

**Health checks:**
- Liveness: `GET /health/live` - checks process is alive
- Readiness: `GET /health/ready` - checks WhatsApp connection ready

**Volume mounts:**
- `/app/auth_info` - WhatsApp session data
- `/app/cache` - Audio file cache

**Image pull secret:** Requires `ghcr-secret` for pulling private images.

### 5. `service.yaml` - Internal Service

```yaml
spec:
  type: ClusterIP
  ports:
    - port: 3000
      targetPort: 3000
      name: http
```

Exposes the API internally at `wpp-bot:3000` within the cluster.

---

## Prerequisites

### 1. Create GitHub Container Registry Secret

```bash
kubectl create secret docker-registry ghcr-secret \
  --namespace wpp-bot \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  --docker-email=your@email.com
```

Your GitHub PAT needs `read:packages` scope.

### 2. PostgreSQL must be running

The application connects to `postgres:5432`. Ensure PostgreSQL deployment is ready before starting wpp-bot.

### 3. Build and push Docker image

```bash
docker build -t ghcr.io/YOUR_USERNAME/wpp-bot:latest .
docker push ghcr.io/YOUR_USERNAME/wpp-bot:latest
```

---

## Apply Order

```bash
# 1. Ensure namespace exists
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets
kubectl apply -f k8s/wpp-bot/secret.yaml

# 3. Create configmap
kubectl apply -f k8s/wpp-bot/configmap.yaml

# 4. Create persistent storage
kubectl apply -f k8s/wpp-bot/pvc.yaml

# 5. Deploy application
kubectl apply -f k8s/wpp-bot/deployment.yaml

# 6. Create service
kubectl apply -f k8s/wpp-bot/service.yaml
```

Or apply all at once:

```bash
kubectl apply -f k8s/wpp-bot/
```

---

## Verification

### Check deployment status

```bash
# View pod status
kubectl get pods -n wpp-bot -l app=wpp-bot

# Watch logs
kubectl logs -n wpp-bot -l app=wpp-bot -f

# Check events
kubectl describe pod -n wpp-bot -l app=wpp-bot
```

### Test API endpoints

```bash
# Port forward
kubectl port-forward -n wpp-bot svc/wpp-bot 3000:3000

# Test health endpoints
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

### Check WhatsApp connection

The first time you deploy, you'll need to scan a QR code:

```bash
# Watch logs for QR code
kubectl logs -n wpp-bot -l app=wpp-bot -f

# Look for QR code in ASCII art format
# Scan with WhatsApp mobile app
```

---

## Environment Variables

### Required secrets

| Variable | Source | Description |
|----------|--------|-------------|
| `ELEVENLABS_API_KEY` | Secret | ElevenLabs API key |
| `JWT_SECRET` | Secret | JWT signing key |
| `DB_PASSWORD` | Secret | PostgreSQL password |

### Configuration from ConfigMap

All values from `wpp-bot-config` ConfigMap are injected via `envFrom`.

---

## Customization

### Change ElevenLabs voice

Find voice IDs at [ElevenLabs Voice Library](https://elevenlabs.io/voice-library).

```bash
kubectl edit configmap wpp-bot-config -n wpp-bot
# Change ELEVENLABS_VOICE_ID

kubectl rollout restart deployment wpp-bot -n wpp-bot
```

### Adjust daily character limit

```bash
kubectl patch configmap wpp-bot-config -n wpp-bot \
  --type merge -p '{"data":{"DAILY_LIMIT":"20000"}}'

kubectl rollout restart deployment wpp-bot -n wpp-bot
```

### Update CORS origins for production

```bash
kubectl patch configmap wpp-bot-config -n wpp-bot \
  --type merge -p '{"data":{"CORS_ORIGINS":"https://dashboard.yourdomain.com"}}'

kubectl rollout restart deployment wpp-bot -n wpp-bot
```

---

## Troubleshooting

### Pod stuck in ImagePullBackOff

Check ghcr-secret exists and is valid:
```bash
kubectl get secret ghcr-secret -n wpp-bot

# Test by pulling manually
docker pull ghcr.io/YOUR_USERNAME/wpp-bot:latest
```

### WhatsApp disconnects frequently

Check the `reconnect_attempts` counter in user records. The app has built-in reconnection logic but may need manual intervention if:
- Phone is offline
- WhatsApp Web was manually disconnected
- Session expired (need to re-scan QR)

### Database connection errors

1. Check postgres pod is running
2. Verify DB_PASSWORD matches postgres secret
3. Check network policy (if any)

```bash
# Test connection from wpp-bot pod
kubectl exec -it -n wpp-bot deploy/wpp-bot -- nc -zv postgres 5432
```

### Out of memory errors

Increase limits in deployment:
```bash
kubectl patch deployment wpp-bot -n wpp-bot \
  --type json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/resources/limits/memory","value":"2Gi"}]'
```
