# Performance and Security for Dev Containers

Optimising build speed, startup time, disk I/O, and hardening container security.

---

## Performance: Dockerfile Layer Caching

### Layer Ordering Principle

Docker rebuilds every layer **after** the first changed layer. Order instructions from least- to most-frequently changed:

```dockerfile
# ✅ Good — stable layers first
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# 1. System packages (rarely change)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Package manager dependencies (change occasionally)
COPY package.json package-lock.json ./
RUN npm ci

# 3. Source code (changes frequently)
COPY . .
RUN npm run build
```

```dockerfile
# ❌ Bad — copying source early invalidates dependency cache
FROM node:20
COPY . .                   # Any source change invalidates everything below
RUN npm ci                 # Always re-runs
```

### BuildKit Cache Mounts

Persist package manager caches between builds even when layers are invalidated:

```dockerfile
# Node.js / npm
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Python / pip
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Go modules
RUN --mount=type=cache,target=/root/go/pkg/mod \
    go mod download

# Rust / cargo
RUN --mount=type=cache,target=/root/.cargo/registry \
    cargo build --release

# apt packages
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y curl wget
```

### Multi-Stage Builds

Separate build and runtime stages to reduce final image size and improve cacheability:

```dockerfile
# Stage 1 — build dependencies (cacheable)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2 — build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3 — minimal runtime image
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

In `devcontainer.json`, target the dev-friendly stage:

```jsonc
{
  "build": {
    "dockerfile": "Dockerfile",
    "target": "builder"   // Use the full build stage for development
  }
}
```

### Minimise Build Context

Create `.dockerignore`:

```dockerignore
.git
node_modules
dist
build
.DS_Store
*.log
.env
.env.*
coverage
__pycache__
*.pyc
.pytest_cache
```

---

## Performance: Pre-building Images in CI

Pre-build the dev container image in CI and push to a registry. Developers pull a ready-to-use image instead of building locally.

### GitHub Actions Workflow

```yaml
# .github/workflows/devcontainer-prebuild.yml
name: Pre-build Dev Container

on:
  push:
    branches: [main]
    paths:
      - '.devcontainer/**'
      - 'package.json'
      - 'requirements.txt'
  schedule:
    - cron: '0 3 * * 1'   # Weekly on Mondays to pick up Feature updates

jobs:
  prebuild:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Pre-build and push
        uses: devcontainers/ci@v0.3
        with:
          imageName: ghcr.io/${{ github.repository }}/devcontainer
          cacheFrom: ghcr.io/${{ github.repository }}/devcontainer
          push: always
