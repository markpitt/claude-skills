# Build, Release, Run

Covers **Factor V: Build, Release, Run** — strict separation of the three deployment stages to ensure reproducible, auditable, and rollback-capable deployments.

---

## Factor V: Build, Release, Run

### Principle

> Strictly separate build and run stages.

A codebase is transformed into a deploy through exactly three stages, and they must never be mixed.

### The Three Stages

```
Codebase (Git repo)
   │
   ▼ BUILD STAGE
Build Artifact (compiled binaries, assets, vendored dependencies)
   │
   ▼ RELEASE STAGE (Build + Config)
Release (unique, immutable, timestamped)
   │
   ▼ RUN STAGE
Running Process(es) in execution environment
```

| Stage | Input | Output | Who Triggers |
|---|---|---|---|
| **Build** | Specific commit + dependencies | Executable bundle / artifact | Developer (on deploy) |
| **Release** | Build artifact + environment config | Immutable, timestamped release | Automated pipeline |
| **Run** | A specific release | Running processes | Process manager / platform |

### Build Stage

The build stage converts a code repository into an **executable bundle** (the "build"):

- Fetches every dependency declared in the manifest (Factor II)
- Compiles binaries, transpiles code (TypeScript → JavaScript, SCSS → CSS)
- Packages assets (bundling, minification)
- Runs code generation (protobuf, OpenAPI, etc.)

The build is tied to a specific commit. It should be deterministic: the same commit always produces the same build.

**Build artifacts by platform:**

| Platform | Build Artifact |
|---|---|
| Docker | Container image |
| Heroku / Buildpacks | Slug |
| AWS Lambda | ZIP or container image |
| Node.js | Bundled `dist/` directory |
| Java | `*.jar` / `*.war` file |
| .NET | `publish/` output directory |
| Go | Compiled binary |

### Release Stage

The release stage combines the build artifact with the deploy's config (Factor III):

```
Build v42 + Production config → Release v42-prod
Build v42 + Staging config   → Release v42-staging
```

**Release immutability rules:**
- Every release has a unique release ID (timestamp or incrementing number)
- Releases are an append-only ledger — a release is never mutated
- Any change (code or config) requires creating a new release
- Releases can be rolled back by re-activating a previous release ID

```bash
# Example: Heroku-style release tracking
heroku releases
# v47   Deploy a3f1c4b  2025-11-15 14:32:11
# v46   Deploy 9c2b8e1  2025-11-14 09:15:42
# v45   Set FEATURE_FLAG_X=true  2025-11-13 16:40:10

heroku rollback v46   # re-activate a previous release
```

### Run Stage

The run stage executes one or more of the app's **processes** against a selected release. It should be as simple as possible because:

- It can be triggered automatically (server reboot, crash restart)
- There may be no developer available when a failure occurs
- Complexity here increases mean time to recovery

**Run stage characteristics:**
- Reads config from the environment (Factor III)
- Starts processes as declared in the Procfile or equivalent
- No compilation, asset pipelining, or dependency fetching happens here
- Manages process lifecycle via the host OS process manager

### Why Strict Separation Matters

| Without Separation | With Separation |
|---|---|
| Runtime code changes are possible | Runtime code changes are impossible |
| No rollback capability | Easy rollback to previous release |
| Build failures surface at runtime | Build failures surface at build time |
| Non-deterministic deployments | Reproducible, auditable deployments |
| Mixing config and code | Config is cleanly injected at release time |

### Critical Rule: No Runtime Code Changes

> It is impossible to make changes to the code at runtime, since there is no way to propagate those changes back to the build stage.

```bash
# Wrong: editing code on a running server
ssh prod-server
vim /app/handlers/payment.py   # direct edit in production
# This bypasses build stage entirely, is not tracked, not reproducible
```

All code changes must go through the build pipeline.

### CI/CD Pipeline Implementation

A twelve-factor compliant pipeline looks like:

```yaml
# GitHub Actions example
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci           # reproducible install from lockfile
      - name: Build
        run: npm run build    # compile, bundle, generate assets
      - name: Push image
        run: docker push myapp:${{ github.sha }}

  release:
    needs: build
    steps:
      - name: Create release
        run: |
          # Combine build artifact with environment config
          # Tag the release with unique ID
          kubectl set image deployment/myapp app=myapp:${{ github.sha }}
          # Release ID = github.sha or a derived version

  # "run" stage is managed by Kubernetes, systemd, or the platform
```

### Procfile Pattern

Many platforms (Heroku, Railway, Render, Dokku) use a `Procfile` to declare process types at run time:

```
# Procfile
web: gunicorn myapp.wsgi:application --bind 0.0.0.0:$PORT
worker: celery -A myapp worker --loglevel=info
beat: celery -A myapp beat --loglevel=info
```

The Procfile lives in the codebase (built into the artifact), and the platform decides which process types to run and how many of each (see Factor VIII: Concurrency).

### Rollback Strategy

Because releases are immutable and identified by unique IDs, rollback is simple:

```bash
# Heroku
heroku rollback v45

# Kubernetes (image tag = commit SHA)
kubectl set image deployment/myapp app=myapp:9c2b8e1

# AWS ECS (task definition revision)
aws ecs update-service --service myapp --task-definition myapp:41
```

Rollback is a config change (pointing to an existing earlier build), not a new build.

### Common Violations

| Violation | Description | Fix |
|---|---|---|
| **SSH to prod and run git pull** | Bypasses build and release stages entirely | Use a CI/CD pipeline |
| **Compile assets at startup** | Build work happening in the run stage | Move to build stage |
| **`pip install` at container start** | Installing dependencies at runtime | Install in Dockerfile/build |
| **Config baked into build** | Environment-specific values in the artifact | Inject at release stage via env vars |
| **No release IDs** | Cannot identify which version is running | Tag every artifact with commit SHA or version |
| **Mutable releases** | Patching running code in place | Build a new release for every change |

### Containerised Build/Release/Run

Docker naturally maps to this model:

```dockerfile
# BUILD stage: compile the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production   # dependency install = part of build
COPY . .
RUN npm run build              # compile TypeScript, bundle assets

# RUN stage: minimal production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

The **release** is the container image tagged with a specific version. Config (Factor III) is injected at container startup via environment variables — never baked into the image.

```bash
# Release: image + config = running container
docker run \
  -e DATABASE_URL=$DATABASE_URL \
  -e SECRET_KEY=$SECRET_KEY \
  myapp:v1.2.3       # ← specific, immutable build artifact
```
