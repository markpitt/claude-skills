# Processes and Concurrency

Covers **Factor VI: Processes**, **Factor VII: Port Binding**, and **Factor VIII: Concurrency** — how twelve-factor apps execute as stateless processes, self-host their own services, and scale horizontally.

---

## Factor VI: Processes

### Principle

> Execute the app as one or more stateless processes.

Twelve-factor processes are **stateless** and **share-nothing**. Any state that must persist is stored in a backing service (database, cache, object store) — never in the process's memory or local filesystem.

### Stateless vs. Stateful Processes

| Stateless (✅ twelve-factor) | Stateful (❌ violation) |
|---|---|
| User session stored in Redis | User session in process memory |
| Uploaded file sent directly to S3 | Uploaded file saved to local disk |
| Computed result stored in DB | Computed result cached in process RAM |
| Job state tracked in message queue | Job state in process-local variable |
| Config read from env vars at startup | Config loaded into a global variable, mutated at runtime |

### Why Stateless?

A **stateless process can be:**
- Killed and restarted without data loss
- Replaced with a new instance at any time
- Duplicated (any process can handle any request)
- Scaled horizontally by simply running more copies

A **stateful process cannot:**
- Be restarted cleanly (in-flight state is lost)
- Scale out (requests must go to the specific process holding user state)
- Be moved to a different physical machine

### The Filesystem as a Scratchpad (Not Storage)

The local filesystem may be used as a **brief, single-transaction cache** only:

```python
# Acceptable: download file, process it, store result, delete local copy
import tempfile, requests, boto3

response = requests.get("https://cdn.example.com/big-file.csv")
with tempfile.NamedTemporaryFile() as f:
    f.write(response.content)
    result = process(f.name)   # process while file exists locally

# result is persisted to a backing service, not the local disk
s3.put_object(Bucket="results", Key="output.json", Body=json.dumps(result))
# Temp file is deleted when the context manager exits
```

Never assume a file written by one process instance will be available to a future request (it may be served by a different process on a different machine):

```python
# Wrong: assumes the same process will serve the next request
with open("/tmp/user_session.json", "w") as f:
    json.dump(session_data, f)
# This file only exists on one process — next request may go elsewhere
```

### Sticky Sessions Are a Violation

**Sticky sessions** (routing requests from the same user to the same process) violate Factor VI:

```nginx
# Wrong: nginx "ip_hash" directs each user's requests to the same upstream
upstream app {
    ip_hash;
    server app1:5000;
    server app2:5000;
}
```

Session data belongs in a time-expiring backing service:

```python
# Right: sessions in Redis, accessible from any process
from flask import session
app.config["SESSION_TYPE"] = "redis"
app.config["SESSION_REDIS"] = redis.from_url(os.environ["REDIS_URL"])
```

### Asset Compilation at Build Time, Not Runtime

Some frameworks compile assets lazily on first request. Move this to the build stage:

```bash
# Wrong: compiling assets when first request arrives (slows startup, adds state)
# Right: assets compiled during docker build / CI
RUN python manage.py collectstatic --noinput   # Django
RUN bundle exec rake assets:precompile          # Rails
RUN npm run build                               # Node.js
```

---

## Factor VII: Port Binding

### Principle

> Export services via port binding.

A twelve-factor app is **completely self-contained**. It does not rely on a webserver being injected into the execution environment. Instead, it embeds a web server library and binds to a port itself to serve requests.

### Embedded vs. Injected Web Server

| Injected (❌ violation) | Embedded (✅ twelve-factor) |
|---|---|
| PHP running as Apache module | Python app using Gunicorn/uvicorn |
| Java WAR deployed to Tomcat | Java app using embedded Jetty/Tomcat |
| App requires IIS or nginx to run | Node.js app using built-in `http` module |
| CGI script | Go app using `net/http` package |

### How Port Binding Works

The app listens on a port (usually specified by the `PORT` environment variable) and a routing layer in front handles external traffic:

```
Internet → Load Balancer → Router/Proxy (nginx, ALB) → App process on PORT
```

The app itself owns the port:

```python
# Python (Flask + Gunicorn)
# Procfile: web: gunicorn app:application --bind 0.0.0.0:$PORT
import os
from flask import Flask
app = Flask(__name__)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
```

```javascript
// Node.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

```go
// Go
package main

