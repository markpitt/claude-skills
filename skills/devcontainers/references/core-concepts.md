# Dev Container Core Concepts

Reference for `devcontainer.json` structure, properties, and lifecycle management.

---

## What is a Dev Container?

A **development container** is a Docker-based environment defined as code. The `devcontainer.json` file is a metadata manifest telling supporting tools (VS Code, GitHub Codespaces, JetBrains, the Dev Container CLI) how to build, start, and configure a containerised development environment.

Key distinction: `devcontainer.json` *enriches* a container for development — adding IDE settings, extensions, user permissions, and lifecycle automation that don't belong in production images.

---

## File Location Precedence

Tools search for configuration in this order:

| Priority | Location |
|----------|----------|
| 1 (highest) | `.devcontainer/<subfolder>/devcontainer.json` |
| 2 | `.devcontainer/devcontainer.json` |
| 3 (lowest) | `.devcontainer.json` (root) |

Use subfolders for **monorepos** with multiple environments (e.g. `.devcontainer/backend/`, `.devcontainer/frontend/`).

The file uses **JSONC** (JSON with Comments) format — `//` and `/* */` comments are allowed.

---

## Orchestration Methods (Choose One)

Every `devcontainer.json` must declare exactly one environment source:

### `image` — Simplest

```jsonc
{
  "image": "mcr.microsoft.com/devcontainers/python:3.12"
}
```

References a pre-built image from a registry. Best for quick starts and teams using pre-built base images.

### `build` — Custom Dockerfile

```jsonc
{
  "build": {
    "dockerfile": "Dockerfile",
    "context": "..",
    "args": { "VARIANT": "3.12" }
  }
}
```

- `dockerfile`: Path relative to `.devcontainer/`
- `context`: Build context (defaults to `.devcontainer/`)
- `args`: Build arguments passed to `ARG` instructions

### `dockerComposeFile` — Multi-Container

```jsonc
{
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.dev.yml"],
  "service": "app",
  "workspaceFolder": "/workspace"
}
```

See `references/advanced-config.md` for full multi-container guidance.

---

## Features

Add modular tools without writing Dockerfile instructions:

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  }
}
```

- Always **pin a major version** (`:1`, `:2`) — never use `:latest`
- Control install order with `overrideFeatureInstallOrder` if one Feature depends on another

See `references/features-templates.md` for authoring and advanced usage.

---

## Lifecycle Hooks

Scripts that run at defined points in the container lifecycle:

| Hook | When It Runs | Where | Typical Use |
|------|-------------|-------|-------------|
| `initializeCommand` | Before container is created | **Host** | Create host directories, set permissions |
| `onCreateCommand` | Once, after container is first created | Container | Clone repos, bootstrap databases |
| `updateContentCommand` | After create; when source changes (Codespaces prebuilds) | Container | Regenerate derived assets |
| `postCreateCommand` | Once, after `updateContentCommand` | Container | Install dependencies (`npm install`, `pip install`) |
| `postStartCommand` | Every container start | Container | Start background services, daemons |
| `postAttachCommand` | Every time an IDE attaches | Container | Show welcome message, open files |

**Important:** `initializeCommand` runs on the host; all others run inside the container.

### String vs. Array vs. Object Forms

All hooks accept three forms:

```jsonc
// String (runs via shell)
"postCreateCommand": "npm install && npm run build"

// Array (no shell expansion; preferred for safety)
"postCreateCommand": ["npm", "install"]

