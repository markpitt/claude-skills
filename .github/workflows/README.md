# Workflows

This repository is the index of the seven skill group repositories, so most workflows start by checking the groups out under `.groups/` and pointing the toolchain at them with `SKILL_GROUPS_DIR`. `scripts/checkout_groups.sh` does that from `groups.json`.

| Workflow | Runs on | What it does |
|---|---|---|
| `validate-skills.yml` | every pull request, push to `main` | **Static Validation**: checks out each group at its `main`, then runs the validator, the index check, the per-skill packaging check and the contents-list check. A required check on `main`, so it has no paths filter. |
| `deploy-pages.yml` | push to `main` | Builds the skills site from the groups and deploys it to GitHub Pages. |
| `release.yml` | `v*` tag | Checks out each group at its highest `v*` tag, validates, builds one zip per skill and a `manifest.json` of checksums, and attaches them to a draft release. The notes are the body of the merged `release/<tag>` pull request. Run it by hand for a dry run that uploads the zips as an artifact instead. |
| `build.yml` | changes to `skills-tui/` | Tests skills-tui on Linux, macOS and Windows, and builds release binaries as run artifacts. |
| `docs.yml` | changes to `skills-tui/` | Builds the skills-tui API docs as a run artifact. |
| `wasm.yml` | by hand only | Disabled. WebAssembly is not practical for a terminal UI. |

The workflow token is read-only by default; `release.yml` and `deploy-pages.yml` ask for the permissions they need.
