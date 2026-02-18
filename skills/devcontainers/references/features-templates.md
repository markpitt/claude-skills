# Dev Container Features and Templates

Reference for consuming Features, authoring custom Features, and distributing Templates.

---

## Dev Container Features

**Features** are self-contained, versioned units of installation code that add tools and configuration to a dev container without modifying the Dockerfile. They are the recommended way to compose development environments.

### Consuming Features

Add Features to the `features` object in `devcontainer.json`:

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/python:1": { "version": "3.12" },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/azure-cli:1": { "version": "latest" },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {
      "version": "latest",
      "dockerDashComposeVersion": "v2"
    }
  }
}
```

**Always pin a major version** (`:1`, `:2`) — never use `:latest` for production environments. The registry resolves the latest patch within a major version.

### Popular Official Features

| Feature | Registry Path | Options |
|---------|--------------|---------|
| Node.js | `ghcr.io/devcontainers/features/node:1` | `version` |
| Python | `ghcr.io/devcontainers/features/python:1` | `version`, `installTools` |
| Go | `ghcr.io/devcontainers/features/go:1` | `version` |
| Rust | `ghcr.io/devcontainers/features/rust:1` | `version`, `profile` |
| .NET | `ghcr.io/devcontainers/features/dotnet:2` | `version` |
| Java | `ghcr.io/devcontainers/features/java:1` | `version`, `jdkDistro` |
| Git | `ghcr.io/devcontainers/features/git:1` | `version`, `ppa` |
| Docker-in-Docker | `ghcr.io/devcontainers/features/docker-in-docker:2` | `version`, `moby` |
| Docker-outside-Docker | `ghcr.io/devcontainers/features/docker-outside-of-docker:1` | |
| kubectl + Helm | `ghcr.io/devcontainers/features/kubectl-helm-minikube:1` | `version` |
| Azure CLI | `ghcr.io/devcontainers/features/azure-cli:1` | `version` |
| AWS CLI | `ghcr.io/devcontainers/features/aws-cli:1` | `version` |
| GitHub CLI | `ghcr.io/devcontainers/features/github-cli:1` | `version` |

Browse the full registry: https://containers.dev/features

### Controlling Install Order

Features install in an unspecified order by default. Use `overrideFeatureInstallOrder` when ordering matters:

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/myorg/features/my-tool:1": {}
  },
  "overrideFeatureInstallOrder": [
    "ghcr.io/devcontainers/features/node:1",
    "ghcr.io/myorg/features/my-tool:1"
  ]
}
```

Alternatively, within your own Feature's `devcontainer-feature.json`, use `installsAfter` to declare soft dependencies.

---

## Authoring Custom Features

### Structure

```
my-feature/
├── devcontainer-feature.json   # Metadata and options
├── install.sh                  # Installation script (required)
└── README.md                   # Optional documentation
```

### `devcontainer-feature.json`

```json
{
  "id": "my-tool",
  "version": "1.0.0",
  "name": "My Tool",
  "description": "Installs My Tool for development",
  "documentationURL": "https://github.com/myorg/my-feature",
  "licenseURL": "https://github.com/myorg/my-feature/blob/main/LICENSE",
  "options": {
    "version": {
      "type": "string",
      "default": "latest",
      "description": "Version of My Tool to install",
      "proposals": ["latest", "1.0.0", "0.9.0"]
    },
    "installGlobalTools": {
      "type": "boolean",
      "default": true,
      "description": "Install global CLI tools alongside My Tool"
    }
  },
  "installsAfter": [
    "ghcr.io/devcontainers/features/common-utils"
  ],
  "containerEnv": {
    "MY_TOOL_HOME": "/usr/local/my-tool"
  }
}
```

### `install.sh` Best Practices

```bash
#!/bin/bash
set -e

# Access options (injected as environment variables by CLI)
VERSION="${VERSION:-"latest"}"
INSTALL_GLOBAL_TOOLS="${INSTALLGLOBALTOOLS:-"true"}"

# Detect OS and architecture
. /etc/os-release
ARCH="$(uname -m)"
case "${ARCH}" in
  x86_64) ARCH="amd64" ;;
  aarch64 | arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: ${ARCH}"; exit 1 ;;
esac

# Install dependencies
apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates

# Resolve 'latest' version
if [ "${VERSION}" = "latest" ]; then
  VERSION=$(curl -sf "https://api.github.com/repos/myorg/my-tool/releases/latest" \
    | grep '"tag_name"' | sed -E 's/"tag_name": "v?([^"]+)".*/\1/')
fi

# Download and install
curl -fsSL "https://example.com/releases/${VERSION}/my-tool-${ARCH}" \
  -o /usr/local/bin/my-tool
chmod +x /usr/local/bin/my-tool

# Respect remoteUser (CLI provides _REMOTE_USER variable)
if [ "${INSTALL_GLOBAL_TOOLS}" = "true" ]; then
  su "${_REMOTE_USER}" -c "my-tool install-globals"
fi

echo "Done! Installed my-tool ${VERSION}"
```

