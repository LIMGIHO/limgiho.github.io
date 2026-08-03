#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CHROME_BIN="${KAKAOPAY_RESUME_CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
INPUT_HTML="$ROOT_DIR/resumes/kakaopay-fde/index.html"
OUTPUT_DIR="$ROOT_DIR/output/pdf"
# Version tag (e.g. v04). Archives to output/pdf/versions/ and refreshes the
# deployable copy at output/pdf/lim-giho-kakaopay-fde-resume.pdf.
RESUME_VERSION="${1:-${KAKAOPAY_RESUME_VERSION:-}}"
OUTPUT_PDF="$OUTPUT_DIR/lim-giho-kakaopay-fde-resume-claude.pdf"

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

if [[ -n "$RESUME_VERSION" ]]; then
  VERSION_DIR="$OUTPUT_DIR/versions"
  mkdir -p "$VERSION_DIR"
  cp "$OUTPUT_PDF" "$VERSION_DIR/lim-giho-kakaopay-fde-resume-claude-$RESUME_VERSION.pdf"
  echo "$VERSION_DIR/lim-giho-kakaopay-fde-resume-claude-$RESUME_VERSION.pdf"
fi

echo "$OUTPUT_PDF"
