# Implementation Guide: Twelve-Factor Compliance Checklist

A practical reference for auditing existing apps or setting up new ones against all 12 factors. Use this as the starting point for full compliance reviews or new service design.

---

## Compliance Audit Checklist

Work through each factor systematically. For each: assess the current state, note violations, and plan remediation.

### Factor I: Codebase

- [ ] The app has exactly one codebase in version control
- [ ] All deploys (prod, staging, dev) come from the same repo
- [ ] Shared code between multiple apps is in a versioned library (npm package, PyPI package, etc.), not copied
- [ ] No single repo contains multiple distinct apps without proper library extraction

### Factor II: Dependencies

- [ ] All dependencies are declared in a manifest (`package.json`, `requirements.txt`, `Gemfile`, `go.mod`, etc.)
- [ ] A dependency isolation tool is used (`venv`, `bundler`, `node_modules`, `vendor/`, etc.)
- [ ] A lockfile is committed to version control (`package-lock.json`, `Gemfile.lock`, `poetry.lock`, `go.sum`)
- [ ] No implicit reliance on system-wide packages
- [ ] No reliance on system tools (`curl`, `ImageMagick`, etc.) without bundling or explicit Docker layer

### Factor III: Config

- [ ] All environment-specific values are in environment variables, not in code
- [ ] No credentials, API keys, or secrets are in source code or committed config files
- [ ] `.env` files (if used) are in `.gitignore`
- [ ] A `.env.example` file with dummy values documents required variables
- [ ] The codebase could be open-sourced without exposing credentials
- [ ] Config is not grouped into named environments in the code (no `if ENV == "production"` for config values)

### Factor IV: Backing Services

- [ ] Databases, queues, caches, and external APIs are treated as attached resources
- [ ] All service connections use URLs/credentials from environment variables
- [ ] Swapping a local service for a cloud equivalent requires only a config change
- [ ] The app makes no distinction between local-managed and third-party services in code

### Factor V: Build, Release, Run

- [ ] Build, release, and run stages are strictly separated
- [ ] No code compilation, asset building, or dependency installation happens at runtime startup
- [ ] Every release has a unique ID (commit SHA, timestamp, or version number)
- [ ] Releases are immutable — once created, a release is not modified
- [ ] Previous releases can be rolled back without a new build
- [ ] No direct SSH-and-edit workflow on running production servers

### Factor VI: Processes

- [ ] Processes are stateless and share-nothing
- [ ] No data is stored in process memory between requests (no sticky sessions)
- [ ] No data is written to the local filesystem and expected to persist across restarts
- [ ] Session state is stored in a backing service (Redis, database) not in process memory
- [ ] Assets are compiled at build time, not lazily on first request

### Factor VII: Port Binding

- [ ] The app embeds its own web server (Gunicorn, Express, Netty, etc.)
- [ ] The app does not rely on Apache/Tomcat/IIS being injected into the environment
- [ ] The app binds to a port specified by `PORT` environment variable
- [ ] HTTP and any other protocols are served directly by the app process

### Factor VIII: Concurrency

- [ ] The app is decomposed into process types (web, worker, beat, etc.) via a Procfile or equivalent
- [ ] Scaling is achieved by running more process instances, not by making processes heavier
- [ ] Processes do not daemonize themselves or write PID files
- [ ] The platform/OS process manager handles process lifecycle (start, stop, restart)

### Factor IX: Disposability

- [ ] Processes start within a few seconds of launch
- [ ] Processes handle `SIGTERM` and shut down gracefully (finish in-flight work, then exit)
- [ ] Worker processes return jobs to the queue on shutdown (NACK or equivalent)
- [ ] Jobs and operations are idempotent (safe to execute twice)
- [ ] The app is robust against sudden death (crash-only design)

### Factor X: Dev/Prod Parity

- [ ] The same type of backing service is used in all environments (no SQLite in dev, PostgreSQL in prod)
- [ ] The same version of backing services is used across environments
- [ ] Developers deploy their own code and are responsible for monitoring it
- [ ] The time between writing code and deploying it is hours, not weeks
- [ ] No environment-specific code paths for service adapters

### Factor XI: Logs

- [ ] The app writes all log output to `stdout` (and `stderr` for errors)
- [ ] The app does not manage log files, rotation, or archival
- [ ] Log output is captured and routed by the execution environment
- [ ] Log format is consistent (ideally structured JSON)
- [ ] Log level is configurable via an environment variable

### Factor XII: Admin Processes

- [ ] Database migrations run as one-off processes, not at app startup
- [ ] Admin scripts use the same codebase, release, and config as the regular app
- [ ] Admin scripts use the same dependency isolation tools (bundle exec, venv, etc.)
- [ ] Admin code lives in the same repo as the application code
- [ ] One-off administrative tasks are run via the platform CLI or container exec, not custom tooling

---

## Quick Setup Templates

### Minimal `.env.example`

```bash
# Database
DATABASE_URL=postgres://postgres:password@localhost:5432/myapp

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=change-me-to-a-long-random-string

# External Services
STRIPE_SECRET_KEY=sk_test_your_key_here
SENDGRID_API_KEY=SG.your_key_here

# App Config
LOG_LEVEL=debug
PORT=3000
WORKERS=2
```