### Key Authoring Rules

1. **Idempotency** — scripts may run multiple times; check before acting
2. **OS/arch detection** — handle `amd64` and `arm64` at minimum; detect distro via `/etc/os-release`
3. **Respect `_REMOTE_USER`** — use the `_REMOTE_USER` variable (injected by CLI) when installing user-scoped tools
4. **Clean up after `apt-get`** — add `&& rm -rf /var/lib/apt/lists/*` to keep layers small
5. **Export env vars** — use `containerEnv` in metadata rather than sourcing `.bashrc` (more reliable across shells)

### Testing Features

Use the official test framework via the Dev Container CLI:

```bash
# Install CLI
npm install -g @devcontainers/cli

# Test against a specific base image
devcontainer features test \
  --features my-feature \
  --base-image mcr.microsoft.com/devcontainers/base:ubuntu \
  .

# Test against multiple images (define in devcontainer-feature.json's "scenarios")
devcontainer features test .
```

### Publishing Features

```bash
# Build and push to GitHub Container Registry
devcontainer features publish \
  --registry ghcr.io \
  --namespace myorg \
  ./my-feature
```

The Feature becomes available at `ghcr.io/myorg/features/my-feature:1`.

---

## Dev Container Templates

Templates are complete `devcontainer.json` configurations (plus optional Dockerfiles and Compose files) that define standardised starting points for new projects.

### Using a Template

Via VS Code: **Dev Containers: Add Dev Container Configuration Files** → browse Templates

Via CLI:

```bash
devcontainer templates apply \
  --template-id ghcr.io/devcontainers/templates/python:1 \
  --workspace-folder .
```

### Popular Official Templates

| Template | ID |
|----------|----|
| Python 3 | `ghcr.io/devcontainers/templates/python:1` |
| Node.js | `ghcr.io/devcontainers/templates/javascript-node:1` |
| Go | `ghcr.io/devcontainers/templates/go:1` |
| Rust | `ghcr.io/devcontainers/templates/rust:1` |
| .NET | `ghcr.io/devcontainers/templates/dotnet:1` |
| Java | `ghcr.io/devcontainers/templates/java:1` |

Browse the full registry: https://containers.dev/templates

### Authoring Custom Templates

```
my-template/
├── devcontainer-template.json   # Metadata
├── .devcontainer/
│   ├── devcontainer.json        # The template configuration
│   └── Dockerfile               # (optional)
└── README.md
```

**`devcontainer-template.json`:**

```json
{
  "id": "my-stack",
  "version": "1.0.0",
  "name": "My Stack",
  "description": "Development environment for My Stack projects",
  "documentationURL": "https://github.com/myorg/my-template",
  "licenseURL": "https://github.com/myorg/my-template/blob/main/LICENSE",
  "options": {
    "nodeVersion": {
      "type": "string",
      "default": "20",
      "description": "Node.js version",
      "proposals": ["20", "18", "16"]
    }
  },
  "platforms": ["linux/amd64", "linux/arm64"],
  "publisher": "myorg",
  "keywords": ["node", "typescript", "my-stack"]
}
```

### Template Distribution

1. Publish to GitHub Container Registry as OCI artifacts (tarballs)
2. Add `devcontainer-collection.json` to the repository root for [discovery](https://containers.dev/implementors/collections/)
3. Use semantic versioning: `1.0.0`, `1.1.0`, etc.

```bash
devcontainer templates publish \
  --registry ghcr.io \
  --namespace myorg \
  ./my-template
```

### Centralised Team Repository Pattern

Host a `team-devcontainers` repository with:

```
team-devcontainers/
├── devcontainer-collection.json   # Metadata index
├── templates/
│   ├── backend-service/           # Java Spring Boot template
│   ├── frontend-app/              # React/TypeScript template
│   └── data-science/              # Python + Jupyter template
└── features/
    ├── internal-cli/              # Company CLI tool
    └── vpn-config/                # Internal network setup
```

Share the collection URL with the team; point the VS Code Add Config dialog to it.
