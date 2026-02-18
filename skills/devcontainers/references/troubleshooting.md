# Dev Container Troubleshooting

Common issues and fixes for Dev Container configuration, performance, and credential problems.

---

## Permission Errors (UID/GID Mismatch)

### Symptom
Files created inside the container appear owned by `root` on the host, or you get `Permission denied` when the container tries to write to a bind-mounted directory.

### Cause
The container user's UID differs from the host user's UID.

### Fix

```jsonc
{
  "remoteUser": "vscode",
  "updateRemoteUserUID": true    // Default true — re-maps UID/GID to match host
}
```

If you have a custom Dockerfile and the user UID is hardcoded:

```dockerfile
ARG USER_UID=1000
ARG USER_GID=1000
RUN usermod -u $USER_UID vscode && groupmod -g $USER_GID vscode
```

Pass the host user's UID at build time:

```jsonc
{
  "build": {
    "dockerfile": "Dockerfile",
    "args": {
      "USER_UID": "1000",
      "USER_GID": "1000"
    }
  }
}
```

---

## Slow File I/O (macOS / Windows)

### Symptom
`npm install`, `pip install`, or file-watching tools (webpack, nodemon) are extremely slow inside the container.

### Fixes — in order of impact

**1. Use named volumes for heavy directories**

```jsonc
{
  "mounts": [
    "source=${localWorkspaceFolderBasename}-node_modules,target=${containerWorkspaceFolder}/node_modules,type=volume"
  ]
}
```

**2. Enable Virtio-fs in Docker Desktop**

Docker Desktop → Settings → General → Virtual File Sharing → **VirtioFS**

Requires Docker Desktop 4.6+ on macOS.

**3. Enable Synchronized File Shares**

Docker Desktop → Settings → Resources → File Sharing → enable **Synchronized file shares** for your project directory.

**4. Store the project inside WSL2 (Windows only)**

Do not clone the repository to `C:\Users\...`. Clone inside WSL2:

```bash
# Inside WSL2 terminal
git clone git@github.com:myorg/my-repo.git ~/projects/my-repo
# Then open VS Code from WSL2: code ~/projects/my-repo
```

---

## SSH Credentials Not Available Inside Container

### Symptom
`git clone git@github.com:...` or `git fetch` fails with `Permission denied (publickey)`.

### Fix

Ensure the SSH agent is running and your key is loaded **on the host**:

```bash
# macOS / Linux
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519    # or id_rsa

# Verify
ssh-add -l
```

The Dev Containers extension automatically forwards the SSH agent socket. If it still fails:

1. Check `SSH_AUTH_SOCK` is set on the host: `echo $SSH_AUTH_SOCK`
2. Rebuild the container (Command Palette → **Dev Containers: Rebuild Container**)
3. Inside container, verify: `ssh-add -l`

### macOS Keychain Integration

```bash
# ~/.ssh/config — persist keys across reboots on macOS
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
```

---

## GPG Signing Fails Inside Container

### Symptom
`git commit` fails with `error: gpg failed to sign the data`.

### Fix

```bash
# On the host
export GPG_TTY=$(tty)
gpgconf --launch gpg-agent
```

Mount the GPG socket into the container:

```jsonc
{
  "mounts": [
    "source=${localEnv:HOME}/.gnupg,target=/home/vscode/.gnupg,type=bind,consistency=cached"
  ],
  "postCreateCommand": "gpg --list-keys && git config --global gpg.program gpg2"
}
```

