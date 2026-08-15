#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SERVER_PORT="4173"
SERVER_PID=""
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/portfolio-pdf.XXXXXX")"

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID"
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  find "$TMP_DIR" -depth -delete
}
trap cleanup EXIT INT TERM

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Google Chrome executable not found: $CHROME_BIN" >&2
  exit 1
fi

cd "$ROOT_DIR"
bundle exec jekyll build

python3 -m http.server "$SERVER_PORT" --bind 127.0.0.1 --directory _site \
  >"$TMP_DIR/server.log" 2>&1 &
SERVER_PID="$!"

for _attempt in {1..40}; do
  if curl --silent --fail "http://127.0.0.1:${SERVER_PORT}/" >/dev/null; then
    break
  fi
  sleep 0.25
done
curl --silent --fail "http://127.0.0.1:${SERVER_PORT}/" >/dev/null

render_pdf() {
  local route="$1"
  local destination="$2"
  local temporary_pdf="$TMP_DIR/$(basename "$destination")"

  "$CHROME_BIN" \
    --headless=new \
    --disable-gpu \
    --no-pdf-header-footer \
    --print-to-pdf-no-header \
    --run-all-compositor-stages-before-draw \
    --virtual-time-budget=5000 \
    --print-to-pdf="$temporary_pdf" \
    "http://127.0.0.1:${SERVER_PORT}${route}" \
    >/dev/null 2>&1

  mkdir -p "$(dirname "$destination")"
  mv "$temporary_pdf" "$destination"
  echo "Built $destination"
}

render_pdf "/" "assets/portfolio/lim-giho-portfolio.pdf"
render_pdf "/applications/2026-08-03/kakaopay-fde/portfolio/" \
  "applications/2026-08-03/kakaopay-fde/portfolio.pdf"
