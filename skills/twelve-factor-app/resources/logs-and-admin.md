# Logs and Admin Processes

Covers **Factor XI: Logs** and **Factor XII: Admin Processes** — how twelve-factor apps handle observability and one-off management tasks.

---

## Factor XI: Logs

### Principle

> Treat logs as event streams.

A twelve-factor app **never concerns itself with the routing or storage of its output stream**. It writes each event to `stdout`, unbuffered, as a stream. The execution environment is responsible for capturing, collating, routing, and archiving that stream.

### What Logs Are (and Are Not)

**Logs are:**
- A time-ordered stream of events from running processes
- Written line-by-line to `stdout` (one event per line)
- Each line has a timestamp, log level, and message
- Continuous as long as the app runs — no fixed beginning or end

**Logs are not:**
- Files managed by the application
- Rotated, archived, or moved by the application
- Written to a specific directory the app controls

### stdout vs. Log Files

| Approach | Twelve-Factor? | Reason |
|---|---|---|
| `print(message)` / `console.log(message)` to stdout | ✅ Correct | App writes; environment routes |
| `logging.basicConfig(filename="/var/log/app.log")` | ❌ Violation | App managing file routing |
| `winston.createWriteStream("app.log")` | ❌ Violation | App choosing storage |
| `syslog.info(message)` | ✅ Acceptable | Syslog on the host captures and routes |
| Writing to a named logfile and configuring logrotate | ❌ Violation | App is now responsible for log management |

### Correct Logging Setup

**Python**

```python
import logging
import sys

# Log to stdout, not to a file
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)

logger = logging.getLogger(__name__)
logger.info("Server started on port %s", port)
```

**Node.js**

```javascript
// console.log and console.error go to stdout/stderr by default
// Use a library that outputs to stdout:
const pino = require("pino");
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

logger.info({ userId: 123, action: "login" }, "User logged in");
```

**Go**

```go
import (
    "log"
    "os"
)

// Default log package writes to stderr; set to stdout
logger := log.New(os.Stdout, "", log.LstdFlags)
logger.Println("Server started")
```

**Java / Spring Boot**

```properties
# application.properties: console appender (stdout) is default
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} [%level] %logger{36} - %msg%n
# Do NOT configure a file appender here
```

### Structured Logging

Structured (JSON) logs improve machine-readability and enable powerful querying in log aggregation systems:

```json
{"timestamp": "2025-11-15T14:32:11Z", "level": "info", "service": "api", "request_id": "abc123", "method": "POST", "path": "/orders", "status": 201, "duration_ms": 45}
{"timestamp": "2025-11-15T14:32:12Z", "level": "error", "service": "api", "request_id": "xyz789", "error": "connection timeout", "database": "postgres"}
```

```python
# Python: structlog
import structlog
logger = structlog.get_logger()
logger.info("order_created", order_id=42, user_id=7, amount=99.99)
```

```javascript
// Node.js: pino (outputs JSON by default)
const logger = require("pino")();
logger.info({ orderId: 42, userId: 7, amount: 99.99 }, "order_created");
```

### Execution Environment Log Routing

The environment (not the app) decides what to do with the stream:

| Environment | Log Routing Mechanism |
|---|---|
| Local development | Stream visible in terminal foreground |
| Heroku | `logplex` — captured and forwarded to log drains |
| Kubernetes | `kubelet` captures stdout; `fluentd`/`fluentbit` forwards |
| Docker | `docker logs` + configured log driver |
| AWS ECS | CloudWatch Logs agent captures stdout |
| systemd | `journald` captures stdout automatically |

**Log drains / aggregation destinations:**
- Elastic Stack (ELK) / OpenSearch
- Datadog Logs
- Splunk
- Loggly
- AWS CloudWatch
- Google Cloud Logging
- Grafana Loki

### Log Levels

Use consistent log levels that map to actionable severity:

| Level | Use for | Example |
|---|---|---|
| `DEBUG` | Detailed diagnostics (dev/staging only) | SQL query text, full request headers |
| `INFO` | Normal operational events | Request handled, user logged in, job completed |
| `WARN` | Degraded but recoverable state | Retrying failed request, deprecation usage |
| `ERROR` | Failure requiring investigation | Unhandled exception, database connection failed |
| `FATAL`/`CRITICAL` | App cannot continue | Cannot connect to required backing service |

Control the active level via an environment variable:

```bash
LOG_LEVEL=debug   # development
LOG_LEVEL=info    # production default
LOG_LEVEL=warn    # high-traffic production (reduce noise)
```

---

## Factor XII: Admin Processes

### Principle

> Run admin/management tasks as one-off processes.

Database migrations, data import/export scripts, REPL sessions, and one-time fix scripts are **not part of the regular process formation** (web, worker). They run as one-off processes in an identical environment to the app's regular processes.

### What Counts as an Admin Process

| Task Type | Examples |
|---|---|
| Database migrations | `manage.py migrate`, `rake db:migrate`, `flyway migrate` |
| Interactive console / REPL | `rails console`, `python manage.py shell`, `flask shell` |
| One-time data scripts | `python scripts/backfill_timestamps.py` |
| Report generation | `rake report:monthly` |
| Cache warming | `python scripts/warm_cache.py` |
| Seed data | `rails db:seed` |
| Manual fixes | `python scripts/fix_bad_records.py` |

### Key Rules for Admin Processes

**1. Run against the same release**
Admin processes run against the same codebase and config as the regular long-running processes — not a different version.

```bash
# Wrong: running a migration against a different version
git checkout v1.3 && python manage.py migrate   # mismatch with running app

# Right: run the migration as part of the deploy, before restarting the app
# Using the same release artifact
```

**2. Use the same dependency isolation**

```bash
# Ruby: use bundle exec to ensure the correct dependencies
bundle exec rake db:migrate   # not: rake db:migrate

# Python: activate the same virtualenv used by the app
source .venv/bin/activate && python manage.py migrate

# Docker: run inside the same container image as the app
docker run --rm myapp:v1.2.3 python manage.py migrate
```

**3. Admin code ships with application code**

Admin scripts must live in the application repository to avoid synchronisation issues. A script that assumes schema version N must deploy alongside the code that requires schema version N.

### Running Admin Processes

**Local development:**

```bash
# Direct shell command inside the app's checkout directory
python manage.py migrate
rails console
flask db upgrade
node scripts/import_data.js
```

**Remote production (Heroku-style):**

```bash
# SSH-equivalent: run inside the execution environment
heroku run python manage.py migrate
heroku run rails console
heroku run bash   # interactive shell inside a dyno
```

**Kubernetes:**

```bash
# One-off pod with the same image and config as the running app
kubectl run migrate --image=myapp:v1.2.3 --rm -it \
  --env="DATABASE_URL=$DATABASE_URL" \
  -- python manage.py migrate
```

### Migration Strategy in CI/CD

A common pattern is to run migrations as part of the deploy pipeline, after the new build is deployed but before traffic is switched to the new app version:

```yaml
# GitHub Actions deploy job
- name: Run database migrations
  run: |
    docker run --rm \
      -e DATABASE_URL=${{ secrets.DATABASE_URL }} \
      myapp:${{ github.sha }} \
      python manage.py migrate --no-input

- name: Deploy new version
  run: kubectl set image deployment/web app=myapp:${{ github.sha }}
```

**Migration safety in rolling deployments:**

When running multiple app versions simultaneously (during a rolling deploy), migrations must be backward-compatible with the previous version. Follow the expand-contract pattern:

1. **Expand**: Add new columns/tables as optional (backward-compatible)
2. **Deploy** new code that uses new columns
3. **Contract**: Remove old columns in a subsequent migration (after old code is gone)

### Twelve-Factor Strongly Favours REPL Languages

Languages with first-class REPL support make twelve-factor admin processes easier:

| Language | REPL | Framework Console |
|---|---|---|
| Python | `python` | `flask shell`, `django shell_plus` |
| Ruby | `irb` | `rails console` |
| Node.js | `node` | custom `repl.js` scripts |
| Elixir | `iex` | `iex -S mix` |
| Clojure | `clj` | nREPL / lein repl |
| Scala | `scala` | `sbt console` |

### Common Violations

| Violation | Risk | Fix |
|---|---|---|
| Running migrations at app startup | Race condition on multi-instance deploy; slow startup (Factor IX) | Run as pre-deploy one-off process |
| Admin script with hardcoded database URL | Credentials in source code (Factor III) | Read from env var |
| Admin code in a separate repo | Version mismatch between app and migrations | Co-locate in same repo |
| Using a different Python/Ruby version for admin tasks | Dependency discrepancies | Use the same container image |
| Interactive REPL in production connected to live DB (without care) | Accidental data mutation | Use read replicas where possible; always test destructive queries first |
