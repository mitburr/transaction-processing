# AI Agent Guide: Sequoia Homelab k8s Deployment

## Quick Reference

**Remote Access**: `sequoia` or `ssh em@192.168.1.2`

**Quick Deploy Pattern**:
```bash
# 1. Edit manifests in k8s/ directory
# 2. Apply from local machine
task deploy-<service>

# OR manually on server:
sequoia "sudo k3s kubectl apply -f /path/to/manifest.yaml"
```

## Cluster Overview

**Architecture**:
- **Sequoia** (192.168.1.2): Control plane + worker | i7-4770, 4TB HDD, Ubuntu 24.04 LTS
- **Hickory**: Worker node | Your primary workstation
- **Type**: k3s (lightweight Kubernetes)
- **Ingress**: Traefik (built-in, LoadBalancer on 192.168.1.2:80/443)
- **DNS**: Pi-hole (192.168.1.17) resolves `*.grove` → 192.168.1.2

**Access Patterns**:
```bash
# From remote
sequoia "sudo k3s kubectl get pods -A"

# kubectl alias (if configured)
sequoia "k get pods -A"
```

## Deployment Workflow

### 1. Manifest Structure

```
k8s/
├── apps/
│   ├── <service>/
│   │   ├── namespace.yaml        # Optional: Create dedicated namespace
│   │   ├── deployment.yaml       # Pod/container spec
│   │   ├── service.yaml          # ClusterIP service
│   │   └── configmap.yaml        # Optional: Config files
│   └── ...
├── ingress/
│   └── <service>-ingress.yaml    # IngressRoute for Traefik
└── services/
    └── external-services.yaml     # Service/Endpoint for external (non-k8s) apps
```

### 2. Standard Deployment Template

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <service>
  namespace: default  # or custom namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: <service>
  template:
    metadata:
      labels:
        app: <service>
    spec:
      containers:
      - name: <service>
        image: <image>:<tag>
        ports:
        - containerPort: <port>
        env:  # Environment variables
        - name: KEY
          value: "value"
        volumeMounts:  # If needed
        - name: config
          mountPath: /config
        - name: media
          mountPath: /media
      volumes:
      - name: config
        hostPath:
          path: /opt/<service>/config  # Config on Sequoia
      - name: media
        hostPath:
          path: /media  # Shared media storage
```

**service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: <service>
  namespace: default
spec:
  selector:
    app: <service>
  ports:
  - port: 80
    targetPort: <container-port>
  type: ClusterIP  # Internal cluster access only
```

**ingress/<service>-ingress.yaml** (Traefik):
```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: <service>-http
  namespace: default
spec:
  entryPoints:
    - web  # Port 80
  routes:
  - match: Host(`<service>.grove`)
    kind: Rule
    services:
    - name: <service>
      port: 80
```

### 3. Deploy Commands

```bash
# Apply all manifests for a service
sequoia "sudo k3s kubectl apply -f k8s/apps/<service>/"

# Apply ingress
sequoia "sudo k3s kubectl apply -f k8s/ingress/<service>-ingress.yaml"

# Check deployment
sequoia "sudo k3s kubectl get pods -l app=<service>"
sequoia "sudo k3s kubectl logs -l app=<service>"

# Check ingress routing
sequoia "sudo k3s kubectl get ingressroutes"

# Test from any machine on network
curl -I http://<service>.grove
```

## Storage Patterns

**Media Storage** (all services need read/write to `/media/`):
```yaml
volumes:
- name: media
  hostPath:
    path: /media
    type: Directory
```

**Subdirectories**:
- `/media/movies/` - Radarr managed
- `/media/tv/` - Sonarr managed
- `/media/music/` - Music library
- `/media/downloads/complete/` - qBittorrent output
- `/media/wikipedia/` - Offline Wikipedia

**App Config** (persistent across pod restarts):
```yaml
volumes:
- name: config
  hostPath:
    path: /opt/<service>/config
    type: DirectoryOrCreate
```

## Special Cases

### External Services (Docker/systemd → k8s Ingress)

