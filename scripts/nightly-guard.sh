#!/usr/bin/env bash
# Nightly guard (MIN-4718, CTO decision 5 on MIN-4714). First step of .github/workflows/nightly.yml.
#
# Fails the run unless:
#   1. HEALTHAPP_LIVE_URL is exactly the synthetic dev twin (below). Any other string fails, including the same
#      address with a trailing slash, an http:// form, or an unset variable. The founder's real records sit behind the
#      other staging address (MIN-4658), so the only way to be safe is to allow one value and refuse the rest.
#   2. HEALTHAPP_DEMO_PASSCODE is not empty. Every spec skips without it, and a run where everything skipped would
#      look green. The value is never printed.
set -euo pipefail

ALLOWED_URL='https://staging-dev.healthapp-8ui.pages.dev'

if [[ "${HEALTHAPP_LIVE_URL+set}" != "set" ]]; then
  echo "nightly guard: HEALTHAPP_LIVE_URL is not set. It must be exactly $ALLOWED_URL" >&2
  exit 1
fi
if [[ "$HEALTHAPP_LIVE_URL" != "$ALLOWED_URL" ]]; then
  echo "nightly guard: refusing to run. HEALTHAPP_LIVE_URL is '$HEALTHAPP_LIVE_URL'; it must be exactly '$ALLOWED_URL' (the synthetic dev twin)." >&2
  exit 1
fi

passcode="${HEALTHAPP_DEMO_PASSCODE-}"
if [[ -z "${passcode//[[:space:]]/}" ]]; then
  echo "nightly guard: HEALTHAPP_DEMO_PASSCODE is empty. Every spec would skip and the run would look green. Set the repository secret." >&2
  exit 1
fi

echo "nightly guard: ok. Target $HEALTHAPP_LIVE_URL (synthetic dev twin). Passcode is present; its value is never printed."
