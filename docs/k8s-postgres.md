# PostgreSQL Deployment Guide

This guide covers the Kubernetes deployment of PostgreSQL for the WPP-Bot multi-tenant SaaS platform.

## Overview

PostgreSQL serves as the primary database for the WPP-Bot system, storing:
- **Users** - Account information, authentication, and usage limits
- **Usage Logs** - Character consumption tracking per user
- **Refresh Tokens** - JWT refresh token management for secure authentication

## Files

| File | Purpose |
|------|---------|
| `secret.yaml` | Database credentials |
| `configmap.yaml` | Initialization SQL script |
| `pvc.yaml` | Persistent storage (10GB) |
| `deployment.yaml` | PostgreSQL 16-alpine container |
| `service.yaml` | ClusterIP service on port 5432 |

---

## File Breakdown

### 1. `secret.yaml` - Database Credentials

```yaml
stringData:
  POSTGRES_USER: wppbot
  POSTGRES_PASSWORD: CHANGE_ME_IN_PRODUCTION
  POSTGRES_DB: wppbot
```

**Important:** Change `POSTGRES_PASSWORD` before deploying to production. This password must match the `DB_PASSWORD` in `wpp-bot-secret`.

### 2. `configmap.yaml` - Initialization Script

Contains the SQL schema that runs on first database startup:

**Tables created:**
- `users` - User accounts with fields for email, password hash, WhatsApp JID, usage limits
- `usage_logs` - Character usage tracking per message
- `refresh_tokens` - JWT refresh token storage with expiration

**Features:**
- UUID primary keys using `pgcrypto` extension
- Automatic `updated_at` timestamp trigger
- `reset_daily_usage()` function for daily limit resets
- Indexes for email, status, and token lookups

### 3. `pvc.yaml` - Persistent Storage

```yaml
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: linode-block-storage-retain
```

**Key points:**
- 10GB storage allocated
- Uses `linode-block-storage-retain` - data persists even if PVC is deleted
- `ReadWriteOnce` - can only be mounted by one pod at a time

### 4. `deployment.yaml` - Container Configuration

**Image:** `postgres:16-alpine` (lightweight Alpine-based PostgreSQL 16)

**Resource limits:**
- Requests: 128Mi memory, 50m CPU
- Limits: 512Mi memory, 250m CPU

**Health checks:**
- Liveness probe: `pg_isready` every 10s (starts after 30s)
- Readiness probe: `pg_isready` every 5s (starts after 5s)

**Strategy:** `Recreate` - ensures clean shutdown/startup (no rolling updates for databases)

**Volume mounts:**
- `/var/lib/postgresql/data` - Persistent data storage
- `/docker-entrypoint-initdb.d` - Init scripts from ConfigMap

### 5. `service.yaml` - Internal Service

```yaml
spec:
  type: ClusterIP
  ports:
    - port: 5432
      targetPort: 5432
```

Exposes PostgreSQL internally at `postgres:5432` within the cluster.

---

## Apply Order

Apply resources in this order to avoid dependency issues:

```bash
# 1. Create namespace (if not exists)
kubectl apply -f k8s/namespace.yaml

# 2. Create secret first (deployment depends on it)
kubectl apply -f k8s/postgres/secret.yaml

# 3. Create configmap with init script
kubectl apply -f k8s/postgres/configmap.yaml

# 4. Create persistent storage
kubectl apply -f k8s/postgres/pvc.yaml

# 5. Deploy PostgreSQL
kubectl apply -f k8s/postgres/deployment.yaml

# 6. Create service
kubectl apply -f k8s/postgres/service.yaml
```

Or apply all at once:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres/
```

---

## Verification

### Check deployment status

```bash
# View pod status
kubectl get pods -n wpp-bot -l app=postgres

# Check logs
kubectl logs -n wpp-bot -l app=postgres

# Describe pod for events/errors
kubectl describe pod -n wpp-bot -l app=postgres
```

### Test database connection

```bash
# Port forward to local machine
kubectl port-forward -n wpp-bot svc/postgres 5432:5432

# Connect using psql (in another terminal)
psql -h localhost -U wppbot -d wppbot
```

### Verify tables were created

```bash
# Execute SQL directly in pod
kubectl exec -it -n wpp-bot deploy/postgres -- psql -U wppbot -d wppbot -c "\dt"
```

Expected output:
```
          List of relations
 Schema |      Name       | Type  | Owner
--------+-----------------+-------+--------
 public | refresh_tokens  | table | wppbot
 public | usage_logs      | table | wppbot
 public | users           | table | wppbot
```

---

## Customization

### Change database password

1. Update `k8s/postgres/secret.yaml`:
   ```yaml
   stringData:
     POSTGRES_PASSWORD: your-secure-password
   ```

2. Update `k8s/wpp-bot/secret.yaml` to match:
   ```yaml
   stringData:
     DB_PASSWORD: your-secure-password
   ```

3. Reapply both secrets:
   ```bash
   kubectl apply -f k8s/postgres/secret.yaml
   kubectl apply -f k8s/wpp-bot/secret.yaml
   ```

4. Restart deployments:
   ```bash
   kubectl rollout restart deployment -n wpp-bot postgres
   kubectl rollout restart deployment -n wpp-bot wpp-bot
   ```

### Add new tables

1. Edit `k8s/postgres/configmap.yaml` and add SQL to the `init.sql` section

2. For existing databases, the init script only runs on first startup. To add tables to an existing database:
   ```bash
   kubectl exec -it -n wpp-bot deploy/postgres -- psql -U wppbot -d wppbot
   ```
   Then run your CREATE TABLE statements manually.

### Increase storage

PVC resizing depends on your storage class. For Linode:

```bash
# Edit PVC
kubectl edit pvc postgres-pvc -n wpp-bot

# Change storage: 10Gi to storage: 20Gi
# Save and exit

# Check status
kubectl get pvc -n wpp-bot
```

---

## Troubleshooting

### Pod stuck in Pending

Check if PVC is bound:
```bash
kubectl get pvc -n wpp-bot postgres-pvc
```

If PVC is Pending, check storage class availability.

### Init script not running

The init script only runs on first database initialization. If `PGDATA` directory exists, it won't run. To force re-initialization:

```bash
# Delete PVC (WARNING: deletes all data)
kubectl delete pvc postgres-pvc -n wpp-bot

# Recreate
kubectl apply -f k8s/postgres/pvc.yaml
kubectl rollout restart deployment -n wpp-bot postgres
```

### Connection refused

1. Check pod is running: `kubectl get pods -n wpp-bot -l app=postgres`
2. Check service: `kubectl get svc -n wpp-bot postgres`
3. Check endpoints: `kubectl get endpoints -n wpp-bot postgres`
