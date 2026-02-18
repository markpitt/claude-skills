# Advanced Dev Container Configuration

Multi-container setups, Docker-in-Docker, Kubernetes integration, and cloud environments.

---

## Multi-Container with Docker Compose

### Basic Setup

```jsonc
// .devcontainer/devcontainer.json
{
  "name": "My App",
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.dev.yml"],
  "service": "app",
  "workspaceFolder": "/workspace",
  "shutdownAction": "none",
  "forwardPorts": [3000, 5432, 6379]
}
```

```yaml
# docker-compose.yml (production — do not modify for dev)
services:
  app:
    build: .
    ports:
      - "3000:3000"
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
  cache:
    image: redis:7-alpine
```

```yaml
# .devcontainer/docker-compose.dev.yml (dev overrides)
services:
  app:
    volumes:
      # Mount source code instead of copying it
      - ..:/workspace:cached
    command: sleep infinity     # Keep container alive; start app manually
    environment:
      DEBUG: "true"
    ports:
      - "9229:9229"             # Node.js debugger port
  db:
    volumes:
      - db-data:/var/lib/postgresql/data   # Persist DB data
volumes:
  db-data:
```

### Key Properties for Compose Setups

| Property | Description |
|----------|-------------|
| `service` | Which Compose service the IDE should attach to (required) |
| `workspaceFolder` | Working directory inside the container |
| `shutdownAction` | `"none"` keeps all services running when IDE closes; `"stopCompose"` stops all |
| `runServices` | Array of service names to start; omit to start all |

```jsonc
{
  "runServices": ["app", "db"],   // Don't start cache unless needed
  "shutdownAction": "none"
}
```

### Network Isolation

```yaml
services:
  app:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend           # DB not reachable from frontend network
  nginx:
    networks:
      - frontend

networks:
  frontend:
  backend:
    internal: true        # No external internet access
```

### Monorepo with Multiple Dev Containers

```
repo/
├── .devcontainer/
│   ├── backend/
│   │   └── devcontainer.json    # { "service": "backend", "dockerComposeFile": ["../../docker-compose.yml"] }
│   └── frontend/
│       └── devcontainer.json    # { "service": "frontend", "dockerComposeFile": ["../../docker-compose.yml"] }
```

---

## Docker-in-Docker (DinD) vs. Docker-outside-of-Docker (DooD)

### Docker-in-Docker (DinD)

Runs a **separate Docker daemon** inside the container. Completely isolated from the host.

**Use when:** CI/CD pipelines, isolated build environments, Kubernetes (where the host socket may not be accessible)

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {
      "moby": true,
      "dockerDashComposeVersion": "v2"
    }
  },
  "privileged": true    // Required for DinD
}
```

Downsides: No shared layer cache with host; images don't persist across container rebuilds by default.

### Docker-outside-of-Docker (DooD)

Mounts the **host's Docker socket** so the container controls the host's Docker daemon.

**Use when:** Development, when you want to share the host's image cache.

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/docker-outside-of-docker:1": {}
  }
  // No "privileged" needed — socket mounting is sufficient
}
```

```yaml
# If using Compose
services:
  app:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

Downsides: Containers started inside the dev container are siblings on the host, not children — path mapping can be tricky.

### Comparison

| | DinD | DooD |
|--|------|------|
| Isolation | Full | Shares host daemon |
| Privileged required | Yes | No |
| Shares host image cache | No | Yes |
| Build speed | Slower (cold cache) | Faster |
| CI suitability | Excellent | Good |

---

## Kubernetes Integration

### Install kubectl + Helm

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {
      "version": "latest",
      "helm": "latest",
      "minikube": "none"    // "none" to skip Minikube
    }
  }
}
```

### Connect to Existing Cluster

Mount the host's `~/.kube`:

```jsonc
{
  "mounts": [
    "source=${localEnv:HOME}/.kube,target=/home/vscode/.kube,type=bind,consistency=cached"
  ]
}
```

Or copy kubeconfig in `postCreateCommand`:

```jsonc
{
  "postCreateCommand": "mkdir -p ~/.kube && cp /host-kube/config ~/.kube/config"
}
```

### Minikube Inside DinD

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {
      "minikube": "latest"
    },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "privileged": true
}
```

Start Minikube with the `docker` driver inside the container:

```bash
minikube start --driver=docker
```

### DevSpace — Deploy to Remote Cluster

[DevSpace](https://www.devspace.sh/) allows developing directly against a Kubernetes cluster:

```bash
# Install DevSpace
curl -L -o devspace \
  "https://github.com/loft-sh/devspace/releases/latest/download/devspace-linux-amd64"

