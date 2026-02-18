# Disposability and Dev/Prod Parity

Covers **Factor IX: Disposability** and **Factor X: Dev/Prod Parity** — maximising robustness through fast-starting, cleanly-shutting processes, and eliminating the gaps between environments.

---

## Factor IX: Disposability

### Principle

> Maximize robustness with fast startup and graceful shutdown.

Twelve-factor processes are **disposable** — they can be started or stopped at any moment. This enables elastic scaling, rapid config changes, and resilient production deploys.

### Fast Startup

**Target: a few seconds from launch command to accepting requests.**

Fast startup enables:
- Faster scaling (new processes are available quickly)
- Faster deploys (rolling updates cycle through processes quickly)
- Faster recovery from crashes

```bash
# Measure your startup time
time docker run --rm myapp:latest   # or measure the time to first HTTP 200
```

**Slow startup causes:**

| Cause | Fix |
|---|---|
| Eager loading all data at boot | Use lazy loading; load data on first use |
| Compiling assets at startup | Move to build stage (Factor V) |
| Running migrations at startup | Run as a one-off process (Factor XII) |
| Connecting to every backing service at startup | Use connection pools with lazy init |
| Loading a large ML model synchronously | Background-load or use a model server sidecar |

### Graceful Shutdown on SIGTERM

When the process manager wants to stop a process, it sends `SIGTERM`. The process must shut down gracefully:

**Web processes:**
1. Stop accepting new requests (close the listening socket)
2. Finish any in-flight requests (with a reasonable timeout, e.g., 30 seconds)
3. Exit cleanly

**Worker processes:**
1. Finish the current job (if short enough) OR return it to the queue
2. Release any locks held
3. Exit cleanly

```python
# Python: handling SIGTERM in a web process
# Most WSGI servers (gunicorn, uvicorn) handle this automatically
# gunicorn graceful timeout:
# gunicorn --graceful-timeout 30 myapp:app

# Python: handling SIGTERM in a worker
import signal
import sys

def signal_handler(sig, frame):
    # Return current job to queue before exiting
    current_job.nack()  # RabbitMQ: negative acknowledge
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
```

```javascript
// Node.js: graceful shutdown
const server = app.listen(PORT);

process.on('SIGTERM', () => {
  server.close(() => {
    // Finish in-flight requests, then exit
    process.exit(0);
  });
});
```

```go
// Go: graceful shutdown
srv := &http.Server{Addr: ":" + port}

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGTERM)
go func() {
    <-quit
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
}()
srv.ListenAndServe()
```

### Idempotent Jobs

Worker processes must handle **sudden death** robustly — the underlying hardware may fail without warning, bypassing the SIGTERM graceful shutdown path.

**Jobs must be idempotent** or use a transactional queue that returns failed jobs:

```python
# Idempotent job: safe to process twice
def process_payment(payment_id):
    payment = Payment.get(payment_id)
    if payment.status == "completed":
        return   # already done, skip gracefully
    charge = stripe.Charge.create(...)
    payment.update(status="completed", charge_id=charge.id)
```

**Transactional queue pattern:**

```python
# RabbitMQ: only acknowledge after successful processing
# If the process dies, the message is returned to the queue
def consume(ch, method, properties, body):
    try:
        process(body)
        ch.basic_ack(delivery_tag=method.delivery_tag)   # success: remove from queue
    except Exception:
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)  # failure: re-queue
```

### Crash-Only Design

Take disposability to its logical conclusion: design processes so that **crashing and restarting is a valid recovery path**. This removes the need for complex in-process error recovery:

- Do not use cleanup-on-exit paths that are fragile
- Use a transactional queue so in-flight work returns to the queue on crash
- Store state externally (Factor VI) so no state is lost on crash
- Let the process manager restart crashed processes automatically

---

## Factor X: Dev/Prod Parity

### Principle

> Keep development, staging, and production as similar as possible.

Historically, gaps between environments created "works on my machine" problems and made continuous deployment risky. The three gap types:

| Gap Type | Traditional | Twelve-Factor |
|---|---|---|
| **Time gap** | Code takes weeks or months to reach production | Code deployed hours or minutes after writing |
| **Personnel gap** | Developers write code; ops deploys it | Same developers responsible for deploying and monitoring |
| **Tools gap** | Dev uses SQLite + SQLite; prod uses PostgreSQL + Linux | Same services, same OS, same versions everywhere |

### The Tools Gap in Detail

The most common form of dev/prod divergence is **using different backing services** per environment:

| Dev (common but wrong) | Production | Risk |
|---|---|---|
| SQLite | PostgreSQL | SQL dialect differences, NULL handling, indexing behaviour |
| `process.memory` cache | Memcached | In-process cache is not shared across processes |
| `console.log` as queue | Amazon SQS | No retry, ordering, or persistence semantics |
| Mailhog (catch-all) | SendGrid | OK for email capture, but API contract differences |
| Built-in Django dev server | Gunicorn + nginx | Different header handling, timeout behaviour |

### Using the Same Backing Services Everywhere

```yaml
# docker-compose.yml: production-equivalent services for local development
services:
  app:
    build: .
    environment:
      - DATABASE_URL=postgres://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16           # same version as production
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp

  redis:
    image: redis:7-alpine        # same version as production
```

```bash
# Start production-equivalent local environment
docker compose up
```

### Version Parity

Run the **same version** of every backing service in all environments:

```bash
# Check production PostgreSQL version
heroku pg:info | grep "PG Version"
# → PostgreSQL 16.1

# Match in docker-compose.yml
image: postgres:16.1   # pin to the same version
```

### Configuration Parity

While config values differ between environments (Factor III), the **structure** and **type** of configuration should be the same. Avoid environment-specific code paths:

```python
# Wrong: different behaviour per environment
if os.environ.get("ENV") == "production":
    use_real_payment_processor()
else:
    use_mock()

# Right: payment processor is always the same code path;
# use a Stripe test key in non-production environments
stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
# STRIPE_SECRET_KEY=sk_test_... in dev/staging
# STRIPE_SECRET_KEY=sk_live_... in production
```

### Adapter Libraries Are Acceptable, But Use Them Consistently

Adapter libraries (e.g., ActiveRecord, SQLAlchemy, ActiveSupport::Cache) are fine — they handle portability. The twelve-factor rule is that **all environments use the same adapter pointed at the same type of backing service**:

```python
# Fine: SQLAlchemy abstracts the database
engine = create_engine(os.environ["DATABASE_URL"])
# As long as DATABASE_URL always points to PostgreSQL in all environments
```

### Continuous Deployment Mindset

Dev/prod parity enables continuous deployment. When gaps are small:

- Developers catch production-like bugs locally before deployment
- Staging faithfully represents production behaviour
- Deploys are safe and frequent because surprises are rare

A team maintaining dev/prod parity can deploy multiple times per day with confidence. A team with large parity gaps must deploy infrequently and batch changes to reduce risk — increasing the very risk they fear.

### Common Violations and Fixes

| Violation | Impact | Fix |
|---|---|---|
| SQLite in dev, PostgreSQL in prod | Subtle SQL bugs only visible in production | Use PostgreSQL with Docker Compose locally |
| Different OS (macOS vs. Linux) | File path case sensitivity, syscall differences | Use Docker for development |
| Different library versions | Behaviour differences | Pin versions in lockfile; CI uses same version |
| Mock services in dev | Code paths never tested against real service | Use real service (test mode/sandbox) |
| Local-only feature flags | Features tested in isolation never integrated | Use same feature flag system everywhere |
| `DEBUG=True` in production | Exposed stack traces, disabled security features | Never use `DEBUG=True` in production |
