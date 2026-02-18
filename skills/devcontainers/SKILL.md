---
name: devcontainers
description: Provides expert guidance on Development Containers (devcontainers) — creating, configuring, and optimising containerised development environments using the Dev Container Specification. This skill should be used when users ask about devcontainer.json, .devcontainer setup, Dev Container Features or Templates, pre-building images, multi-container workflows, Docker-in-Docker, cloud development environments (Codespaces, DevPod), or troubleshooting container performance and permission issues.
metadata:
  version: 1.0.0
  tags: [docker, containers, devcontainers, vscode, codespaces, devpod]
---

# Dev Containers Skill

Expert guidance on creating, configuring, and optimising containerised development environments using the [Dev Container Specification](https://containers.dev). Covers `devcontainer.json` authoring, Features, Templates, performance, security, multi-container setups, and cloud environments.

## Quick Reference Table

| Task | Load Resource | Key Concepts |
|------|--------------|--------------|
| Create or configure a `devcontainer.json` | `references/core-concepts.md` | image, build, features, lifecycle hooks, customizations |
| Add tools/languages to a container | `references/features-templates.md` | Features, version pinning, installsAfter, Templates |
| Set up multi-container or Docker-in-Docker | `references/advanced-config.md` | dockerComposeFile, DinD, DooD, Kubernetes, service |
| Improve build/startup speed | `references/performance-security.md` | layer caching, named volumes, pre-built images, Virtio-fs |
| Harden container security or manage secrets | `references/performance-security.md` | remoteUser, UID mapping, SSH forwarding, secrets |
| Debug slow mounts, permission errors, credential issues | `references/troubleshooting.md` | UID/GID, bind mounts, SSH agent, postCreateCommand |
| Integrate with Codespaces or DevPod | `references/advanced-config.md` | prebuilds, providers, SSH, cloud residency |

## Orchestration Protocol

### Phase 1 — Classify the Task

Identify which category the user's request falls into:

- **Configuration** — writing or editing `devcontainer.json`, Dockerfiles, Compose files
- **Tooling** — adding Features, authoring custom Features, or using Templates
- **Advanced** — multi-container, DinD/DooD, Kubernetes, cloud environments
- **Optimisation** — caching, pre-built images, named volumes, disk I/O
- **Security** — non-root users, UID mapping, secrets, hardened images
- **Troubleshooting** — permission errors, slow builds, SSH/GPG credential issues

### Phase 2 — Load the Right Resource

Load the resource indicated in the Quick Reference Table. For complex tasks spanning multiple areas (e.g. "set up a secure multi-container environment with fast builds"), load **both** relevant files.

### Phase 3 — Execute

Apply the guidance from the loaded resource. Use concrete examples from the resource files. For configuration tasks, produce a complete, commented `devcontainer.json` snippet.

## Common Task Workflows

### Workflow 1: Create a New Dev Container from Scratch

1. Load `references/core-concepts.md` for the full property reference
2. Choose orchestration method: `image` (simplest), `build.dockerfile`, or `dockerComposeFile`
3. Add `features` for tools (Node.js, Python, Git, Docker CLI, etc.)
4. Set `remoteUser` to a non-root user for security
5. Add `customizations.vscode.extensions` and `settings` for IDE consistency
6. Add `postCreateCommand` to install dependencies automatically
7. Add `forwardPorts` for any app ports

```json
{
  "name": "My Project",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/git:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"],
      "settings": { "editor.formatOnSave": true }
    }
  },
  "postCreateCommand": "npm install",
  "forwardPorts": [3000],
  "remoteUser": "node"
}
```

### Workflow 2: Add a Tool via Features

1. Load `references/features-templates.md`
2. Browse the [official registry](https://containers.dev/features) or GitHub Container Registry
3. Add the feature with a pinned version to `devcontainer.json`
4. Use `overrideFeatureInstallOrder` if ordering matters

### Workflow 3: Multi-Container Setup with Docker Compose

1. Load `references/advanced-config.md`
2. Create `docker-compose.yml` for services (app, database, cache)
3. Create `docker-compose.dev.yml` for development overrides (source mounts, debug ports)
4. Set `dockerComposeFile` to both files in `devcontainer.json`
5. Set `service` to the container the IDE should attach to
6. Set `shutdownAction: "none"` to keep services running when IDE closes

### Workflow 4: Speed Up Dev Container Builds

1. Load `references/performance-security.md`
2. Order Dockerfile instructions from least-changed to most-changed
3. Use `RUN --mount=type=cache` for package managers
4. Use named volumes for `node_modules` / heavy dependency directories
5. Pre-build and push image in CI; reference the pre-built image in `devcontainer.json`

### Workflow 5: Troubleshoot a Permission or Credential Issue

1. Load `references/troubleshooting.md`
2. For UID mismatch: ensure `updateRemoteUserUID: true` (default on Linux)
3. For SSH: ensure local SSH agent is running; the extension auto-forwards it
4. For Git inside container: use SSH agent forwarding; do not copy private keys

## Resource Summaries

| File | Contents | Lines |
|------|----------|-------|
| `references/core-concepts.md` | Full `devcontainer.json` property reference, lifecycle hooks, location precedence | ~280 |
| `references/features-templates.md` | Consuming and authoring Features, Templates distribution, version pinning | ~260 |
| `references/advanced-config.md` | Multi-container, Docker-in-Docker/from-Docker, Kubernetes, Codespaces, DevPod | ~280 |
| `references/performance-security.md` | Layer caching, named volumes, pre-built images, non-root users, secrets | ~270 |
| `references/troubleshooting.md` | Permission errors, slow I/O, SSH/GPG credentials, lifecycle script issues | ~200 |

## Best Practices

- **Version-pin everything** — pin Features (`feature:1`) and base images (`python:3.12`) for reproducibility
- **Non-root by default** — always set `remoteUser` to a non-root user; use `updateRemoteUserUID: true` on Linux
- **Automate setup** — use `postCreateCommand` to install dependencies so the environment is immediately usable
- **Don't modify production Compose** — use a `docker-compose.dev.yml` override for dev-specific additions
- **Pre-build images in CI** — reduces startup from minutes to seconds; embed metadata in image labels
- **Never bake secrets into images** — use SSH agent forwarding, BuildKit secret mounts, or `.env` files (git-ignored)
- **Named volumes for heavy directories** — on macOS/Windows, mount `node_modules` etc. into named volumes for native I/O speed

## External References

- [Dev Container Specification](https://containers.dev) — official specification and schema
- [devcontainer.json reference](https://containers.dev/implementors/json_reference/) — full property reference
- [Official Features registry](https://containers.dev/features) — browse available Features
- [Official Templates registry](https://containers.dev/templates) — browse available Templates
- [VS Code Dev Containers docs](https://code.visualstudio.com/docs/devcontainers/containers) — IDE integration guide
- [GitHub Codespaces docs](https://docs.github.com/en/codespaces) — cloud-hosted containers
- [DevPod docs](https://devpod.sh/docs) — open-source provider-agnostic cloud dev environments
- [devcontainers/cli](https://github.com/devcontainers/cli) — reference CLI implementation
