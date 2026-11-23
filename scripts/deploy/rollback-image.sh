#!/usr/bin/env bash
# Fly release helpers for rollback. Requires flyctl and FLY_API_TOKEN (except with --dry-run).
#
# Usage:
#   scripts/deploy/rollback-image.sh current  <fly-app>                 # print "<version> <image>" of the live release
#   scripts/deploy/rollback-image.sh restore  <fly-app> <image-ref>     # redeploy a recorded image
#   scripts/deploy/rollback-image.sh previous <fly-app> [version]       # restore the previous (or a given) release
#
# Add --dry-run (or DRY_RUN=1) to print what would run without calling flyctl.
# Only versions and image references are printed; release JSON is never echoed
# because it contains user emails.
#
# Database migrations are NOT reverted by a rollback (see docs/guides/DEPLOYMENT.md).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
dry_run="${DRY_RUN:-0}"

args=()
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then dry_run=1; else args+=("$arg"); fi
done
set -- "${args[@]+"${args[@]}"}"

mode="${1:-}"
app="${2:-}"
if [[ -z "$mode" || -z "$app" ]]; then
  sed -n 2,13p "$0" >&2
  exit 2
fi

release_line() {
  # $1 = current|previous, $2 = optional version
  flyctl releases --app "$app" --image --json | node "$here/select-release.js" "$1" "${2:-}"
}

restore_image() {
  local image="$1"
  echo "Restoring $app to image $image"
  if [[ "$dry_run" == "1" ]]; then
    echo "[dry-run] flyctl deploy --app $app --image $image --strategy rolling"
    return 0
  fi
  flyctl deploy --app "$app" --image "$image" --strategy rolling
}

case "$mode" in
  current)
    if [[ "$dry_run" == "1" ]]; then echo "[dry-run] would resolve the current release of $app"; exit 0; fi
    release_line current
    ;;
  restore)
    image="${3:-}"
    if [[ -z "$image" ]]; then echo "restore needs an image reference." >&2; exit 2; fi
    restore_image "$image"
    ;;
  previous)
    if [[ "$dry_run" == "1" ]]; then
      echo "[dry-run] would resolve the previous release of $app${3:+ (version $3)} and redeploy it"
      exit 0
    fi
    read -r version image < <(release_line previous "${3:-}")
    echo "Rolling $app back to release v$version"
    restore_image "$image"
    ;;
  *)
    echo "Unknown mode '$mode'." >&2
    exit 2
    ;;
esac
