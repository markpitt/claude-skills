#!/usr/bin/env bash
# Clone every skill group listed in groups.json into one directory, one checkout per group named
# by its id, for SKILL_GROUPS_DIR (scripts/skill_roots.py).
#
# The public claude-skills holds no skills: they live in the seven group repositories. CI, the
# release and anyone running the toolchain locally check the groups out side by side with this.
#
# Usage:
#   bash scripts/checkout_groups.sh <dir>                    # each group's main
#   bash scripts/checkout_groups.sh <dir> --latest-tag       # each group's highest v* tag
#   bash scripts/checkout_groups.sh <dir> --link <parent>    # symlink <parent>/<id>, no clone
#
# --latest-tag is what a release packs, so a release only ever contains released skills. A group
# with no v* tag is an error, not a silent fall back to main. --link points at groups that are
# already on disk side by side (a monorepo checkout, or clones you made yourself); a group
# missing from <parent> is an error. Reads groups.json beside this script's parent, so the list
# cannot drift from it.
set -euo pipefail

dir="${1:?usage: checkout_groups.sh <dir> [--latest-tag | --link <parent>]}"
mode="${2:-main}"
parent=""
case "$mode" in
  main|--latest-tag) ;;
  --link)
    parent="${3:?--link needs the directory that holds the groups}"
    parent="$(cd "$parent" && pwd)"
    ;;
  *) echo "unknown option: $mode" >&2; exit 2 ;;
esac

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mapfile -t groups < <(python3 -c '
import json, sys
for g in json.load(open(sys.argv[1]))["groups"]:
    print(g["id"], g["public_repo"])
' "$here/groups.json")

if [ "${#groups[@]}" -eq 0 ]; then
  echo "groups.json lists no groups" >&2
  exit 1
fi

mkdir -p "$dir"
for row in "${groups[@]}"; do
  read -r id repo <<<"$row"
  if [ "$mode" = "--link" ]; then
    if [ ! -d "$parent/$id/skills" ]; then
      echo "$parent/$id/skills does not exist" >&2
      exit 1
    fi
    rm -rf "${dir:?}/$id"
    ln -s "$parent/$id" "$dir/$id"
    echo "$id linked"
    continue
  fi
  url="https://github.com/$repo.git"
  ref=main
  if [ "$mode" = "--latest-tag" ]; then
    ref="$(git ls-remote --tags --refs --sort=-v:refname "$url" 'v*' | head -n 1 | sed 's#.*refs/tags/##')"
    if [ -z "$ref" ]; then
      echo "$repo has no v* tag to release from" >&2
      exit 1
    fi
  fi
  rm -rf "${dir:?}/$id"
  git -c advice.detachedHead=false clone --quiet --depth 1 --branch "$ref" "$url" "$dir/$id"
  echo "$id $ref"
done
