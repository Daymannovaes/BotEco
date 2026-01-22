# Infrastructure Guide: Terraform & Kubernetes

A beginner-friendly guide to understanding the infrastructure setup for wpp-bot.

## The Big Picture

Think of it like building an apartment complex:
- **Terraform** = The contractor that builds the building (infrastructure)
- **Kubernetes (k8s)** = The building manager that organizes tenants and keeps things running
- **Your app** = A tenant living in the building

---

## Part 1: What Terraform Does

The `terraform/main.tf` creates 3 things on Linode:

### 1. LKE Cluster (Linode Kubernetes Engine)
```hcl
resource "linode_lke_cluster" "wpp_bot"
```
This creates a Kubernetes cluster - essentially rented computers in the cloud that will run your app. The config creates:
- **1-3 worker nodes** (virtual machines with 4GB RAM each)
- Located in **us-east** (Newark, NJ)
- Running Kubernetes version **1.33**

### 2. Block Storage Volume
```hcl
resource "linode_volume" "wpp_bot_data"
```
A 20GB hard drive in the cloud for storing persistent data (like your WhatsApp session files).

### 3. Kubeconfig File
```hcl
resource "local_file" "kubeconfig"
```
A credentials file saved locally that lets you connect to your cluster with `kubectl` commands.

---

## Part 2: What the Kubernetes Files Do

After Terraform builds the infrastructure, you apply the k8s YAML files to tell Kubernetes *what to run*:

### Namespace (`namespace.yaml`)
Like creating a folder - keeps all your wpp-bot stuff organized and separate.

### Deployments (the apps)
The `k8s/wpp-bot/deployment.yaml` tells Kubernetes:
- Run **1 copy** of your wpp-bot container
- Use this Docker image: `ghcr.io/YOUR_USERNAME/wpp-bot:latest`
- Give it **512MB-2GB RAM** and **0.25-1 CPU**
- Mount persistent storage for auth_info and cache
- Check if it's healthy via `/health/live` and `/health/ready`

### Services (`service.yaml`)
Like an internal phone directory - gives your app a stable internal address (`wpp-bot:3000`) so other things can find it.

### Ingress (`ingress.yaml`)
The "front door" that routes internet traffic:
- `api.yourdomain.com` -> your wpp-bot app
- `dashboard.yourdomain.com` -> your dashboard
- Also handles HTTPS certificates automatically

### Secrets & ConfigMaps
- **Secrets**: Store sensitive stuff (API keys, passwords) encrypted
- **ConfigMaps**: Store non-sensitive config (like environment variables)

---

## The Deployment Workflow

### Step 1: Create Infrastructure with Terraform
```bash
cd terraform

# Set your Linode API token
export TF_VAR_linode_token="your-token-here"

# Preview what will be created
terraform plan

# Create the infrastructure
terraform apply
```

### Step 2: Configure kubectl
```bash
# Point kubectl to your new cluster
export KUBECONFIG=./terraform/kubeconfig.yaml

# Verify connection
kubectl get nodes
```

### Step 3: Install Ingress Controller

The `k8s/ingress.yaml` defines routing rules, but needs an **Ingress Controller** to work:
- **Ingress resource** = Instructions (your YAML file)
- **Ingress controller** = The software that reads and executes those instructions

> **Note:** The community `kubernetes/ingress-nginx` project retires March 2026. We use **Traefik** instead.

Install Traefik:
```bash
helm repo add traefik https://traefik.github.io/charts
helm repo update
helm install traefik traefik/traefik --namespace traefik --create-namespace
```

Check status:
```bash
# See all Traefik resources
kubectl get all -n traefik

# Get the external IP (for DNS configuration)
kubectl get svc -n traefik traefik
```

**Why Traefik?**
- Automatic Let's Encrypt certificates
- Supports both Kubernetes Ingress and Gateway API (future-proof)
- Built-in dashboard for traffic visibility
- Cloud-native with automatic service discovery

### Understanding Contexts

A **context** bundles three things into a named shortcut:

| Component | What it is | Example |
|-----------|------------|---------|
| **Cluster** | API server URL | `https://...linodelke.net:443` |
| **User** | Credentials | Token, certificate |
| **Namespace** | Default namespace | `wpp-bot` |

```bash
kubectl config get-contexts         # list all
kubectl config current-context      # which one am I using?
kubectl config use-context <name>   # switch
```

**Managing multiple clusters:**
```bash
# Option 1: Set KUBECONFIG per session
export KUBECONFIG=./terraform/kubeconfig.yaml

# Option 2: Merge into default config
KUBECONFIG=~/.kube/config:./terraform/kubeconfig.yaml \
  kubectl config view --flatten > ~/.kube/config
```

