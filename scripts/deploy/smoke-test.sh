#!/usr/bin/env bash
# Post-deploy smoke test.
#
# Usage: scripts/deploy/smoke-test.sh <cms|frontend> <base-url> <development|production> [--dry-run]
#
# CMS:      GET /api/v1/health/ready must return 200 (database + Redis reachable).
# Frontend: GET /, /roster and /robots.txt must return 200, and robots.txt must match
#           the environment (production allows crawling, development disallows it).
#
# Retries because a freshly started (or scaled-from-zero) app, and a suspended
# database, may need a few seconds. Only status codes and file names are printed;
# response bodies are never echoed.
set -euo pipefail

app="${1:-}"
base_url="${2:-}"
environment="${3:-}"
dry_run="${4:-}"

attempts="${SMOKE_ATTEMPTS:-10}"
interval="${SMOKE_INTERVAL_SECONDS:-15}"

if [[ -z "$app" || -z "$base_url" || -z "$environment" ]]; then
  echo "Usage: $0 <cms|frontend> <base-url> <development|production> [--dry-run]" >&2
  exit 2
fi
if [[ "$app" != "cms" && "$app" != "frontend" ]]; then
  echo "App must be 'cms' or 'frontend' (got '$app')." >&2
  exit 2
fi
if [[ "$environment" != "development" && "$environment" != "production" ]]; then
  echo "Environment must be 'development' or 'production' (got '$environment')." >&2
  exit 2
fi
base_url="${base_url%/}"

if [[ "$app" == "cms" ]]; then
  paths=("/api/v1/health/ready")
else
  paths=("/" "/roster" "/robots.txt")
fi

if [[ "$dry_run" == "--dry-run" || "${DRY_RUN:-0}" == "1" ]]; then
  echo "[dry-run] smoke test for $app ($environment) at $base_url"
  for path in "${paths[@]}"; do echo "[dry-run] expect 200 from $base_url$path"; done
  if [[ "$app" == "frontend" ]]; then
    if [[ "$environment" == "production" ]]; then
      echo "[dry-run] expect robots.txt to allow crawling"
    else
      echo "[dry-run] expect robots.txt to disallow crawling"
    fi
  fi
  exit 0
fi

check_status() {
  local url="$1"
  local status
  status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$url" 2>/dev/null || true)"
  [[ "$status" == "200" ]]
}

check_robots() {
  local body
  body="$(curl -fsS --max-time 30 "$base_url/robots.txt" 2>/dev/null)" || return 1
  if [[ "$environment" == "production" ]]; then
    # Public routes must stay crawlable: no blanket "Disallow: /".
    ! printf '%s\n' "$body" | grep -qxE 'Disallow: /[[:space:]]*'
  else
    printf '%s\n' "$body" | grep -qxE 'Disallow: /[[:space:]]*'
  fi
}

run_checks() {
  for path in "${paths[@]}"; do
    if ! check_status "$base_url$path"; then
      echo "  not ready: $path did not return 200"
      return 1
    fi
  done
  if [[ "$app" == "frontend" ]] && ! check_robots; then
    echo "  not ready: robots.txt does not match the $environment rules"
    return 1
  fi
  return 0
}

for ((i = 1; i <= attempts; i++)); do
  echo "Smoke test attempt $i/$attempts for $app ($environment)"
  if run_checks; then
    echo "Smoke test passed for $app."
    exit 0
  fi
  if ((i < attempts)); then sleep "$interval"; fi
done

echo "Smoke test FAILED for $app after $attempts attempts." >&2
exit 1
