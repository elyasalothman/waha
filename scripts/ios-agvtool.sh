#!/usr/bin/env bash
# Headless wrapper around Apple's agvtool for Codemagic / macOS CI.
# Same contract as تهجد: never decrease CURRENT_PROJECT_VERSION; never hang on git.
set -euo pipefail

usage() {
  echo "usage: $0 <build-number> <marketing-version>" >&2
  exit 2
}

BUILD_NUMBER="${1:-}"
MARKETING_VERSION="${2:-}"

case "$BUILD_NUMBER" in
  ''|*[!0-9]*) usage ;;
esac
case "$MARKETING_VERSION" in
  ''|*[!0-9.]*) usage ;;
esac

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../ios/App" && pwd)"

if [ ! -d "$PROJECT_DIR/App.xcodeproj" ]; then
  echo "error: App.xcodeproj not found in $PROJECT_DIR" >&2
  exit 1
fi

proj_count="$(find "$PROJECT_DIR" -maxdepth 1 -name '*.xcodeproj' -type d | wc -l | tr -d ' ')"
if [ "$proj_count" != "1" ]; then
  echo "error: expected exactly one .xcodeproj in $PROJECT_DIR (found $proj_count)" >&2
  exit 1
fi

CURRENT_PROJECT_VERSION="$(
  awk '/CURRENT_PROJECT_VERSION =/ { gsub(/;/, "", $3); print $3; exit }' \
    "$PROJECT_DIR/App.xcodeproj/project.pbxproj"
)"
case "$CURRENT_PROJECT_VERSION" in
  ''|*[!0-9]*)
    echo "error: could not read CURRENT_PROJECT_VERSION from App.xcodeproj" >&2
    exit 1
    ;;
esac

if [ "$BUILD_NUMBER" -lt "$CURRENT_PROJECT_VERSION" ]; then
  LATEST_UPLOADED=$((BUILD_NUMBER > 0 ? BUILD_NUMBER - 1 : 0))
  NEXT_BUILD_NUMBER="$(bash "$SCRIPT_DIR/ios-next-build.sh" "$CURRENT_PROJECT_VERSION" "$LATEST_UPLOADED")"
  echo "agvtool: refusing to decrease CURRENT_PROJECT_VERSION from $CURRENT_PROJECT_VERSION to $BUILD_NUMBER" >&2
  BUILD_NUMBER="$NEXT_BUILD_NUMBER"
fi

cd "$PROJECT_DIR"

if command -v xcrun >/dev/null 2>&1; then
  AGVTOOL=(xcrun agvtool)
elif command -v agvtool >/dev/null 2>&1; then
  AGVTOOL=(agvtool)
else
  echo "error: agvtool is not on PATH (need Xcode on a Mac builder)" >&2
  exit 1
fi

echo "agvtool cwd=$PROJECT_DIR project=App.xcodeproj build=$BUILD_NUMBER marketing=$MARKETING_VERSION"
"${AGVTOOL[@]}" -noscm new-version -all "$BUILD_NUMBER"
"${AGVTOOL[@]}" -noscm new-marketing-version "$MARKETING_VERSION"