// Object (named parallel commands)
"postCreateCommand": {
  "install-deps": "npm install",
  "generate-types": "npm run generate"
}
```

### Idempotency

`postCreateCommand` and `postStartCommand` may run multiple times across environment rebuilds. Write scripts defensively:

```bash
# Check before acting
[ -d node_modules ] || npm install
```

---

## Environment Variables

| Property | Scope | Use Case |
|----------|-------|----------|
| `containerEnv` | All container processes | Stable env vars (e.g. `NODE_ENV=development`) |
| `remoteEnv` | IDE/editor process only | Vars that should not be baked into the image |

```jsonc
{
  "containerEnv": { "NODE_ENV": "development" },
  "remoteEnv": { "LOCAL_WORKSPACE_FOLDER": "${localWorkspaceFolder}" }
}
```

**Variable substitution** — supported in many string properties:

| Variable | Value |
|----------|-------|
| `${localWorkspaceFolder}` | Host workspace path |
| `${containerWorkspaceFolder}` | In-container workspace path |
| `${localEnv:MY_VAR}` | Value of a host environment variable |
| `${containerEnv:MY_VAR}` | Value of a container environment variable |

---

## User and Permissions

```jsonc
{
  "remoteUser": "vscode",         // User the IDE runs as (non-root recommended)
  "containerUser": "root",        // User container processes run as (can differ)
  "updateRemoteUserUID": true     // Sync UID/GID with host user (Linux only; default: true)
}
```

- Always set `remoteUser` to a non-root user (`vscode`, `node`, `python`, etc.)
- `updateRemoteUserUID: true` prevents bind-mount permission issues on Linux hosts

---

## Networking

```jsonc
{
  "forwardPorts": [3000, 5432],
  "portsAttributes": {
    "3000": { "label": "App", "onAutoForward": "notify" },
    "5432": { "label": "Postgres", "onAutoForward": "silent" }
  },
  "otherPortsAttributes": { "onAutoForward": "ignore" }
}
```

`onAutoForward` values: `"notify"`, `"openBrowser"`, `"openPreview"`, `"silent"`, `"ignore"`

---

## Mounts

```jsonc
{
  "mounts": [
    // Named volume for performance (avoids slow bind mounts on macOS/Windows)
    "source=node_modules_cache,target=${containerWorkspaceFolder}/node_modules,type=volume",
    // Persist bash history
    "source=devcontainer-bashhistory,target=/commandhistory,type=volume",
    // Additional bind mount
    "source=${localWorkspaceFolder}/../shared-lib,target=/shared-lib,type=bind,consistency=cached"
  ]
}
```

---

## VS Code Customizations

```jsonc
{
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-python.python"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "terminal.integrated.defaultProfile.linux": "bash"
      }
    }
  }
}
```

---

## Other Useful Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name shown in the IDE |
| `workspaceFolder` | string | In-container path where the workspace is mounted |
| `workspaceMount` | string | Override the default workspace mount |
| `runArgs` | array | Extra `docker run` arguments (e.g. `["--cap-add=SYS_PTRACE"]`) |
| `shutdownAction` | string | `"none"` or `"stopContainer"` — what happens when IDE disconnects |
| `hostRequirements` | object | Minimum host CPU, memory, storage, GPU |
| `privileged` | boolean | Run in privileged mode (required for DinD; use with caution) |
| `capAdd` | array | Add Linux capabilities without full `privileged` (e.g. `["SYS_PTRACE"]`) |
| `securityOpt` | array | Security options (e.g. `["seccomp=unconfined"]`) |

---

## Minimal `devcontainer.json` Examples

### Node.js Project

```jsonc
{
  "name": "Node.js App",
  "image": "mcr.microsoft.com/devcontainers/node:20",
  "customizations": {
    "vscode": { "extensions": ["dbaeumer.vscode-eslint"] }
  },
  "postCreateCommand": "npm install",
  "forwardPorts": [3000],
  "remoteUser": "node"
}
```

### Python Project

```jsonc
{
  "name": "Python App",
  "image": "mcr.microsoft.com/devcontainers/python:3.12",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },
  "customizations": {
    "vscode": { "extensions": ["ms-python.python", "ms-python.pylint"] }
  },
  "postCreateCommand": "pip install -r requirements.txt",
  "remoteUser": "vscode"
}
```

### Go Project

```jsonc
{
  "name": "Go App",
  "image": "mcr.microsoft.com/devcontainers/go:1.22",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "postCreateCommand": "go mod download",
  "forwardPorts": [8080],
  "remoteUser": "vscode"
}
```

---

## Official Image Registry

Microsoft publishes maintained base images:

| Image | Use Case |
|-------|----------|
| `mcr.microsoft.com/devcontainers/base:ubuntu` | Generic Ubuntu |
| `mcr.microsoft.com/devcontainers/python:3.x` | Python |
| `mcr.microsoft.com/devcontainers/node:x` | Node.js |
| `mcr.microsoft.com/devcontainers/go:x.x` | Go |
| `mcr.microsoft.com/devcontainers/rust:latest` | Rust |
| `mcr.microsoft.com/devcontainers/dotnet:8.0` | .NET |
| `mcr.microsoft.com/devcontainers/java:21` | Java |

All images include common dev tools (git, curl, etc.) and a non-root `vscode` user.
