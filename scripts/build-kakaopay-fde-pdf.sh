#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CHROME_BIN="${KAKAOPAY_RESUME_CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
INPUT_HTML="$ROOT_DIR/resumes/kakaopay-fde/index.html"
OUTPUT_DIR="$ROOT_DIR/output/pdf"
OUTPUT_PDF="$OUTPUT_DIR/lim-giho-kakaopay-fde-resume.pdf"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome executable not found: $CHROME_BIN" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$OUTPUT_PDF" \
  "file://$INPUT_HTML"

echo "$OUTPUT_PDF"
