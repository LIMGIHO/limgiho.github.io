#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CHROME_BIN="${KAKAOPAY_RESUME_CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
INPUT_HTML="$ROOT_DIR/resumes/kakaopay-fde-v04/index.html"
OUTPUT_DIR="$ROOT_DIR/output/pdf/versions"
OUTPUT_PDF="$OUTPUT_DIR/lim-giho-kakaopay-fde-resume-v04.pdf"
PROFILE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/kakaopay-fde-v04.XXXXXX")"

cleanup() {
  rm -rf "$PROFILE_DIR"
}
trap cleanup EXIT

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome executable not found: $CHROME_BIN" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --user-data-dir="$PROFILE_DIR" \
  --print-to-pdf="$OUTPUT_PDF" \
  "file://$INPUT_HTML"

echo "$OUTPUT_PDF"
