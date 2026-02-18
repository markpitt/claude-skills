# Codebase and Dependencies

Covers **Factor I: Codebase** and **Factor II: Dependencies** — the foundational rules for how twelve-factor apps manage their source code and external libraries.

---

## Factor I: Codebase

### Principle

> One codebase tracked in revision control, many deploys.

A twelve-factor app always has exactly **one codebase** per application, tracked in a version control system (Git, Mercurial, SVN). That single codebase can produce many deploys (production, staging, developer environments).

### Key Rules

| Scenario | Twelve-Factor Verdict |
|---|---|
| Single repo → multiple deploys (prod, staging, dev) | ✅ Correct |
| Multiple repos for one app | ❌ Violation — it's a distributed system; each component must be its own app |
| Multiple apps sharing one repo (monorepo) | ❌ Violation — shared code should become a library, managed via dependency manager |
| Different versions active per deploy | ✅ Correct — same codebase, different commits deployed |

### Deploys

A **deploy** is any running instance of the app. Every developer's local machine counts as a deploy. The distinction between deploys is only the version (commit) currently active and the config injected.

```
Codebase (single Git repo)
  └── Deploy: production  (commit a3f1...)
  └── Deploy: staging     (commit 9c2b...)
  └── Deploy: dev (alice) (commit 9c2b... + local uncommitted)
  └── Deploy: dev (bob)   (commit 8d4e...)
```

### Common Violations

**Multiple codebases for one logical app**

```
# Wrong: shared behaviour spread across two repos
repo-api/      → handles API requests
repo-worker/   → processes background jobs
# These share business logic → both are part of one app
```

Fix: Either merge into one repo, or extract shared logic into a versioned library.

**Shared monorepo without proper isolation**

```
# Wrong: both services share code ad-hoc from a monolithic repo
/services/checkout/   # imports from /services/auth/ directly
/services/auth/
```

Fix: Extract shared code into a library package (npm, PyPI, RubyGems, Maven) with a proper version, then declare it as a dependency in each service.

---

## Factor II: Dependencies

### Principle

> Explicitly declare and isolate all dependencies.

A twelve-factor app **never relies on implicit system-wide packages**. All dependencies are declared in a manifest and isolated so that the surrounding environment cannot leak in.

### Two Requirements

| Requirement | Purpose | Examples |
|---|---|---|
| **Declaration manifest** | Documents every dependency with its version | `package.json`, `Gemfile`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml` |
| **Isolation tool** | Prevents system packages from leaking in | `virtualenv`/`venv` (Python), `bundler` (Ruby), `node_modules` (Node), `vendor/` (Go) |

Both are required. Declaration without isolation still allows ambient system packages to sneak in. Isolation without declaration means the build is not reproducible.

### Language-Specific Patterns

#### Python

```bash
# Declaration: requirements.txt or pyproject.toml
pip freeze > requirements.txt

# Isolation: virtual environment
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Or with modern tooling (uv, poetry, pipenv)
poetry install
```

#### Node.js

```bash
# Declaration: package.json (exact versions in package-lock.json)
npm install

# Isolation: node_modules/ is local to the project
# No global packages assumed

# Always commit package-lock.json for reproducibility
```

#### Ruby

```bash
# Declaration: Gemfile
# Isolation: bundler + bundle exec
bundle install
bundle exec rails server   # not: rails server
bundle exec rake db:migrate
```

#### Go

```bash
# Declaration + isolation: go.mod / go.sum
go mod tidy
go mod vendor   # optional: vendor directory for hermetic builds
```

#### Java / Maven

```xml
<!-- Declaration: pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.2.0</version>
</dependency>
```

### System Tool Dependencies

Do not assume system tools exist at runtime. Examples of violations:

```bash
# Wrong: assumes ImageMagick is installed on the host
subprocess.run(["convert", "input.png", "output.jpg"])

# Wrong: assumes curl is available
os.system("curl https://api.example.com/data")
```

**Fix:** Either vendor the tool into the app, use a library equivalent, or declare it explicitly in the container image/build configuration:

```dockerfile
# Dockerfile explicitly installs the dependency
RUN apt-get install -y imagemagick
```

```python
# Better: use a library instead of a system tool
from PIL import Image   # pillow declared in requirements.txt
img = Image.open("input.png")
```

### Dependency Pinning vs. Ranges

| Approach | Pros | Cons | Recommendation |
|---|---|---|---|
| Exact pin (`==1.2.3`) | Fully reproducible | Manual update burden | ✅ Use for production deployments |
| Range (`>=1.2,<2.0`) | Picks up patches | Non-deterministic builds without lockfile | Use with lockfile |
| No version specified | None | Unpredictable, non-reproducible | ❌ Never |

Always commit lockfiles (`package-lock.json`, `Gemfile.lock`, `poetry.lock`, `go.sum`) to version control.

### Common Violations

| Violation | Symptom | Fix |
|---|---|---|
| Implicit system package | Works on dev, breaks in CI | Add to requirements/Dockerfile |
| No lockfile committed | Different versions deployed | Commit lockfile |
| `requirements.txt` without versions | Builds randomly break | Pin all versions |
| Global npm installs | `npm install -g` in docs | Add to `devDependencies` or scripts |
| Assuming a system `python` version | `python` vs `python3` ambiguity | Use `python3` + declare in `.tool-versions`/`runtime.txt` |

### Developer Onboarding Test

A twelve-factor codebase passes this test:

> A new developer can check out the repo, run a single build command, and have a running app — with no prior knowledge of what dependencies exist.

```bash
# Should be the complete setup for a new developer
git clone https://github.com/org/app.git
cd app
cp .env.example .env   # see Factor III
npm install            # or: pip install -r requirements.txt, bundle install, etc.
npm start
```
