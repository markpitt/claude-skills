# Config and Backing Services

Covers **Factor III: Config** and **Factor IV: Backing Services** — how twelve-factor apps manage environment-specific values and treat external services as interchangeable resources.

---

## Factor III: Config

### Principle

> Store config in the environment.

Config is **everything that varies between deploys** (staging, production, developer environments). Code does not vary between deploys; config does.

### What Counts as Config

| Is Config | Is NOT Config |
|---|---|
| Database connection strings | `config/routes.rb` (framework routing) |
| API keys and credentials | How code modules are wired together (e.g., Spring beans) |
| Third-party service URLs | Feature flags tied to code logic |
| Per-deploy hostnames | Internal constants that don't change per deploy |
| Port numbers | Algorithm choices |

### The Litmus Test

> Could you open-source the codebase right now without exposing any credentials?

If no, config has leaked into code. Fix it before anything else.

### Environment Variables

Twelve-factor apps store config exclusively in **environment variables** (env vars):

```bash
# These live in the environment, not in the codebase
DATABASE_URL=postgres://user:pass@host/dbname
SECRET_KEY=s3cr3t-k3y-here
SMTP_HOST=smtp.sendgrid.net
ALLOWED_HOSTS=myapp.com,staging.myapp.com
```

#### Why Environment Variables

| Property | Config Files | Env Vars |
|---|---|---|
| Can be accidentally committed | Yes | No |
| Language-agnostic | No (format varies) | Yes |
| OS-agnostic | No | Yes |
| Easy to change between deploys | No | Yes |
| Supports audit trails (secrets managers) | Varies | Yes |

### Anti-Patterns to Avoid

**Hardcoded credentials**
```python
# Wrong
DB_URL = "postgres://admin:password@prod-db.example.com/myapp"
```

**Config files checked into version control**
```
# Wrong: these are in the repo
config/database.yml     ← has production credentials
config/secrets.yml      ← has API keys
.env                    ← has everything
```

**Named environment groups**
```python
# Wrong: fragile, doesn't scale
if ENVIRONMENT == "production":
    DB_URL = PROD_DB
elif ENVIRONMENT == "staging":
    DB_URL = STAGING_DB
```
This pattern becomes unmanageable as deploys multiply. Each env var should be independently controllable.

### Correct Patterns

**Reading from environment**

```python
# Python
import os
db_url = os.environ["DATABASE_URL"]   # raises if missing
db_url = os.getenv("DATABASE_URL", "postgres://localhost/dev")  # with default
```

```javascript
// Node.js
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is required");
```

```ruby
# Ruby
db_url = ENV.fetch("DATABASE_URL")
db_url = ENV.fetch("DATABASE_URL", "postgres://localhost/dev")
```

```java
// Java
String dbUrl = System.getenv("DATABASE_URL");
```

**`.env` files for local development only**

A `.env` file is acceptable for local development convenience, but must:
- Be in `.gitignore` (never committed)
- Have a `.env.example` (committed, with dummy values) for documentation

```bash
# .gitignore
.env

# .env.example (committed to version control)
DATABASE_URL=postgres://localhost/myapp_dev
SECRET_KEY=change-me
REDIS_URL=redis://localhost:6379
```

**Secrets managers for production**

For production, prefer secrets managers over flat env vars:
- AWS Secrets Manager / Parameter Store
- HashiCorp Vault
- Azure Key Vault
- GCP Secret Manager
- Kubernetes Secrets (with appropriate encryption at rest)

These inject secrets as env vars at runtime, satisfying Factor III without storing secrets in code or config files.

### Granularity

Each config value should be independently controllable. Avoid grouping variables into named environment sets:

```bash
# Wrong: grouping defeats the purpose
APP_ENV=production   # single variable implies a bundle of settings

# Right: each variable is independent
DATABASE_URL=postgres://prod-db/app
REDIS_URL=redis://prod-cache:6379
LOG_LEVEL=warn
WORKERS=4
```

---

## Factor IV: Backing Services

### Principle

> Treat backing services as attached resources.