### Step 4: Deploy to Kubernetes
```bash
# Create the namespace first
kubectl apply -f k8s/namespace.yaml

# Apply all the k8s configs
kubectl apply -f k8s/
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/wpp-bot/
kubectl apply -f k8s/dashboard/

# Check if your app is running
kubectl get pods -n wpp-bot
```

---

## CI/CD Pipeline

### How Deployments Work

```
+------------------+     +-------------------+     +------------------+
|     GITHUB       |     |  GITHUB ACTIONS   |     |   LINODE LKE     |
|                  |     |                   |     |                  |
|  Push to main ──────>  Build Docker ─────────>  Pull new image    |
|                  |     |  image            |     |  & restart pods  |
|                  |     |                   |     |                  |
|                  |     |  Push to ghcr.io  |     |                  |
+------------------+     +-------------------+     +------------------+
```

### The Flow

1. **You push code** to the `main` branch
2. **GitHub Actions triggers** automatically
3. **Build phase:**
   - Checks out your code
   - Builds Docker image from `Dockerfile`
   - Pushes to GitHub Container Registry (`ghcr.io/YOUR_USERNAME/wpp-bot`)
4. **Deploy phase:**
   - Connects to your K8s cluster using stored kubeconfig
   - Runs `kubectl rollout restart` to pull the new image

### Manual Deployment

If you need to deploy without pushing code:

```bash
# Option 1: Trigger workflow manually from GitHub UI
# Go to Actions tab → Build and Deploy → Run workflow

# Option 2: Use kubectl directly
kubectl rollout restart deployment/wpp-bot -n wpp-bot
```

### Setting Up CI/CD

1. **Create the GitHub secret for kubeconfig:**
   ```bash
   # Encode your kubeconfig
   cat terraform/kubeconfig.yaml | base64

   # Add to GitHub:
   # Settings → Secrets → Actions → New secret
   # Name: KUBE_CONFIG
   # Value: (paste the base64 string)
   ```

2. **Enable GitHub Packages** (for container registry)
   - Should be enabled by default for public repos
   - For private repos: Settings → Packages → Enable improved container support

---

## Cluster Architecture

### Control Plane vs Worker Nodes

With managed Kubernetes (LKE), Linode handles the control plane:

```
Linode manages (free, hidden):
  └── Control Plane
        ├── API Server (receives kubectl commands)
        ├── Scheduler (decides where pods run)
        └── etcd (stores cluster state)
              │
              │ communicates with
              ▼
Your nodes (what you pay for):
  └── Worker Node(s)
        └── Your pods (wpp-bot, postgres, etc.)
```

**Key insight:** `kubectl get nodes` only shows worker nodes. The control plane is invisible but always there.

### What K8s Orchestrates

Kubernetes orchestrates **pods**, not nodes:

| K8s manages | You/cloud manage |
|-------------|------------------|
| Pods (scheduling, restarts, scaling) | Nodes (VMs that provide capacity) |

**Flow:**
1. You declare: "Run 2 replicas of wpp-bot"
2. Scheduler decides: "Put pod A on node 1, pod B on node 2"
3. If a pod crashes → K8s restarts it
4. If a node dies → K8s reschedules pods to healthy nodes

The cluster autoscaler (configured in Terraform) adds nodes when pods don't fit, but that's Linode logic, not core K8s.

### How Kubernetes Works with Cloud Providers

Kubernetes defines abstract concepts (like "LoadBalancer Service" or "PersistentVolume"), but doesn't know how to provision actual cloud resources. Cloud providers implement these abstractions through pluggable components:

```
┌─────────────────────────────────────────────────────────────┐
│  KUBERNETES (Pure Logic)                                    │
│  Pods, Deployments, ConfigMaps, Secrets, Namespaces...      │
│  → K8s handles these entirely on its own                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ delegates infrastructure
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CLOUD PROVIDER INTERFACES                                  │
│  ┌───────────────────────┐    ┌───────────────────────┐     │
│  │ Cloud Controller      │    │ CSI Driver            │     │
│  │ Manager (CCM)         │    │ (Storage Interface)   │     │
│  │ • LoadBalancer Svc    │    │ • PersistentVolumes   │     │
│  │ • Node lifecycle      │    │ • StorageClasses      │     │
│  └───────────────────────┘    └───────────────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │ calls cloud API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LINODE API                                                 │
│  • Provisions NodeBalancers (for LoadBalancer Services)     │
│  • Provisions Block Storage (for PersistentVolumes)         │
│  • Manages VMs (nodes)                                      │
└─────────────────────────────────────────────────────────────┘
```

**What needs cloud implementation vs what doesn't:**

| K8s Concept | Needs Cloud? | Why |
|-------------|--------------|-----|
| Pod, Deployment | No | Just processes/logic on existing nodes |
| ConfigMap, Secret | No | Stored in etcd (control plane) |
| ClusterIP Service | No | Internal networking only |
| **LoadBalancer Service** | **Yes** | Needs external IP + cloud load balancer |
| **PersistentVolume** | **Yes** | Needs actual disk provisioned |
| **Node** | **Yes** | Needs actual VM |