# Sync local files to a pod
devspace dev
```

Useful for workloads that need cloud resources (GPUs, large datasets) unavailable locally.

---

## GitHub Codespaces

Codespaces uses `devcontainer.json` natively — the same file that works locally works in Codespaces.

### Codespaces-Specific Configuration

```jsonc
{
  "customizations": {
    "codespaces": {
      "repositories": {
        "myorg/private-repo": {
          "permissions": { "contents": "read" }
        }
      }
    }
  }
}
```

### Secrets

Prompt users to provide secrets at creation time:

```jsonc
{
  // In .devcontainer/devcontainer.json
  // Users set these in their Codespaces user settings or org settings
  "containerEnv": {
    "MY_API_KEY": "${localEnv:MY_API_KEY}"
  }
}
```

Define recommended secrets in the repository (Settings → Codespaces → Secrets). The secret value is injected but never logged.

### Prebuilds

Enable prebuilds to reduce startup from ~2-5 minutes to ~10-20 seconds:

1. Go to **Settings → Codespaces → Prebuild configuration**
2. Select branch and region
3. Codespaces runs `onCreateCommand` and `updateContentCommand` ahead of time

The prebuild caches `postCreateCommand` output up to but not including `postAttachCommand`. Write `postCreateCommand` to be idempotent.

### Machine Types

Codespaces machine types (set via `hostRequirements`):

```jsonc
{
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb",
    "storage": "32gb"
  }
}
```

### Data Residency (Enterprise)

Enterprise organisations can restrict Codespaces to specific geographic regions for compliance. Configure in the GitHub Enterprise admin console.

---

## DevPod — Provider-Agnostic Dev Environments

[DevPod](https://devpod.sh/) is an open-source, client-only tool that runs dev containers on any backend (local Docker, AWS, Azure, GCP, Kubernetes, SSH).

### Install

```bash
# macOS
brew install loft-sh/tap/devpod

# Linux
curl -L -o devpod \
  "https://github.com/loft-sh/devpod/releases/latest/download/devpod-linux-amd64"
chmod +x devpod && sudo mv devpod /usr/local/bin/
```

### Providers

```bash
# List providers
devpod provider list

# Add AWS provider
devpod provider add aws

# Add Kubernetes provider
devpod provider add kubernetes
```

### Create a Workspace

```bash
# From a GitHub repo
devpod up github.com/myorg/my-project --provider aws

# From local directory
devpod up . --provider docker

# Switch provider without changing devcontainer.json
devpod up . --provider kubernetes
```

### IDE Integration

DevPod manages SSH automatically — connect any IDE:

```bash
# Open in VS Code
devpod up . --ide vscode

# Open in JetBrains (requires Gateway)
devpod up . --ide intellij

# Open in Zed
devpod up . --ide zed

# SSH terminal access
devpod ssh my-workspace
```

### Key Advantages over Codespaces

| Feature | Codespaces | DevPod |
|---------|-----------|--------|
| Provider-agnostic | No (GitHub only) | Yes (any cloud/local) |
| IDE flexibility | VS Code / JetBrains | Any SSH-compatible IDE |
| Open source | No | Yes |
| Cost | GitHub pricing | Pay your own cloud |
| No vendor lock-in | No | Yes |

---

## JetBrains IDE Support

JetBrains Gateway connects to dev containers via SSH. The container needs an SSH server, which DevPod handles automatically.

For **JetBrains CodeCanvas** (cloud IDE), see: https://www.jetbrains.com/code-canvas/

For **IntelliJ IDEA** with remote containers:

```bash
# Start via DevPod with JetBrains IDE
devpod up . --ide intellij
```

---

## WSL2 (Windows Dev Setup)

When using Docker Desktop on Windows:

```jsonc
{
  // Ensure the project lives inside the WSL2 filesystem for acceptable I/O
  // Path: \\wsl$\Ubuntu\home\user\myproject
  "workspaceFolder": "/home/vscode/workspace",
  "mounts": [
    // Avoid mounting Windows-side (C:\) paths directly — slow bind mounts
    "source=project-node-modules,target=/home/vscode/workspace/node_modules,type=volume"
  ]
}
```

Store project files inside WSL2 (`~/` inside the Linux distro), not on the Windows filesystem, to avoid bind mount performance penalties.