A **backing service** is any service the app consumes over the network. The app makes no distinction between a locally-managed service and a third-party service — both are attached resources, accessed via a URL or credentials stored in config (Factor III).

### Categories of Backing Services

| Category | Local Examples | Third-Party Examples |
|---|---|---|
| Datastores | PostgreSQL, MySQL, SQLite | Amazon RDS, CockroachDB Cloud |
| Message queues | RabbitMQ, Redis (as queue) | Amazon SQS, Google Pub/Sub |
| Caches | Redis, Memcached (local) | Elasticache, Upstash |
| SMTP / Email | Postfix, Mailhog (dev) | SendGrid, Postmark, SES |
| Object storage | MinIO (local) | Amazon S3, GCS, Azure Blob |
| Monitoring / APM | Local Prometheus | New Relic, Datadog |
| External APIs | Mock servers | Stripe, Twilio, Google Maps |

### The Attached Resource Model

A backing service is **attached** to a deploy via its resource handle (URL + credentials) in config. This means:

1. The app code does not change when swapping one service for another of the same type
2. A local MySQL and Amazon RDS are interchangeable from the app's perspective
3. Swapping requires only a config change (updating `DATABASE_URL`), not a code change

```
Deploy Config:
  DATABASE_URL=postgres://user:pass@localhost:5432/dev    ← local dev
  
↓ config change only, no code change ↓

  DATABASE_URL=postgres://user:pass@rds.amazonaws.com/prod  ← production
```

### Implementation Pattern

**Correct: service abstracted behind environment variable**

```python
# Python (SQLAlchemy)
import os
from sqlalchemy import create_engine

engine = create_engine(os.environ["DATABASE_URL"])
```

```javascript
// Node.js (pg)
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**Correct: third-party service treated identically to local service**

```python
# Local dev: REDIS_URL=redis://localhost:6379
# Production: REDIS_URL=rediss://user:token@my-cache.upstash.io:6380
import redis
import os

client = redis.from_url(os.environ["REDIS_URL"])
```

The code is identical for both environments. Only the URL changes.

### Resource Handles vs. Hardcoded References

| Approach | Example | Problem |
|---|---|---|
| ❌ Hardcoded hostname | `db.connect("prod-db.internal", 5432)` | Couples code to a specific deploy |
| ❌ Environment-named config | `DB_HOST_PROD = "prod-db.internal"` | Doesn't scale, violates Factor III |
| ✅ Resource handle via env var | `os.environ["DATABASE_URL"]` | Portable, swappable, no code changes needed |

### Attach and Detach

Backing services can be attached and detached at will. If a production database needs emergency replacement:

1. Spin up a new database, restore from backup
2. Update `DATABASE_URL` in the deployment config
3. Restart the app processes
4. Old database is detached — no code changes required

This model also applies to degraded service handling: replacing a misbehaving Memcached instance is a config update, not a deployment.

### Common Violations

| Violation | Example | Fix |
|---|---|---|
| Different code paths for local vs. remote services | `if IS_LOCAL: use_sqlite() else: use_postgres()` | Use the same service type in all environments (Factor X) |
| Service URL hardcoded in source | `REDIS_HOST = "redis.prod.internal"` | Move to environment variable |
| Third-party key in config file | `stripe_key = "sk_live_abc123"` in `settings.py` | Move to environment variable |
| Assuming service is always on `localhost` | `DB_HOST = "localhost"` | Parameterise via env var |

### Dev/Prod Parity for Backing Services

Factor IV works with Factor X (Dev/Prod Parity). Use the **same type** of backing service in all environments:

```bash
# Wrong: SQLite in dev, PostgreSQL in production
DEV_DB=sqlite:///dev.db
PROD_DB=postgres://...

# Right: PostgreSQL in all environments (Docker Compose for local)
DATABASE_URL=postgres://postgres:password@localhost:5432/myapp
```

Modern tooling (Docker Compose, DevContainers, Homebrew + apt-get) makes running production-equivalent backing services locally easy and inexpensive.