This is why K8s works across AWS, GCP, Linode, bare metal - same API, different backend implementations.

---

## Architecture Diagram

```
                        +--------------------------------------------------+
                        |                    GITHUB                         |
                        |                                                   |
                        |   +-------------+      +----------------------+   |
                        |   | Repository  |      | Container Registry   |   |
                        |   | (your code) |      | (ghcr.io)            |   |
                        |   +------+------+      +----------+-----------+   |
                        |          |                        ^               |
                        |          | push to main           | push image    |
                        |          v                        |               |
                        |   +------+------------------------+------+        |
                        |   |         GITHUB ACTIONS               |        |
                        |   |   1. Build Docker image              |        |
                        |   |   2. Push to ghcr.io                 |        |
                        |   |   3. kubectl rollout restart         |        |
                        |   +------------------+-------------------+        |
                        +----------------------|----------------------------+
                                               | deploy (kubectl)
                                               v
+-------------------------------------------------------------------------+
|                           LINODE CLOUD                                   |
|                                                                          |
|  +---------------------------+                                           |
|  |    CONTROL PLANE          |  (managed by Linode, invisible to you)    |
|  |    ├── API Server         |                                           |
|  |    ├── Scheduler          |                                           |
|  |    └── etcd               |                                           |
|  +------------|--------------+                                           |
|               | manages                                                  |
|               v                                                          |
|  +-----------------------------------------------------------------------+
|  |                    LKE CLUSTER                                        |
|  |                                                                       |
|  |   PHYSICAL LAYER (Worker Nodes - what you pay for)                    |
|  |   +---------------------+  +---------------------+                    |
|  |   |     Node 1 (VM)     |  |     Node 2 (VM)     |                    |
|  |   |     4GB RAM         |  |     4GB RAM         |                    |
|  |   +---------------------+  +---------------------+                    |
|  |            ▲                         ▲                                |
|  |            |   pods scheduled onto   |                                |
|  |            +------------+------------+                                |
|  |                         |                                             |
|  |   LOGICAL LAYER (Namespaces - for organization)                       |
|  |   +---------------------------------------------------------------+   |
|  |   |                    NAMESPACE: wpp-bot                         |   |
|  |   |                                                               |   |
|  |   |   +----------+    +------------+                              |   |
|  |   |   | wpp-bot  |    | postgres   |    (pods can run on any node)|   |
|  |   |   |   Pod    |--->|   Pod      |                              |   |
|  |   |   +----+-----+    +-----+------+                              |   |
|  |   |        |                |                                     |   |
|  |   |   +----v-----+    +-----v------+                              |   |
|  |   |   | Service  |    |  Service   |                              |   |
|  |   |   +----+-----+    +------------+                              |   |
|  |   |        |                                                      |   |
|  |   |   +----v-------------------------------------------------+    |   |
|  |   |   |              INGRESS CONTROLLER                      |    |   |
|  |   |   |   (traefik - routes external traffic)                |    |   |
|  |   |   +------------------------+-----------------------------+    |   |
|  |   |   |                    INGRESS                           |    |   |
|  |   |   |  api.yourdomain.com -> wpp-bot                       |    |   |
|  |   |   |  dashboard.yourdomain.com -> dashboard               |    |   |
|  |   |   +------------------------+-----------------------------+    |   |
|  |   +----------------------------|----------------------------------+   |
|  +--------------------------------|--------------------------------------+
+-----------------------------------|------------------------------------------+
                                    |
                               +----v----+
                               | INTERNET |
                               |  (you)   |
                               +----------+
```

---

## Common kubectl Commands

### Viewing Resources
```bash
# See what's running
kubectl get pods -n wpp-bot

# See all resources in namespace
kubectl get all -n wpp-bot

# Get detailed info about a pod
kubectl describe pod <pod-name> -n wpp-bot
```

### Logs & Debugging
```bash
# See logs from your app
kubectl logs -f deployment/wpp-bot -n wpp-bot

# Get a shell inside your running container
kubectl exec -it deployment/wpp-bot -n wpp-bot -- /bin/sh

# See events (useful for debugging)
kubectl get events -n wpp-bot --sort-by='.lastTimestamp'
```

### Managing Deployments
```bash
# Restart your app (after pushing new image)
kubectl rollout restart deployment/wpp-bot -n wpp-bot

# Check rollout status
kubectl rollout status deployment/wpp-bot -n wpp-bot

# Scale up/down
kubectl scale deployment/wpp-bot --replicas=2 -n wpp-bot
```

