#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SERVER_PORT="4173"
SERVER_PID=""
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/portfolio-pdf.XXXXXX")"
if [[ "${1:-}" == "--target" ]]; then
  TARGET="${2:-}"
else
  TARGET="${1:-all}"
fi
CHROME_PROFILE="$TMP_DIR/chrome-profile"
SITE_DIR="$TMP_DIR/site"

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
bundle exec jekyll build --destination "$SITE_DIR"

python3 -m http.server "$SERVER_PORT" --bind 127.0.0.1 --directory "$SITE_DIR" \
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
  local chrome_pid=""
  local last_size=0
  local stable_count=0

  "$CHROME_BIN" \
    --headless=new \
    --disable-gpu \
    --disable-background-networking \
    --disable-component-update \
    --disable-default-apps \
    --no-first-run \
    --no-service-autorun \
    --user-data-dir="$CHROME_PROFILE" \
    --no-pdf-header-footer \
    --print-to-pdf-no-header \
    --run-all-compositor-stages-before-draw \
    --virtual-time-budget=5000 \
    --print-to-pdf="$temporary_pdf" \
    "http://127.0.0.1:${SERVER_PORT}${route}" \
    >/dev/null 2>&1 &
  chrome_pid="$!"

  for _attempt in $(seq 1 120); do
    if [[ -s "$temporary_pdf" ]]; then
      local current_size
      current_size="$(wc -c < "$temporary_pdf" | tr -d ' ')"
      if [[ "$current_size" == "$last_size" ]]; then
        stable_count=$((stable_count + 1))
      else
        stable_count=0
        last_size="$current_size"
      fi
      if [[ "$stable_count" -ge 4 ]]; then
        break
      fi
    fi
    sleep 0.25
  done

  if [[ "$stable_count" -lt 4 ]]; then
    kill "$chrome_pid" 2>/dev/null || true
    wait "$chrome_pid" 2>/dev/null || true
    echo "PDF generation timed out: $route" >&2
    exit 1
  fi

  kill "$chrome_pid" 2>/dev/null || true
  wait "$chrome_pid" 2>/dev/null || true

  mkdir -p "$(dirname "$destination")"
  mv "$temporary_pdf" "$destination"
  echo "Built $destination"
}

case "$TARGET" in
  all)
    render_pdf "/" "assets/portfolio/lim-giho-portfolio.pdf"
    render_pdf "/applications/2026-08-03/kakaopay-fde/portfolio/" \
      "applications/2026-08-03/kakaopay-fde/portfolio.pdf"
    render_pdf "/applications/2026-08-22/kakaopay-server-senior-minor/portfolio/" \
      "applications/2026-08-22/kakaopay-server-senior-minor/portfolio.pdf"
    ;;
  root)
    render_pdf "/" "assets/portfolio/lim-giho-portfolio.pdf"
    ;;
  legacy-kakaopay-fde)
    render_pdf "/applications/2026-08-03/kakaopay-fde/portfolio/" \
      "applications/2026-08-03/kakaopay-fde/portfolio.pdf"
    ;;
  kakaopay_server_senior_minor)
    render_pdf "/applications/2026-08-22/kakaopay-server-senior-minor/portfolio/" \
      "applications/2026-08-22/kakaopay-server-senior-minor/portfolio.pdf"
    ;;
  *)
    echo "Unknown target: $TARGET (expected all, root, legacy-kakaopay-fde, or kakaopay_server_senior_minor)" >&2
    exit 2
    ;;
esac