```

### Reference Pre-built Image

```jsonc
// .devcontainer/devcontainer.json
{
  "image": "ghcr.io/myorg/my-repo/devcontainer:latest",
  // Features/customizations still apply on top of the pre-built image
  "customizations": {
    "vscode": { "extensions": ["dbaeumer.vscode-eslint"] }
  },
  "postCreateCommand": "npm install"
}
```

### Embedding Metadata in the Image

When using `devcontainers/ci`, metadata (extensions, settings, lifecycle scripts) is automatically embedded as image labels. The image becomes self-contained — tools apply settings automatically when the image is pulled.

---

## Performance: Disk I/O

### Named Volumes for Heavy Directories

On macOS and Windows, bind mounts pass through a virtualisation layer and are slow. Use named volumes for directories with heavy I/O:

```jsonc
{
  "mounts": [
    // node_modules in a named volume — native Linux filesystem speed
    "source=${localWorkspaceFolderBasename}-node_modules,target=${containerWorkspaceFolder}/node_modules,type=volume",
    // Python virtualenv
    "source=${localWorkspaceFolderBasename}-venv,target=${containerWorkspaceFolder}/.venv,type=volume",
    // Cargo build cache
    "source=cargo-cache,target=/usr/local/cargo/registry,type=volume"
  ]
}
```

**Trade-off:** Named volumes are not visible on the host filesystem. They persist across container rebuilds but must be explicitly deleted when resetting.

### Virtio-fs (Docker Desktop macOS/Windows)

Enable in **Docker Desktop → Settings → General → VirtioFS** (Virtual File Sharing). Provides up to 2–10× faster bind mount performance vs default gRPC-FUSE.

Requires Docker Desktop 4.6+ on macOS.

### Synchronized File Shares (Docker Desktop 4.27+)

Docker Desktop's **Synchronized File Shares** feature maintains a synchronised copy of host files inside the VM, providing near-native speeds for bind mounts. Enable per-mount in Docker Desktop settings.

---

## Security: Non-Root Users

### Always Use `remoteUser`

```jsonc
{
  "remoteUser": "vscode"    // The user VS Code and terminals run as
}
```

The `mcr.microsoft.com/devcontainers/*` images include a pre-configured `vscode` user. Other images may use `node`, `python`, `app`, etc.

**Never develop as `root`** — even inside a container, running as root exposes the host if there are container escape vulnerabilities.

### UID/GID Mapping (Linux Hosts)

On Linux, the container user's UID must match the host user's UID to avoid bind mount permission errors:

```jsonc
{
  "remoteUser": "vscode",
  "updateRemoteUserUID": true    // Default: true — automatically syncs UID/GID
}
```

If you see files owned by `root` after the container writes to a bind-mounted directory, ensure `updateRemoteUserUID` is `true`.

### Running as a Specific UID

```dockerfile
# Explicitly set UID in Dockerfile
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupmod --gid $USER_GID vscode \
    && usermod --uid $USER_UID --gid $USER_GID vscode
```

---

## Security: Secrets Management

### Never Bake Secrets Into Images

```dockerfile
# ❌ NEVER do this
ENV GITHUB_TOKEN=ghp_xxx       # Visible in image history
RUN curl -H "Authorization: token $GITHUB_TOKEN" ...
```

### BuildKit Secret Mounts (Build-Time Secrets)

```dockerfile
# Dockerfile — secret is available only during this RUN; not in the image
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install --registry https://npm.pkg.github.com
```

```bash
# Build with the secret
docker build --secret id=github_token,src=$HOME/.github_token .
```

### SSH Agent Forwarding (Git Credentials)

The Dev Containers extension automatically forwards the local SSH agent socket into the container. Prerequisites:

```bash
# On the host, ensure SSH agent is running and key is loaded
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Verify
ssh-add -l
```

Inside the container, Git operations over SSH work automatically.

### GPG Signing

```bash
# On the host
gpg --list-secret-keys

# Export the key ID you want to use
echo "export GPG_KEY_ID=<your-key-id>" >> ~/.bashrc
```

```jsonc
// devcontainer.json — mount GPG socket
{
  "mounts": [
    "source=${localEnv:HOME}/.gnupg,target=/home/vscode/.gnupg,type=bind,consistency=cached"
  ],
  "postCreateCommand": "git config --global user.signingkey $GPG_KEY_ID && git config --global commit.gpgsign true"
}
```

### Environment Variable Secrets

```jsonc
// devcontainer.json — inject from host environment (never hardcode values)
{
  "remoteEnv": {
    "GITHUB_TOKEN": "${localEnv:GITHUB_TOKEN}",
    "AWS_ACCESS_KEY_ID": "${localEnv:AWS_ACCESS_KEY_ID}",
    "AWS_SECRET_ACCESS_KEY": "${localEnv:AWS_SECRET_ACCESS_KEY}"
  }
}
```

For secrets that vary per developer, use a `.env` file (added to `.gitignore`) and reference it:

```jsonc
{
  "runArgs": ["--env-file", "${localWorkspaceFolder}/.env"]
}
```

### Docker BuildKit Inline Cache for CI

```yaml
# docker-compose.dev.yml — enable BuildKit inline cache
services:
  app:
    build:
      cache_from:
        - ghcr.io/myorg/my-repo/devcontainer:latest
```

```bash
# Build with registry cache backend (caches all stages)
docker buildx build \
  --cache-from type=registry,ref=ghcr.io/myorg/cache \
  --cache-to type=registry,ref=ghcr.io/myorg/cache,mode=max \
  .
```

---

## Security: Hardened Base Images

- Use Docker's official **hardened images** (reduced attack surface, signed, regularly patched)
- Review the SBOM (Software Bill of Materials) for known vulnerabilities
- Pin base image digests for full reproducibility:

```dockerfile
# Pin by digest instead of tag for maximum reproducibility
FROM mcr.microsoft.com/devcontainers/base@sha256:abc123...
```

---

## Security: Capability Management

Avoid `"privileged": true` unless absolutely required (e.g. Docker-in-Docker). Instead, grant specific capabilities:

```jsonc
{
  "capAdd": ["SYS_PTRACE"],       // Enable debuggers (ptrace)
  "securityOpt": ["seccomp=unconfined"]   // Disable seccomp for debugging
}
```

Common capabilities for development:

| Capability | Use Case |
|-----------|----------|
| `SYS_PTRACE` | Debuggers (GDB, strace) |
| `NET_ADMIN` | Network testing tools |
| `SYS_ADMIN` | FUSE mounts |

---

## CI/CD Integration Checklist

- [ ] Pre-build image on `main` branch changes and weekly schedule
- [ ] Push to a container registry with appropriate access controls
- [ ] Use `--cache-from` to reuse previous build layers
- [ ] Embed devcontainer metadata in image labels (`devcontainers/ci` does this automatically)
- [ ] Scan image for vulnerabilities in CI (Trivy, Snyk, Docker Scout)
- [ ] Rotate base image regularly to pick up OS patches
