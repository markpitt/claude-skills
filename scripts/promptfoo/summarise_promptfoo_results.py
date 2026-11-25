#!/usr/bin/env python3
"""Summarise merged PromptFoo trigger-test results for a GitHub Actions job.

Writes a per-skill pass count and a table of failed cases to the job summary
($GITHUB_STEP_SUMMARY, or stdout when unset), and prints one `::warning::`
annotation per failed case. The trigger tests are advisory in CI, so failures
are surfaced here rather than by failing the job.

Usage: summarise_promptfoo_results.py RESULTS_JSON

Exit status: 0 when the file was read (whatever the test outcomes), 1 when the
results file is missing or unreadable, so a broken run is not mistaken for a
clean one.
"""

from __future__ import annotations

import json
import os
import sys
from collections import OrderedDict
from pathlib import Path


def _skill(result: dict) -> str:
    routed = (result.get("vars") or {}).get("routing_skill")
    if routed:
        return str(routed)
    skill_file = str((result.get("vars") or {}).get("skill_file", ""))
    if skill_file:
        return Path(skill_file).parent.name
    return "unknown"


def _one_line(text: object, limit: int) -> str:
    flat = " ".join(str(text or "").split())
    flat = flat.replace("|", "\\|")
    return flat if len(flat) <= limit else flat[: limit - 3] + "..."


def _annotation(text: str) -> str:
    # GitHub workflow command values must escape %, CR and LF.
    return text.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    path = Path(argv[1])
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"::warning title=Trigger results unreadable::{_annotation(f'{path}: {exc}')}")
        return 1

    results = data.get("results", data) if isinstance(data, dict) else data
    if isinstance(results, dict):
        results = results.get("results", [])

    # Routing results (scripts/build-routing-config.py) carry vars.routing_skill and routing_kind,
    # and get a pass rate split by kind; trigger results keep the original table.
    routing = any((r.get("vars") or {}).get("routing_skill") for r in results)
    per_skill: "OrderedDict[str, list[int]]" = OrderedDict()
    per_kind: "dict[tuple[str, str], list[int]]" = {}
    failures = []
    for result in results:
        skill = _skill(result)
        counts = per_skill.setdefault(skill, [0, 0])
        counts[1] += 1
        kind = str((result.get("vars") or {}).get("routing_kind", ""))
        kind_counts = per_kind.setdefault((skill, kind), [0, 0])
        kind_counts[1] += 1
        if result.get("success"):
            counts[0] += 1
            kind_counts[0] += 1
            continue
        case = (result.get("testCase") or {}).get("description") or _one_line(
            (result.get("vars") or {}).get("user_message"), 80)
        grading = result.get("gradingResult") or {}
        reason = grading.get("reason") or result.get("error") or "no reason recorded"
        failures.append((skill, str(case), str(reason)))

    label = "Routing" if routing else "Trigger"
    lines = [f"## {label} tests (advisory)", ""]
    if not results:
        lines.append("No trigger-test results were recorded.")
    else:
        if routing:
            lines += ["| Skill | Pass rate | Should route | Should not route |", "|---|---|---|---|"]
            for skill, (passed, total) in per_skill.items():
                exp = per_kind.get((skill, "expect"), [0, 0])
                rej = per_kind.get((skill, "reject"), [0, 0])
                lines.append(f"| {skill} | {round(100 * passed / total)}% ({passed}/{total}) | "
                             f"{exp[0]}/{exp[1]} | {rej[0]}/{rej[1]} |")
        else:
            lines += ["| Skill | Passed |", "|---|---|"]
            lines += [f"| {skill} | {passed}/{total} |" for skill, (passed, total) in per_skill.items()]
        lines.append("")
        if failures:
            reason_head = "Reason" if routing else "Judge's reason"
            lines += [f"### Failed cases ({len(failures)})", "", f"| Skill | Case | {reason_head} |",
                      "|---|---|---|"]
            lines += [f"| {s} | {_one_line(c, 80)} | {_one_line(r, 300)} |" for s, c, r in failures]
        else:
            lines.append("Every case passed.")
        if routing:
            lines += ["", "Routing shows the model only skill names and descriptions and checks which "
                          "skill it picks, with no judge. Advisory: a free model varies from run to run."]
        else:
            lines += ["", "These tests do not block merging: a free model and an LLM judge vary from run to "
                          "run. Read the failures; the static frontmatter check is the gate."]

    summary = "\n".join(lines) + "\n"
    target = os.environ.get("GITHUB_STEP_SUMMARY")
    if target:
        with open(target, "a", encoding="utf-8") as handle:
            handle.write(summary)
    else:
        sys.stdout.write(summary)

    for skill, case, reason in failures:
        print(f"::warning title={label} test failed: {skill}::{_annotation(case + ': ' + _one_line(reason, 400))}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