### Minimal `Procfile`

```
web:    gunicorn myapp.wsgi:application --bind 0.0.0.0:$PORT --workers $WORKERS
worker: celery -A myapp worker --loglevel=info
beat:   celery -A myapp beat --loglevel=info
```

### Minimal `docker-compose.yml` for Local Dev

```yaml
version: "3.9"
services:
  app:
    build: .
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: celery -A myapp worker
    env_file: .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

---

## Common Violation Patterns by Language

### Python / Django / Flask

| Violation | Code Pattern | Fix |
|---|---|---|
| Config in code | `DATABASES = {'default': {'NAME': 'prod_db'}}` | `'NAME': os.environ['DATABASE_URL']` |
| Run migrations on startup | `management.call_command('migrate')` in `wsgi.py` | Run as pre-deploy step |
| Write to local disk | `with open('/tmp/data.json', 'w')` for persistent data | Use S3/GCS/Azure Blob |
| Compile assets at runtime | Django `DEBUG=True` whitenoises static lazily | Run `collectstatic` at build time |
| Global mutable state | Module-level singletons modified at runtime | Use request-scoped state or services |

### Node.js / Express

| Violation | Code Pattern | Fix |
|---|---|---|
| Hardcoded config | `const DB = "mongodb://localhost/prod"` | `process.env.DATABASE_URL` |
| File-based sessions | `express-session({ store: new FileStore() })` | `connect-redis` or `express-session` + Redis |
| Log to file | `winston.createWriteStream('app.log')` | `winston` with `Console` transport |
| No graceful shutdown | No `SIGTERM` handler | `process.on('SIGTERM', ...)` + server close |
| npm global in Dockerfile | `RUN npm install -g nodemon` in production image | Only dev dependencies for dev; use `CMD` in Dockerfile |

### Ruby / Rails

| Violation | Code Pattern | Fix |
|---|---|---|
| Credentials in `database.yml` | `password: mysecretpassword` | `password: <%= ENV['DB_PASSWORD'] %>` |
| `rails db:migrate` at startup | In `Procfile web:` command | Separate `release: bundle exec rails db:migrate` |
| `secrets.yml` committed | API keys in file tracked by git | Use Rails credentials with encrypted file, or env vars |
| Logfile configured in code | `config.logger = Logger.new("log/production.log")` | `config.logger = Logger.new(STDOUT)` |

### Java / Spring Boot

| Violation | Code Pattern | Fix |
|---|---|---|
| DB config in `application.properties` | `spring.datasource.password=secret` | `${DB_PASSWORD}` referencing env var |
| Log to file | `<appender name="FILE">` in `logback.xml` | Use `<appender name="STDOUT">` only |
| Fat initialisation | Loading all caches on context startup | Use lazy init: `spring.main.lazy-initialization=true` |
| Static file serving via app | Serving `/static/` directly from Spring | Serve from CDN or separate nginx; app focuses on API |

---

## Prioritising Remediation

Not all violations have equal urgency. Prioritise in this order:

### High Priority (Security and Reliability Risks)

1. **Credentials in source code** (Factor III) — immediate security risk
2. **No graceful shutdown** (Factor IX) — dropped requests on every deploy
3. **Stateful processes** (Factor VI) — prevents scaling and causes data loss

### Medium Priority (Scalability and Maintainability)

4. **No lockfile committed** (Factor II) — non-reproducible builds
5. **Migrations at startup** (Factor XII) — causes downtime on scale-out
6. **Log files managed by app** (Factor XI) — lost logs, disk fill-up risk
7. **Different services in dev vs. prod** (Factor X) — "works on my machine" bugs

### Lower Priority (Operational Improvements)

8. **No Procfile / process formation** (Factor VIII) — limits platform portability
9. **Build/release not separated** (Factor V) — slower deploys, no rollback
10. **Hardcoded hostnames** (Factor IV) — fragile but usually working

---

## Tool Recommendations by Factor

| Factor | Tools |
|---|---|
| I. Codebase | Git, GitHub/GitLab/Bitbucket |
| II. Dependencies | pip + venv, npm + lockfile, bundler, go mod, cargo |
| III. Config | dotenv, direnv, AWS Secrets Manager, Vault, Doppler |
| IV. Backing Services | Docker Compose, DevContainers |
| V. Build/Release/Run | Docker, GitHub Actions, GitLab CI, Buildkite |
| VI. Processes | Redis (sessions), S3 (file storage), Postgres (state) |
| VII. Port Binding | Gunicorn, uvicorn, Express, Jetty, Kestrel |
| VIII. Concurrency | Kubernetes HPA, Heroku ps:scale, ECS Service Auto Scaling |
| IX. Disposability | SIGTERM handlers, Celery ACKS_LATE, RabbitMQ NACK |
| X. Dev/Prod Parity | Docker Compose, DevContainers, TestContainers |
| XI. Logs | structlog, pino, logrus, Loki, Datadog Logs, ELK |
| XII. Admin Processes | `manage.py`, `rake`, `kubectl run --rm`, Heroku run |