Ensure `gnupg2` is installed in the container:

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },
  "postCreateCommand": "sudo apt-get install -y gnupg2"
}
```

---

## Container Fails to Start / Builds Hang

### Symptom
The container never starts, or the build hangs indefinitely at a `RUN` command.

### Diagnosis

Open the **Dev Containers: Show Container Log** output (Command Palette) to see the full build output.

### Common Causes

| Cause | Fix |
|-------|-----|
| Network timeout pulling image | Check Docker network; try `docker pull <image>` manually |
| `postCreateCommand` hangs | Add a timeout or run interactively first |
| Feature install fails | Check the Feature's GitHub issues; pin to a different version |
| Dockerfile syntax error | Run `docker build .` manually from `.devcontainer/` |
| Out of disk space | Run `docker system prune` to free space |

### Force Rebuild

```
Command Palette → Dev Containers: Rebuild Container Without Cache
```

Or from the CLI:

```bash
devcontainer up --remove-existing-container --workspace-folder .
```

---

## `postCreateCommand` Fails or Runs Repeatedly

### Symptom
Dependency installation fails, or runs every time the container starts (instead of just once).

### Cause
`postCreateCommand` should run only once after container creation, but a container rebuild triggers it again. If the command is not idempotent, it may fail on re-run.

### Fix — Make Commands Idempotent

```bash
# ❌ Fails on re-run if .env already exists
cp .env.example .env

# ✅ Safe to run multiple times
[ -f .env ] || cp .env.example .env

# ✅ npm install is already idempotent
npm install

# ✅ Check before running migration
python manage.py migrate --check || python manage.py migrate
```

### Separate One-Time vs. Every-Start Commands

```jsonc
{
  "postCreateCommand": "npm install && cp -n .env.example .env",  // Once
  "postStartCommand": "npm run dev:services"                       // Every start
}
```

---

## Docker-in-Docker Issues

### Symptom: `Cannot connect to the Docker daemon`

```
Error: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Fix:** Ensure you have added the DinD/DooD Feature and the container is privileged (for DinD):

```jsonc
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "privileged": true
}
```

Rebuild the container after adding these settings.

### Symptom: `devcontainer with docker-in-docker doesn't start` (Known Issue)

This is a known issue (GitHub: `devcontainer/cli#831`). Workarounds:

1. Downgrade the `docker-in-docker` Feature to `:1` (older, stable version)
2. Switch to `docker-outside-of-docker` instead
3. Use `"overrideCommand": false` in `devcontainer.json`

---

## Extension Not Installed in Container

### Symptom
A VS Code extension works locally but is missing inside the container.

### Fix

Add it to `customizations.vscode.extensions` in `devcontainer.json`:

```jsonc
{
  "customizations": {
    "vscode": {
      "extensions": ["ms-python.python"]
    }
  }
}
```

Then rebuild: **Dev Containers: Rebuild Container**.

Note: Extensions installed manually in the container are not persisted across rebuilds. Always declare them in `devcontainer.json`.

---

## Port Not Accessible on Localhost

### Symptom
The app is running inside the container but `http://localhost:3000` is not reachable.

### Fix

```jsonc
{
  "forwardPorts": [3000]
}
```

If the port still does not appear forwarded, check the VS Code **Ports** panel (View → Open View → Ports) and forward it manually.

Ensure the app is listening on `0.0.0.0` (all interfaces), not just `127.0.0.1`:

```js
// ❌ Only accessible inside container
app.listen(3000, '127.0.0.1', ...)

// ✅ Accessible via port forwarding
app.listen(3000, '0.0.0.0', ...)
```

---

## Debugging Lifecycle Script Execution

Check which lifecycle scripts ran and their output:

```bash
# Inside the container — Dev Container CLI stores logs here
cat ~/.devcontainer-init.log 2>/dev/null || echo "No log found"

# Or check VS Code Dev Containers output panel:
# View → Output → Dev Containers
```

Execution order reference:

```
Host:         initializeCommand
Container:    onCreateCommand → updateContentCommand → postCreateCommand
Each start:   postStartCommand
Each attach:  postAttachCommand
```

---

## Cleaning Up Stale Resources

```bash
# Remove all stopped dev containers
docker container prune

# Remove unused named volumes (⚠️  removes persisted data)
docker volume prune

# Remove dangling images
docker image prune

# Full cleanup (⚠️  removes everything not currently in use)
docker system prune --volumes

# Remove a specific named volume
docker volume rm my-repo-node_modules
```
