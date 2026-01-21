# Web Dashboard Deployment Guide

This guide covers the Kubernetes deployment of the WPP-Bot web dashboard - a static frontend for user management and monitoring.

## Overview

The dashboard provides a web interface for:
- User registration and login
- WhatsApp QR code scanning
- Usage statistics and character consumption tracking
- Account settings and management

It's a static build (React/Vue) served by nginx, communicating with the wpp-bot API.

## Files

| File | Purpose |
|------|---------|
| `deployment.yaml` | Nginx container serving static files |
| `service.yaml` | ClusterIP service on port 80 |

---

## File Breakdown

### 1. `deployment.yaml` - Container Configuration

**Image:** `ghcr.io/YOUR_USERNAME/wpp-dashboard:latest`

**Resource limits (lightweight):**
- Requests: 64Mi memory, 50m CPU
- Limits: 128Mi memory, 100m CPU

**Health checks:**
- Liveness: `GET /` every 30s
- Readiness: `GET /` every 10s

**No persistent storage** - The dashboard is stateless. All state lives in:
- Browser (JWT tokens in localStorage/cookies)
- Backend API (wpp-bot service)

**Image pull secret:** Requires `ghcr-secret` for pulling private images.

### 2. `service.yaml` - Internal Service

```yaml
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 80
      name: http
```

Exposes the dashboard internally at `wpp-dashboard:80` within the cluster.

---

## Prerequisites

### 1. GitHub Container Registry Secret

```bash
kubectl create secret docker-registry ghcr-secret \
  --namespace wpp-bot \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  --docker-email=your@email.com
```

### 2. Build Dashboard Docker Image

The dashboard needs to be built with the correct API URL baked in.

**Example Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=https://api.yourdomain.com
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Build and push:**
```bash
docker build -t ghcr.io/YOUR_USERNAME/wpp-dashboard:latest ./dashboard
docker push ghcr.io/YOUR_USERNAME/wpp-dashboard:latest
```

### 3. Configure API URL

The dashboard must know where to find the API. This is typically configured at build time:

```bash
# Set environment variable before build
VITE_API_URL=https://api.yourdomain.com npm run build
```

---

## Apply Order

```bash
# 1. Ensure namespace exists
kubectl apply -f k8s/namespace.yaml

# 2. Deploy dashboard
kubectl apply -f k8s/dashboard/deployment.yaml

# 3. Create service
kubectl apply -f k8s/dashboard/service.yaml
```

Or apply all at once:

```bash
kubectl apply -f k8s/dashboard/
```

---

## Verification

### Check deployment status

```bash
# View pod status
kubectl get pods -n wpp-bot -l app=wpp-dashboard

# Check logs
kubectl logs -n wpp-bot -l app=wpp-dashboard

# Describe for events
kubectl describe pod -n wpp-bot -l app=wpp-dashboard
```

### Test locally

```bash
# Port forward
kubectl port-forward -n wpp-bot svc/wpp-dashboard 8080:80

# Open in browser
open http://localhost:8080
```

---

## Architecture

```
                    ┌─────────────────┐
                    │   User Browser  │
                    └────────┬────────┘
                             │ HTTPS
                             ▼
                    ┌─────────────────┐
                    │     Ingress     │
                    │   (nginx-ic)    │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                │
    dashboard.domain    api.domain            │
            │                │                │
            ▼                ▼                │
    ┌───────────────┐ ┌─────────────┐        │
    │ wpp-dashboard │ │   wpp-bot   │        │
    │   (nginx)     │ │  (Node.js)  │        │
    │   port 80     │ │  port 3000  │        │
    └───────────────┘ └─────────────┘        │
                             │                │
                             ▼                │
                     ┌─────────────┐          │
                     │  PostgreSQL │          │
                     │  port 5432  │          │
                     └─────────────┘
```

The dashboard (static files) is served by nginx. JavaScript in the browser makes API calls to the wpp-bot service.

---

## Customization

### Update API URL

Since the API URL is baked in at build time, changing it requires rebuilding the image:

```bash
# Rebuild with new API URL
VITE_API_URL=https://api.newdomain.com npm run build

# Build and push new image
docker build -t ghcr.io/YOUR_USERNAME/wpp-dashboard:latest ./dashboard
docker push ghcr.io/YOUR_USERNAME/wpp-dashboard:latest

# Restart deployment
kubectl rollout restart deployment wpp-dashboard -n wpp-bot
```

### Scale for high traffic

The dashboard is stateless and can be scaled horizontally:

```bash
kubectl scale deployment wpp-dashboard -n wpp-bot --replicas=3
```

### Add custom nginx configuration

Create a ConfigMap with nginx config:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dashboard-nginx-config
  namespace: wpp-bot
data:
  default.conf: |
    server {
      listen 80;
      root /usr/share/nginx/html;
      index index.html;

      # SPA routing - return index.html for all routes
      location / {
        try_files $uri $uri/ /index.html;
      }

      # Cache static assets
      location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
      }

      # Gzip compression
      gzip on;
      gzip_types text/plain text/css application/json application/javascript;
    }
```

Mount in deployment:
```yaml
volumeMounts:
  - name: nginx-config
    mountPath: /etc/nginx/conf.d
volumes:
  - name: nginx-config
    configMap:
      name: dashboard-nginx-config
```

---

## Troubleshooting

### White page / JavaScript errors

Check if API URL is correct:
1. Open browser DevTools (F12) → Network tab
2. Look for failed API requests (red)
3. Verify the URL matches your ingress configuration

### 404 on page refresh

This is a SPA routing issue. Nginx needs to return `index.html` for all routes:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### ImagePullBackOff

```bash
# Check secret exists
kubectl get secret ghcr-secret -n wpp-bot

# Check image exists
docker pull ghcr.io/YOUR_USERNAME/wpp-dashboard:latest
```

### CORS errors

CORS is handled by the wpp-bot API, not the dashboard. Check:
1. `CORS_ORIGINS` in wpp-bot configmap matches dashboard domain
2. Include protocol: `https://dashboard.yourdomain.com` not just `dashboard.yourdomain.com`

```bash
kubectl get configmap wpp-bot-config -n wpp-bot -o yaml | grep CORS
```
