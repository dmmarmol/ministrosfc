#!/usr/bin/env bash

set -euo pipefail

dry_run="${DRY_RUN:-0}"

if [[ -z "${RESET_CONFIRMATION:-}" ]]; then
  echo "Missing RESET_CONFIRMATION. Refusing to reset database."
  exit 1
fi

if [[ "$RESET_CONFIRMATION" != "RESET_DB" ]]; then
  echo "RESET_CONFIRMATION must be exactly RESET_DB. Refusing to reset database."
  exit 1
fi

echo "Resetting CMS database on Fly app: $CMS_APP_NAME"

machine_json="$(flyctl machine list --app "$CMS_APP_NAME" --json)"
machine_id="$(printf '%s' "$machine_json" | node -e '
const machines = JSON.parse(require("fs").readFileSync(0, "utf8"));
const candidates = machines.filter((machine) => machine.state !== "destroyed");
const preferred = candidates.find((machine) => machine.state === "started") ?? candidates[0];
if (preferred) {
  process.stdout.write(preferred.id);
}
')"

if [[ -z "$machine_id" ]]; then
  echo "No Fly machine found for app $CMS_APP_NAME"
  flyctl status --app "$CMS_APP_NAME"
  exit 1
fi

machine_state="$(printf '%s' "$machine_json" | node -e '
const machines = JSON.parse(require("fs").readFileSync(0, "utf8"));
const machineId = process.argv[1];
const machine = machines.find((entry) => entry.id === machineId);
if (machine?.state) {
  process.stdout.write(machine.state);
}
' "$machine_id")"

if [[ "$machine_state" != "started" ]]; then
  echo "Starting Fly machine $machine_id from state: ${machine_state:-unknown}"
  flyctl machine start "$machine_id" --app "$CMS_APP_NAME"

  attempts=0
  current_state="${machine_state:-}"
  until [[ "$attempts" -ge 12 ]]; do
    current_state="$(flyctl machine list --app "$CMS_APP_NAME" --json | node -e '
const machines = JSON.parse(require("fs").readFileSync(0, "utf8"));
const machineId = process.argv[1];
const machine = machines.find((entry) => entry.id === machineId);
if (machine?.state) {
  process.stdout.write(machine.state);
}
' "$machine_id")"

    if [[ "$current_state" == "started" ]]; then
      break
    fi

    attempts=$((attempts + 1))
    echo "Waiting for machine $machine_id to start. Current state: ${current_state:-unknown}"
    sleep 5
  done

  if [[ "$current_state" != "started" ]]; then
    echo "Fly machine $machine_id did not reach started state"
    flyctl status --app "$CMS_APP_NAME"
    exit 1
  fi
fi

remote_command="sh -lc 'cd /app/packages/cms && npx prisma migrate reset --force --skip-seed'"

if [[ "$dry_run" == "1" ]]; then
  echo "Dry run enabled. Skipping remote DB reset execution."
  echo "Target machine: $machine_id"
  echo "Remote command: sh -lc 'cd /app/packages/cms && npx prisma migrate reset --force --skip-seed'"
  exit 0
fi

flyctl ssh console --app "$CMS_APP_NAME" --command "$remote_command"
