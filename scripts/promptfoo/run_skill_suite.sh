#!/usr/bin/env bash
# Run the PromptFoo trigger suite, or write the snapshot baseline.
#
# Usage: bash scripts/promptfoo/run_skill_suite.sh <triggers|snapshot> [skill ...]
#
# Environment:
#   PROMPTFOO_PROVIDER          openai (default; any OpenAI-compatible endpoint) or anthropic
#   PROMPTFOO_MODEL             model under test
#   PROMPTFOO_JUDGE_MODEL       llm-rubric judge; defaults to PROMPTFOO_MODEL
#   PROMPTFOO_BASE_URL          openai only: the endpoint, such as http://localhost:11434/v1
#   PROMPTFOO_PROVIDER_API_KEY  the key; on anthropic it is passed on as ANTHROPIC_API_KEY
#   PROMPTFOO_BIN               promptfoo command, default "npx promptfoo"
#   PROMPTFOO_RESULTS           merged results file, default tests/snapshots/promptfoo-results.json

set -euo pipefail

mode="${1:-}"
if [[ "$mode" != "triggers" && "$mode" != "snapshot" ]]; then
  echo "Usage: bash scripts/promptfoo/run_skill_suite.sh <triggers|snapshot> [skill ...]" >&2
  exit 2
fi
shift
skills=("$@")

provider="${PROMPTFOO_PROVIDER:-openai}"
case "$provider" in
  openai|anthropic) ;;
  *) echo "Unknown PROMPTFOO_PROVIDER '$provider'; expected openai or anthropic" >&2; exit 2 ;;
esac
export PROMPTFOO_PROVIDER="$provider"
if [[ "$provider" == "anthropic" && -z "${ANTHROPIC_API_KEY:-}" ]]; then
  export ANTHROPIC_API_KEY="${PROMPTFOO_PROVIDER_API_KEY:-}"
fi

read -ra promptfoo <<< "${PROMPTFOO_BIN:-npx promptfoo}"

repo_root="$PWD"
results="${PROMPTFOO_RESULTS:-$repo_root/tests/snapshots/promptfoo-results.json}"
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT
errors=0
ran_any=0
cd tests/promptfoo

: "${PROMPTFOO_KEEP_ALIVE:=30m}"
: "${PROMPTFOO_USE_MMAP:=true}"

is_ollama_base_url() {
  [[ "$provider" == "openai" ]] || return 1
  [[ "${PROMPTFOO_BASE_URL:-}" == *"ollama"* ]] || [[ "${PROMPTFOO_BASE_URL:-}" == *":11434"* ]]
}

warm_ollama_model() {
  local model_name="$1"
  local ollama_api_base="${PROMPTFOO_BASE_URL%/v1}"

  if [[ -z "$model_name" ]]; then
    return 0
  fi

  echo "▶ Warming model $model_name (keep_alive=${PROMPTFOO_KEEP_ALIVE})..."
  curl -sS "${ollama_api_base}/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"${model_name}\",\"messages\":[],\"keep_alive\":\"${PROMPTFOO_KEEP_ALIVE}\",\"options\":{\"use_mmap\":${PROMPTFOO_USE_MMAP}}}" \
    >/dev/null || true
}

apply_ollama_tuning() {
  local config_file="$1"
  python "$repo_root/scripts/promptfoo/apply_ollama_tuning.py" "$config_file"
}

wanted() {
  local name="$1" s
  [[ ${#skills[@]} -eq 0 ]] && return 0
  for s in "${skills[@]}"; do [[ "$s" == "$name" ]] && return 0; done
  return 1
}

for s in "${skills[@]}"; do
  if [[ ! -f "skills/$s.yaml" ]]; then
    echo "No trigger config for skill: $s" >&2
    exit 2
  fi
done

mkdir -p "$tmp_dir/extensions"
cp skills/extensions/*.py "$tmp_dir/extensions/"

if is_ollama_base_url; then
  warm_ollama_model "${PROMPTFOO_MODEL}"
  warm_ollama_model "${PROMPTFOO_JUDGE_MODEL:-}"
fi

for yaml in skills/*.yaml; do
  skill=$(basename "$yaml" .yaml)
  wanted "$skill" || continue

  ran_any=1
  rendered="$tmp_dir/${skill}.config.yaml"
  out="$tmp_dir/$skill.json"

  if ! python "$repo_root/scripts/promptfoo/render_config.py" "$yaml" "$rendered" "$tmp_dir/extensions"; then
    echo "  ✗ $skill config could not be rendered"
    errors=$((errors + 1))
    continue
  fi

  if is_ollama_base_url; then
    apply_ollama_tuning "$rendered"
  fi

  if [[ "$mode" == "triggers" ]]; then
    echo "▶ Testing $skill..."
    if ! "${promptfoo[@]}" validate --config "$rendered" 2>&1; then
      echo "  ✗ $skill config validation failed"
      errors=$((errors + 1))
      continue
    fi

    if "${promptfoo[@]}" eval --config "$rendered" --no-share --output "$out" 2>&1; then
      echo "  ✓ $skill"
    else
      echo "  ✗ $skill (see output above)"
      errors=$((errors + 1))
    fi
  else
    "${promptfoo[@]}" validate --config "$rendered" 2>&1
    "${promptfoo[@]}" eval --config "$rendered" --no-share --output "$out" 2>&1
  fi
done

if [[ "$ran_any" -eq 0 ]]; then
  echo "No trigger configs found" >&2
  exit 2
fi

python3 "$repo_root/scripts/promptfoo/merge_promptfoo_results.py" \
  "$tmp_dir" \
  "$results" \
  --ensure-parent

if [[ "$mode" == "triggers" ]]; then
  if [[ $errors -ne 0 ]]; then
    echo "$errors skill config(s) had failures"
    exit 1
  fi
  exit 0
fi

cd "$repo_root"
python tests/snapshots/compare.py --update
echo "Snapshot baseline updated. Commit tests/snapshots/baseline.json if intentional."
