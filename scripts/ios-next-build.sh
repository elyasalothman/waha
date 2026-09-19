#!/usr/bin/env bash
# Next CFBundleVersion / CURRENT_PROJECT_VERSION for TestFlight / App Store.
#
# Usage:
#   scripts/ios-next-build.sh <CURRENT_PROJECT_VERSION> [latest_uploaded]
#
# Bump formula (never decrease):
#   next = max(CURRENT_PROJECT_VERSION, latest_uploaded) + 1
set -euo pipefail

CURRENT="${1:-}"
LATEST="${2:-}"

case "$CURRENT" in
  ''|*[!0-9]*)
    echo "usage: $0 <CURRENT_PROJECT_VERSION> [latest_uploaded]" >&2
    exit 2
    ;;
esac

case "${LATEST}" in
  ''|*[!0-9]*)
    echo "$CURRENT"
    exit 0
    ;;
esac

if [ "$CURRENT" -ge "$LATEST" ]; then
  echo $((CURRENT + 1))
else
  echo $((LATEST + 1))
fi