### Secrets Management
```bash
# Create a secret from literal values
kubectl create secret generic wpp-bot-secret \
  --from-literal=ELEVENLABS_API_KEY=xxx \
  --from-literal=JWT_SECRET=xxx \
  -n wpp-bot

# View secret (base64 encoded)
kubectl get secret wpp-bot-secret -n wpp-bot -o yaml
```

### Service Accounts

A **ServiceAccount** is an identity for processes running inside pods (or for external tools) to authenticate with the Kubernetes API.

**Why it exists:**
- Pods need permissions to talk to the K8s API (e.g., list pods, read secrets)
- External tools (like the K8s Dashboard) need to authenticate as *something*
- ServiceAccounts provide that identity + can be given specific permissions

```bash
# Create a service account
kubectl create serviceaccount my-sa -n wpp-bot

# Generate a short-lived token for it
kubectl create token my-sa -n wpp-bot

# Give it permissions (e.g., cluster-admin for dashboard access)
kubectl create clusterrolebinding my-sa-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=wpp-bot:my-sa
```

**Common use case - K8s Dashboard:**
When Linode asks for a token to view the dashboard, you need to:
1. Create a ServiceAccount
2. Give it permissions (usually cluster-admin for full access)
3. Generate a token and paste it into the dashboard login

---

## Connecting to PostgreSQL

The PostgreSQL database runs inside the cluster. Here's how to connect depending on your use case.

### Understanding Service Types

By default, PostgreSQL uses a **ClusterIP** service - it's only accessible inside the cluster via `postgres:5432`. Apps like wpp-bot connect using the service name as the hostname.

### Port Forward (Individual Developer Access)

**Best for:** Development, debugging, ad-hoc queries

Port forwarding creates a client-side tunnel - no cluster changes needed. It's secure (requires kubectl auth) and temporary.

```bash
# Forward local port 5432 to the postgres service
kubectl port-forward -n wpp-bot svc/postgres 5432:5432

# In another terminal, connect with psql
psql -h localhost -U wppbot -d wppbot
```

This works with GUI clients too (DBeaver, TablePlus, pgAdmin) - just connect to `localhost:5432`.

### LoadBalancer (Team Access)

**Best for:** Shared access across a team (similar to RDS)

Modify the postgres service to expose it externally:

```yaml
# k8s/postgres/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: wpp-bot
spec:
  type: LoadBalancer
  loadBalancerSourceRanges:
    - 203.0.113.0/24  # Whitelist your team's IPs
  ports:
    - port: 5432
      targetPort: 5432
  selector:
    app: postgres
```

After applying, get the external IP:
```bash
kubectl get svc postgres -n wpp-bot
# Share connection string: postgres://wppbot:password@<EXTERNAL-IP>:5432/wppbot
```

> **Security note:** Always use `loadBalancerSourceRanges` to restrict access to known IPs.

### Direct Pod Access (Quick Queries)

**Best for:** One-off queries, quick checks

```bash
kubectl exec -it deploy/postgres -n wpp-bot -- psql -U wppbot -d wppbot
```

This drops you directly into a psql shell inside the running container.

---

## Providing the Linode API Token

You have 3 options:

**Option 1: Environment variable (recommended)**
```bash
export TF_VAR_linode_token="your-token-here"
terraform apply
```

**Option 2: Create a `terraform.tfvars` file**
```hcl
# terraform/terraform.tfvars
linode_token = "your-token-here"
```
> Note: Add `*.tfvars` to `.gitignore` to avoid committing secrets

**Option 3: Pass it directly**
```bash
terraform apply -var="linode_token=your-token-here"
```

---

## Glossary

| Term | Description |
|------|-------------|
| **Pod** | The smallest deployable unit in k8s - contains one or more containers |
| **Deployment** | Manages pods - handles scaling, updates, and restarts |
| **Service** | Internal load balancer that gives pods a stable network address |
| **Ingress** | Routes external HTTP/HTTPS traffic to services |
| **Namespace** | Virtual cluster within a cluster - for organizing resources |
| **ConfigMap** | Stores non-sensitive configuration as key-value pairs |
| **Secret** | Stores sensitive data (passwords, API keys) encrypted |
| **ServiceAccount** | Identity for pods/tools to authenticate with K8s API |
| **PVC** | Persistent Volume Claim - request for storage |
| **Node** | A worker machine (VM) in the cluster |
| **Cluster** | A set of nodes that run containerized applications |
| **Context** | Named shortcut bundling cluster + user + namespace |
| **Control Plane** | K8s brain - API server, scheduler, etcd (managed by Linode) |
| **Worker Node** | VM that runs your pods (what you see with `kubectl get nodes`) |
| **CI/CD** | Continuous Integration/Deployment - automated build & deploy pipeline |
| **ghcr.io** | GitHub Container Registry - stores Docker images |
| **Container** | Running instance of a Docker image (lives inside a pod) |