import (
    "net/http"
    "os"
)

func main() {
    port := os.Getenv("PORT")
    if port == "" { port = "8080" }
    http.ListenAndServe(":"+port, nil)
}
```

### Non-HTTP Services

Port binding is not limited to HTTP. Any protocol can be exported via port binding:

| Protocol | Example |
|---|---|
| HTTP/HTTPS | Web applications, REST APIs |
| WebSockets | Real-time apps |
| gRPC | Microservice communication |
| Redis protocol | Custom data stores |
| XMPP | Messaging services |
| Custom TCP | Game servers, IoT backends |

### One App as Another App's Backing Service

Because any app exports its service via a URL, one app can become the **backing service** (Factor IV) for another app. The consuming app stores the URL as config:

```bash
# App A exposes a REST API on port 3001
# App B consumes App A (treats it as a backing service via URL in config)
SERVICE_A_URL=http://service-a:3001
```

---

## Factor VIII: Concurrency

### Principle

> Scale out via the process model.

Twelve-factor apps scale by running **more processes** (horizontal scale), not by making individual processes larger (vertical scale). Different work types are assigned to different **process types**.

### The Process Formation

A **process formation** is the set of process types and the count of each type:

```
web=3, worker=5, beat=1
```

This is defined by the Procfile and managed by the platform:

```
# Procfile
web:    gunicorn myapp.wsgi:application --workers 2
worker: celery -A myapp worker --concurrency 4
beat:   celery -A myapp beat
```

Each line is a **process type**. The platform runs N instances of each type.

### Process Type Patterns

| Process Type | Handles | Scale Trigger |
|---|---|---|
| `web` | HTTP requests | Request throughput |
| `worker` | Background jobs / queue tasks | Queue depth |
| `beat` / `scheduler` | Periodic/cron tasks | Usually 1 (singleton) |
| `release` | One-off migration tasks | Run once at deploy |
| `ws` | WebSocket connections | Connected clients |

### Horizontal vs. Vertical Scaling

```
Vertical (❌ anti-pattern for twelve-factor):
  Single large process → give it more RAM and CPU
  ← does not distribute work, single point of failure

Horizontal (✅ twelve-factor):
  Many identical processes → add more instances
  ← distributes work, no single point of failure
  ← requires Factor VI: stateless processes
```

### No Daemonisation

Twelve-factor processes **must not daemonize themselves**. They should run in the foreground and let the OS process manager handle lifecycle:

```python
# Wrong: app daemonizing itself
import daemon
with daemon.DaemonContext():
    run_app()

# Right: run in foreground; systemd/supervisor/Kubernetes manages lifecycle
run_app()   # blocks until terminated
```

The process manager (systemd, Kubernetes, Heroku dyno manager) is responsible for:
- Starting processes
- Restarting crashed processes  
- Handling graceful shutdown (SIGTERM)
- Collecting output streams (Factor XI: Logs)

### Thread-Based vs. Process-Based Concurrency

Factor VIII does not prohibit threads or async within a single process. A `web` process may use:
- Multiple threads (threaded WSGI: `gunicorn --workers 4 --threads 2`)
- Async/await (uvicorn, asyncio)
- Node.js event loop

The key distinction: an individual process can only grow so large. **The application must also be able to span multiple processes across multiple machines.** Internal threading handles concurrency within one machine; the process model handles distribution across machines.

### Scaling Example

```bash
# Development: one of each
web=1, worker=1

# Production (moderate load):
web=4, worker=8, beat=1

# Black Friday / peak traffic:
web=20, worker=40, beat=1

# All of the above is config, not code changes
heroku ps:scale web=20 worker=40
kubectl scale deployment/web --replicas=20
kubectl scale deployment/worker --replicas=40
```

### Common Violations

| Violation | Description | Fix |
|---|---|---|
| **Writing PID files** | App manages its own process lifecycle | Use process manager |
| **In-process cron scheduler** | Scheduler runs inside the web process | Extract to a `beat` process type |
| **Assuming single instance** | Code assumes it is the only running instance | Remove singleton assumptions; use distributed locks in Redis if needed |
| **Memory-hungry monolith** | One giant process handles all workloads | Split into web + worker process types |
| **Session affinity / sticky routing** | Load balancer must route user to specific instance | Move session state to Redis (Factor VI) |
