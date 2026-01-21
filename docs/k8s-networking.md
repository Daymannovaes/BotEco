# Networking & TLS Guide

This guide covers the Kubernetes networking setup for WPP-Bot, including Ingress routing and TLS certificate management.

## Overview

Traffic flows from the internet to your applications through:
1. **DNS** - Points domains to LoadBalancer IP
2. **Ingress Controller** - nginx handles incoming HTTPS requests
3. **Ingress Resource** - Routes requests to correct services
4. **Cert-Manager** - Automatically obtains and renews TLS certificates

## Files

| File | Purpose |
|------|---------|
| `ingress.yaml` | Routes traffic to services based on hostname |
| `cert-manager/issuer.yaml` | ClusterIssuers for Let's Encrypt (prod & staging) |

---

## Traffic Flow

```
Internet
    │
    ▼
┌─────────────────────────────────────────────┐
│              DNS Records                     │
│  api.yourdomain.com → LoadBalancer IP       │
│  dashboard.yourdomain.com → LoadBalancer IP │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│         Ingress Controller (nginx)          │
│              LoadBalancer IP                │
│           Terminates TLS here               │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│            Ingress Resource                 │
│   api.yourdomain.com → wpp-bot:3000         │
│   dashboard.yourdomain.com → wpp-dashboard:80│
└─────────────────────────────────────────────┘
    │
    ▼
┌──────────────┬──────────────┐
│   wpp-bot    │ wpp-dashboard │
│   :3000      │     :80       │
└──────────────┴──────────────┘
```

---

## Ingress Configuration

### `ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wpp-bot-ingress
  namespace: wpp-bot
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
```

### Annotations explained

| Annotation | Purpose |
|------------|---------|
| `ingress.class: nginx` | Use nginx ingress controller |
| `cert-manager.io/cluster-issuer` | Automatically request TLS cert from this issuer |
| `proxy-body-size: "10m"` | Allow 10MB request bodies (for audio uploads) |
| `proxy-read-timeout: "60"` | 60s timeout waiting for backend response |
| `proxy-send-timeout: "60"` | 60s timeout sending to client |

### TLS Configuration

```yaml
spec:
  tls:
    - hosts:
        - api.yourdomain.com
        - dashboard.yourdomain.com
      secretName: wpp-bot-tls
```

Cert-manager will:
1. See the `cert-manager.io/cluster-issuer` annotation
2. Request a certificate for both hostnames from Let's Encrypt
3. Store the certificate in `wpp-bot-tls` secret
4. Automatically renew before expiration

### Routing Rules

```yaml
rules:
  - host: api.yourdomain.com
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: wpp-bot
              port:
                number: 3000
  - host: dashboard.yourdomain.com
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: wpp-dashboard
              port:
                number: 80
```

---

## Cert-Manager Setup

### Prerequisites

Install cert-manager in your cluster:

```bash
# Add Jetstack Helm repo
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

### ClusterIssuers

The `issuer.yaml` file creates two ClusterIssuers:

**Production Issuer:**
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: YOUR_EMAIL@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

**Staging Issuer:**
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    ...
```

### Why staging issuer?

Let's Encrypt has [rate limits](https://letsencrypt.org/docs/rate-limits/):
- 50 certificates per registered domain per week
- 5 failures per hostname per hour

Use staging issuer for testing:
```yaml
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-staging
```

Staging certificates are not trusted by browsers but have much higher rate limits.

### HTTP-01 Challenge

The solver uses HTTP-01 challenge:
1. Cert-manager creates a temporary ingress
2. Let's Encrypt requests `/.well-known/acme-challenge/TOKEN`
3. Cert-manager responds with proof of domain ownership
4. Let's Encrypt issues the certificate

This requires:
- Port 80 accessible from the internet
- DNS pointing to your ingress controller

---

## Prerequisites

### 1. Install nginx Ingress Controller

```bash
# Using Helm
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

### 2. Get LoadBalancer IP

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

Wait for `EXTERNAL-IP` to be assigned (may show `<pending>` initially).

### 3. Configure DNS

Create A records pointing to your LoadBalancer IP:

| Type | Name | Value |
|------|------|-------|
| A | api.yourdomain.com | LoadBalancer IP |
| A | dashboard.yourdomain.com | LoadBalancer IP |

Or use wildcard:

| Type | Name | Value |
|------|------|-------|
| A | *.yourdomain.com | LoadBalancer IP |

---

## Apply Order

```bash
# 1. Ensure cert-manager is installed
kubectl get pods -n cert-manager

# 2. Create ClusterIssuers
kubectl apply -f k8s/cert-manager/issuer.yaml

# 3. Verify issuers are ready
kubectl get clusterissuer

# 4. Apply ingress (after other services are running)
kubectl apply -f k8s/ingress.yaml
```

---

## Verification

### Check ingress status

```bash
kubectl get ingress -n wpp-bot

# Expected output:
# NAME              CLASS   HOSTS                                      ADDRESS        PORTS     AGE
# wpp-bot-ingress   nginx   api.yourdomain.com,dashboard.yourdomain.com   203.0.113.10   80, 443   1m
```

### Check certificate status

```bash
# View certificate
kubectl get certificate -n wpp-bot

# Expected output:
# NAME          READY   SECRET        AGE
# wpp-bot-tls   True    wpp-bot-tls   5m

# Describe for details
kubectl describe certificate wpp-bot-tls -n wpp-bot
```

### Check certificate secret

```bash
kubectl get secret wpp-bot-tls -n wpp-bot

# View certificate details
kubectl get secret wpp-bot-tls -n wpp-bot -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout
```

### Test HTTPS endpoints

```bash
# Test API
curl https://api.yourdomain.com/health/live

# Test dashboard
curl -I https://dashboard.yourdomain.com
```

---

## Customization

### Update domain names

1. Edit `k8s/ingress.yaml`:
   ```yaml
   spec:
     tls:
       - hosts:
           - api.newdomain.com
           - dashboard.newdomain.com
     rules:
       - host: api.newdomain.com
       ...
   ```

2. Update CORS in wpp-bot configmap:
   ```bash
   kubectl patch configmap wpp-bot-config -n wpp-bot \
     --type merge -p '{"data":{"CORS_ORIGINS":"https://dashboard.newdomain.com"}}'
   ```

3. Update DNS records

4. Apply changes:
   ```bash
   kubectl apply -f k8s/ingress.yaml
   kubectl rollout restart deployment wpp-bot -n wpp-bot
   ```

### Add rate limiting

```yaml
annotations:
  nginx.ingress.kubernetes.io/limit-rps: "10"
  nginx.ingress.kubernetes.io/limit-connections: "5"
```

### Enable WebSocket support

For real-time features:

```yaml
annotations:
  nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
  nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
  nginx.ingress.kubernetes.io/websocket-services: "wpp-bot"
```

---

## Troubleshooting

### Certificate stuck in "Issuing"

```bash
# Check certificate status
kubectl describe certificate wpp-bot-tls -n wpp-bot

# Check certificate request
kubectl get certificaterequest -n wpp-bot

# Check challenges
kubectl get challenge -n wpp-bot
kubectl describe challenge -n wpp-bot
```

Common issues:
- DNS not pointing to ingress controller
- Port 80 blocked by firewall
- Wrong ingress class in solver

### 404 Not Found

Check service and endpoints exist:
```bash
kubectl get svc -n wpp-bot
kubectl get endpoints -n wpp-bot
```

### 502 Bad Gateway

Backend service not responding:
```bash
# Check pods are running
kubectl get pods -n wpp-bot

# Check service has endpoints
kubectl describe svc wpp-bot -n wpp-bot
```

### Certificate invalid / not trusted

If using staging issuer, switch to prod:
```yaml
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-prod
```

Then delete and recreate the certificate:
```bash
kubectl delete certificate wpp-bot-tls -n wpp-bot
kubectl apply -f k8s/ingress.yaml
```

---

## Full Deployment Order

When deploying the entire stack:

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy PostgreSQL
kubectl apply -f k8s/postgres/

# 3. Deploy WPP-Bot
kubectl apply -f k8s/wpp-bot/

# 4. Deploy Dashboard
kubectl apply -f k8s/dashboard/

# 5. Create ClusterIssuers (requires cert-manager installed)
kubectl apply -f k8s/cert-manager/issuer.yaml

# 6. Apply Ingress (apply last - after services exist)
kubectl apply -f k8s/ingress.yaml
```

The ingress should be applied last because:
- It references services that must exist
- Cert-manager immediately tries to issue certificates
- Services must be ready for HTTP-01 challenge to succeed
