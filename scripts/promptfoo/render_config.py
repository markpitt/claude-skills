"""Render a skill's trigger config for a provider, with the skill sent as the system message.

Usage: render_config.py <source-yaml> <output-yaml> <extensions-dir>

Environment:
  PROMPTFOO_PROVIDER             openai (default; any OpenAI-compatible endpoint) or anthropic
  PROMPTFOO_MODEL                model under test (required)
  PROMPTFOO_JUDGE_MODEL          llm-rubric judge; defaults to PROMPTFOO_MODEL
  PROMPTFOO_ANTHROPIC_EFFORT     anthropic only, default low
  PROMPTFOO_ANTHROPIC_MAX_TOKENS anthropic only, default 4096
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import yaml

PROVIDERS = ("openai", "anthropic")
HOOK = "compose_skill_system_prompt"
OPENAI_ENDPOINT = {
    "apiBaseUrl": "{{ env.PROMPTFOO_BASE_URL }}",
    "apiKey": "{{ env.PROMPTFOO_PROVIDER_API_KEY }}",
}


def provider_entry(provider: str, model: str) -> dict:
    if provider == "anthropic":
        return {
            "id": f"anthropic:messages:{model}",
            "config": {
                "max_tokens": int(os.environ.get("PROMPTFOO_ANTHROPIC_MAX_TOKENS", "4096")),
                "thinking": {"type": "adaptive"},
                "effort": os.environ.get("PROMPTFOO_ANTHROPIC_EFFORT", "low"),
                "showThinking": False,
            },
        }
    return {"id": f"openai:chat:{model}", "config": dict(OPENAI_ENDPOINT)}


def skill_file_of(doc: dict, source: Path) -> Path:
    """Resolve the systemPrompt path against tests/promptfoo, the directory the suite runs in."""
    base = source.resolve().parent.parent
    paths = set()
    for provider in doc.get("providers") or []:
        config = provider.get("config") if isinstance(provider, dict) else None
        prompt = str((config or {}).get("systemPrompt", ""))
        if prompt.startswith("file://"):
            paths.add((base / prompt.removeprefix("file://")).resolve())
    if len(paths) != 1:
        sys.exit(f"{source}: expected one file:// systemPrompt, found {len(paths)}")
    path = paths.pop()
    if not path.is_file():
        sys.exit(f"{source}: systemPrompt file not found: {path}")
    return path


def render(source: Path, extensions: Path, provider: str, model: str, judge: str) -> dict:
    doc = yaml.safe_load(source.read_text(encoding="utf-8"))
    skill_file = skill_file_of(doc, source)
    uses_hook = any(HOOK in str(e) for e in doc.pop("extensions", None) or [])
    transform = f"file://{extensions}/sanitize_llm_output.py:get_transform"

    model_entry = provider_entry(provider, model)
    model_entry["transform"] = transform
    doc["providers"] = [model_entry]
    doc["prompts"] = [f"file://{extensions}/{HOOK}.py:build_chat_prompt"]

    default_test = doc.get("defaultTest") or {}
    options = default_test.get("options") or {}
    options["provider"] = provider_entry(provider, judge)
    options.setdefault("transform", transform)
    default_test["options"] = options
    default_test.setdefault("vars", {}).update(
        {"skill_file": str(skill_file), "skill_compose_refs": "1" if uses_hook else "0"})
    doc["defaultTest"] = default_test
    return doc


def main() -> int:
    if len(sys.argv) != 4:
        print(__doc__, file=sys.stderr)
        return 2
    source, output, extensions = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]).resolve()
    provider = os.environ.get("PROMPTFOO_PROVIDER", "").strip() or "openai"
    if provider not in PROVIDERS:
        print(f"Unknown PROMPTFOO_PROVIDER {provider!r}; expected one of {', '.join(PROVIDERS)}", file=sys.stderr)
        return 2
    model = os.environ.get("PROMPTFOO_MODEL", "").strip()
    if not model:
        print("PROMPTFOO_MODEL is not set", file=sys.stderr)
        return 2
    judge = os.environ.get("PROMPTFOO_JUDGE_MODEL", "").strip() or model
    doc = render(source, extensions, provider, model, judge)
    output.write_text(yaml.safe_dump(doc, sort_keys=False, allow_unicode=True), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