For services NOT yet migrated to k8s but need `.grove` domain routing:

**k8s/services/external-services.yaml**:
```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: plex-external
spec:
  ports:
  - port: 80
    targetPort: 32400
---
apiVersion: v1
kind: Endpoints
metadata:
  name: plex-external
subsets:
- addresses:
  - ip: 192.168.1.2  # Sequoia's IP
  ports:
  - port: 32400
```

Then create IngressRoute pointing to `plex-external` service.

### VPN-Routed Services (qBittorrent)

Use sidecar pattern with WireGuard:
```yaml
spec:
  containers:
  - name: qbittorrent
    image: linuxserver/qbittorrent
  - name: wireguard
    image: linuxserver/wireguard
    securityContext:
      capabilities:
        add: ["NET_ADMIN"]
    volumeMounts:
    - name: wg-config
      mountPath: /config/wg0.conf
      subPath: wg0.conf
```

## Verification Checklist

After deploying a service:

1. **Pod Running**: `sequoia "sudo k3s kubectl get pods -l app=<service>"`
2. **Logs Clean**: `sequoia "sudo k3s kubectl logs -l app=<service>"`
3. **Service Exists**: `sequoia "sudo k3s kubectl get svc <service>"`
4. **IngressRoute Active**: `sequoia "sudo k3s kubectl get ingressroute <service>-http"`
5. **HTTP Response**: `curl -sI http://<service>.grove | head -5`
6. **Web UI Accessible**: Open `http://<service>.grove` in browser

## Troubleshooting

**Pod not starting**:
```bash
sequoia "sudo k3s kubectl describe pod <pod-name>"
sequoia "sudo k3s kubectl logs <pod-name>"
```

**Ingress not routing**:
```bash
# Check IngressRoute
sequoia "sudo k3s kubectl get ingressroute <service>-http -o yaml"

# Check Traefik logs
sequoia "sudo k3s kubectl logs -n kube-system -l app.kubernetes.io/name=traefik"

# Verify DNS
dig <service>.grove  # Should return 192.168.1.2
```

**Volume permission issues**:
```bash
# Check/fix permissions on Sequoia
sequoia "sudo chown -R 1000:1000 /opt/<service>/config"
sequoia "sudo chmod -R 755 /media/<directory>"
```

## Common Operations

**Restart a deployment**:
```bash
sequoia "sudo k3s kubectl rollout restart deployment/<service>"
```

**Scale replicas**:
```bash
sequoia "sudo k3s kubectl scale deployment/<service> --replicas=2"
```

**Update image**:
```bash
sequoia "sudo k3s kubectl set image deployment/<service> <container>=<new-image>:<tag>"
```

**Delete and redeploy**:
```bash
sequoia "sudo k3s kubectl delete -f k8s/apps/<service>/"
sequoia "sudo k3s kubectl apply -f k8s/apps/<service>/"
```

## Migration Strategy

When moving a service from Docker/systemd to k8s:

1. **Create manifests** in `k8s/apps/<service>/`
2. **Test deployment** alongside existing service (different port/domain)
3. **Verify functionality** (web UI, API, integrations)
4. **Update IngressRoute** to point to k8s service
5. **Stop old service**: `sudo systemctl stop <service>`
6. **Remove old config** from Docker Compose or systemd

See `MIGRATION_PLAN.md` for detailed service-by-service migration steps.

## Useful Aliases

Consider adding to AI agent context or user's `.bashrc`:
```bash
alias k='sudo k3s kubectl'
alias kgp='sudo k3s kubectl get pods'
alias kgs='sudo k3s kubectl get svc'
alias kgi='sudo k3s kubectl get ingressroutes'
alias klog='sudo k3s kubectl logs'
```

## References

- Cluster config: `CLAUDE.md`
- Migration plan: `MIGRATION_PLAN.md`
- Service manifest: `SERVICE_MANIFEST.md`
- Traefik docs: https://doc.traefik.io/traefik/providers/kubernetes-crd/
- k3s docs: https://docs.k3s.io/
