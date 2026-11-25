"""Apply Ollama-specific PromptFoo config tuning to a rendered skill config."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path


def _add_passthrough(match: re.Match[str], keep_alive: str, use_mmap: str) -> str:
    indent = match.group("indent")
    line = match.group(0)
    think = os.environ.get("PROMPTFOO_THINK", "false").strip().lower()
    think_value = "true" if think in {"1", "true", "yes", "on"} else "false"
    return (
        f"{line}\n"
        f"{indent}passthrough:\n"
        f'{indent}  keep_alive: "{keep_alive}"\n'
        f"{indent}  options:\n"
        f"{indent}    use_mmap: {use_mmap}\n"
        f"{indent}    think: {think_value}"
    )


def _swap_default_judge(lines: list[str], judge_model: str) -> list[str]:
    in_default = False
    default_indent = 0

    for index, line in enumerate(lines):
        stripped = line.lstrip()
        indent = len(line) - len(stripped)

        if stripped.startswith("defaultTest:"):
            in_default = True
            default_indent = indent
            continue

        if in_default and stripped and indent <= default_indent:
            in_default = False

        if in_default and stripped.startswith("id: openai:chat:"):
            lines[index] = f"{' ' * indent}id: openai:chat:{judge_model}"

    return lines


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: apply_ollama_tuning.py <rendered-config-path>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    keep_alive = os.environ.get("PROMPTFOO_KEEP_ALIVE", "30m")
    use_mmap = os.environ.get("PROMPTFOO_USE_MMAP", "true").lower()
    judge_model = os.environ.get("PROMPTFOO_JUDGE_MODEL", "").strip()

    text = re.sub(
        r"^(?P<indent>[ \t]*)apiKey:[ \t]*.*$",
        lambda match: _add_passthrough(match, keep_alive=keep_alive, use_mmap=use_mmap),
        text,
        flags=re.MULTILINE,
    )

    if judge_model:
        lines = text.splitlines()
        lines = _swap_default_judge(lines, judge_model=judge_model)
        text = "\n".join(lines) + "\n"

    path.write_text(text, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())