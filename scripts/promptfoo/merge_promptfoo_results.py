"""Merge per-skill PromptFoo JSON outputs into one snapshot result file."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_dir", type=Path, help="Directory containing per-skill *.json files")
    parser.add_argument("output_file", type=Path, help="Merged output JSON path")
    parser.add_argument(
        "--ensure-parent",
        action="store_true",
        help="Create output parent directory if it does not exist",
    )
    return parser.parse_args()


def extract_entries(data: dict) -> list[dict]:
    payload = data.get("results")
    if isinstance(payload, dict):
        entries = payload.get("results", [])
    elif isinstance(payload, list):
        entries = payload
    else:
        entries = []

    if not isinstance(entries, list):
        return []

    return [entry for entry in entries if isinstance(entry, dict)]


def main() -> int:
    args = parse_args()
    results: list[dict] = []

    for file in sorted(args.input_dir.glob("*.json")):
        try:
            data = json.loads(file.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                results.extend(extract_entries(data))
        except Exception as exc:  # noqa: BLE001
            print(f"Warning: {file}: {exc}", file=sys.stderr)

    if args.ensure_parent:
        args.output_file.parent.mkdir(parents=True, exist_ok=True)

    args.output_file.write_text(json.dumps({"results": results}, indent=2), encoding="utf-8")
    print(f"Merged {len(results)} test results -> {args.output_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())