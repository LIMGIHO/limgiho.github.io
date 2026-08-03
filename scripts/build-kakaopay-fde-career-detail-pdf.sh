#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CHROME_BIN="${KAKAOPAY_RESUME_CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
INPUT_HTML="$ROOT_DIR/resumes/kakaopay-fde-career-detail/index.html"
VERSIONED_DIR="$ROOT_DIR/output/pdf/versions"
VERSIONED_PDF="$VERSIONED_DIR/lim-giho-kakaopay-fde-career-detail-v02.pdf"
PUBLIC_DIR="$ROOT_DIR/assets/resume"
PUBLIC_PDF="$PUBLIC_DIR/lim-giho-kakaopay-fde-career-detail.pdf"
PROFILE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/kakaopay-fde-career-detail.XXXXXX")"
TEMP_PDF="$PROFILE_DIR/career-detail.pdf"
CHROME_PID=""

cleanup() {
  if [[ -n "$CHROME_PID" ]] && kill -0 "$CHROME_PID" 2>/dev/null; then
    kill "$CHROME_PID" 2>/dev/null || true
  fi
  rm -rf "$PROFILE_DIR"
}
trap cleanup EXIT

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome executable not found: $CHROME_BIN" >&2
  exit 1
fi

mkdir -p "$VERSIONED_DIR" "$PUBLIC_DIR"

"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --disable-background-networking \
  --disable-component-update \
  --disable-default-apps \
  --no-first-run \
  --no-service-autorun \
  --no-pdf-header-footer \
  --user-data-dir="$PROFILE_DIR" \
  --print-to-pdf="$TEMP_PDF" \
  "file://$INPUT_HTML" &
CHROME_PID=$!

LAST_SIZE=0
STABLE_COUNT=0
for _ in $(seq 1 120); do
  if [[ -s "$TEMP_PDF" ]]; then
    CURRENT_SIZE="$(wc -c < "$TEMP_PDF" | tr -d ' ')"
    if [[ "$CURRENT_SIZE" == "$LAST_SIZE" ]]; then
      STABLE_COUNT=$((STABLE_COUNT + 1))
    else
      STABLE_COUNT=0
      LAST_SIZE="$CURRENT_SIZE"
    fi
    if [[ "$STABLE_COUNT" -ge 4 ]]; then
      break
    fi
  fi
  sleep 0.25
done

if [[ "$STABLE_COUNT" -lt 4 ]]; then
  echo "PDF generation timed out: $TEMP_PDF" >&2
  exit 1
fi

kill "$CHROME_PID" 2>/dev/null || true
wait "$CHROME_PID" 2>/dev/null || true
CHROME_PID=""

mv "$TEMP_PDF" "$VERSIONED_PDF"

cp "$VERSIONED_PDF" "$PUBLIC_PDF"

echo "$VERSIONED_PDF"
echo "$PUBLIC_PDF"
